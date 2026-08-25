import { apiUser, errorResponse, isSameOrigin, parseSubscriptionInput, readJsonBody } from '@/app/api/api-helpers';
import { ensureSchema } from '@/db/runtime';
import { insertSubscriptions } from '@/db/subscription-store';

export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) return errorResponse('不正なリクエストです', 403);
  const user = await apiUser();
  if (user instanceof Response) return user;
  const body = await readJsonBody(request, 256_000);
  if (body.error) return body.error;
  if (!body.value || typeof body.value !== 'object') return errorResponse('入力内容を確認してください', 400);
  const candidates = (body.value as { subscriptions?: unknown }).subscriptions;
  if (!Array.isArray(candidates) || candidates.length < 1 || candidates.length > 100) {
    return errorResponse('1〜100件のサブスクを指定してください', 400);
  }

  const parsed = candidates.map((candidate) => parseSubscriptionInput(
    candidate && typeof candidate === 'object' ? { ...candidate, source: 'csv' } : candidate,
  ));
  const invalidIndex = parsed.findIndex((item) => !item.value);
  if (invalidIndex >= 0) {
    return errorResponse(`${invalidIndex + 2}行目: ${parsed[invalidIndex].error ?? '入力内容を確認してください'}`, 400);
  }

  const subscriptions = await insertSubscriptions(
    await ensureSchema(),
    user.userId,
    parsed.map((item) => item.value!),
  );
  return Response.json({ subscriptions }, { status: 201 });
}
