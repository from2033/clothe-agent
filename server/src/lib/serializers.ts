import type { Product, Profile, TryOnTask } from '@prisma/client'
import { signedUrl } from './storage.js'

export async function profileDto(profile: Profile | null) {
  if (!profile) return null
  return {
    name: profile.name,
    height: profile.height,
    weight: profile.weight,
    bust: profile.bust,
    waist: profile.waist,
    hips: profile.hips,
    photoFileId: profile.photoFileId,
    photoTempUrl: await signedUrl(profile.photoFileId),
    updatedAt: profile.updatedAt.getTime(),
  }
}

export async function productDto(product: Product) {
  return {
    id: product.id,
    originalUrl: product.originalUrl,
    normalizedUrl: product.normalizedUrl,
    platform: product.platform.toLowerCase(),
    title: product.title,
    imageFileId: product.imageFileId,
    imageTempUrl: await signedUrl(product.imageFileId),
    parseStatus: product.parseStatus.toLowerCase(),
  }
}

export async function taskDto(task: TryOnTask) {
  return {
    id: task.id,
    status: task.status.toLowerCase(),
    originalUrl: task.originalUrl,
    productTitle: task.productTitle,
    productImageFileId: task.productImageFileId,
    productImageTempUrl: await signedUrl(task.productImageFileId),
    personImageFileId: task.personImageFileId,
    personImageTempUrl: await signedUrl(task.personImageFileId),
    resultImageFileId: task.resultImageFileId || '',
    resultImageTempUrl: await signedUrl(task.resultImageFileId),
    failureReason: task.failureReason || '',
    createdAt: task.createdAt.getTime(),
    updatedAt: task.updatedAt.getTime(),
  }
}
