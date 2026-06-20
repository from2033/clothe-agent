import { z } from 'zod'

const booleanValue = z
  .string()
  .default('false')
  .transform((value) => value === 'true')

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  PUBLIC_BASE_URL: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  WECHAT_APP_ID: z.string().default(''),
  WECHAT_APP_SECRET: z.string().default(''),
  ALLOW_DEV_LOGIN: booleanValue,
  MINIO_ENDPOINT: z.string().default('localhost'),
  MINIO_PORT: z.coerce.number().default(9000),
  MINIO_USE_SSL: booleanValue,
  // 生成对外签名 URL 用的公网端点；为空则回退到内部 MINIO_ENDPOINT。
  // 云服务器常无法访问自身公网 IP（NAT 不支持 hairpin），故内部操作走
  // MINIO_ENDPOINT(127.0.0.1)，对外签名 URL 走 MINIO_PUBLIC_ENDPOINT(公网IP/域名)。
  MINIO_PUBLIC_ENDPOINT: z.string().default(''),
  MINIO_PUBLIC_PORT: z.coerce.number().optional(),
  MINIO_PUBLIC_USE_SSL: z.string().optional().transform((v) => (v === undefined ? undefined : v === 'true')),
  MINIO_ACCESS_KEY: z.string().min(1),
  MINIO_SECRET_KEY: z.string().min(1),
  MINIO_BUCKET: z.string().default('cloth-agent'),
  TRYON_PROVIDER: z.string().default('mock'),
  FAL_KEY: z.string().default(''),
  FAL_MODEL_ID: z.string().default('fal-ai/fashn/tryon/v1.5'),
  DASHSCOPE_API_KEY: z.string().default(''),
  ALIYUN_TRYON_MODEL: z.enum(['aitryon', 'aitryon-plus']).default('aitryon'),
  AI_CREATE_URL: z.string().default(''),
  AI_STATUS_URL: z.string().default(''),
  AI_API_KEY: z.string().default(''),
  AI_ASSET_TTL_SECONDS: z.coerce.number().int().positive().default(21600),
  AI_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(3000),
  AI_POLL_MAX_ATTEMPTS: z.coerce.number().int().positive().default(60),
  ANTHROPIC_API_KEY: z.string().default(''),
})

export const config = schema.parse(process.env)
