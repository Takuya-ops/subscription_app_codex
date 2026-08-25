import { apiUser, errorResponse, isSameOrigin, parseSubscriptionInput, readJsonBody } from '@/app/api/api-helpers';
import { ensureSchema } from '@/db/runtime';
import { getSubscription, replaceSubscription } from '@/db/subscription-store';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const user = await apiUser();
  if (user instanceof Response) return user;
  const { id } = await params;
  const subscription = await getSubscription(await ensureSchema(), user.userId, id);
  return subscription
    ? Response.json({ subscription }, { headers: { 'cache-control': 'private, no-store' } })
    : errorResponse('サブスクが見つかりません', 404);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  if (!isSameOrigin(request)) return errorResponse('不正なリクエストです', 403);
  const user = await apiUser();
  if (user instanceof Response) return user;
  const { id } = await params;
  const db = await ensureSchema();
  const existing = await getSubscription(db, user.userId, id);
  if (!existing) return errorResponse('サブスクが見つかりません', 404);
  const body = await readJsonBody(request);
  if (body.error) return body.error;
  const parsed = parseSubscriptionInput(
    body.value && typeof body.value === 'object' ? { ...body.value, source: existing.source } : body.value,
  );
  if (!parsed.value) return errorResponse(parsed.error ?? '入力内容を確認してください', 400);
  const subscription = await replaceSubscription(db, user.userId, id, parsed.value);
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

  const body = await readJsonBody(request);
  if (body.error) return body.error;
  if (!body.value || typeof body.value !== 'object' || (body.value as { confirmName?: unknown }).confirmName !== existing.name) return errorResponse('サービス名による確認が一致しません', 400);

  await db.prepare('DELETE FROM subscriptions WHERE user_id = ? AND id = ?').bind(user.userId, id).run();
  return new Response(null, { status: 204 });
}
