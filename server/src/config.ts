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
  MINIO_ACCESS_KEY: z.string().min(1),
  MINIO_SECRET_KEY: z.string().min(1),
  MINIO_BUCKET: z.string().default('cloth-agent'),
  TRYON_PROVIDER: z.string().default('mock'),
  FAL_KEY: z.string().default(''),
  FAL_MODEL_ID: z.string().default('fal-ai/fashn/tryon/v1.5'),
  AI_CREATE_URL: z.string().default(''),
  AI_STATUS_URL: z.string().default(''),
  AI_API_KEY: z.string().default(''),
  AI_ASSET_TTL_SECONDS: z.coerce.number().int().positive().default(21600),
  AI_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(3000),
  AI_POLL_MAX_ATTEMPTS: z.coerce.number().int().positive().default(60),
  ANTHROPIC_API_KEY: z.string().default(''),
})

export const config = schema.parse(process.env)
