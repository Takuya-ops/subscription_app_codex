import { ensureSchema } from '@/db/runtime';
import { insertSubscription, listSubscriptions } from '@/db/subscription-store';
import { apiUser, errorResponse, isSameOrigin, parseSubscriptionInput, readJsonBody } from '@/app/api/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const user = await apiUser();
  if (user instanceof Response) return user;
  const db = await ensureSchema();
  return Response.json(
    { subscriptions: await listSubscriptions(db, user.userId) },
    { headers: { 'cache-control': 'private, no-store' } },
  );
}

export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) return errorResponse('不正なリクエストです', 403);
  const user = await apiUser();
  if (user instanceof Response) return user;

  const body = await readJsonBody(request);
  if (body.error) return body.error;
  const parsed = parseSubscriptionInput(
    body.value && typeof body.value === 'object' ? { ...body.value, source: 'manual' } : body.value,
  );
  if (!parsed.value) return errorResponse(parsed.error ?? '入力内容を確認してください', 400);

  const db = await ensureSchema();
  const subscription = await insertSubscription(db, user.userId, parsed.value);
  return Response.json({ subscription }, { status: 201 });
}
