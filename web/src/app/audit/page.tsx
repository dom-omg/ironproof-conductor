'use client'

import { useEffect, useState, useCallback } from 'react'
import { getDeployments, getProof, type Deployment, type ProofData } from '@/lib/api'

export default function AuditPage() {
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [selectedProof, setSelectedProof] = useState<ProofData | null>(null)
  const [loadingProof, setLoadingProof] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const loadProof = useCallback((depId: string) => {
    setSelectedId(depId)
    setLoadingProof(true)
    getProof(depId)
      .then(setSelectedProof)
      .catch(() => setSelectedProof(null))
      .finally(() => setLoadingProof(false))
  }, [])

  useEffect(() => {
    getDeployments(200).then(setDeployments).catch(() => {})

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const dep = params.get('dep')
      if (dep) loadProof(dep)
    }
  }, [loadProof])

  const statusColor = (status: string) => {
    if (status === 'success') return '#4ade80'
    if (status === 'failed') return '#f87171'
    if (status === 'running') return '#fbbf24'
    return '#475569'
  }

  return (
    <div className="p-6 grid grid-cols-5 gap-6 h-full">
      <div className="col-span-2">
        <h1 className="text-slate-100 font-mono text-2xl font-bold tracking-wider mb-1">AUDIT TRAIL</h1>
        <p className="text-slate-500 font-mono text-xs mb-4">Ed25519-signed deployment proofs</p>

        <div style={{ border: '1px solid #0f2040' }} className="rounded overflow-hidden">
          <div
            style={{ backgroundColor: '#0a1628', borderBottom: '1px solid #0f2040' }}
            className="grid grid-cols-4 gap-2 px-3 py-2 text-xs font-mono text-slate-500 uppercase tracking-widest"
          >
            <span>Status</span>
            <span>Product</span>
            <span>Ver</span>
            <span>Proof</span>
          </div>
          <div className="overflow-y-auto max-h-[70vh]">
            {deployments.map((dep, i) => (
              <div
                key={dep.id}
                onClick={() => loadProof(dep.id)}
                style={{
                  backgroundColor: selectedId === dep.id ? '#162d5a' : i % 2 === 0 ? '#040d1a' : '#0a1628',
                  borderBottom: '1px solid #040d1a',
                  cursor: 'pointer',
                }}
                className="grid grid-cols-4 gap-2 px-3 py-2 text-xs font-mono hover:bg-blue-950 transition-colors"
              >
                <span style={{ color: statusColor(dep.status) }} className="uppercase">
                  {dep.status.slice(0, 4)}
                </span>
                <span className="text-slate-400 truncate">{dep.productId.slice(0, 10)}</span>
                <span className="text-slate-600">{dep.version}</span>
                <span style={{ color: dep.proofSignature ? '#c8a84b' : '#334155' }}>
                  {dep.proofSignature ? '✓' : '—'}
                </span>
              </div>
            ))}
            {deployments.length === 0 && (
              <p className="px-4 py-4 text-slate-600 font-mono text-xs">No deployments yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="col-span-3">
        <h2 className="text-slate-100 font-mono text-xl font-bold tracking-wider mb-1">PROOF INSPECTOR</h2>
        <p className="text-slate-500 font-mono text-xs mb-4">Click a deployment to verify its Ed25519 proof</p>

        {loadingProof && (
          <div style={{ border: '1px solid #0f2040', backgroundColor: '#0a1628' }} className="rounded p-6 text-center">
            <p className="text-slate-500 font-mono text-xs">Verifying signature...</p>
          </div>
        )}

        {!loadingProof && selectedProof && (
          <div style={{ border: `1px solid ${selectedProof.valid ? '#166534' : '#7f1d1d'}`, backgroundColor: '#0a1628' }} className="rounded p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedProof.valid ? '#4ade80' : '#f87171' }}
              />
              <span
                className="font-mono font-bold text-base"
                style={{ color: selectedProof.valid ? '#4ade80' : '#f87171' }}
              >
                PROOF {selectedProof.valid ? 'VALID' : 'INVALID'}
              </span>
              {selectedProof.valid && (
                <span className="text-slate-500 font-mono text-xs">Ed25519 signature verified ✓</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              {[
                ['PRODUCT', selectedProof.product],
                ['VERSION', selectedProof.version],
                ['ENVIRONMENT', selectedProof.environment],
                ['TIMESTAMP', new Date(selectedProof.timestamp).toISOString()],
              ].map(([label, value]) => (
                <div key={label} style={{ border: '1px solid #0f2040' }} className="rounded p-2.5">
                  <p className="text-slate-600 text-xs mb-1">{label}</p>
                  <p className="text-slate-200">{value}</p>
                </div>
              ))}
            </div>

            <div style={{ border: '1px solid #0f2040' }} className="rounded p-3">
              <p className="text-slate-600 font-mono text-xs mb-2">ED25519 SIGNATURE</p>
              <p style={{ color: '#c8a84b' }} className="font-mono text-xs break-all leading-relaxed">
                {selectedProof.signature}
              </p>
            </div>

            <div style={{ border: '1px solid #0f2040' }} className="rounded p-3">
              <p className="text-slate-600 font-mono text-xs mb-2">PUBLIC KEY</p>
              <p className="text-slate-400 font-mono text-xs break-all">{selectedProof.publicKey}</p>
            </div>

            <div style={{ border: '1px solid #0f2040' }} className="rounded p-3">
              <p className="text-slate-600 font-mono text-xs mb-2">DEPLOYMENT ID</p>
              <p className="text-slate-500 font-mono text-xs">{selectedProof.deploymentId}</p>
            </div>
          </div>
        )}

        {!loadingProof && !selectedProof && !selectedId && (
          <div style={{ border: '1px solid #0f2040', backgroundColor: '#040d1a' }} className="rounded p-8 text-center">
            <p className="text-slate-600 font-mono text-xs">← Select a deployment to inspect its proof</p>
          </div>
        )}

        {!loadingProof && !selectedProof && selectedId && (
          <div style={{ border: '1px solid #7f1d1d', backgroundColor: '#040d1a' }} className="rounded p-6 text-center">
            <p className="text-red-500 font-mono text-xs">No proof available for this deployment</p>
          </div>
        )}
      </div>
    </div>
  )
}
