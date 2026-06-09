import type { FastifyInstance } from 'fastify'
import { db } from '../db/index'
import { products } from '../db/schema'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

interface CreateProductBody {
  name: string
  slug: string
  repoUrl: string
  githubRepo: string
  deployType: string
  deployConfig: Record<string, unknown>
  liveUrl?: string
}

interface UpdateProductBody {
  name?: string
  liveUrl?: string
  deployConfig?: Record<string, unknown>
  status?: string
}

export async function productRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/products', async () => {
    return db.select().from(products).all()
  })

  app.get<{ Params: { id: string } }>('/api/products/:id', async (req, reply) => {
    const product = db.select().from(products).where(eq(products.id, req.params.id)).get()
    if (!product) return reply.status(404).send({ error: 'Not found' })
    return product
  })

  app.post<{ Body: CreateProductBody }>('/api/products', async (req, reply) => {
    const { name, slug, repoUrl, githubRepo, deployType, deployConfig, liveUrl } = req.body
    if (!name || !slug || !repoUrl || !githubRepo || !deployType || !deployConfig) {
      return reply.status(400).send({ error: 'Missing required fields' })
    }
    const id = nanoid()
    const now = new Date().getTime()
    db.insert(products).values({
      id, name, slug, repoUrl, githubRepo,
      deployType,
      deployConfig: JSON.stringify(deployConfig),
      liveUrl: liveUrl ?? null,
      status: 'unknown',
      createdAt: now,
    }).run()
    return db.select().from(products).where(eq(products.id, id)).get()
  })

  app.put<{ Params: { id: string }; Body: UpdateProductBody }>('/api/products/:id', async (req, reply) => {
    const existing = db.select().from(products).where(eq(products.id, req.params.id)).get()
    if (!existing) return reply.status(404).send({ error: 'Not found' })
    const updates: Record<string, unknown> = {}
    if (req.body.name) updates.name = req.body.name
    if (req.body.liveUrl !== undefined) updates.liveUrl = req.body.liveUrl
    if (req.body.deployConfig) updates.deployConfig = JSON.stringify(req.body.deployConfig)
    if (req.body.status) updates.status = req.body.status
    db.update(products).set(updates).where(eq(products.id, req.params.id)).run()
    return db.select().from(products).where(eq(products.id, req.params.id)).get()
  })

  app.delete<{ Params: { id: string } }>('/api/products/:id', async (req, reply) => {
    const existing = db.select().from(products).where(eq(products.id, req.params.id)).get()
    if (!existing) return reply.status(404).send({ error: 'Not found' })
    db.delete(products).where(eq(products.id, req.params.id)).run()
    return { success: true }
  })
}
