import { apiUser } from '@/app/api/api-helpers';
import { ensureSchema } from '@/db/runtime';
import { googleConnectionStatus } from '@/lib/server/google-oauth';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const user = await apiUser();
  if (user instanceof Response) return user;
  return Response.json(
    await googleConnectionStatus(await ensureSchema(), user.userId),
    { headers: { 'cache-control': 'private, no-store' } },
  );
}
