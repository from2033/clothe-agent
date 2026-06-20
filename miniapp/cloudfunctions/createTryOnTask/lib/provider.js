async function postJson(url, body) {
  const fetch = require('node-fetch')
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.AI_API_KEY || ''}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`AI 服务响应异常（${response.status}）`)
    return response.json()
  } finally {
    clearTimeout(timeout)
  }
}

function createProvider() {
  const providerName = process.env.AI_PROVIDER || 'mock'
  if (providerName === 'mock') {
    return {
      name: 'mock',
      async create() {
        return { externalTaskId: `mock-${Date.now()}` }
      },
    }
  }

  if (!process.env.AI_CREATE_URL || !process.env.AI_API_KEY) {
    throw new Error('AI 服务环境变量未配置完整')
  }

  return {
    name: providerName,
    async create(input) {
      const result = await postJson(process.env.AI_CREATE_URL, {
        person_image_url: input.personImageUrl,
        garment_image_url: input.productImageUrl,
        measurements: input.measurements,
        callback_url: process.env.AI_CALLBACK_URL || undefined,
      })
      const externalTaskId = result.task_id || result.id
      if (!externalTaskId) throw new Error('AI 服务未返回任务 ID')
      return { externalTaskId: String(externalTaskId) }
    },
  }
}

module.exports = { createProvider }
