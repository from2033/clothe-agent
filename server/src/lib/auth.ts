import type { FastifyInstance, FastifyRequest } from 'fastify'
import { config } from '../config.js'
import { prisma } from './prisma.js'

export async function authenticate(request: FastifyRequest) {
  await request.jwtVerify()
}

export async function exchangeWechatCode(code: string) {
  if (!config.WECHAT_APP_ID || !config.WECHAT_APP_SECRET) {
    throw new Error('微信 AppID 或 AppSecret 尚未配置')
  }
  const url = new URL('https://api.weixin.qq.com/sns/jscode2session')
  url.searchParams.set('appid', config.WECHAT_APP_ID)
  url.searchParams.set('secret', config.WECHAT_APP_SECRET)
  url.searchParams.set('js_code', code)
  url.searchParams.set('grant_type', 'authorization_code')
  const response = await fetch(url)
  if (!response.ok) throw new Error('微信登录服务不可用')
  const result = (await response.json()) as {
    openid?: string
    errcode?: number
    errmsg?: string
  }
  if (!result.openid) throw new Error(result.errmsg || '微信登录失败')
  return result.openid
}

export async function issueToken(app: FastifyInstance, openId: string) {
  const user = await prisma.user.upsert({
    where: { openId },
    update: {},
    create: { openId },
  })
  return {
    token: app.jwt.sign({ userId: user.id, openId: user.openId }, { expiresIn: '30d' }),
  }
}
