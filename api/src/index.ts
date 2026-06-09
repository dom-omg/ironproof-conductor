import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { initDb } from './db/index'
import { autoSeed } from './startup'
import { productRoutes } from './routes/products'
import { environmentRoutes } from './routes/environments'
import { deploymentRoutes } from './routes/deployments'
import { statusRoutes } from './routes/status'

const app = Fastify({ logger: { level: process.env.NODE_ENV === 'production' ? 'warn' : 'info' } })

await app.register(cors, {
  origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
})

await app.register(jwt, {
  secret: process.env.JWT_SECRET ?? 'conductor-dev-secret-change-in-prod',
})

app.addHook('onRequest', async (req, reply) => {
  const publicPaths = ['/api/health', '/api/status']
  if (publicPaths.includes(req.url)) return
  if (req.url.includes('/logs/stream')) return

  const adminKey = req.headers['x-conductor-key']
  if (!adminKey || adminKey !== process.env.CONDUCTOR_ADMIN_KEY) {
    return reply.status(401).send({ error: 'Unauthorized — x-conductor-key required' })
  }
})

initDb()
autoSeed()

await app.register(productRoutes)
await app.register(environmentRoutes)
await app.register(deploymentRoutes)
await app.register(statusRoutes)

const PORT = parseInt(process.env.PORT ?? '3001')
const HOST = process.env.HOST ?? '0.0.0.0'

try {
  await app.listen({ port: PORT, host: HOST })
  console.log(`[CONDUCTOR] API running on ${HOST}:${PORT}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
