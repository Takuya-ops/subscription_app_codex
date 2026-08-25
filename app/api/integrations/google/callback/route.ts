import { apiUser } from '@/app/api/api-helpers';
import { ensureSchema } from '@/db/runtime';
import {
  exchangeGoogleAuthorizationCode,
  fetchGoogleEmail,
  GoogleConnectionError,
  saveGoogleConnection,
  verifyGoogleAuthorizationCookie,
} from '@/lib/server/google-oauth';

export const dynamic = 'force-dynamic';

const COOKIE_NAME = '__Host-looply-google-oauth';
const clearCookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;

function cookieValue(request: Request, name: string): string | null {
  const cookie = request.headers.get('cookie') ?? '';
  for (const part of cookie.split(';')) {
    const index = part.indexOf('=');
    if (index < 1) continue;
    if (part.slice(0, index).trim() === name) return part.slice(index + 1).trim();
  }
  return null;
}

function finishUrl(result: 'connected' | 'denied' | 'expired' | 'failed'): string {
  return `/?google=${encodeURIComponent(result)}`;
}

function redirectResult(result: 'connected' | 'denied' | 'expired' | 'failed'): Response {
  return new Response(null, {
    status: 303,
    headers: {
      location: finishUrl(result),
      'cache-control': 'private, no-store',
      'referrer-policy': 'no-referrer',
      'set-cookie': clearCookie,
    },
  });
}

export async function GET(request: Request): Promise<Response> {
  const user = await apiUser();
  if (user instanceof Response) return user;
  const url = new URL(request.url);
  const codes = url.searchParams.getAll('code');
  const states = url.searchParams.getAll('state');
  const providerErrors = url.searchParams.getAll('error');
  const state = states.length === 1 ? states[0] : null;
  const stored = cookieValue(request, COOKIE_NAME);
  if (!state || state.length > 256 || !stored || stored.length > 4096 || providerErrors.length > 1 || codes.length > 1) {
    return redirectResult('expired');
  }
  try {
    const { verifier } = await verifyGoogleAuthorizationCookie(stored, state, user.userId);
    if (providerErrors.length === 1) return redirectResult('denied');
    const code = codes.length === 1 ? codes[0] : null;
    if (!code || code.length > 4096) return redirectResult('expired');
    const tokens = await exchangeGoogleAuthorizationCode(code, verifier);
    const email = await fetchGoogleEmail(tokens.access_token!);
    await saveGoogleConnection(await ensureSchema(), user.userId, email, tokens);
    return redirectResult('connected');
  } catch (error) {
    return redirectResult(
      error instanceof GoogleConnectionError && error.code === 'reauthorization_required' ? 'expired' : 'failed',
    );
  }
}
