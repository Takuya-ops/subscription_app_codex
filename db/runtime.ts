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

const createGoogleConnections = `
  CREATE TABLE IF NOT EXISTS google_connections (
    user_id TEXT PRIMARY KEY NOT NULL,
    google_email TEXT NOT NULL,
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT,
    access_token_expires_at TEXT NOT NULL,
    scope TEXT NOT NULL,
    last_synced_at TEXT,
    scan_started_at TEXT,
    gmail_page_token TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`;

const createGmailImportCandidates = `
  CREATE TABLE IF NOT EXISTS gmail_import_candidates (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL REFERENCES google_connections(user_id) ON DELETE CASCADE,
    fingerprint TEXT NOT NULL,
    google_message_id TEXT NOT NULL,
    name TEXT NOT NULL,
    merchant TEXT NOT NULL,
    price_minor INTEGER NOT NULL CHECK (price_minor > 0),
    currency TEXT NOT NULL DEFAULT 'JPY' CHECK (currency = 'JPY'),
    billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('weekly', 'monthly', 'yearly')),
    first_charged_on TEXT NOT NULL,
    last_charged_on TEXT NOT NULL,
    evidence_count INTEGER NOT NULL DEFAULT 1 CHECK (evidence_count > 0),
    confidence INTEGER NOT NULL CHECK (confidence BETWEEN 0 AND 100),
    imported_at TEXT,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`;

const createGmailImportEvents = `
  CREATE TABLE IF NOT EXISTS gmail_import_events (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    fingerprint TEXT NOT NULL,
    last_charged_on TEXT NOT NULL,
    subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    imported_at TEXT NOT NULL
  )
`;

async function upgradeGoogleConnectionColumns(db: D1Database): Promise<void> {
  const columns = await db.prepare("PRAGMA table_info('google_connections')").all<{ name: string }>();
  const names = new Set(columns.results.map((column) => column.name));
  const statements: D1PreparedStatement[] = [];
  if (!names.has('scan_started_at')) {
    statements.push(db.prepare('ALTER TABLE google_connections ADD COLUMN scan_started_at TEXT'));
  }
  if (!names.has('gmail_page_token')) {
    statements.push(db.prepare('ALTER TABLE google_connections ADD COLUMN gmail_page_token TEXT'));
  }
  if (statements.length) await db.batch(statements);
}

async function upgradeCandidateForeignKey(db: D1Database): Promise<void> {
  const foreignKeys = await db.prepare("PRAGMA foreign_key_list('gmail_import_candidates')")
    .all<{ table: string; on_delete: string }>();
  if (foreignKeys.results.some((key) => key.table === 'google_connections' && key.on_delete.toLowerCase() === 'cascade')) return;

  await db.prepare(`
    DELETE FROM gmail_import_candidates
    WHERE NOT EXISTS (
      SELECT 1 FROM google_connections
      WHERE google_connections.user_id = gmail_import_candidates.user_id
    )
  `).run();
  const temporaryTable = '__looply_gmail_import_candidates_upgrade';
  const createTemporary = createGmailImportCandidates.replace(
    'CREATE TABLE IF NOT EXISTS gmail_import_candidates',
    `CREATE TABLE ${temporaryTable}`,
  );
  await db.batch([
    db.prepare('PRAGMA defer_foreign_keys = ON'),
    db.prepare(`DROP TABLE IF EXISTS ${temporaryTable}`),
    db.prepare(createTemporary),
    db.prepare(`
      INSERT INTO ${temporaryTable} (
        id, user_id, fingerprint, google_message_id, name, merchant, price_minor,
        currency, billing_cycle, first_charged_on, last_charged_on, evidence_count,
        confidence, imported_at, expires_at, created_at, updated_at
      ) SELECT
        id, user_id, fingerprint, google_message_id, name, merchant, price_minor,
        currency, billing_cycle, first_charged_on, last_charged_on, evidence_count,
        confidence, imported_at, expires_at, created_at, updated_at
      FROM gmail_import_candidates
    `),
    db.prepare('DROP TABLE gmail_import_candidates'),
    db.prepare(`ALTER TABLE ${temporaryTable} RENAME TO gmail_import_candidates`),
    db.prepare('CREATE UNIQUE INDEX idx_gmail_candidates_user_fingerprint ON gmail_import_candidates(user_id, fingerprint)'),
    db.prepare('CREATE INDEX idx_gmail_candidates_user_imported ON gmail_import_candidates(user_id, imported_at, expires_at)'),
    db.prepare('PRAGMA defer_foreign_keys = OFF'),
  ]);
}

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
      db.prepare(createGoogleConnections),
      db.prepare(createGmailImportCandidates),
      db.prepare(createGmailImportEvents),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status)'),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_subscriptions_user_next_billing ON subscriptions(user_id, next_billing_date)'),
      db.prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_checkins_user_subscription_day ON usage_checkins(user_id, subscription_id, used_on)'),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON usage_checkins(user_id, used_on)'),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_charges_user_subscription_date ON charges(user_id, subscription_id, charged_on)'),
      db.prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_gmail_candidates_user_fingerprint ON gmail_import_candidates(user_id, fingerprint)'),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_gmail_candidates_user_imported ON gmail_import_candidates(user_id, imported_at, expires_at)'),
      db.prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_gmail_events_user_charge ON gmail_import_events(user_id, fingerprint, last_charged_on)'),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_gmail_events_user_subscription ON gmail_import_events(user_id, subscription_id)'),
    ]);
    await upgradeGoogleConnectionColumns(db);
    await upgradeCandidateForeignKey(db);
    await db.prepare('PRAGMA optimize').run();
  })().catch((error) => {
    schemaPromise = null;
    throw error;
  });

  await schemaPromise;
  return db;
}
