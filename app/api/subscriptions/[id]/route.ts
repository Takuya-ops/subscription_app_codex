import { apiUser, errorResponse, isSameOrigin, parseSubscriptionInput } from '@/app/api/api-helpers';
import { ensureSchema } from '@/db/runtime';
import { getSubscription, replaceSubscription } from '@/db/subscription-store';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const user = await apiUser();
  if (user instanceof Response) return user;
  const { id } = await params;
  const subscription = await getSubscription(await ensureSchema(), user.userId, id);
  return subscription ? Response.json({ subscription }) : errorResponse('サブスクが見つかりません', 404);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  if (!isSameOrigin(request)) return errorResponse('不正なリクエストです', 403);
  const user = await apiUser();
  if (user instanceof Response) return user;
  let body: unknown;
  try { body = await request.json(); } catch { return errorResponse('JSONを読み取れませんでした', 400); }
  const parsed = parseSubscriptionInput(body);
  if (!parsed.value) return errorResponse(parsed.error ?? '入力内容を確認してください', 400);
  const { id } = await params;
  const subscription = await replaceSubscription(await ensureSchema(), user.userId, id, parsed.value);
  return subscription ? Response.json({ subscription }) : errorResponse('サブスクが見つかりません', 404);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  if (!isSameOrigin(request)) return errorResponse('不正なリクエストです', 403);
  const user = await apiUser();
  if (user instanceof Response) return user;
  const { id } = await params;
  const db = await ensureSchema();
  const existing = await getSubscription(db, user.userId, id);
  if (!existing) return errorResponse('サブスクが見つかりません', 404);

  let body: unknown;
  try { body = await request.json(); } catch { return errorResponse('確認情報が必要です', 400); }
  if (!body || typeof body !== 'object' || (body as { confirmName?: unknown }).confirmName !== existing.name) return errorResponse('サービス名による確認が一致しません', 400);

  await db.prepare('DELETE FROM subscriptions WHERE user_id = ? AND id = ?').bind(user.userId, id).run();
  return new Response(null, { status: 204 });
}
