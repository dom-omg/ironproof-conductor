'use client'

import { useEffect, useState, useCallback } from 'react'
import { getStatus, refreshStatus, type StatusResponse, type Product } from '@/lib/api'

const STATUS_COLORS: Record<string, string> = {
  live: '#4ade80',
  down: '#f87171',
  deploying: '#fbbf24',
  unknown: '#475569',
}

const DEPLOY_LABELS: Record<string, string> = {
  fly: 'FLY',
  vercel: 'VCL',
  airgap: 'AIR',
}

function ProductCard({ product }: { product: Product }) {
  const config = JSON.parse(product.deployConfig) as Record<string, string>
  const statusColor = STATUS_COLORS[product.status] ?? STATUS_COLORS.unknown

  return (
    <div
      style={{ border: '1px solid #0f2040', backgroundColor: '#0a1628' }}
      className="rounded p-4 hover:border-blue-900 transition-colors"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-slate-100 font-mono text-sm font-semibold truncate">{product.name}</p>
          <p className="text-slate-600 font-mono text-xs">{product.slug}</p>
        </div>
        <span
          style={{ backgroundColor: '#162d5a', color: '#93c5fd' }}
          className="font-mono text-xs px-1.5 py-0.5 rounded ml-2 shrink-0"
        >
          {DEPLOY_LABELS[product.deployType] ?? product.deployType}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }} />
        <span className="font-mono text-xs uppercase" style={{ color: statusColor }}>
          {product.status}
        </span>
        {product.lastVersion && (
          <span className="text-slate-600 font-mono text-xs ml-auto">{product.lastVersion}</span>
        )}
      </div>

      {product.liveUrl && (
        <a
          href={product.liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#c8a84b' }}
          className="font-mono text-xs hover:underline block truncate"
        >
          {product.liveUrl.replace('https://', '')}
        </a>
      )}
      {!product.liveUrl && config.appName && (
        <p className="text-slate-700 font-mono text-xs truncate">{config.appName}.fly.dev</p>
      )}

      {product.lastDeployedAt && (
        <p className="text-slate-700 font-mono text-xs mt-1">
          {new Date(product.lastDeployedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState<StatusResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(() => {
    getStatus().then(setData).catch((e: unknown) => {
      setError(e instanceof Error ? e.message : 'API unreachable')
    })
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [load])

  async function handleRefresh() {
    setRefreshing(true)
    await refreshStatus().catch(() => null)
    load()
    setRefreshing(false)
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-400 font-mono text-sm">[ERROR] {error}</p>
        <p className="text-slate-600 font-mono text-xs mt-2">Set NEXT_PUBLIC_API_URL in .env.local</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500 font-mono text-sm">Connecting to conductor...</p>
      </div>
    )
  }

  const { summary, products, recentDeployments } = data

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-slate-100 font-mono text-2xl font-bold tracking-wider">FLEET STATUS</h1>
          <p className="text-slate-500 font-mono text-xs mt-1">
            {summary.total} products · auto-refresh 15s
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="flex gap-4 text-xs font-mono">
              <span className="text-green-400">{summary.live} LIVE</span>
              <span className="text-red-400">{summary.down} DOWN</span>
              <span className="text-yellow-400">{summary.deploying} DEPLOY</span>
              <span className="text-slate-500">{summary.unknown} ??</span>
            </div>
          </div>
          <button
            onClick={() => { void handleRefresh() }}
            disabled={refreshing}
            style={{ border: '1px solid #162d5a', color: '#c8a84b' }}
            className="font-mono text-xs px-3 py-1.5 rounded hover:bg-navy-800 disabled:opacity-40 transition-colors"
          >
            {refreshing ? 'REFRESHING...' : 'REFRESH STATUS'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-8">
        {products.map(p => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {recentDeployments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-slate-400 font-mono text-xs uppercase tracking-widest">Recent Deployments</h2>
            <a href="/audit" style={{ color: '#c8a84b' }} className="font-mono text-xs hover:underline">
              VIEW ALL PROOFS →
            </a>
          </div>
          <div style={{ border: '1px solid #0f2040' }} className="rounded overflow-hidden">
            {recentDeployments.slice(0, 8).map((dep, i) => {
              const sc = dep.status === 'success' ? 'text-green-400' : dep.status === 'failed' ? 'text-red-400' : dep.status === 'running' ? 'text-yellow-400' : 'text-slate-500'
              return (
                <div
                  key={dep.id}
                  style={{ backgroundColor: i % 2 === 0 ? '#040d1a' : '#0a1628' }}
                  className="flex items-center gap-4 px-4 py-2 text-xs font-mono"
                >
                  <span className={`w-20 uppercase ${sc}`}>{dep.status}</span>
                  <span className="text-slate-400 flex-1 truncate">{dep.productId}</span>
                  <span className="text-slate-600">{dep.version}</span>
                  <span className="text-slate-600">{dep.triggeredBy}</span>
                  {dep.proofSignature && (
                    <a href={`/audit?dep=${dep.id}`} style={{ color: '#c8a84b' }} className="hover:underline">
                      PROOF ✓
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
