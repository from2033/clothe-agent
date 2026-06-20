import crypto from 'node:crypto'
import { Client } from 'minio'
import { config } from '../config.js'
import { prisma } from './prisma.js'

export const storage = new Client({
  endPoint: config.MINIO_ENDPOINT,
  port: config.MINIO_PORT,
  useSSL: config.MINIO_USE_SSL,
  accessKey: config.MINIO_ACCESS_KEY,
  secretKey: config.MINIO_SECRET_KEY,
})

// 仅用于生成对外可访问的签名 URL（手机端展示、试衣厂商下载）。
// 不会用它做对象读写，因此即便公网端点对本机不可达也无妨。
const publicStorage = config.MINIO_PUBLIC_ENDPOINT
  ? new Client({
      endPoint: config.MINIO_PUBLIC_ENDPOINT,
      port: config.MINIO_PUBLIC_PORT ?? config.MINIO_PORT,
      useSSL: config.MINIO_PUBLIC_USE_SSL ?? config.MINIO_USE_SSL,
      accessKey: config.MINIO_ACCESS_KEY,
      secretKey: config.MINIO_SECRET_KEY,
    })
  : storage

export async function ensureBucket() {
  if (!(await storage.bucketExists(config.MINIO_BUCKET))) {
    await storage.makeBucket(config.MINIO_BUCKET)
  }
}

export async function saveFile(input: {
  userId: string
  buffer: Buffer
  contentType: string
  kind: 'profile' | 'product' | 'result'
  extension: string
}) {
  const hash = crypto.createHash('sha256').update(input.buffer).digest('hex')
  const objectKey = `users/${input.userId}/${input.kind}/${hash}.${input.extension}`
  await storage.putObject(config.MINIO_BUCKET, objectKey, input.buffer, input.buffer.length, {
    'Content-Type': input.contentType,
  })
  return prisma.storedFile.upsert({
    where: { objectKey },
    update: {},
    create: {
      userId: input.userId,
      objectKey,
      contentType: input.contentType,
      size: input.buffer.length,
      kind: input.kind,
    },
  })
}

export async function signedUrl(fileId?: string | null, ttlSeconds = 60 * 60) {
  if (!fileId) return ''
  const file = await prisma.storedFile.findUnique({ where: { id: fileId } })
  if (!file) return ''
  return publicStorage.presignedGetObject(config.MINIO_BUCKET, file.objectKey, ttlSeconds)
}

export async function readFile(fileId: string) {
  const file = await prisma.storedFile.findUniqueOrThrow({ where: { id: fileId } })
  const stream = await storage.getObject(config.MINIO_BUCKET, file.objectKey)
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(Buffer.from(chunk))
  return { file, buffer: Buffer.concat(chunks) }
}

export async function deleteFiles(fileIds: Array<string | null | undefined>) {
  const ids = [...new Set(fileIds.filter((id): id is string => Boolean(id)))]
  if (!ids.length) return
  const files = await prisma.storedFile.findMany({ where: { id: { in: ids } } })
  if (files.length) {
    await storage.removeObjects(config.MINIO_BUCKET, files.map((file) => file.objectKey))
    await prisma.storedFile.deleteMany({ where: { id: { in: files.map((file) => file.id) } } })
  }
}
