import { apiUser, errorResponse, isSameOrigin } from '@/app/api/api-helpers';
import { ensureSchema } from '@/db/runtime';
import { getSubscription } from '@/db/subscription-store';
import type { UsageLevel } from '@/lib/subscriptions';

export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) return errorResponse('不正なリクエストです', 403);
  const user = await apiUser();
  if (user instanceof Response) return user;
  let body: unknown;
  try { body = await request.json(); } catch { return errorResponse('JSONを読み取れませんでした', 400); }
  if (!body || typeof body !== 'object') return errorResponse('入力内容を確認してください', 400);
  const { subscriptionId, level } = body as { subscriptionId?: unknown; level?: unknown };
  if (typeof subscriptionId !== 'string' || !['often', 'sometimes', 'rarely'].includes(String(level))) return errorResponse('利用状況を確認してください', 400);

  const db = await ensureSchema();
  const subscription = await getSubscription(db, user.userId, subscriptionId);
  if (!subscription) return errorResponse('サブスクが見つかりません', 404);
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();
  const usageLevel = level as Exclude<UsageLevel, 'unknown'>;
  const checkinId = crypto.randomUUID();

  await db.batch([
    db.prepare(`
      INSERT INTO usage_checkins (id, user_id, subscription_id, used_on, level, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, subscription_id, used_on)
      DO UPDATE SET level = excluded.level, created_at = excluded.created_at
    `).bind(checkinId, user.userId, subscriptionId, today, usageLevel, now),
    db.prepare(`
      UPDATE subscriptions
      SET usage_level = ?, last_used_date = CASE WHEN ? IN ('often', 'sometimes') THEN ? ELSE last_used_date END, updated_at = ?
      WHERE user_id = ? AND id = ?
    `).bind(usageLevel, usageLevel, today, now, user.userId, subscriptionId),
  ]);

  return Response.json({ subscription: await getSubscription(db, user.userId, subscriptionId) });
}
