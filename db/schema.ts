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
