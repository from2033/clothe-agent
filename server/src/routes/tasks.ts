import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../lib/auth.js'
import { prisma } from '../lib/prisma.js'
import { tryOnQueue } from '../lib/queue.js'
import { taskDto } from '../lib/serializers.js'
import { deleteFiles } from '../lib/storage.js'
import { config } from '../config.js'

export const taskRoutes: FastifyPluginAsync = async (app) => {
  app.post('/', { preHandler: authenticate }, async (request, reply) => {
    const { productId, model, garmentType } = z
      .object({
        productId: z.string().min(1),
        model: z.enum(['aitryon', 'aitryon-plus']).optional(),
        garmentType: z.enum(['upper', 'lower', 'dress']).optional(),
      })
      .parse(request.body)
    const [profile, product] = await Promise.all([
      prisma.profile.findUnique({ where: { userId: request.user.userId } }),
      prisma.product.findFirst({ where: { id: productId, userId: request.user.userId } }),
    ])
    if (!profile) return reply.code(400).send({ error: { code: 'PROFILE_REQUIRED', message: '请先完善个人资料' } })
    if (!product) return reply.code(404).send({ error: { code: 'PRODUCT_NOT_FOUND', message: '商品不存在' } })

    const duplicate = await prisma.tryOnTask.findFirst({
      where: {
        userId: request.user.userId,
        productId,
        status: { in: ['PENDING', 'PROCESSING'] },
        createdAt: { gte: new Date(Date.now() - 60_000) },
      },
      orderBy: { createdAt: 'desc' },
    })
    if (duplicate) return taskDto(duplicate)

    const task = await prisma.tryOnTask.create({
      data: {
        userId: request.user.userId,
        productId,
        originalUrl: product.originalUrl,
        productTitle: product.title,
        productImageFileId: product.imageFileId,
        personImageFileId: profile.photoFileId,
        provider: config.TRYON_PROVIDER,
        aiModel: model,
        garmentType,
      },
    })
    await tryOnQueue.add('generate', { taskId: task.id }, {
      jobId: task.id,
      attempts: 3,
      backoff: { type: 'exponential', delay: 3000 },
      removeOnComplete: 100,
      removeOnFail: 100,
    })
    return taskDto(task)
  })

  app.get('/', { preHandler: authenticate }, async (request) => {
    const tasks = await prisma.tryOnTask.findMany({
      where: { userId: request.user.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return Promise.all(tasks.map(taskDto))
  })

  app.get('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params)
    const task = await prisma.tryOnTask.findFirst({
      where: { id, userId: request.user.userId },
    })
    if (!task) return reply.code(404).send({ error: { code: 'TASK_NOT_FOUND', message: '任务不存在' } })
    return taskDto(task)
  })

  app.delete('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params)
    const task = await prisma.tryOnTask.findFirst({
      where: { id, userId: request.user.userId },
    })
    if (!task) return reply.code(404).send({ error: { code: 'TASK_NOT_FOUND', message: '任务不存在' } })
    await prisma.tryOnTask.delete({ where: { id } })
    await deleteFiles([task.resultImageFileId])
    return { deleted: true }
  })
}
