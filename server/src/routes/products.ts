import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../lib/auth.js'
import { fetchLimited } from '../lib/http-security.js'
import { parseProductHtml } from '../lib/product-parser.js'
import { prisma } from '../lib/prisma.js'
import { productDto } from '../lib/serializers.js'
import { saveFile } from '../lib/storage.js'

export const productRoutes: FastifyPluginAsync = async (app) => {
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
