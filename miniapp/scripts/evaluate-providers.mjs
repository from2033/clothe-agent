import fs from 'node:fs/promises'

const configPath = process.argv[2]
if (!configPath) {
  console.error('用法: node scripts/evaluate-providers.mjs providers.local.json')
  process.exit(1)
}

const config = JSON.parse(await fs.readFile(configPath, 'utf8'))
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function requestJson(url, options, timeoutMs = 20000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response.json()
  } finally {
    clearTimeout(timeout)
  }
}

async function evaluate(provider, testCase) {
  const startedAt = Date.now()
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${provider.apiKey}`,
  }
  const created = await requestJson(provider.createUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      person_image_url: testCase.personImageUrl,
      garment_image_url: testCase.productImageUrl,
    }),
  })
  const taskId = created.task_id || created.id
  if (!taskId) throw new Error('创建接口未返回 task_id')

  while (Date.now() - startedAt < (provider.timeoutMs || 180000)) {
    await sleep(provider.pollIntervalMs || 3000)
    const separator = provider.statusUrl.includes('?') ? '&' : '?'
    const status = await requestJson(
      `${provider.statusUrl}${separator}task_id=${encodeURIComponent(taskId)}`,
      { headers },
    )
    const value = String(status.status || status.state || '').toLowerCase()
    if (['success', 'succeeded', 'completed', 'done'].includes(value)) {
      return { success: true, durationMs: Date.now() - startedAt }
    }
    if (['failed', 'error', 'cancelled', 'canceled'].includes(value)) {
      return {
        success: false,
        durationMs: Date.now() - startedAt,
        error: status.error_message || status.message || value,
      }
    }
  }
  return { success: false, durationMs: Date.now() - startedAt, error: 'timeout' }
}

for (const provider of config.providers) {
  const results = []
  for (const testCase of config.testCases) {
    try {
      results.push(await evaluate(provider, testCase))
    } catch (error) {
      results.push({ success: false, durationMs: 0, error: error.message })
    }
  }
  const successes = results.filter((result) => result.success)
  const successRate = successes.length / results.length
  const averageMs = successes.length
    ? Math.round(
        successes.reduce((total, result) => total + result.durationMs, 0) /
          successes.length,
      )
    : 0
  console.log(
    JSON.stringify(
      {
        provider: provider.name,
        successRate,
        averageMs,
        estimatedUnitCost: provider.estimatedUnitCost,
        eligible: successRate >= 0.9,
        results,
      },
      null,
      2,
    ),
  )
}
