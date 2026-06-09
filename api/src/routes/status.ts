import type { FastifyInstance } from 'fastify'
import { db } from '../db/index'
import { products, deployments } from '../db/schema'
import { desc } from 'drizzle-orm'
import { refreshAllStatus } from '../services/deploy'

export async function statusRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/status', async () => {
    const allProducts = db.select().from(products).all()
    const recentDeploys = db.select().from(deployments).orderBy(desc(deployments.createdAt)).limit(20).all()

    const live = allProducts.filter(p => p.status === 'live').length
    const down = allProducts.filter(p => p.status === 'down').length
    const deploying = allProducts.filter(p => p.status === 'deploying').length

    return {
      summary: {
        total: allProducts.length,
        live,
        down,
        deploying,
        unknown: allProducts.length - live - down - deploying,
      },
      products: allProducts,
      recentDeployments: recentDeploys,
    }
  })

  app.post('/api/status/refresh', async () => {
    await refreshAllStatus()
    return { success: true, message: 'Status refresh triggered' }
  })

  app.get('/api/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'IRONPROOF CONDUCTOR',
    version: '1.0.0',
  }))
}
