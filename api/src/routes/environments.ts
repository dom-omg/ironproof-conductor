import type { FastifyInstance } from 'fastify'
import { db } from '../db/index'
import { environments } from '../db/schema'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

interface CreateEnvBody {
  name: string
  slug: string
  type: string
  config?: Record<string, string>
}

export async function environmentRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/environments', async () => {
    return db.select().from(environments).all()
  })

  app.post<{ Body: CreateEnvBody }>('/api/environments', async (req, reply) => {
    const { name, slug, type, config } = req.body
    if (!name || !slug || !type) {
      return reply.status(400).send({ error: 'Missing required fields' })
    }
    const id = nanoid()
    const now = new Date().getTime()
    db.insert(environments).values({
      id, name, slug, type,
      config: JSON.stringify(config ?? {}),
      createdAt: now,
    }).run()
    return db.select().from(environments).where(eq(environments.id, id)).get()
  })

  app.delete<{ Params: { id: string } }>('/api/environments/:id', async (req, reply) => {
    const existing = db.select().from(environments).where(eq(environments.id, req.params.id)).get()
    if (!existing) return reply.status(404).send({ error: 'Not found' })
    db.delete(environments).where(eq(environments.id, req.params.id)).run()
    return { success: true }
  })
}
