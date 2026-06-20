import '@fastify/jwt'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { userId: string; openId: string }
    user: { userId: string; openId: string }
  }
}
