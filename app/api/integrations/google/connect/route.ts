import { apiUser, errorResponse } from '@/app/api/api-helpers';
import { createGoogleAuthorization, GoogleConnectionError } from '@/lib/server/google-oauth';

export const dynamic = 'force-dynamic';

const COOKIE_NAME = '__Host-looply-google-oauth';

export async function GET(): Promise<Response> {
  const user = await apiUser();
  if (user instanceof Response) return user;
  try {
    const authorization = await createGoogleAuthorization(user.userId);
    return new Response(null, {
      status: 302,
      headers: {
        location: authorization.url,
        'cache-control': 'private, no-store',
        'referrer-policy': 'no-referrer',
        'set-cookie': `${COOKIE_NAME}=${authorization.cookieValue}; Path=/; Max-Age=600; HttpOnly; Secure; SameSite=Lax`,
      },
    });
  } catch (error) {
    if (error instanceof GoogleConnectionError) return errorResponse(error.message, 503);
    return errorResponse('Google接続を開始できませんでした', 500);
  }
}
