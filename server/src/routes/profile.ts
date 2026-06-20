import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../lib/auth.js'
import { deleteFiles } from '../lib/storage.js'
import { prisma } from '../lib/prisma.js'
import { profileDto } from '../lib/serializers.js'

const schema = z.object({
  name: z.string().max(30).default(''),
  height: z.string().max(10).default(''),
  weight: z.string().max(10).default(''),
  bust: z.string().max(10).default(''),
  waist: z.string().max(10).default(''),
  hips: z.string().max(10).default(''),
  photoFileId: z.string().min(1),
})

export const profileRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', { preHandler: authenticate }, async (request) => {
    return profileDto(await prisma.profile.findUnique({ where: { userId: request.user.userId } }))
  })

  app.put('/', { preHandler: authenticate }, async (request) => {
    const input = schema.parse(request.body)
    const owned = await prisma.storedFile.findFirst({
      where: { id: input.photoFileId, userId: request.user.userId, kind: 'profile' },
    })
    if (!owned) {
      const error = new Error('照片不存在') as Error & { statusCode: number }
      error.statusCode = 400
      throw error
    }
    const existing = await prisma.profile.findUnique({ where: { userId: request.user.userId } })
    const profile = await prisma.profile.upsert({
      where: { userId: request.user.userId },
      update: input,
      create: { ...input, userId: request.user.userId },
    })
    if (existing?.photoFileId && existing.photoFileId !== input.photoFileId) {
      await deleteFiles([existing.photoFileId])
    }
    return profileDto(profile)
  })
}
