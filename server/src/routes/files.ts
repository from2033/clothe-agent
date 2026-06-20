import type { FastifyPluginAsync } from 'fastify'
import sharp from 'sharp'
import { z } from 'zod'
import { authenticate } from '../lib/auth.js'
import { readFile, saveFile, signedUrl, verifyFileSignature } from '../lib/storage.js'

export const fileRoutes: FastifyPluginAsync = async (app) => {
  app.get('/:id/content', async (request, reply) => {
    const { id } = z.object({ id: z.string().min(1) }).parse(request.params)
    const { expires, signature } = z
      .object({
        expires: z.coerce.number().int().positive(),
        signature: z.string().length(64),
      })
      .parse(request.query)
    if (!verifyFileSignature(id, expires, signature)) {
      return reply.code(403).send({ error: { code: 'INVALID_SIGNATURE', message: '图片地址已失效' } })
    }
    try {
      const source = await readFile(id)
      return reply
        .header('Content-Type', source.file.contentType)
        .header('Cache-Control', `private, max-age=${Math.max(0, expires - Math.floor(Date.now() / 1000))}`)
        .send(source.buffer)
    } catch {
      return reply.code(404).send({ error: { code: 'FILE_NOT_FOUND', message: '图片不存在' } })
    }
  })

  app.post('/profile-photo', { preHandler: authenticate }, async (request, reply) => {
    const part = await request.file({
      limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    })
    if (!part || !['image/jpeg', 'image/png', 'image/webp'].includes(part.mimetype)) {
      return reply.code(400).send({ error: { code: 'INVALID_IMAGE', message: '请选择 JPG、PNG 或 WebP 图片' } })
    }
    const input = await part.toBuffer()
    let buffer: Buffer
    try {
      buffer = await sharp(input)
        .rotate()
        .resize({ width: 1600, height: 2400, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 88 })
        .toBuffer()
    } catch {
      return reply.code(400).send({ error: { code: 'INVALID_IMAGE', message: '图片无法解析，请更换图片' } })
    }
    const file = await saveFile({
      userId: request.user.userId,
      buffer,
      contentType: 'image/jpeg',
      extension: 'jpg',
      kind: 'profile',
    })
    return { fileId: file.id, url: await signedUrl(file.id) }
  })
}
