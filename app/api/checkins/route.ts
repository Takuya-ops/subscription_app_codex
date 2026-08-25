import { apiUser, errorResponse, isSameOrigin, readJsonBody } from '@/app/api/api-helpers';
import { ensureSchema } from '@/db/runtime';
import { getSubscription } from '@/db/subscription-store';
import { addDays, isIsoDate, type UsageLevel } from '@/lib/subscriptions';

export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) return errorResponse('不正なリクエストです', 403);
  const user = await apiUser();
  if (user instanceof Response) return user;
  const parsedBody = await readJsonBody(request);
  if (parsedBody.error) return parsedBody.error;
  if (!parsedBody.value || typeof parsedBody.value !== 'object') return errorResponse('入力内容を確認してください', 400);
  const { subscriptionId, level, usedOn } = parsedBody.value as { subscriptionId?: unknown; level?: unknown; usedOn?: unknown };
  if (typeof subscriptionId !== 'string' || !['often', 'sometimes', 'rarely'].includes(String(level))) return errorResponse('利用状況を確認してください', 400);
  const serverDate = new Date().toISOString().slice(0, 10);
  if (!isIsoDate(usedOn) || usedOn < addDays(serverDate, -1) || usedOn > addDays(serverDate, 1)) {
    return errorResponse('利用日の端末設定を確認してください', 400);
  }

  const db = await ensureSchema();
  const subscription = await getSubscription(db, user.userId, subscriptionId);
  if (!subscription) return errorResponse('サブスクが見つかりません', 404);
  const now = new Date().toISOString();
  const usageLevel = level as Exclude<UsageLevel, 'unknown'>;
  const checkinId = crypto.randomUUID();

  await db.batch([
    db.prepare(`
      INSERT INTO usage_checkins (id, user_id, subscription_id, used_on, level, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, subscription_id, used_on)
      DO UPDATE SET level = excluded.level, created_at = excluded.created_at
    `).bind(checkinId, user.userId, subscriptionId, usedOn, usageLevel, now),
    db.prepare(`
      UPDATE subscriptions
      SET usage_level = ?, last_used_date = CASE WHEN ? IN ('often', 'sometimes') THEN ? ELSE last_used_date END, updated_at = ?
      WHERE user_id = ? AND id = ?
    `).bind(usageLevel, usageLevel, usedOn, now, user.userId, subscriptionId),
  ]);

  return Response.json({ subscription: await getSubscription(db, user.userId, subscriptionId) });
}
