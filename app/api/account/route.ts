import { apiUser, errorResponse, isSameOrigin, readJsonBody } from '@/app/api/api-helpers';
import { ensureSchema } from '@/db/runtime';

export const dynamic = 'force-dynamic';

export async function DELETE(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) return errorResponse('不正なリクエストです', 403);
  const user = await apiUser();
  if (user instanceof Response) return user;
  const body = await readJsonBody(request);
  if (body.error) return body.error;
  if (!body.value || typeof body.value !== 'object' || (body.value as { confirmation?: unknown }).confirmation !== '削除') return errorResponse('確認欄に「削除」と入力してください', 400);
  const db = await ensureSchema();
  await db.batch([
    db.prepare('DELETE FROM usage_checkins WHERE user_id = ?').bind(user.userId),
    db.prepare('DELETE FROM charges WHERE user_id = ?').bind(user.userId),
    db.prepare('DELETE FROM subscriptions WHERE user_id = ?').bind(user.userId),
    db.prepare('DELETE FROM user_states WHERE user_id = ?').bind(user.userId),
  ]);
  return new Response(null, { status: 204 });
}
