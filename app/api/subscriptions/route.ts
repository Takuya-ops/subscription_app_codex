import { ensureSchema } from '@/db/runtime';
import { insertSubscription, listSubscriptions, seedSubscriptions } from '@/db/subscription-store';
import { apiUser, errorResponse, isSameOrigin, parseSubscriptionInput } from '@/app/api/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const user = await apiUser();
  if (user instanceof Response) return user;
  const db = await ensureSchema();
  await seedSubscriptions(db, user.userId);
  return Response.json({ subscriptions: await listSubscriptions(db, user.userId) });
}

export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) return errorResponse('不正なリクエストです', 403);
  const user = await apiUser();
  if (user instanceof Response) return user;

  let body: unknown;
  try { body = await request.json(); } catch { return errorResponse('JSONを読み取れませんでした', 400); }
  const parsed = parseSubscriptionInput(body);
  if (!parsed.value) return errorResponse(parsed.error ?? '入力内容を確認してください', 400);

  const db = await ensureSchema();
  const subscription = await insertSubscription(db, user.userId, parsed.value);
  return Response.json({ subscription }, { status: 201 });
}
