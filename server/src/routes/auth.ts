import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { config } from '../config.js'
import { exchangeWechatCode, issueToken } from '../lib/auth.js'

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post('/wechat', async (request, reply) => {
    const { code } = z.object({ code: z.string().min(1) }).parse(request.body)
    return reply.send(await issueToken(app, await exchangeWechatCode(code)))
  })

  app.post('/dev', async (request, reply) => {
    if (!config.ALLOW_DEV_LOGIN || config.NODE_ENV === 'production') {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: '接口不存在' } })
    }
    const { deviceId } = z.object({ deviceId: z.string().min(8).max(100) }).parse(request.body)
    return reply.send(await issueToken(app, `dev:${deviceId}`))
  })
}
