import Taro from '@tarojs/taro'
import type { Product, Profile, TryOnTask } from '@/types/domain'

const TOKEN_KEY = 'apiToken'
const DEVICE_KEY = 'devDeviceId'

function deviceId() {
  let value = Taro.getStorageSync<string>(DEVICE_KEY)
  if (!value) {
    value = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    Taro.setStorageSync(DEVICE_KEY, value)
  }
  return value
}

async function login() {
  if (ALLOW_DEV_LOGIN) {
    const response = await Taro.request<{ token: string }>({
      url: `${API_BASE_URL}/api/auth/dev`,
      method: 'POST',
      data: { deviceId: deviceId() },
    })
    if (response.statusCode >= 400) throw new Error('开发登录失败')
    Taro.setStorageSync(TOKEN_KEY, response.data.token)
    return response.data.token
  }
  const result = await Taro.login()
  const response = await Taro.request<{ token: string }>({
    url: `${API_BASE_URL}/api/auth/wechat`,
    method: 'POST',
    data: { code: result.code },
  })
  if (response.statusCode >= 400) throw new Error('微信登录失败')
  Taro.setStorageSync(TOKEN_KEY, response.data.token)
  return response.data.token
}

async function request<T>(
  path: string,
  options: { method?: keyof Taro.request.Method; data?: unknown; retry?: boolean } = {},
): Promise<T> {
  const token = Taro.getStorageSync<string>(TOKEN_KEY) || (await login())
  const response = await Taro.request<T & { error?: { message?: string } }>({
    url: `${API_BASE_URL}${path}`,
    method: options.method || 'GET',
    data: options.data,
    header: { Authorization: `Bearer ${token}` },
  })
  if (response.statusCode === 401 && options.retry !== false) {
    Taro.removeStorageSync(TOKEN_KEY)
    await login()
    return request<T>(path, { ...options, retry: false })
  }
  if (response.statusCode >= 400) {
    throw new Error(response.data?.error?.message || '服务请求失败')
  }
  return response.data
}

export const api = {
  getProfile: () => request<Profile | null>('/api/profile'),
  saveProfile: (profile: Profile) =>
    request<Profile>('/api/profile', { method: 'PUT', data: profile }),
  parseProduct: (url: string) =>
    request<Product>('/api/products/parse', { method: 'POST', data: { url } }),
  createTryOnTask: (
    productId: string,
    options?: { model?: string; garmentType?: string },
  ) =>
    request<TryOnTask>('/api/tasks', {
      method: 'POST',
      data: { productId, ...options },
    }),
  getTryOnTask: (taskId: string) => request<TryOnTask>(`/api/tasks/${taskId}`),
  listTryOnTasks: () => request<TryOnTask[]>('/api/tasks'),
  deleteTryOnTask: (taskId: string) =>
    request<{ deleted: boolean }>(`/api/tasks/${taskId}`, { method: 'DELETE' }),
  clearUserData: () =>
    request<{ deleted: boolean }>('/api/user/data', { method: 'DELETE' }),
}

export async function uploadProfilePhoto(tempFilePath: string): Promise<string> {
  const token = Taro.getStorageSync<string>(TOKEN_KEY) || (await login())
  const response = await Taro.uploadFile({
    url: `${API_BASE_URL}/api/files/profile-photo`,
    filePath: tempFilePath,
    name: 'file',
    header: { Authorization: `Bearer ${token}` },
  })
  const data = JSON.parse(response.data) as {
    fileId?: string
    error?: { message?: string }
  }
  if (response.statusCode >= 400 || !data.fileId) {
    throw new Error(data.error?.message || '照片上传失败')
  }
  return data.fileId
}

export async function uploadGarmentImage(tempFilePath: string): Promise<Product> {
  const token = Taro.getStorageSync<string>(TOKEN_KEY) || (await login())
  const response = await Taro.uploadFile({
    url: `${API_BASE_URL}/api/products/upload`,
    filePath: tempFilePath,
    name: 'file',
    header: { Authorization: `Bearer ${token}` },
  })
  const data = JSON.parse(response.data) as Product & { error?: { message?: string } }
  if (response.statusCode >= 400 || !data.id) {
    throw new Error(data.error?.message || '服装图上传失败')
  }
  return data
}
