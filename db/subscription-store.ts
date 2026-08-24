import type { BillingCycle, Subscription, SubscriptionSource, SubscriptionStatus, UsageLevel } from '@/lib/subscriptions';

type DbSubscriptionRow = {
  id: string;
  name: string;
  plan: string;
  price_minor: number;
  currency: string;
  billing_cycle: BillingCycle;
  start_date: string;
  next_billing_date: string;
  category: string;
  importance: number;
  satisfaction: number | null;
  usage_level: UsageLevel;
  last_used_date: string | null;
  source: SubscriptionSource;
  status: SubscriptionStatus;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type SubscriptionInput = Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>;

const columns = `
  id, name, plan, price_minor, currency, billing_cycle, start_date,
  next_billing_date, category, importance, satisfaction, usage_level,
  last_used_date, source, status, notes, created_at, updated_at
`;

export function rowToSubscription(row: DbSubscriptionRow): Subscription {
  return {
    id: row.id,
    name: row.name,
    plan: row.plan,
    priceMinor: row.price_minor,
    currency: row.currency,
    billingCycle: row.billing_cycle,
    startDate: row.start_date,
    nextBillingDate: row.next_billing_date,
    category: row.category,
    importance: row.importance,
    satisfaction: row.satisfaction,
    usageLevel: row.usage_level,
    lastUsedDate: row.last_used_date,
    source: row.source,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listSubscriptions(db: D1Database, userId: string): Promise<Subscription[]> {
  const result = await db.prepare(`SELECT ${columns} FROM subscriptions WHERE user_id = ? ORDER BY status ASC, next_billing_date ASC`).bind(userId).all<DbSubscriptionRow>();
  return result.results.map(rowToSubscription);
}

export async function getSubscription(db: D1Database, userId: string, id: string): Promise<Subscription | null> {
  const row = await db.prepare(`SELECT ${columns} FROM subscriptions WHERE user_id = ? AND id = ? LIMIT 1`).bind(userId, id).first<DbSubscriptionRow>();
  return row ? rowToSubscription(row) : null;
}

export async function insertSubscription(db: D1Database, userId: string, input: SubscriptionInput): Promise<Subscription> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.prepare(`
    INSERT INTO subscriptions (
      id, user_id, name, plan, price_minor, currency, billing_cycle, start_date,
      next_billing_date, category, importance, satisfaction, usage_level,
      last_used_date, source, status, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, userId, input.name, input.plan, input.priceMinor, input.currency,
    input.billingCycle, input.startDate, input.nextBillingDate, input.category,
    input.importance, input.satisfaction, input.usageLevel, input.lastUsedDate,
    input.source, input.status, input.notes, now, now,
  ).run();
  return { id, ...input, createdAt: now, updatedAt: now };
}

export async function replaceSubscription(db: D1Database, userId: string, id: string, input: SubscriptionInput): Promise<Subscription | null> {
  const existing = await getSubscription(db, userId, id);
  if (!existing) return null;
  const now = new Date().toISOString();
  await db.prepare(`
    UPDATE subscriptions SET
      name = ?, plan = ?, price_minor = ?, currency = ?, billing_cycle = ?,
      start_date = ?, next_billing_date = ?, category = ?, importance = ?,
      satisfaction = ?, usage_level = ?, last_used_date = ?, source = ?,
      status = ?, notes = ?, updated_at = ?
    WHERE user_id = ? AND id = ?
  `).bind(
    input.name, input.plan, input.priceMinor, input.currency, input.billingCycle,
    input.startDate, input.nextBillingDate, input.category, input.importance,
    input.satisfaction, input.usageLevel, input.lastUsedDate, input.source,
    input.status, input.notes, now, userId, id,
  ).run();
  return { id, ...input, createdAt: existing.createdAt, updatedAt: now };
}

function isoDateFromNow(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export async function seedSubscriptions(db: D1Database, userId: string): Promise<void> {
  const now = new Date().toISOString();
  const seedClaim = await db.prepare(`
    INSERT OR IGNORE INTO user_states (user_id, demo_seeded_at, created_at, updated_at)
    VALUES (?, ?, ?, ?)
  `).bind(userId, now, now, now).run();
  if ((seedClaim.meta.changes ?? 0) === 0) return;

  const seeds: Array<Omit<SubscriptionInput, 'currency' | 'source' | 'status' | 'notes'>> = [
    { name: 'Netflix', plan: 'スタンダード', priceMinor: 1590, billingCycle: 'monthly', startDate: '2023-04-28', nextBillingDate: isoDateFromNow(4), category: '動画', importance: 4, satisfaction: 5, usageLevel: 'often', lastUsedDate: isoDateFromNow(-1) },
    { name: 'Notion', plan: 'Plus', priceMinor: 16500, billingCycle: 'yearly', startDate: '2023-09-02', nextBillingDate: isoDateFromNow(9), category: '仕事・効率化', importance: 5, satisfaction: 5, usageLevel: 'often', lastUsedDate: isoDateFromNow(-1) },
    { name: 'Adobe Creative Cloud', plan: 'フォトプラン', priceMinor: 39360, billingCycle: 'yearly', startDate: '2024-01-06', nextBillingDate: isoDateFromNow(13), category: '仕事・効率化', importance: 4, satisfaction: 4, usageLevel: 'sometimes', lastUsedDate: isoDateFromNow(-8) },
    { name: 'Spotify', plan: 'Premium', priceMinor: 980, billingCycle: 'monthly', startDate: '2021-11-12', nextBillingDate: isoDateFromNow(18), category: '音楽', importance: 4, satisfaction: 5, usageLevel: 'often', lastUsedDate: isoDateFromNow(-1) },
    { name: 'iCloud+', plan: '200GB', priceMinor: 400, billingCycle: 'monthly', startDate: '2022-06-19', nextBillingDate: isoDateFromNow(24), category: 'クラウド', importance: 5, satisfaction: 4, usageLevel: 'often', lastUsedDate: isoDateFromNow(-1) },
    { name: 'YouTube Premium', plan: '個人', priceMinor: 1280, billingCycle: 'monthly', startDate: '2022-03-03', nextBillingDate: isoDateFromNow(27), category: '動画', importance: 3, satisfaction: 4, usageLevel: 'often', lastUsedDate: isoDateFromNow(-2) },
    { name: 'Canva Pro', plan: '個人', priceMinor: 15000, billingCycle: 'yearly', startDate: '2025-02-14', nextBillingDate: isoDateFromNow(31), category: '仕事・効率化', importance: 2, satisfaction: 2, usageLevel: 'rarely', lastUsedDate: isoDateFromNow(-74) },
    { name: 'Dropbox Plus', plan: '2TB', priceMinor: 14400, billingCycle: 'yearly', startDate: '2024-08-16', nextBillingDate: isoDateFromNow(38), category: 'クラウド', importance: 2, satisfaction: 3, usageLevel: 'sometimes', lastUsedDate: isoDateFromNow(-25) },
    { name: 'Kindle Unlimited', plan: '読み放題', priceMinor: 980, billingCycle: 'monthly', startDate: '2025-05-21', nextBillingDate: isoDateFromNow(42), category: '学習', importance: 3, satisfaction: 3, usageLevel: 'rarely', lastUsedDate: isoDateFromNow(-49) },
    { name: 'Money Forward ME', plan: 'プレミアム', priceMinor: 500, billingCycle: 'monthly', startDate: '2024-10-25', nextBillingDate: isoDateFromNow(47), category: '家計管理', importance: 5, satisfaction: 5, usageLevel: 'often', lastUsedDate: isoDateFromNow(-1) },
  ];

  await db.batch(seeds.map((seed) => db.prepare(`
    INSERT INTO subscriptions (
      id, user_id, name, plan, price_minor, currency, billing_cycle, start_date,
      next_billing_date, category, importance, satisfaction, usage_level,
      last_used_date, source, status, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'JPY', ?, ?, ?, ?, ?, ?, ?, ?, 'manual', 'active', '', ?, ?)
  `).bind(
    crypto.randomUUID(), userId, seed.name, seed.plan, seed.priceMinor,
    seed.billingCycle, seed.startDate, seed.nextBillingDate, seed.category,
    seed.importance, seed.satisfaction, seed.usageLevel, seed.lastUsedDate,
    now, now,
  )));
}
