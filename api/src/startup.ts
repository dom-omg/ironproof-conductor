import { db } from './db/index'
import { products, environments } from './db/schema'
import { nanoid } from 'nanoid'

const SEED_PRODUCTS = [
  { name: 'RedZone Global', slug: 'redzone-global', githubRepo: 'dom-omg/redzone-global', deployType: 'fly', deployConfig: { appName: 'redzone-global', region: 'yyz' }, liveUrl: 'https://redzone-global.fly.dev' },
  { name: 'Wraith', slug: 'wraith', githubRepo: 'dom-omg/wraith', deployType: 'fly', deployConfig: { appName: 'wraith-007', region: 'yyz' }, liveUrl: 'https://wraith-007.fly.dev' },
  { name: 'TRACE (u-cant-hide)', slug: 'u-cant-hide', githubRepo: 'dom-omg/u-cant-hide', deployType: 'fly', deployConfig: { appName: 'u-cant-hide', region: 'yyz' }, liveUrl: 'https://u-cant-hide.fly.dev' },
  { name: 'PQ-Inventory API', slug: 'pq-inventory-api', githubRepo: 'dom-omg/pq-inventory', deployType: 'fly', deployConfig: { appName: 'pq-inventory-api', region: 'yyz' }, liveUrl: 'https://pq-inventory-api.fly.dev' },
  { name: 'AEGIS Hub API', slug: 'aegis-hub-api', githubRepo: 'dom-omg/aegis-hub', deployType: 'fly', deployConfig: { appName: 'aegis-hub-api', region: 'yyz' }, liveUrl: 'https://aegis-hub-api.fly.dev' },
  { name: 'AURORA DND API', slug: 'aurora-dnd-api', githubRepo: 'dom-omg/aurora', deployType: 'fly', deployConfig: { appName: 'aurora-dnd-api', region: 'yyz' }, liveUrl: 'https://aurora-dnd-api.fly.dev' },
  { name: 'AURORA DND Frontend', slug: 'aurora-dnd-frontend', githubRepo: 'dom-omg/aurora', deployType: 'fly', deployConfig: { appName: 'aurora-dnd-frontend', region: 'yyz' }, liveUrl: 'https://aurora-dnd-frontend.fly.dev' },
  { name: 'Skyveil', slug: 'skyveil', githubRepo: 'dom-omg/skyveil', deployType: 'fly', deployConfig: { appName: 'skyveil', region: 'yyz' }, liveUrl: 'https://skyveil.fly.dev' },
  { name: 'SPVM Insight', slug: 'spvm-insight', githubRepo: 'dom-omg/spvm-insight', deployType: 'fly', deployConfig: { appName: 'spvm-insight', region: 'yyz' }, liveUrl: 'https://spvm-insight.fly.dev' },
  { name: 'Chain Guardian', slug: 'chain-guardian', githubRepo: 'dom-omg/chain-guardian', deployType: 'fly', deployConfig: { appName: 'chain-guardian', region: 'yyz' }, liveUrl: 'https://chain-guardian.fly.dev' },
  { name: 'Verdict Engine', slug: 'verdict-engine', githubRepo: 'dom-omg/verdict-engine', deployType: 'fly', deployConfig: { appName: 'verdict-engine', region: 'yyz' }, liveUrl: 'https://verdict-engine.fly.dev' },
  { name: 'SENTINEL', slug: 'sentinel', githubRepo: 'dom-omg/blackpoint-sentinel', deployType: 'fly', deployConfig: { appName: 'sentinel', region: 'yyz' }, liveUrl: 'https://sentinel.fly.dev' },
]

const SEED_ENVIRONMENTS = [
  { name: 'Production YYZ', slug: 'prod-yyz', type: 'production', config: { region: 'yyz', provider: 'fly' } },
  { name: 'Staging', slug: 'staging', type: 'staging', config: { region: 'yyz', provider: 'fly' } },
  { name: 'Air-Gap Sovereign', slug: 'airgap-sovereign', type: 'airgap', config: { classification: 'PROTECTED-B', network: 'isolated', bundleDir: '/secure/bundles' } },
]

export function autoSeed(): void {
  const existing = db.select().from(products).all()
  if (existing.length > 0) return

  console.log('[CONDUCTOR] Empty DB detected — seeding registry...')
  const now = new Date().getTime()

  for (const env of SEED_ENVIRONMENTS) {
    try {
      db.insert(environments).values({
        id: nanoid(), name: env.name, slug: env.slug, type: env.type,
        config: JSON.stringify(env.config), createdAt: now,
      }).run()
    } catch { /* already exists */ }
  }

  for (const p of SEED_PRODUCTS) {
    try {
      db.insert(products).values({
        id: nanoid(), name: p.name, slug: p.slug,
        repoUrl: `https://github.com/${p.githubRepo}`,
        githubRepo: p.githubRepo, deployType: p.deployType,
        deployConfig: JSON.stringify(p.deployConfig),
        liveUrl: p.liveUrl ?? null, status: 'unknown', createdAt: now,
      }).run()
    } catch { /* already exists */ }
  }

  console.log(`[CONDUCTOR] Seeded ${SEED_PRODUCTS.length} products, ${SEED_ENVIRONMENTS.length} environments`)
}
