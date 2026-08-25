import type { BillingCandidate } from '@/lib/gmail';
import type { BillingCycle, Subscription } from '@/lib/subscriptions';
import { localIsoDate, nextBillingDateFromStart } from '@/lib/subscriptions';
import { sha256Base64Url } from '@/lib/server/secret-crypto';
import { rowToSubscription } from '@/db/subscription-store';

type GmailCandidateRow = {
  id: string;
  fingerprint: string;
  google_message_id: string;
  name: string;
  merchant: string;
  price_minor: number;
  currency: string;
  billing_cycle: BillingCycle;
  first_charged_on: string;
  last_charged_on: string;
  evidence_count: number;
  confidence: number;
};

export type GmailImportCandidate = {
  id: string;
  name: string;
  merchant: string;
  priceMinor: number;
  currency: 'JPY';
  billingCycle: BillingCycle;
  firstChargedOn: string;
  lastChargedOn: string;
  evidenceCount: number;
  confidence: number;
  existingSubscriptionId: string | null;
  existingSubscriptionName: string | null;
};

export class GmailCandidateError extends Error {}

function publicCandidate(row: GmailCandidateRow, existing?: { id: string; name: string }): GmailImportCandidate {
  return {
    id: row.id,
    name: row.name,
    merchant: row.merchant,
    priceMinor: row.price_minor,
    currency: 'JPY',
    billingCycle: row.billing_cycle,
    firstChargedOn: row.first_charged_on,
    lastChargedOn: row.last_charged_on,
    evidenceCount: row.evidence_count,
    confidence: row.confidence,
    existingSubscriptionId: existing?.id ?? null,
    existingSubscriptionName: existing?.name ?? null,
  };
}

function normalizedName(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('en-US').replace(/[^\p{L}\p{N}]+/gu, '');
}

async function fingerprint(candidate: BillingCandidate): Promise<string> {
  return sha256Base64Url(`${normalizedName(candidate.name)}\n${candidate.billingCycle}`);
}

type GroupedCandidate = BillingCandidate & { fingerprint: string; firstChargedOn: string; evidenceCount: number };

async function groupCandidates(candidates: BillingCandidate[]): Promise<GroupedCandidate[]> {
  const groups = new Map<string, GroupedCandidate>();
  for (const candidate of candidates) {
    const key = await fingerprint(candidate);
    const current = groups.get(key);
    if (!current) {
      groups.set(key, { ...candidate, fingerprint: key, firstChargedOn: candidate.chargedOn, evidenceCount: 1 });
      continue;
    }
    current.evidenceCount += 1;
    current.firstChargedOn = current.firstChargedOn < candidate.chargedOn ? current.firstChargedOn : candidate.chargedOn;
    current.confidence = Math.max(current.confidence, candidate.confidence);
    if (candidate.chargedOn > current.chargedOn) {
      current.chargedOn = candidate.chargedOn;
      current.messageId = candidate.messageId;
      current.threadId = candidate.threadId;
      current.merchant = candidate.merchant;
      current.priceMinor = candidate.priceMinor;
    }
  }
  return [...groups.values()];
}

