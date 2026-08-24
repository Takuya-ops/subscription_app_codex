import { env } from 'cloudflare:workers';

let schemaPromise: Promise<void> | null = null;

const createSubscriptions = `
  CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'スタンダード',
    price_minor INTEGER NOT NULL CHECK (price_minor >= 0),
    currency TEXT NOT NULL DEFAULT 'JPY',
    billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('weekly', 'monthly', 'yearly')),
    start_date TEXT NOT NULL,
    next_billing_date TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'その他',
    importance INTEGER NOT NULL DEFAULT 3 CHECK (importance BETWEEN 1 AND 5),
    satisfaction INTEGER CHECK (satisfaction IS NULL OR satisfaction BETWEEN 1 AND 5),
    usage_level TEXT NOT NULL DEFAULT 'unknown' CHECK (usage_level IN ('often', 'sometimes', 'rarely', 'unknown')),
    last_used_date TEXT,
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'csv', 'email', 'store')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`;

const createCheckins = `
  CREATE TABLE IF NOT EXISTS usage_checkins (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    used_on TEXT NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('often', 'sometimes', 'rarely')),
    created_at TEXT NOT NULL
  )
`;

const createCharges = `
  CREATE TABLE IF NOT EXISTS charges (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    charged_on TEXT NOT NULL,
    amount_minor INTEGER NOT NULL CHECK (amount_minor >= 0),
    currency TEXT NOT NULL DEFAULT 'JPY',
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'csv', 'email')),
    created_at TEXT NOT NULL
  )
`;

export async function ensureSchema(): Promise<D1Database> {
  const db = env.DB;
  if (!db) throw new Error('D1 binding DB is unavailable');

  schemaPromise ??= (async () => {
    await db.batch([
      db.prepare('PRAGMA foreign_keys = ON'),
      db.prepare(`
        CREATE TABLE IF NOT EXISTS user_states (
          user_id TEXT PRIMARY KEY NOT NULL,
          demo_seeded_at TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `),
      db.prepare(createSubscriptions),
      db.prepare(createCheckins),
      db.prepare(createCharges),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status)'),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_subscriptions_user_next_billing ON subscriptions(user_id, next_billing_date)'),
      db.prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_checkins_user_subscription_day ON usage_checkins(user_id, subscription_id, used_on)'),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON usage_checkins(user_id, used_on)'),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_charges_user_subscription_date ON charges(user_id, subscription_id, charged_on)'),
    ]);
    await db.prepare('PRAGMA optimize').run();
  })();

  await schemaPromise;
  return db;
}
