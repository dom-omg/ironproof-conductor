'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { getProducts, getEnvironments, triggerDeploy, streamLogs, type Product, type Environment } from '@/lib/api'

interface LogLine {
  line: string
  level: string
  ts: number
}

export default function DeployPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [environments, setEnvironments] = useState<Environment[]>([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [selectedEnv, setSelectedEnv] = useState('')
  const [deploying, setDeploying] = useState(false)
  const [deploymentId, setDeploymentId] = useState<string | null>(null)
  const [logs, setLogs] = useState<LogLine[]>([])
  const [error, setError] = useState<string | null>(null)
  const logsRef = useRef<HTMLDivElement>(null)
  const unsubRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    getProducts().then(setProducts).catch(() => setError('Cannot reach API'))
    getEnvironments().then(setEnvironments).catch(() => {})
  }, [])

  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight
    }
  }, [logs])

  useEffect(() => {
    return () => { unsubRef.current?.() }
  }, [])

  const deploy = useCallback(async () => {
    if (!selectedProduct || !selectedEnv || deploying) return
    setDeploying(true)
    setLogs([])
    setError(null)
    setDeploymentId(null)

    try {
      const result = await triggerDeploy(selectedProduct, selectedEnv)
      setDeploymentId(result.deploymentId)

      const timeout = setTimeout(() => {
        setDeploying(false)
        unsubRef.current?.()
      }, 120000)

      const unsub = streamLogs(result.deploymentId, (line, level) => {
        setLogs(prev => [...prev, { line, level, ts: new Date().getTime() }])
        if (line.includes('Deploy SUCCESS') || line.includes('Deploy FAILED') || line.includes('Deploy complete')) {
          setDeploying(false)
          clearTimeout(timeout)
          unsub()
        }
      })

      unsubRef.current = () => {
        clearTimeout(timeout)
        unsub()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Deploy failed')
      setDeploying(false)
    }
  }, [selectedProduct, selectedEnv, deploying])

  const selectedProductObj = products.find(p => p.id === selectedProduct)
  const selectedEnvObj = environments.find(e => e.id === selectedEnv)

  const lineColor = (level: string) => {
    if (level === 'error') return '#f87171'
    if (level === 'warn') return '#fbbf24'
    return '#86efac'
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-slate-100 font-mono text-2xl font-bold tracking-wider mb-1">DEPLOY</h1>
      <p className="text-slate-500 font-mono text-xs mb-6">Trigger sovereign deployment with Ed25519 proof generation</p>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-widest">
            Product
          </label>
          <select
            value={selectedProduct}
            onChange={e => setSelectedProduct(e.target.value)}
            style={{ backgroundColor: '#0a1628', border: '1px solid #162d5a', color: '#e2e8f0' }}
            className="w-full font-mono text-sm rounded px-3 py-2 focus:outline-none"
          >
            <option value="">-- select product --</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-widest">
            Environment
          </label>
          <select
            value={selectedEnv}
            onChange={e => setSelectedEnv(e.target.value)}
            style={{ backgroundColor: '#0a1628', border: '1px solid #162d5a', color: '#e2e8f0' }}
            className="w-full font-mono text-sm rounded px-3 py-2 focus:outline-none"
          >
            <option value="">-- select environment --</option>
            {environments.map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedProductObj && selectedEnvObj && (
        <div style={{ border: '1px solid #0f2040', backgroundColor: '#0a1628' }} className="rounded p-3 mb-4 text-xs font-mono">
          <div className="grid grid-cols-4 gap-3">
            <div>
              <p className="text-slate-600 mb-0.5">PRODUCT</p>
              <p className="text-slate-200">{selectedProductObj.name}</p>
            </div>
            <div>
              <p className="text-slate-600 mb-0.5">TYPE</p>
              <p className="text-slate-200">{selectedProductObj.deployType.toUpperCase()}</p>
            </div>
            <div>
              <p className="text-slate-600 mb-0.5">ENV</p>
              <p className="text-slate-200">{selectedEnvObj.name}</p>
            </div>
            <div>
              <p className="text-slate-600 mb-0.5">STATUS</p>
              <p className="text-slate-200">{selectedProductObj.status.toUpperCase()}</p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => { void deploy() }}
        disabled={!selectedProduct || !selectedEnv || deploying}
        style={{
          backgroundColor: !selectedProduct || !selectedEnv || deploying ? '#162d5a' : '#c8a84b',
          color: !selectedProduct || !selectedEnv || deploying ? '#475569' : '#040d1a',
        }}
        className="mb-4 px-6 py-2.5 font-mono font-bold text-sm rounded transition-colors cursor-pointer disabled:cursor-not-allowed"
      >
        {deploying ? '● DEPLOYING...' : '▶ TRIGGER DEPLOY'}
      </button>

      {error && (
        <p className="text-red-400 font-mono text-xs mb-4">[ERROR] {error}</p>
      )}

      {logs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 font-mono text-xs uppercase tracking-widest">
              Deploy Log
            </span>
            {deploymentId && (
              <a
                href={`/audit?dep=${deploymentId}`}
                style={{ color: '#c8a84b' }}
                className="font-mono text-xs hover:underline"
              >
                VIEW PROOF →
              </a>
            )}
          </div>
          <div
            ref={logsRef}
            style={{ backgroundColor: '#000', border: '1px solid #0f2040' }}
            className="rounded p-4 h-72 overflow-y-auto font-mono text-xs space-y-0.5"
          >
            {logs.map((log, i) => (
              <div key={i} style={{ color: lineColor(log.level) }}>
                {log.line}
              </div>
            ))}
            {deploying && (
              <div className="text-slate-500 cursor-blink">▋</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
