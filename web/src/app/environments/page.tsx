'use client'

import { useEffect, useState } from 'react'
import { getEnvironments, type Environment } from '@/lib/api'

const ENV_COLORS: Record<string, string> = {
  production: '#4ade80',
  staging: '#60a5fa',
  airgap: '#fb923c',
}

export default function EnvironmentsPage() {
  const [environments, setEnvironments] = useState<Environment[]>([])

  useEffect(() => {
    getEnvironments().then(setEnvironments).catch(() => {})
  }, [])

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-slate-100 font-mono text-2xl font-bold tracking-wider mb-1">ENVIRONMENTS</h1>
      <p className="text-slate-500 font-mono text-xs mb-6">Registered deployment targets</p>

      <div className="space-y-3">
        {environments.map(env => {
          const config = JSON.parse(env.config) as Record<string, string>
          const typeColor = ENV_COLORS[env.type] ?? '#475569'
          return (
            <div
              key={env.id}
              style={{ border: '1px solid #0f2040', backgroundColor: '#0a1628' }}
              className="rounded p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-slate-100 font-mono text-sm font-semibold">{env.name}</h3>
                <span className="font-mono text-xs uppercase" style={{ color: typeColor }}>
                  {env.type}
                </span>
              </div>
              <p className="text-slate-600 font-mono text-xs mb-3">{env.slug}</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(config).map(([k, v]) => (
                  <span
                    key={k}
                    style={{ backgroundColor: '#162d5a', color: '#94a3b8' }}
                    className="text-xs font-mono px-2 py-0.5 rounded"
                  >
                    {k}={v}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
