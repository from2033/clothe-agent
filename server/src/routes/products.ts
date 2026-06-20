import type { FastifyPluginAsync } from 'fastify'
import sharp from 'sharp'
import { z } from 'zod'
import { authenticate } from '../lib/auth.js'
import { fetchLimited } from '../lib/http-security.js'
import { parseProductHtml } from '../lib/product-parser.js'
import { prisma } from '../lib/prisma.js'
import { productDto } from '../lib/serializers.js'
import { saveFile } from '../lib/storage.js'

export const productRoutes: FastifyPluginAsync = async (app) => {
  // 直接上传服装图：绕开淘宝反爬，用户截图/保存商品图后直接选图试穿。
  app.post('/upload', { preHandler: authenticate }, async (request, reply) => {
    const part = await request.file({ limits: { fileSize: 10 * 1024 * 1024, files: 1 } })
    if (!part || !['image/jpeg', 'image/png', 'image/webp'].includes(part.mimetype)) {
      return reply.code(400).send({ error: { code: 'INVALID_IMAGE', message: '请选择 JPG、PNG 或 WebP 图片' } })
    }
    const input = await part.toBuffer()
    let buffer: Buffer
    try {
      buffer = await sharp(input)
        .rotate()
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
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
      kind: 'product',
    })
    // 上传图无平台来源；用 upload:// 标记，platform 仅作占位。
    const marker = `upload://${file.id}`
    const product = await prisma.product.create({
      data: {
        userId: request.user.userId,
        originalUrl: marker,
        normalizedUrl: marker,
        platform: 'TAOBAO',
        title: '上传的服装图',
        imageFileId: file.id,
      },
    })
    return productDto(product)
  })

  app.post('/parse', { preHandler: authenticate }, async (request) => {
    const { url } = z.object({ url: z.string().url().max(2048) }).parse(request.body)
    const page = await fetchLimited(url, 'product', 2 * 1024 * 1024)
    const cached = await prisma.product.findFirst({
      where: {
        userId: request.user.userId,
        normalizedUrl: page.finalUrl,
        parseStatus: 'SUCCEEDED',
      },
    })
    if (cached) return productDto(cached)

    const parsed = parseProductHtml(page.buffer.toString('utf8'), page.finalUrl)
    const image = await fetchLimited(parsed.imageUrl, 'image', 10 * 1024 * 1024)
    const extension = image.contentType.includes('png')
      ? 'png'
      : image.contentType.includes('webp')
        ? 'webp'
        : 'jpg'
    const file = await saveFile({
      userId: request.user.userId,
      buffer: image.buffer,
      contentType: image.contentType,
      extension,
      kind: 'product',
    })
    const product = await prisma.product.create({
      data: {
        userId: request.user.userId,
        originalUrl: url,
        normalizedUrl: page.finalUrl,
        platform: new URL(page.finalUrl).hostname.includes('tmall.com') ? 'TMALL' : 'TAOBAO',
        title: parsed.title,
        imageFileId: file.id,
      },
    })
    return productDto(product)
  })
}
