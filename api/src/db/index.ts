import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import path from 'path'
import fs from 'fs'

const DB_PATH = process.env.DATABASE_PATH ?? path.join(process.cwd(), 'data', 'conductor.db')

if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
}

const sqlite = new Database(DB_PATH)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite, { schema })

export function initDb(): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      repo_url TEXT NOT NULL,
      github_repo TEXT NOT NULL,
      deploy_type TEXT NOT NULL,
      deploy_config TEXT NOT NULL,
      live_url TEXT,
      status TEXT NOT NULL DEFAULT 'unknown',
      last_version TEXT,
      last_deployed_at INTEGER,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS environments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      config TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS deployments (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      environment_id TEXT NOT NULL,
      version TEXT NOT NULL,
      status TEXT NOT NULL,
      triggered_by TEXT NOT NULL DEFAULT 'system',
      started_at INTEGER NOT NULL,
      finished_at INTEGER,
      proof_signature TEXT,
      proof_public_key TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS deployment_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deployment_id TEXT NOT NULL,
      line TEXT NOT NULL,
      level TEXT NOT NULL DEFAULT 'info',
      timestamp INTEGER NOT NULL
    );
  `)
}
