import { apiUser, errorResponse, isSameOrigin } from '@/app/api/api-helpers';
import { ensureSchema } from '@/db/runtime';

export const dynamic = 'force-dynamic';

export async function DELETE(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) return errorResponse('不正なリクエストです', 403);
  const user = await apiUser();
  if (user instanceof Response) return user;
  let body: unknown;
  try { body = await request.json(); } catch { return errorResponse('確認情報が必要です', 400); }
  if (!body || typeof body !== 'object' || (body as { confirmation?: unknown }).confirmation !== '削除') return errorResponse('確認欄に「削除」と入力してください', 400);
  const db = await ensureSchema();
  await db.batch([
    db.prepare('DELETE FROM usage_checkins WHERE user_id = ?').bind(user.userId),
    db.prepare('DELETE FROM charges WHERE user_id = ?').bind(user.userId),
    db.prepare('DELETE FROM subscriptions WHERE user_id = ?').bind(user.userId),
  ]);
  return new Response(null, { status: 204 });
}
