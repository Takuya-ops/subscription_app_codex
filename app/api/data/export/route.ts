import { apiUser } from '@/app/api/api-helpers';
import { ensureSchema } from '@/db/runtime';
import { listSubscriptions } from '@/db/subscription-store';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const user = await apiUser();
  if (user instanceof Response) return user;
  const db = await ensureSchema();
  const [subscriptions, checkins, charges] = await Promise.all([
    listSubscriptions(db, user.userId),
    db.prepare('SELECT subscription_id, used_on, level, created_at FROM usage_checkins WHERE user_id = ? ORDER BY used_on DESC').bind(user.userId).all(),
    db.prepare('SELECT subscription_id, charged_on, amount_minor, currency, source FROM charges WHERE user_id = ? ORDER BY charged_on DESC').bind(user.userId).all(),
  ]);
  const body = JSON.stringify({ exportedAt: new Date().toISOString(), subscriptions, usageCheckins: checkins.results, charges: charges.results }, null, 2);
  return new Response(body, {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="looply-export-${new Date().toISOString().slice(0, 10)}.json"`,
      'cache-control': 'no-store',
    },
  });
}