export async function saveGmailCandidates(
  db: D1Database,
  userId: string,
  candidates: BillingCandidate[],
): Promise<GmailImportCandidate[]> {
  const grouped = await groupCandidates(candidates);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 86_400_000).toISOString();
  const nowIso = now.toISOString();
  const statements = await Promise.all(grouped.map(async (candidate) => db.prepare(`
    INSERT INTO gmail_import_candidates (
      id, user_id, fingerprint, google_message_id, name, merchant, price_minor,
      currency, billing_cycle, first_charged_on, last_charged_on, evidence_count,
      confidence, imported_at, expires_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'JPY', ?, ?, ?, ?, ?, NULL, ?, ?, ?)
    ON CONFLICT(user_id, fingerprint) DO UPDATE SET
      google_message_id = CASE
        WHEN excluded.last_charged_on >= gmail_import_candidates.last_charged_on
        THEN excluded.google_message_id ELSE gmail_import_candidates.google_message_id END,
      name = CASE
        WHEN excluded.last_charged_on >= gmail_import_candidates.last_charged_on
        THEN excluded.name ELSE gmail_import_candidates.name END,
      merchant = CASE
        WHEN excluded.last_charged_on >= gmail_import_candidates.last_charged_on
        THEN excluded.merchant ELSE gmail_import_candidates.merchant END,
      price_minor = CASE
        WHEN excluded.last_charged_on >= gmail_import_candidates.last_charged_on
        THEN excluded.price_minor ELSE gmail_import_candidates.price_minor END,
      billing_cycle = excluded.billing_cycle,
      first_charged_on = MIN(gmail_import_candidates.first_charged_on, excluded.first_charged_on),
      last_charged_on = MAX(gmail_import_candidates.last_charged_on, excluded.last_charged_on),
      evidence_count = MAX(gmail_import_candidates.evidence_count, excluded.evidence_count),
      confidence = MAX(gmail_import_candidates.confidence, excluded.confidence),
      imported_at = CASE
        WHEN excluded.last_charged_on > gmail_import_candidates.last_charged_on THEN NULL
        ELSE gmail_import_candidates.imported_at END,
      expires_at = CASE
        WHEN gmail_import_candidates.imported_at IS NULL OR excluded.last_charged_on > gmail_import_candidates.last_charged_on
        THEN excluded.expires_at ELSE gmail_import_candidates.expires_at END,
      updated_at = excluded.updated_at
  `).bind(
    crypto.randomUUID(), userId, candidate.fingerprint, await sha256Base64Url(candidate.messageId),
    candidate.name, candidate.merchant, candidate.priceMinor, candidate.billingCycle,
    candidate.firstChargedOn, candidate.chargedOn, candidate.evidenceCount,
    candidate.confidence, expiresAt, nowIso, nowIso,
  )));
  if (statements.length) await db.batch(statements);
  await db.prepare('DELETE FROM gmail_import_candidates WHERE user_id = ? AND imported_at IS NULL AND expires_at < ?')
    .bind(userId, nowIso).run();
  return listGmailCandidates(db, userId);
}

export async function listGmailCandidates(db: D1Database, userId: string): Promise<GmailImportCandidate[]> {
  const [result, subscriptions] = await Promise.all([db.prepare(`
    SELECT id, fingerprint, google_message_id, name, merchant, price_minor, currency,
      billing_cycle, first_charged_on, last_charged_on, evidence_count, confidence
    FROM gmail_import_candidates
    WHERE user_id = ? AND imported_at IS NULL AND expires_at >= ?
      AND NOT EXISTS (
        SELECT 1 FROM gmail_import_events
        WHERE gmail_import_events.user_id = ?
          AND gmail_import_events.fingerprint = gmail_import_candidates.fingerprint
          AND gmail_import_events.last_charged_on = gmail_import_candidates.last_charged_on
      )
    ORDER BY confidence DESC, last_charged_on DESC
    LIMIT 50
  `).bind(userId, new Date().toISOString(), userId).all<GmailCandidateRow>(), db.prepare(`
    SELECT id, name FROM subscriptions WHERE user_id = ? AND status != 'cancelled'
  `).bind(userId).all<{ id: string; name: string }>()]);
  return result.results.map((row) => publicCandidate(
    row,
    subscriptions.results.find((subscription) => normalizedName(subscription.name) === normalizedName(row.name)),
  ));
}

type SubscriptionRow = Parameters<typeof rowToSubscription>[0] & { user_id?: string };

function likelySameService(subscription: Subscription, candidate: GmailCandidateRow): boolean {
  return normalizedName(subscription.name) === normalizedName(candidate.name);
}

