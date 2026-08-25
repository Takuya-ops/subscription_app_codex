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

export async function insertSubscriptions(
  db: D1Database,
  userId: string,
  inputs: SubscriptionInput[],
): Promise<Subscription[]> {
  const now = new Date().toISOString();
  const subscriptions = inputs.map((input) => ({
    id: crypto.randomUUID(),
    ...input,
    createdAt: now,
    updatedAt: now,
  }));
  await db.batch(subscriptions.map((subscription) => db.prepare(`
    INSERT INTO subscriptions (
      id, user_id, name, plan, price_minor, currency, billing_cycle, start_date,
      next_billing_date, category, importance, satisfaction, usage_level,
      last_used_date, source, status, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    subscription.id, userId, subscription.name, subscription.plan,
    subscription.priceMinor, subscription.currency, subscription.billingCycle,
    subscription.startDate, subscription.nextBillingDate, subscription.category,
    subscription.importance, subscription.satisfaction, subscription.usageLevel,
    subscription.lastUsedDate, subscription.source, subscription.status,
    subscription.notes, now, now,
  )));
  return subscriptions;
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
