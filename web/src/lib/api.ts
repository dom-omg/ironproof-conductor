const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
const ADMIN_KEY = process.env.NEXT_PUBLIC_CONDUCTOR_KEY ?? ''

function h(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-conductor-key': ADMIN_KEY,
  }
}

export interface Product {
  id: string
  name: string
  slug: string
  repoUrl: string
  githubRepo: string
  deployType: string
  deployConfig: string
  liveUrl?: string
  status: string
  lastVersion?: string
  lastDeployedAt?: number
  createdAt: number
}

export interface Environment {
  id: string
  name: string
  slug: string
  type: string
  config: string
  createdAt: number
}

export interface Deployment {
  id: string
  productId: string
  environmentId: string
  version: string
  status: string
  triggeredBy: string
  startedAt: number
  finishedAt?: number
  proofSignature?: string
  proofPublicKey?: string
  createdAt: number
}

export interface StatusResponse {
  summary: { total: number; live: number; down: number; deploying: number; unknown: number }
  products: Product[]
  recentDeployments: Deployment[]
}

export interface ProofData {
  deploymentId: string
  product: string
  version: string
  environment: string
  timestamp: number
  signature: string
  publicKey: string
  valid: boolean
}

export async function getStatus(): Promise<StatusResponse> {
  const res = await fetch(`${API}/api/status`)
  if (!res.ok) throw new Error('API unreachable')
  return res.json() as Promise<StatusResponse>
}

export async function getProducts(): Promise<Product[]> {
  const res = await fetch(`${API}/api/products`, { headers: h() })
  if (!res.ok) throw new Error('Failed to fetch products')
  return res.json() as Promise<Product[]>
}

export async function getEnvironments(): Promise<Environment[]> {
  const res = await fetch(`${API}/api/environments`, { headers: h() })
  if (!res.ok) throw new Error('Failed to fetch environments')
  return res.json() as Promise<Environment[]>
}

export async function getDeployments(limit = 100): Promise<Deployment[]> {
  const res = await fetch(`${API}/api/deployments?limit=${limit}`, { headers: h() })
  if (!res.ok) throw new Error('Failed to fetch deployments')
  return res.json() as Promise<Deployment[]>
}

export async function triggerDeploy(
  productId: string,
  environmentId: string
): Promise<{ deploymentId: string; success: boolean }> {
  const res = await fetch(`${API}/api/deployments`, {
    method: 'POST',
    headers: h(),
    body: JSON.stringify({ productId, environmentId, triggeredBy: 'conductor-ui' }),
  })
  if (!res.ok) throw new Error('Deploy failed')
  return res.json() as Promise<{ deploymentId: string; success: boolean }>
}

export async function getProof(deploymentId: string): Promise<ProofData> {
  const res = await fetch(`${API}/api/deployments/${deploymentId}/proof`, { headers: h() })
  if (!res.ok) throw new Error('No proof')
  return res.json() as Promise<ProofData>
}

export async function refreshStatus(): Promise<void> {
  await fetch(`${API}/api/status/refresh`, { method: 'POST', headers: h() })
}

export function streamLogs(
  deploymentId: string,
  onLine: (line: string, level: string) => void
): () => void {
  const es = new EventSource(`${API}/api/deployments/${deploymentId}/logs/stream`)
  es.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data as string) as { line: string; level: string }
      onLine(data.line, data.level ?? 'info')
    } catch { /* ignore parse errors */ }
  }
  return () => es.close()
}