export async function importGmailCandidates(
  db: D1Database,
  userId: string,
  candidateIds: string[],
): Promise<{ subscriptions: Subscription[]; importedCount: number; matchedCount: number }> {
  const uniqueIds = [...new Set(candidateIds)];
  const placeholders = uniqueIds.map(() => '?').join(',');
  const selected = await db.prepare(`
    SELECT id, fingerprint, google_message_id, name, merchant, price_minor, currency,
      billing_cycle, first_charged_on, last_charged_on, evidence_count, confidence
    FROM gmail_import_candidates
    WHERE user_id = ? AND id IN (${placeholders}) AND imported_at IS NULL AND expires_at >= ?
  `).bind(userId, ...uniqueIds, new Date().toISOString()).all<GmailCandidateRow>();
  if (selected.results.length !== uniqueIds.length) throw new GmailCandidateError('選択した候補の一部が期限切れか、すでに登録済みです');
  const selectedNames = selected.results.map((candidate) => normalizedName(candidate.name));
  if (new Set(selectedNames).size !== selectedNames.length) {
    throw new GmailCandidateError('同じサービスの候補は一度に1件だけ選択してください');
  }

  const existingResult = await db.prepare(`
    SELECT id, name, plan, price_minor, currency, billing_cycle, start_date,
      next_billing_date, category, importance, satisfaction, usage_level,
      last_used_date, source, status, notes, created_at, updated_at
    FROM subscriptions WHERE user_id = ?
  `).bind(userId).all<SubscriptionRow>();
  const existing = existingResult.results.map(rowToSubscription);
  const statements: D1PreparedStatement[] = [];
  const affectedIds: string[] = [];
  let matchedCount = 0;
  const now = new Date().toISOString();

  for (const candidate of selected.results) {
    const match = existing.find((subscription) => likelySameService(subscription, candidate));
    const subscriptionId = match?.id ?? crypto.randomUUID();
    const nextBillingDate = nextBillingDateFromStart(candidate.last_charged_on, candidate.billing_cycle, localIsoDate());
    if (match) {
      matchedCount += 1;
      statements.push(db.prepare(`
        UPDATE subscriptions SET
          price_minor = ?, billing_cycle = ?, start_date = MIN(start_date, ?),
          next_billing_date = ?, updated_at = ?
        WHERE user_id = ? AND id = ?
      `).bind(candidate.price_minor, candidate.billing_cycle, candidate.first_charged_on, nextBillingDate, now, userId, subscriptionId));
    } else {
      statements.push(db.prepare(`
        INSERT INTO subscriptions (
          id, user_id, name, plan, price_minor, currency, billing_cycle, start_date,
          next_billing_date, category, importance, satisfaction, usage_level,
          last_used_date, source, status, notes, created_at, updated_at
        ) VALUES (?, ?, ?, 'Gmailから取得', ?, 'JPY', ?, ?, ?, 'その他', 3, NULL, 'unknown', NULL, 'email', 'active', ?, ?, ?)
      `).bind(
        subscriptionId, userId, candidate.name, candidate.price_minor,
        candidate.billing_cycle, candidate.first_charged_on, nextBillingDate,
        `Gmailの請求メール${candidate.evidence_count}件を確認して登録`, now, now,
      ));
    }
    statements.push(db.prepare(`
      INSERT INTO gmail_import_events (id, user_id, fingerprint, last_charged_on, subscription_id, imported_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(crypto.randomUUID(), userId, candidate.fingerprint, candidate.last_charged_on, subscriptionId, now));
    statements.push(db.prepare(`
      INSERT INTO charges (id, user_id, subscription_id, charged_on, amount_minor, currency, source, created_at)
      SELECT ?, ?, ?, ?, ?, 'JPY', 'email', ?
      WHERE NOT EXISTS (
        SELECT 1 FROM charges WHERE user_id = ? AND subscription_id = ? AND charged_on = ? AND amount_minor = ?
      )
    `).bind(
      crypto.randomUUID(), userId, subscriptionId, candidate.last_charged_on,
      candidate.price_minor, now, userId, subscriptionId,
      candidate.last_charged_on, candidate.price_minor,
    ));
    statements.push(db.prepare('UPDATE gmail_import_candidates SET imported_at = ?, updated_at = ? WHERE user_id = ? AND id = ? AND imported_at IS NULL')
      .bind(now, now, userId, candidate.id));
    affectedIds.push(subscriptionId);
  }
  try {
    await db.batch(statements);
  } catch {
    throw new GmailCandidateError('候補はすでに登録された可能性があります。メールを再確認してください');
  }
  const affectedPlaceholders = affectedIds.map(() => '?').join(',');
  const affected = await db.prepare(`
    SELECT id, name, plan, price_minor, currency, billing_cycle, start_date,
      next_billing_date, category, importance, satisfaction, usage_level,
      last_used_date, source, status, notes, created_at, updated_at
    FROM subscriptions WHERE user_id = ? AND id IN (${affectedPlaceholders})
  `).bind(userId, ...affectedIds).all<SubscriptionRow>();
  return { subscriptions: affected.results.map(rowToSubscription), importedCount: selected.results.length, matchedCount };
}
