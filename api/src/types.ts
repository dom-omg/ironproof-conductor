export type DeployType = 'fly' | 'vercel' | 'airgap'
export type DeployStatus = 'pending' | 'running' | 'success' | 'failed'
export type ProductStatus = 'live' | 'down' | 'deploying' | 'unknown'
export type EnvType = 'production' | 'staging' | 'airgap'

export interface FlyConfig { appName: string; region: string }
export interface VercelConfig { projectName: string; org: string }
export interface AirgapConfig { bundleDir: string; manifest: string }

export interface Product {
  id: string
  name: string
  slug: string
  repoUrl: string
  githubRepo: string
  deployType: DeployType
  deployConfig: FlyConfig | VercelConfig | AirgapConfig
  liveUrl?: string
  status: ProductStatus
  lastVersion?: string
  lastDeployedAt?: number
  createdAt: number
}

export interface Environment {
  id: string
  name: string
  slug: string
  type: EnvType
  config: Record<string, string>
  createdAt: number
}

export interface Deployment {
  id: string
  productId: string
  environmentId: string
  version: string
  status: DeployStatus
  triggeredBy: string
  startedAt: number
  finishedAt?: number
  proofSignature?: string
  proofPublicKey?: string
  createdAt: number
}

export interface DeploymentLog {
  id: number
  deploymentId: string
  line: string
  level: 'info' | 'error' | 'warn'
  timestamp: number
}
