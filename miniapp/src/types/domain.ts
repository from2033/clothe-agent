export type TryOnStatus = 'pending' | 'processing' | 'succeeded' | 'failed'

export interface Profile {
  name: string
  height: string
  weight: string
  bust: string
  waist: string
  hips: string
  photoFileId: string
  photoTempUrl?: string
  updatedAt?: number
}

export interface Product {
  id: string
  originalUrl: string
  normalizedUrl: string
  platform: 'taobao' | 'tmall'
  title: string
  imageFileId: string
  imageTempUrl?: string
  parseStatus: 'succeeded' | 'failed'
}

export interface TryOnTask {
  id: string
  status: TryOnStatus
  originalUrl: string
  productTitle: string
  productImageFileId: string
  productImageTempUrl?: string
  personImageFileId: string
  personImageTempUrl?: string
  resultImageFileId?: string
  resultImageTempUrl?: string
  failureReason?: string
  createdAt: number
  updatedAt: number
}
