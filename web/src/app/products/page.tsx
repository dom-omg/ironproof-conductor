'use client'

import { useEffect, useState } from 'react'
import { getProducts, type Product } from '@/lib/api'

const STATUS_COLORS: Record<string, string> = {
  live: '#4ade80',
  down: '#f87171',
  deploying: '#fbbf24',
  unknown: '#475569',
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProducts().then(setProducts).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="p-6 text-slate-500 font-mono text-sm">Loading registry...</div>
  }

  return (
    <div className="p-6">
      <h1 className="text-slate-100 font-mono text-2xl font-bold tracking-wider mb-1">PRODUCT REGISTRY</h1>
      <p className="text-slate-500 font-mono text-xs mb-6">{products.length} sovereign products registered</p>

      <div style={{ border: '1px solid #0f2040' }} className="rounded overflow-hidden">
        <div
          style={{ backgroundColor: '#0a1628', borderBottom: '1px solid #0f2040' }}
          className="grid grid-cols-6 gap-3 px-4 py-2 text-xs font-mono text-slate-500 uppercase tracking-widest"
        >
          <span className="col-span-2">Name</span>
          <span>Type</span>
          <span>GitHub Repo</span>
          <span>Status</span>
          <span>Live URL</span>
        </div>
        {products.map((p, i) => (
          <div
            key={p.id}
            style={{ backgroundColor: i % 2 === 0 ? '#040d1a' : '#0a1628', borderBottom: '1px solid #040d1a' }}
            className="grid grid-cols-6 gap-3 px-4 py-3 text-xs font-mono hover:bg-blue-950 transition-colors"
          >
            <div className="col-span-2">
              <p className="text-slate-200">{p.name}</p>
              <p className="text-slate-600 text-xs">{p.slug}</p>
            </div>
            <span className="text-blue-300 self-center">{p.deployType.toUpperCase()}</span>
            <a
              href={`https://github.com/${p.githubRepo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-yellow-400 truncate self-center transition-colors"
            >
              {p.githubRepo}
            </a>
            <div className="self-center flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[p.status] ?? STATUS_COLORS.unknown }} />
              <span className="uppercase" style={{ color: STATUS_COLORS[p.status] ?? STATUS_COLORS.unknown }}>
                {p.status}
              </span>
            </div>
            <div className="self-center">
              {p.liveUrl ? (
                <a
                  href={p.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#c8a84b' }}
                  className="hover:underline truncate block"
                >
                  {p.liveUrl.replace('https://', '')}
                </a>
              ) : (
                <span className="text-slate-700">—</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
