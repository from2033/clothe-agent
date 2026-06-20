import { Queue } from 'bullmq'
import { redis } from './redis.js'

export const tryOnQueue = new Queue('try-on', { connection: redis })
