import type { FastifyPluginAsync } from 'fastify'
import { authenticate } from '../lib/auth.js'
import { prisma } from '../lib/prisma.js'
import { deleteFiles } from '../lib/storage.js'

export const userRoutes: FastifyPluginAsync = async (app) => {
  app.delete('/data', { preHandler: authenticate }, async (request) => {
    const files = await prisma.storedFile.findMany({
      where: { userId: request.user.userId },
      select: { id: true },
    })
    await deleteFiles(files.map((file) => file.id))
    await prisma.user.delete({ where: { id: request.user.userId } })
    return { deleted: true }
  })
}
