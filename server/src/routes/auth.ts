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
    const { deviceId, password } = z
      .object({ deviceId: z.string().min(8).max(100), password: z.string().optional() })
      .parse(request.body)
    if (config.ACCESS_PASSWORD && password !== config.ACCESS_PASSWORD) {
      return reply.code(401).send({ error: { code: 'INVALID_PASSWORD', message: '访问密码错误' } })
    }
    return reply.send(await issueToken(app, `dev:${deviceId}`))
  })
}
