import { config } from '../config.js'

export interface ProviderInput {
  personImageUrl: string
  productImageUrl: string
  measurements: Record<string, string>
}

export interface TryOnProvider {
  name: string
  create(input: ProviderInput): Promise<{ externalTaskId: string }>
  status(externalTaskId: string): Promise<{
    status: 'processing' | 'succeeded' | 'failed'
    resultUrl?: string
    failureReason?: string
  }>
}

class MockProvider implements TryOnProvider {
  name = 'mock'
  async create() {
    return { externalTaskId: `mock-${Date.now()}` }
  }
  async status() {
    return { status: 'succeeded' as const }
  }
}

class HttpProvider implements TryOnProvider {
  name = config.TRYON_PROVIDER

  private headers() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.AI_API_KEY}`,
    }
  }

  async create(input: ProviderInput) {
    if (!config.AI_CREATE_URL || !config.AI_STATUS_URL || !config.AI_API_KEY) {
      throw new Error('试衣模型环境变量未配置完整')
    }
    const response = await fetch(config.AI_CREATE_URL, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        person_image_url: input.personImageUrl,
        garment_image_url: input.productImageUrl,
        measurements: input.measurements,
      }),
      signal: AbortSignal.timeout(20_000),
    })
    if (!response.ok) throw new Error(`试衣服务响应异常（${response.status}）`)
    const data = (await response.json()) as Record<string, unknown>
    const id = data.task_id || data.id
    if (!id) throw new Error('试衣服务未返回任务 ID')
    return { externalTaskId: String(id) }
  }

  async status(externalTaskId: string) {
    const url = new URL(config.AI_STATUS_URL)
    url.searchParams.set('task_id', externalTaskId)
    const response = await fetch(url, {
      headers: this.headers(),
      signal: AbortSignal.timeout(20_000),
    })
    if (!response.ok) throw new Error(`试衣服务响应异常（${response.status}）`)
    const data = (await response.json()) as Record<string, any>
    const value = String(data.status || data.state || '').toLowerCase()
    if (['success', 'succeeded', 'completed', 'done'].includes(value)) {
      return {
        status: 'succeeded' as const,
        resultUrl: data.result_url || data.output?.url || data.image_url,
      }
    }
    if (['failed', 'error', 'cancelled', 'canceled'].includes(value)) {
      return {
        status: 'failed' as const,
        failureReason: data.error_message || data.message || '试衣生成失败',
      }
    }
    return { status: 'processing' as const }
  }
}

// fal.ai 队列协议适配（默认对接 FASHN 试穿模型）。
// 注意：fal 服务器会主动下载 model_image / garment_image，
// 因此这两个签名 URL 必须公网可达（本地 MinIO 不可达时请改用 mock 或内网穿透）。
class FalProvider implements TryOnProvider {
  name = 'fal'

  private headers() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Key ${config.FAL_KEY}`,
    }
  }

  async create(input: ProviderInput) {
    if (!config.FAL_KEY) throw new Error('FAL_KEY 未配置')
    const response = await fetch(`https://queue.fal.run/${config.FAL_MODEL_ID}`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        model_image: input.personImageUrl,
        garment_image: input.productImageUrl,
      }),
      signal: AbortSignal.timeout(20_000),
    })
    if (!response.ok) throw new Error(`试衣服务响应异常（${response.status}）`)
    const data = (await response.json()) as { response_url?: string; request_id?: string }
    // 直接保存 fal 返回的 response_url；状态查询为 `${response_url}/status`，
    // 避免自行拼接队列路径（带版本子路径时容易出错）。
    if (!data.response_url) throw new Error('试衣服务未返回任务地址')
    return { externalTaskId: data.response_url }
  }

  async status(externalTaskId: string) {
    const statusResponse = await fetch(`${externalTaskId}/status`, {
      headers: this.headers(),
      signal: AbortSignal.timeout(20_000),
    })
    if (!statusResponse.ok) throw new Error(`试衣服务响应异常（${statusResponse.status}）`)
    const statusData = (await statusResponse.json()) as { status?: string }
    if (String(statusData.status || '').toUpperCase() !== 'COMPLETED') {
      return { status: 'processing' as const }
    }
    const resultResponse = await fetch(externalTaskId, {
      headers: this.headers(),
      signal: AbortSignal.timeout(20_000),
    })
    if (!resultResponse.ok) throw new Error(`获取试衣结果失败（${resultResponse.status}）`)
    const result = (await resultResponse.json()) as { images?: Array<{ url?: string }> }
    const url = result.images?.[0]?.url
    if (!url) throw new Error('试衣服务未返回结果图片')
    return { status: 'succeeded' as const, resultUrl: url }
  }
}

class AliyunTryOnProvider implements TryOnProvider {
  name = 'aliyun'

  private headers(async = false) {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.DASHSCOPE_API_KEY}`,
      ...(async ? { 'X-DashScope-Async': 'enable' } : {}),
    }
  }

  async create(input: ProviderInput) {
    if (!config.DASHSCOPE_API_KEY) throw new Error('DASHSCOPE_API_KEY 未配置')
    const response = await fetch(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/image2image/image-synthesis',
      {
        method: 'POST',
        headers: this.headers(true),
        body: JSON.stringify({
          model: config.ALIYUN_TRYON_MODEL,
          input: {
            person_image_url: input.personImageUrl,
            // 当前商品数据尚未区分上装/下装。top_garment_url 可覆盖上装与连衣裙；
            // 后续增加服装品类字段后，再按品类切换为 bottom_garment_url。
            top_garment_url: input.productImageUrl,
          },
          parameters: {
            resolution: -1,
            restore_face: true,
          },
        }),
        signal: AbortSignal.timeout(20_000),
      },
    )
    const data = (await response.json()) as {
      output?: { task_id?: string }
      code?: string
      message?: string
    }
    if (!response.ok) {
      throw new Error(data.message || `阿里云试衣服务响应异常（${response.status}）`)
    }
    const taskId = data.output?.task_id
    if (!taskId) throw new Error('阿里云试衣服务未返回任务 ID')
    return { externalTaskId: taskId }
  }

  async status(externalTaskId: string) {
    const response = await fetch(
      `https://dashscope.aliyuncs.com/api/v1/tasks/${encodeURIComponent(externalTaskId)}`,
      {
        headers: this.headers(),
        signal: AbortSignal.timeout(20_000),
      },
    )
    const data = (await response.json()) as {
      output?: {
        task_status?: string
        image_url?: string
        code?: string
        message?: string
      }
      code?: string
      message?: string
    }
    if (!response.ok) {
      throw new Error(data.message || `阿里云试衣服务响应异常（${response.status}）`)
    }
    const status = String(data.output?.task_status || '').toUpperCase()
    if (status === 'SUCCEEDED') {
      const resultUrl = data.output?.image_url
      if (!resultUrl) throw new Error('阿里云试衣服务未返回结果图片')
      return { status: 'succeeded' as const, resultUrl }
    }
    if (['FAILED', 'CANCELED', 'UNKNOWN'].includes(status)) {
      return {
        status: 'failed' as const,
        failureReason: data.output?.message || data.output?.code || '阿里云试衣生成失败',
      }
    }
    return { status: 'processing' as const }
  }
}

export function createTryOnProvider(): TryOnProvider {
  if (config.TRYON_PROVIDER === 'mock') return new MockProvider()
  if (config.TRYON_PROVIDER === 'fal') return new FalProvider()
  if (config.TRYON_PROVIDER === 'aliyun') return new AliyunTryOnProvider()
  return new HttpProvider()
}
