import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const userStates = sqliteTable('user_states', {
  userId: text('user_id').primaryKey(),
  demoSeededAt: text('demo_seeded_at').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const subscriptions = sqliteTable(
  'subscriptions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    name: text('name').notNull(),
    plan: text('plan').notNull().default('スタンダード'),
    priceMinor: integer('price_minor').notNull(),
    currency: text('currency').notNull().default('JPY'),
    billingCycle: text('billing_cycle', { enum: ['weekly', 'monthly', 'yearly'] }).notNull(),
    startDate: text('start_date').notNull(),
    nextBillingDate: text('next_billing_date').notNull(),
    category: text('category').notNull().default('その他'),
    importance: integer('importance').notNull().default(3),
    satisfaction: integer('satisfaction'),
    usageLevel: text('usage_level', { enum: ['often', 'sometimes', 'rarely', 'unknown'] }).notNull().default('unknown'),
    lastUsedDate: text('last_used_date'),
    source: text('source', { enum: ['manual', 'csv', 'email', 'store'] }).notNull().default('manual'),
    status: text('status', { enum: ['active', 'paused', 'cancelled'] }).notNull().default('active'),
    notes: text('notes').notNull().default(''),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('idx_subscriptions_user_status').on(table.userId, table.status),
    index('idx_subscriptions_user_next_billing').on(table.userId, table.nextBillingDate),
    check('subscriptions_price_nonnegative', sql`${table.priceMinor} >= 0`),
    check('subscriptions_importance_range', sql`${table.importance} BETWEEN 1 AND 5`),
    check('subscriptions_satisfaction_range', sql`${table.satisfaction} IS NULL OR ${table.satisfaction} BETWEEN 1 AND 5`),
    check('subscriptions_billing_cycle_values', sql`${table.billingCycle} IN ('weekly', 'monthly', 'yearly')`),
    check('subscriptions_usage_level_values', sql`${table.usageLevel} IN ('often', 'sometimes', 'rarely', 'unknown')`),
    check('subscriptions_source_values', sql`${table.source} IN ('manual', 'csv', 'email', 'store')`),
    check('subscriptions_status_values', sql`${table.status} IN ('active', 'paused', 'cancelled')`),
  ],
);

export const usageCheckins = sqliteTable(
  'usage_checkins',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    subscriptionId: text('subscription_id').notNull().references(() => subscriptions.id, { onDelete: 'cascade' }),
    usedOn: text('used_on').notNull(),
    level: text('level', { enum: ['often', 'sometimes', 'rarely'] }).notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    uniqueIndex('idx_checkins_user_subscription_day').on(table.userId, table.subscriptionId, table.usedOn),
    index('idx_checkins_user_date').on(table.userId, table.usedOn),
    check('usage_checkins_level_values', sql`${table.level} IN ('often', 'sometimes', 'rarely')`),
  ],
);

export const charges = sqliteTable(
  'charges',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    subscriptionId: text('subscription_id').notNull().references(() => subscriptions.id, { onDelete: 'cascade' }),
    chargedOn: text('charged_on').notNull(),
    amountMinor: integer('amount_minor').notNull(),
    currency: text('currency').notNull().default('JPY'),
    source: text('source', { enum: ['manual', 'csv', 'email'] }).notNull().default('manual'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('idx_charges_user_subscription_date').on(table.userId, table.subscriptionId, table.chargedOn),
    check('charges_amount_nonnegative', sql`${table.amountMinor} >= 0`),
    check('charges_source_values', sql`${table.source} IN ('manual', 'csv', 'email')`),
  ],
);

export const googleConnections = sqliteTable('google_connections', {
  userId: text('user_id').primaryKey(),
  googleEmail: text('google_email').notNull(),
  accessTokenEncrypted: text('access_token_encrypted').notNull(),
  refreshTokenEncrypted: text('refresh_token_encrypted'),
  accessTokenExpiresAt: text('access_token_expires_at').notNull(),
  scope: text('scope').notNull(),
  lastSyncedAt: text('last_synced_at'),
  scanStartedAt: text('scan_started_at'),
  gmailPageToken: text('gmail_page_token'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const gmailImportCandidates = sqliteTable(
  'gmail_import_candidates',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => googleConnections.userId, { onDelete: 'cascade' }),
    fingerprint: text('fingerprint').notNull(),
    googleMessageId: text('google_message_id').notNull(),
    name: text('name').notNull(),
    merchant: text('merchant').notNull(),
    priceMinor: integer('price_minor').notNull(),
    currency: text('currency').notNull().default('JPY'),
    billingCycle: text('billing_cycle', { enum: ['weekly', 'monthly', 'yearly'] }).notNull(),
    firstChargedOn: text('first_charged_on').notNull(),
    lastChargedOn: text('last_charged_on').notNull(),
    evidenceCount: integer('evidence_count').notNull().default(1),
    confidence: integer('confidence').notNull(),
    importedAt: text('imported_at'),
    expiresAt: text('expires_at').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('idx_gmail_candidates_user_fingerprint').on(table.userId, table.fingerprint),
    index('idx_gmail_candidates_user_imported').on(table.userId, table.importedAt, table.expiresAt),
    check('gmail_candidates_price_positive', sql`${table.priceMinor} > 0`),
    check('gmail_candidates_currency_jpy', sql`${table.currency} = 'JPY'`),
    check('gmail_candidates_cycle_values', sql`${table.billingCycle} IN ('weekly', 'monthly', 'yearly')`),
    check('gmail_candidates_evidence_positive', sql`${table.evidenceCount} > 0`),
    check('gmail_candidates_confidence_range', sql`${table.confidence} BETWEEN 0 AND 100`),
  ],
);

export const gmailImportEvents = sqliteTable(
  'gmail_import_events',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    fingerprint: text('fingerprint').notNull(),
    lastChargedOn: text('last_charged_on').notNull(),
    subscriptionId: text('subscription_id').notNull().references(() => subscriptions.id, { onDelete: 'cascade' }),
    importedAt: text('imported_at').notNull(),
  },
  (table) => [
    uniqueIndex('idx_gmail_events_user_charge').on(table.userId, table.fingerprint, table.lastChargedOn),
    index('idx_gmail_events_user_subscription').on(table.userId, table.subscriptionId),
  ],
);
