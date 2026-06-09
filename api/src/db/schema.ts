import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  repoUrl: text('repo_url').notNull(),
  githubRepo: text('github_repo').notNull(),
  deployType: text('deploy_type').notNull(),
  deployConfig: text('deploy_config').notNull(),
  liveUrl: text('live_url'),
  status: text('status').notNull().default('unknown'),
  lastVersion: text('last_version'),
  lastDeployedAt: integer('last_deployed_at'),
  createdAt: integer('created_at').notNull(),
})

export const environments = sqliteTable('environments', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  type: text('type').notNull(),
  config: text('config').notNull(),
  createdAt: integer('created_at').notNull(),
})

export const deployments = sqliteTable('deployments', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull(),
  environmentId: text('environment_id').notNull(),
  version: text('version').notNull(),
  status: text('status').notNull(),
  triggeredBy: text('triggered_by').notNull().default('system'),
  startedAt: integer('started_at').notNull(),
  finishedAt: integer('finished_at'),
  proofSignature: text('proof_signature'),
  proofPublicKey: text('proof_public_key'),
  createdAt: integer('created_at').notNull(),
})

export const deploymentLogs = sqliteTable('deployment_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  deploymentId: text('deployment_id').notNull(),
  line: text('line').notNull(),
  level: text('level').notNull().default('info'),
  timestamp: integer('timestamp').notNull(),
})
