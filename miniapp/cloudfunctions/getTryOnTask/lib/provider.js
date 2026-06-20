async function getJson(url) {
  const fetch = require('node-fetch')
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.AI_API_KEY || ''}`,
      },
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`AI 服务响应异常（${response.status}）`)
    return response.json()
  } finally {
    clearTimeout(timeout)
  }
}

function normalizeStatus(status) {
  const value = String(status || '').toLowerCase()
  if (['succeeded', 'success', 'completed', 'done'].includes(value)) return 'succeeded'
  if (['failed', 'error', 'cancelled', 'canceled'].includes(value)) return 'failed'
  return 'processing'
}

function createProvider(name) {
  if (!name || name === 'mock') {
    return {
      async status(task) {
        if (Date.now() - task.createdAt < 6000) return { status: 'processing' }
        return {
          status: 'succeeded',
          existingResultFileId: task.personImageFileId,
        }
      },
    }
  }

  if (!process.env.AI_STATUS_URL || !process.env.AI_API_KEY) {
    throw new Error('AI 服务环境变量未配置完整')
  }

  return {
    async status(task) {
      const separator = process.env.AI_STATUS_URL.includes('?') ? '&' : '?'
      const result = await getJson(
        `${process.env.AI_STATUS_URL}${separator}task_id=${encodeURIComponent(
          task.providerTaskId,
        )}`,
      )
      const status = normalizeStatus(result.status || result.state)
      return {
        status,
        resultUrl: result.result_url || result.output?.url || result.image_url,
        failureReason: result.error_message || result.message,
      }
    },
  }
}

module.exports = { createProvider, normalizeStatus }
