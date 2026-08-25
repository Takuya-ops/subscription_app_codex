import { apiUser, errorResponse, isSameOrigin } from '@/app/api/api-helpers';
import { ensureSchema } from '@/db/runtime';
import { disconnectGoogle } from '@/lib/server/google-oauth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) return errorResponse('不正なリクエストです', 403);
  const user = await apiUser();
  if (user instanceof Response) return user;
  return Response.json(
    await disconnectGoogle(await ensureSchema(), user.userId),
    { headers: { 'cache-control': 'private, no-store' } },
  );
}
