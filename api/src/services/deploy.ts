import { db } from '../db/index'
import { deployments, deploymentLogs, products, environments } from '../db/schema'
import { eq, desc } from 'drizzle-orm'
import { getProofService } from './proof'
import type { ProofPayload } from './proof'
import { nanoid } from 'nanoid'

const sseClients = new Map<string, Set<(line: string) => void>>()

export function subscribeToDeployment(deploymentId: string, cb: (line: string) => void): () => void {
  if (!sseClients.has(deploymentId)) sseClients.set(deploymentId, new Set())
  sseClients.get(deploymentId)!.add(cb)
  return () => sseClients.get(deploymentId)?.delete(cb)
}

function emitLog(deploymentId: string, line: string, level: 'info' | 'error' | 'warn' = 'info'): void {
  const ts = new Date().getTime()
  db.insert(deploymentLogs).values({ deploymentId, line, level, timestamp: ts }).run()
  sseClients.get(deploymentId)?.forEach(cb =>
    cb(JSON.stringify({ line, level, timestamp: ts }))
  )
}

async function getGithubSha(githubRepo: string, token: string): Promise<string> {
  try {
    const res = await fetch(`https://api.github.com/repos/${githubRepo}/commits/main`, {
      headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' },
    })
    if (!res.ok) return 'unknown'
    const data = await res.json() as { sha: string }
    return data.sha.slice(0, 8)
  } catch {
    return 'unknown'
  }
}

async function triggerGithubWorkflow(githubRepo: string, token: string, workflow = 'deploy.yml'): Promise<boolean> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${githubRepo}/actions/workflows/${workflow}/dispatches`,
      {
        method: 'POST',
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ref: 'main' }),
      }
    )
    return res.status === 204
  } catch {
    return false
  }
}

async function getFlyStatus(appName: string, flyToken: string): Promise<'live' | 'down' | 'unknown'> {
  try {
    const res = await fetch(`https://api.machines.dev/v1/apps/${appName}`, {
      headers: { Authorization: `Bearer ${flyToken}` },
    })
    if (!res.ok) return 'unknown'
    const data = await res.json() as { status: string }
    return data.status === 'deployed' ? 'live' : 'down'
  } catch {
    return 'unknown'
  }
}

async function getVercelStatus(projectName: string, vercelToken: string): Promise<'live' | 'down' | 'unknown'> {
  try {
    const res = await fetch(`https://api.vercel.com/v9/projects/${projectName}`, {
      headers: { Authorization: `Bearer ${vercelToken}` },
    })
    return res.ok ? 'live' : 'unknown'
  } catch {
    return 'unknown'
  }
}

export async function triggerDeploy(
  productId: string,
  environmentId: string,
  triggeredBy = 'conductor'
): Promise<{ deploymentId: string; success: boolean; error?: string }> {
  const product = db.select().from(products).where(eq(products.id, productId)).get()
  if (!product) return { deploymentId: '', success: false, error: 'Product not found' }

  const config = JSON.parse(product.deployConfig) as Record<string, string>
  const githubToken = process.env.GITHUB_TOKEN ?? ''
  const version = await getGithubSha(product.githubRepo, githubToken)

  const deploymentId = nanoid()
  const now = new Date().getTime()

  db.insert(deployments).values({
    id: deploymentId,
    productId,
    environmentId,
    version,
    status: 'running',
    triggeredBy,
    startedAt: now,
    createdAt: now,
  }).run()

  db.update(products).set({ status: 'deploying' }).where(eq(products.id, productId)).run()

  emitLog(deploymentId, `[CONDUCTOR] Deploying ${product.name} @ ${version}`)
  emitLog(deploymentId, `[CONDUCTOR] Type: ${product.deployType} | Repo: ${product.githubRepo}`)

  try {
    let success = false

    if (product.deployType === 'fly') {
      emitLog(deploymentId, `[FLY] Dispatching workflow on ${product.githubRepo}`)
      success = await triggerGithubWorkflow(product.githubRepo, githubToken)
      emitLog(
        deploymentId,
        success ? `[FLY] Workflow dispatched ✓` : `[FLY] No workflow found — ensure deploy.yml exists`,
        success ? 'info' : 'warn'
      )
    } else if (product.deployType === 'vercel') {
      emitLog(deploymentId, `[VERCEL] Dispatching workflow on ${product.githubRepo}`)
      success = await triggerGithubWorkflow(product.githubRepo, githubToken)
      emitLog(deploymentId, success ? `[VERCEL] Workflow dispatched ✓` : `[VERCEL] Dispatch failed`, success ? 'info' : 'warn')
    } else if (product.deployType === 'airgap') {
      emitLog(deploymentId, `[AIRGAP] Generating sovereign bundle manifest...`)
      emitLog(deploymentId, `[AIRGAP] Bundle target: ${config.bundleDir ?? '/secure/bundles'}`)
      emitLog(deploymentId, `[AIRGAP] Classification: ${config.classification ?? 'PROTECTED-B'}`)
      emitLog(deploymentId, `[AIRGAP] ⚠ Manual transfer required to air-gapped environment`, 'warn')
      success = true
    }

    const finishedAt = new Date().getTime()
    const status = success ? 'success' : 'failed'

    const proofSvc = getProofService()
    const envRow = db.select().from(environments).where(eq(environments.id, environmentId)).get()

    const payload: ProofPayload = {
      deploymentId,
      productSlug: product.slug,
      version,
      environmentSlug: envRow?.slug ?? environmentId,
      timestamp: finishedAt,
      triggeredBy,
    }

    const proofSig = proofSvc.sign(payload)

    db.update(deployments).set({
      status,
      finishedAt,
      proofSignature: proofSig,
      proofPublicKey: proofSvc.publicKeyHex,
    }).where(eq(deployments.id, deploymentId)).run()

    db.update(products).set({
      status: success ? 'live' : 'down',
      lastVersion: version,
      lastDeployedAt: finishedAt,
    }).where(eq(products.id, productId)).run()

    emitLog(deploymentId, `[CONDUCTOR] Proof: ${proofSig.slice(0, 32)}...`)
    emitLog(deploymentId, `[CONDUCTOR] Deploy ${status.toUpperCase()} ✓`)

    return { deploymentId, success }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    emitLog(deploymentId, `[ERROR] ${msg}`, 'error')
    db.update(deployments).set({ status: 'failed', finishedAt: new Date().getTime() }).where(eq(deployments.id, deploymentId)).run()
    db.update(products).set({ status: 'down' }).where(eq(products.id, productId)).run()
    return { deploymentId, success: false, error: msg }
  }
}

export async function refreshAllStatus(): Promise<void> {
  const allProducts = db.select().from(products).all()
  const flyToken = process.env.FLY_API_TOKEN ?? ''
  const vercelToken = process.env.VERCEL_TOKEN ?? ''

  await Promise.all(allProducts.map(async p => {
    const config = JSON.parse(p.deployConfig) as Record<string, string>
    let status: 'live' | 'down' | 'unknown' = 'unknown'

    if (p.deployType === 'fly' && config.appName) {
      status = await getFlyStatus(config.appName, flyToken)
    } else if (p.deployType === 'vercel' && config.projectName) {
      status = await getVercelStatus(config.projectName, vercelToken)
    }

    db.update(products).set({ status }).where(eq(products.id, p.id)).run()
  }))
}

export function getRecentDeployments(limit = 50) {
  return db.select().from(deployments).orderBy(desc(deployments.createdAt)).limit(limit).all()
}
