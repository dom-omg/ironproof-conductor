import type { FastifyInstance } from 'fastify'
import { db } from '../db/index'
import { deployments, deploymentLogs, products, environments } from '../db/schema'
import { eq, desc } from 'drizzle-orm'
import { triggerDeploy, subscribeToDeployment } from '../services/deploy'
import { getProofService } from '../services/proof'
import type { ProofPayload } from '../services/proof'

interface TriggerBody {
  productId: string
  environmentId: string
  triggeredBy?: string
}

export async function deploymentRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Querystring: { limit?: string } }>('/api/deployments', async (req) => {
    const limit = parseInt(req.query.limit ?? '50')
    return db.select().from(deployments).orderBy(desc(deployments.createdAt)).limit(limit).all()
  })

  app.get<{ Params: { id: string } }>('/api/deployments/:id', async (req, reply) => {
    const dep = db.select().from(deployments).where(eq(deployments.id, req.params.id)).get()
    if (!dep) return reply.status(404).send({ error: 'Not found' })
    const logs = db.select().from(deploymentLogs).where(eq(deploymentLogs.deploymentId, req.params.id)).all()
    return { ...dep, logs }
  })

  app.get<{ Params: { id: string } }>('/api/deployments/:id/proof', async (req, reply) => {
    const dep = db.select().from(deployments).where(eq(deployments.id, req.params.id)).get()
    if (!dep) return reply.status(404).send({ error: 'Not found' })
    if (!dep.proofSignature || !dep.proofPublicKey) {
      return reply.status(404).send({ error: 'No proof available' })
    }

    const product = db.select().from(products).where(eq(products.id, dep.productId)).get()
    const env = db.select().from(environments).where(eq(environments.id, dep.environmentId)).get()

    const proofSvc = getProofService()
    const payload: ProofPayload = {
      deploymentId: dep.id,
      productSlug: product?.slug ?? dep.productId,
      version: dep.version,
      environmentSlug: env?.slug ?? dep.environmentId,
      timestamp: dep.finishedAt ?? dep.startedAt,
      triggeredBy: dep.triggeredBy,
    }

    const valid = proofSvc.verify(payload, dep.proofSignature, dep.proofPublicKey)
    return {
      deploymentId: dep.id,
      product: product?.name ?? dep.productId,
      version: dep.version,
      environment: env?.name ?? dep.environmentId,
      timestamp: dep.finishedAt ?? dep.startedAt,
      signature: dep.proofSignature,
      publicKey: dep.proofPublicKey,
      valid,
    }
  })

  app.post<{ Body: TriggerBody }>('/api/deployments', async (req, reply) => {
    const { productId, environmentId, triggeredBy } = req.body
    if (!productId || !environmentId) {
      return reply.status(400).send({ error: 'productId and environmentId required' })
    }
    const result = await triggerDeploy(productId, environmentId, triggeredBy ?? 'api')
    return result
  })

  app.get<{ Params: { id: string } }>('/api/deployments/:id/logs/stream', async (req, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    })

    const existing = db.select().from(deploymentLogs)
      .where(eq(deploymentLogs.deploymentId, req.params.id))
      .all()

    for (const log of existing) {
      reply.raw.write(`data: ${JSON.stringify({ line: log.line, level: log.level, timestamp: log.timestamp })}\n\n`)
    }

    const dep = db.select().from(deployments).where(eq(deployments.id, req.params.id)).get()
    if (dep?.status === 'success' || dep?.status === 'failed') {
      reply.raw.write('data: {"line":"[STREAM] Deployment complete","level":"info"}\n\n')
      reply.raw.end()
      return
    }

    const unsub = subscribeToDeployment(req.params.id, (line) => {
      reply.raw.write(`data: ${line}\n\n`)
    })

    req.raw.on('close', unsub)
  })
}
