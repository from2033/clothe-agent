import { Worker } from 'bullmq'
import sharp from 'sharp'
import { config } from './config.js'
import { prisma } from './lib/prisma.js'
import { redis } from './lib/redis.js'
import { readFile, saveFile, signedUrl } from './lib/storage.js'
import { createTryOnProvider } from './providers/tryon.js'

const worker = new Worker<{ taskId: string }>(
  'try-on',
  async (job) => {
    const task = await prisma.tryOnTask.findUniqueOrThrow({ where: { id: job.data.taskId } })
    const provider = createTryOnProvider()
    await prisma.tryOnTask.update({
      where: { id: task.id },
      data: { status: 'PROCESSING', provider: provider.name },
    })

    if (provider.name === 'mock') {
      await new Promise((resolve) => setTimeout(resolve, 5000))
      const source = await readFile(task.personImageFileId)
      const result = await sharp(source.buffer)
        .composite([
          {
            input: Buffer.from(
              '<svg width="900" height="180"><rect width="900" height="180" rx="30" fill="#07c160" fill-opacity=".88"/><text x="450" y="110" text-anchor="middle" font-size="52" fill="white">Mock AI 试穿结果</text></svg>',
            ),
            gravity: 'south',
          },
        ])
        .jpeg({ quality: 88 })
        .toBuffer()
      const file = await saveFile({
        userId: task.userId,
        buffer: result,
        contentType: 'image/jpeg',
        extension: 'jpg',
        kind: 'result',
      })
      await prisma.tryOnTask.update({
        where: { id: task.id },
        data: { status: 'SUCCEEDED', resultImageFileId: file.id },
      })
      return
    }

    const profile = await prisma.profile.findUnique({ where: { userId: task.userId } })
    const measurements = profile
      ? Object.fromEntries(
          Object.entries({
            height: profile.height,
            weight: profile.weight,
            bust: profile.bust,
            waist: profile.waist,
            hips: profile.hips,
          }).filter(([, value]) => value.trim()),
        )
      : {}

    const created = await provider.create({
      personImageUrl: await signedUrl(task.personImageFileId, config.AI_ASSET_TTL_SECONDS),
      productImageUrl: await signedUrl(task.productImageFileId, config.AI_ASSET_TTL_SECONDS),
      measurements,
      model: task.aiModel ?? undefined,
      garmentType: task.garmentType ?? undefined,
    })
    await prisma.tryOnTask.update({
      where: { id: task.id },
      data: { providerTaskId: created.externalTaskId },
    })

    for (let attempt = 0; attempt < config.AI_POLL_MAX_ATTEMPTS; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, config.AI_POLL_INTERVAL_MS))
      const status = await provider.status(created.externalTaskId)
      if (status.status === 'processing') continue
      if (status.status === 'failed') throw new Error(status.failureReason || '试衣生成失败')
      if (!status.resultUrl) throw new Error('试衣服务未返回结果图片')
      const response = await fetch(status.resultUrl, { signal: AbortSignal.timeout(30_000) })
      if (!response.ok) throw new Error('下载试衣结果失败')
      const buffer = Buffer.from(await response.arrayBuffer())
      if (buffer.length > 10 * 1024 * 1024) throw new Error('试衣结果超过 10MB')
      const file = await saveFile({
        userId: task.userId,
        buffer,
        contentType: response.headers.get('content-type') || 'image/jpeg',
        extension: 'jpg',
        kind: 'result',
      })
      await prisma.tryOnTask.update({
        where: { id: task.id },
        data: { status: 'SUCCEEDED', resultImageFileId: file.id },
      })
      return
    }
    throw new Error('试衣任务处理超时')
  },
  { connection: redis, concurrency: 2 },
)

worker.on('failed', async (job, error) => {
  if (!job) return
  await prisma.tryOnTask
    .update({
      where: { id: job.data.taskId },
      data: { status: 'FAILED', failureReason: error.message.slice(0, 300) },
    })
    .catch(() => undefined)
})

console.log('Try-on worker started')
