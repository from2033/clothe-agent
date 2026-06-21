import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'
import fastifyStatic from '@fastify/static'
import { ZodError } from 'zod'
import { config } from './config.js'
import { authRoutes } from './routes/auth.js'
import { fileRoutes } from './routes/files.js'
import { productRoutes } from './routes/products.js'
import { profileRoutes } from './routes/profile.js'
import { taskRoutes } from './routes/tasks.js'
import { userRoutes } from './routes/user.js'

export async function buildApp() {
  const app = Fastify({
    logger: {
      redact: ['req.headers.authorization', 'body.code', 'body.token'],
    },
    bodyLimit: 2 * 1024 * 1024,
  })
  await app.register(cors, { origin: false })
  await app.register(jwt, { secret: config.JWT_SECRET })
  await app.register(multipart)
  await app.register(rateLimit, { max: 120, timeWindow: '1 minute' })

  // Vite 构建后的 PWA：根目录 dist/ 挂载到 /app（同源，前端用 /api 直连后端）
  const webDist = fileURLToPath(new URL('../../dist/', import.meta.url))
  const hasWebDist = existsSync(webDist)
  if (hasWebDist) {
    await app.register(fastifyStatic, { root: webDist, prefix: '/app/' })
  }

  app.get('/health', async () => ({ ok: true, timestamp: Date.now() }))
  await app.register(authRoutes, { prefix: '/api/auth' })
  await app.register(fileRoutes, { prefix: '/api/files' })
  await app.register(profileRoutes, { prefix: '/api/profile' })
  await app.register(productRoutes, { prefix: '/api/products' })
  await app.register(taskRoutes, { prefix: '/api/tasks' })
  await app.register(userRoutes, { prefix: '/api/user' })

  // SPA 回退：/app 下的客户端路由（刷新/深链）都返回 index.html，/api 保持 JSON 404
  app.setNotFoundHandler((request, reply) => {
    if (
      hasWebDist &&
      request.method === 'GET' &&
      (request.url === '/app' || request.url.startsWith('/app/')) &&
      !request.url.startsWith('/api')
    ) {
      return reply.sendFile('index.html')
    }
    return reply.code(404).send({
      error: { code: 'NOT_FOUND', message: '资源不存在' },
    })
  })

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: { code: 'VALIDATION_ERROR', message: error.issues[0]?.message || '参数错误' },
      })
    }
    const statusCode = 'statusCode' in error && typeof error.statusCode === 'number'
      ? error.statusCode
      : 500
    if (statusCode >= 500) app.log.error(error)
    return reply.code(statusCode).send({
      error: {
        code: statusCode === 401 ? 'UNAUTHORIZED' : 'REQUEST_FAILED',
        message: statusCode >= 500 ? '服务器内部错误' : error.message,
      },
    })
  })
  return app
}
