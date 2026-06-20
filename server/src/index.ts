import { buildApp } from './app.js'
import { config } from './config.js'
import { ensureBucket } from './lib/storage.js'

await ensureBucket()
const app = await buildApp()
await app.listen({ port: config.PORT, host: '0.0.0.0' })
