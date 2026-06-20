import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'
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

  app.get('/health', async () => ({ ok: true, timestamp: Date.now() }))
  await app.register(authRoutes, { prefix: '/api/auth' })
  await app.register(fileRoutes, { prefix: '/api/files' })
  await app.register(profileRoutes, { prefix: '/api/profile' })
  await app.register(productRoutes, { prefix: '/api/products' })
  await app.register(taskRoutes, { prefix: '/api/tasks' })
  await app.register(userRoutes, { prefix: '/api/user' })

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
