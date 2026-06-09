import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'IRONPROOF CONDUCTOR',
  description: 'Sovereign Deployment Platform — IRONPROOF Security',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen" style={{ backgroundColor: '#040d1a', color: '#e2e8f0' }}>
        <nav style={{ borderBottom: '1px solid #0f2040', backgroundColor: '#0a1628' }} className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span style={{ color: '#c8a84b' }} className="font-mono text-xl font-bold">Ω</span>
            <span className="font-mono text-sm tracking-widest text-slate-100 uppercase">IRONPROOF CONDUCTOR</span>
          </div>
          <div className="flex items-center gap-6 text-xs font-mono text-slate-400">
            <a href="/" className="hover:text-yellow-400 transition-colors uppercase">Dashboard</a>
            <a href="/deploy" className="hover:text-yellow-400 transition-colors uppercase">Deploy</a>
            <a href="/products" className="hover:text-yellow-400 transition-colors uppercase">Registry</a>
            <a href="/environments" className="hover:text-yellow-400 transition-colors uppercase">Environments</a>
            <a href="/audit" className="hover:text-yellow-400 transition-colors uppercase">Audit</a>
          </div>
        </nav>
        <main className="min-h-screen">{children}</main>
        <footer style={{ borderTop: '1px solid #0f2040' }} className="px-6 py-2 text-xs font-mono text-slate-700 flex justify-between">
          <span>IRONPROOF CONDUCTOR v1.0</span>
          <span>SOVEREIGN DELIVERY LAYER · YYZ</span>
        </footer>
      </body>
    </html>
  )
}
