import { env } from 'cloudflare:workers';
import { constantTimeEqual, decryptSecret, encryptSecret, isValidEncryptionKey, randomBase64Url, sha256Base64Url } from '@/lib/server/secret-crypto';
import { GMAIL_READONLY_SCOPE, hasOnlyGmailReadonlyScope } from '@/lib/server/google-oauth-policy';

const GMAIL_SCOPE = GMAIL_READONLY_SCOPE;
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const REVOKE_ENDPOINT = 'https://oauth2.googleapis.com/revoke';
const PROFILE_ENDPOINT = 'https://gmail.googleapis.com/gmail/v1/users/me/profile';
const COOKIE_PURPOSE = 'looply:google-oauth-cookie:v1';
const ACCESS_PURPOSE = 'looply:google-access-token:v1';
const REFRESH_PURPOSE = 'looply:google-refresh-token:v1';

type GoogleRuntimeEnv = Cloudflare.Env & {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REDIRECT_URI?: string;
  TOKEN_ENCRYPTION_KEY?: string;
};

type GoogleConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  encryptionKey: string;
};

type OAuthCookiePayload = {
  state: string;
  verifier: string;
  userId: string;
  expiresAt: number;
};

type GoogleConnectionRow = {
  user_id: string;
  google_email: string;
  access_token_encrypted: string;
  refresh_token_encrypted: string | null;
  access_token_expires_at: string;
  scope: string;
  last_synced_at: string | null;
  scan_started_at: string | null;
  gmail_page_token: string | null;
  created_at: string;
  updated_at: string;
};

type TokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

async function userBoundPurpose(base: string, userId: string): Promise<string> {
  return `${base}:${await sha256Base64Url(userId)}`;
}

export class GoogleConnectionError extends Error {
  readonly code: 'not_configured' | 'not_connected' | 'reauthorization_required' | 'google_unavailable' | 'scan_in_progress';
  readonly diagnostic: string;

  constructor(
    message: string,
    code: 'not_configured' | 'not_connected' | 'reauthorization_required' | 'google_unavailable' | 'scan_in_progress',
    diagnostic = 'unspecified',
  ) {
    super(message);
    this.code = code;
    this.diagnostic = diagnostic;
  }
}

function config(): GoogleConfig {
  const runtime = env as GoogleRuntimeEnv;
  const clientId = runtime.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = runtime.GOOGLE_CLIENT_SECRET?.trim();
  const redirectUri = runtime.GOOGLE_REDIRECT_URI?.trim();
  const encryptionKey = runtime.TOKEN_ENCRYPTION_KEY?.trim();
  if (!clientId || !clientSecret || !redirectUri || !encryptionKey) {
    throw new GoogleConnectionError('Google連携の設定が完了していません', 'not_configured');
  }
  if (!isValidEncryptionKey(encryptionKey)) {
    throw new GoogleConnectionError('Google連携の暗号化設定を確認してください', 'not_configured');
  }
  return { clientId, clientSecret, redirectUri, encryptionKey };
}

function formBody(values: Record<string, string>): URLSearchParams {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) body.set(key, value);
  return body;
}

function validateTokenResponse(payload: TokenResponse, requireScope: boolean): void {
  if (
    !payload.access_token || payload.access_token.length > 8192 ||
    !Number.isInteger(payload.expires_in) || payload.expires_in! <= 0 || payload.expires_in! > 86_400 ||
    (payload.token_type && payload.token_type.toLowerCase() !== 'bearer')
  ) {
    throw new GoogleConnectionError('Google認証を完了できませんでした', 'google_unavailable', 'token_payload_invalid');
  }
  if (payload.refresh_token && payload.refresh_token.length > 8192) {
    throw new GoogleConnectionError('Google認証を完了できませんでした', 'google_unavailable', 'token_refresh_payload_invalid');
  }
  if (requireScope || payload.scope !== undefined) {
    if (!hasOnlyGmailReadonlyScope(payload.scope)) {
      throw new GoogleConnectionError('Gmailの読み取り専用権限を確認できませんでした', 'reauthorization_required', 'token_scope_invalid');
    }
  }
}

async function tokenRequest(values: Record<string, string>, requireScope = false): Promise<TokenResponse> {
  let response: Response;
  try {
    response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: formBody(values),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    const errorName = error instanceof Error && /^[A-Za-z]{1,30}$/u.test(error.name) ? error.name.toLowerCase() : 'unknown';
    throw new GoogleConnectionError(
      'Google認証サーバーに接続できませんでした',
      'google_unavailable',
      `token_fetch_${errorName}`,
    );
  }
  const payload = await response.json().catch(() => ({})) as TokenResponse;
  if (!response.ok) {
    const reauthorize = payload.error === 'invalid_grant';
    const safeError = typeof payload.error === 'string' && /^[a-z_]{1,40}$/u.test(payload.error)
      ? payload.error
      : 'unknown';
    throw new GoogleConnectionError(
      reauthorize ? 'Googleの許可が期限切れです。再接続してください' : 'Google認証を完了できませんでした',
      reauthorize ? 'reauthorization_required' : 'google_unavailable',
      `token_http_${response.status}_${safeError}`,
    );
  }
  validateTokenResponse(payload, requireScope);
  return payload;
}

export async function createGoogleAuthorization(userId: string): Promise<{ url: string; cookieValue: string }> {
  const settings = config();
  const state = randomBase64Url(32);
  const verifier = randomBase64Url(48);
  const challenge = await sha256Base64Url(verifier);
  const payload: OAuthCookiePayload = {
    state,
    verifier,
    userId,
    expiresAt: Date.now() + 10 * 60_000,
  };
  const cookieValue = await encryptSecret(JSON.stringify(payload), settings.encryptionKey, COOKIE_PURPOSE);
  const url = new URL(AUTH_ENDPOINT);
  url.search = formBody({
    client_id: settings.clientId,
    redirect_uri: settings.redirectUri,
    response_type: 'code',
    scope: GMAIL_SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'false',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  }).toString();
  return { url: url.toString(), cookieValue };
}

export async function verifyGoogleAuthorizationCookie(
  cookieValue: string,
  returnedState: string,
  userId: string,
): Promise<{ verifier: string }> {
  const settings = config();
  let payload: OAuthCookiePayload;
  try {
    payload = JSON.parse(await decryptSecret(cookieValue, settings.encryptionKey, COOKIE_PURPOSE)) as OAuthCookiePayload;
  } catch {
    throw new GoogleConnectionError('Google接続の確認情報が無効です。もう一度お試しください', 'reauthorization_required');
  }
  if (
    typeof payload.state !== 'string' ||
    typeof payload.verifier !== 'string' ||
    typeof payload.userId !== 'string' ||
    typeof payload.expiresAt !== 'number' ||
    payload.expiresAt < Date.now() ||
    !constantTimeEqual(payload.state, returnedState) ||
    !constantTimeEqual(payload.userId, userId)
  ) {
    throw new GoogleConnectionError('Google接続の確認情報が一致しません。もう一度お試しください', 'reauthorization_required');
  }
  return { verifier: payload.verifier };
}

export async function exchangeGoogleAuthorizationCode(code: string, verifier: string): Promise<TokenResponse> {
  const settings = config();
  return tokenRequest({
    client_id: settings.clientId,
    client_secret: settings.clientSecret,
    redirect_uri: settings.redirectUri,
    grant_type: 'authorization_code',
    code,
    code_verifier: verifier,
  }, true);
}

export async function fetchGoogleEmail(accessToken: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(PROFILE_ENDPOINT, {
      headers: { authorization: `Bearer ${accessToken}`, accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
      redirect: 'error',
    });
  } catch {
    throw new GoogleConnectionError('Gmailプロフィールを確認できませんでした', 'google_unavailable');
  }
  const payload = await response.json().catch(() => ({})) as { emailAddress?: string };
  if (!response.ok || typeof payload.emailAddress !== 'string' || !payload.emailAddress.includes('@')) {
    throw new GoogleConnectionError('Gmailプロフィールを確認できませんでした', 'google_unavailable');
  }
  return payload.emailAddress.slice(0, 254);
}

export async function saveGoogleConnection(
  db: D1Database,
  userId: string,
  googleEmail: string,
  tokens: TokenResponse,
): Promise<void> {
  const settings = config();
  if (!tokens.access_token || !tokens.expires_in) throw new GoogleConnectionError('Google認証情報が不足しています', 'google_unavailable');
  const existing = await db.prepare(
    'SELECT google_email, refresh_token_encrypted FROM google_connections WHERE user_id = ? LIMIT 1',
  ).bind(userId).first<{ google_email: string; refresh_token_encrypted: string | null }>();
  const refreshTokenEncrypted = tokens.refresh_token
    ? await encryptSecret(tokens.refresh_token, settings.encryptionKey, await userBoundPurpose(REFRESH_PURPOSE, userId))
    : existing?.google_email.toLocaleLowerCase('en-US') === googleEmail.toLocaleLowerCase('en-US')
      ? existing.refresh_token_encrypted
      : null;
  if (!refreshTokenEncrypted) {
    throw new GoogleConnectionError('継続利用の許可を取得できませんでした。もう一度接続してください', 'reauthorization_required');
  }
  const now = new Date();
  const expiresAt = new Date(now.getTime() + Math.max(60, tokens.expires_in) * 1000).toISOString();
  const accessTokenEncrypted = await encryptSecret(
    tokens.access_token,
    settings.encryptionKey,
    await userBoundPurpose(ACCESS_PURPOSE, userId),
  );
  await db.prepare(`
    INSERT INTO google_connections (
      user_id, google_email, access_token_encrypted, refresh_token_encrypted,
      access_token_expires_at, scope, last_synced_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      google_email = excluded.google_email,
      access_token_encrypted = excluded.access_token_encrypted,
      refresh_token_encrypted = excluded.refresh_token_encrypted,
      access_token_expires_at = excluded.access_token_expires_at,
      scope = excluded.scope,
      last_synced_at = NULL,
      scan_started_at = NULL,
      gmail_page_token = NULL,
      updated_at = excluded.updated_at
  `).bind(
    userId,
    googleEmail,
    accessTokenEncrypted,
    refreshTokenEncrypted,
    expiresAt,
    GMAIL_SCOPE,
    now.toISOString(),
    now.toISOString(),
  ).run();
}

async function connectionRow(db: D1Database, userId: string): Promise<GoogleConnectionRow | null> {
  return db.prepare(`
    SELECT user_id, google_email, access_token_encrypted, refresh_token_encrypted,
      access_token_expires_at, scope, last_synced_at, scan_started_at,
      gmail_page_token, created_at, updated_at
    FROM google_connections WHERE user_id = ? LIMIT 1
  `).bind(userId).first<GoogleConnectionRow>();
}

async function deleteGoogleConnection(db: D1Database, userId: string): Promise<void> {
  await db.batch([
    db.prepare('DELETE FROM gmail_import_candidates WHERE user_id = ?').bind(userId),
    db.prepare('DELETE FROM google_connections WHERE user_id = ?').bind(userId),
  ]);
}

export async function googleConnectionStatus(db: D1Database, userId: string): Promise<{
  connected: boolean;
  email?: string;
  lastSyncedAt?: string;
}> {
  const row = await connectionRow(db, userId);
  if (!row) return { connected: false };
  return { connected: true, email: row.google_email, ...(row.last_synced_at ? { lastSyncedAt: row.last_synced_at } : {}) };
}

export async function getGoogleAccessToken(db: D1Database, userId: string, forceRefresh = false): Promise<string> {
  const row = await connectionRow(db, userId);
  if (!row) throw new GoogleConnectionError('Gmailが接続されていません', 'not_connected');
  const settings = config();
  if (!forceRefresh && new Date(row.access_token_expires_at).getTime() > Date.now() + 60_000) {
    try {
      return await decryptSecret(
        row.access_token_encrypted,
        settings.encryptionKey,
        await userBoundPurpose(ACCESS_PURPOSE, userId),
      );
    } catch {
      await deleteGoogleConnection(db, userId);
      throw new GoogleConnectionError('Google接続情報を読み取れません。再接続してください', 'reauthorization_required');
    }
  }
  if (!row.refresh_token_encrypted) {
    await deleteGoogleConnection(db, userId);
    throw new GoogleConnectionError('Googleの許可が期限切れです。再接続してください', 'reauthorization_required');
  }
  let refreshToken: string;
  try {
    refreshToken = await decryptSecret(
      row.refresh_token_encrypted,
      settings.encryptionKey,
      await userBoundPurpose(REFRESH_PURPOSE, userId),
    );
  } catch {
    await deleteGoogleConnection(db, userId);
    throw new GoogleConnectionError('Google接続情報を読み取れません。再接続してください', 'reauthorization_required');
  }
  let tokens: TokenResponse;
  try {
    tokens = await tokenRequest({
      client_id: settings.clientId,
      client_secret: settings.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });
  } catch (error) {
    if (error instanceof GoogleConnectionError && error.code === 'reauthorization_required') {
      await deleteGoogleConnection(db, userId);
    }
    throw error;
  }
  const now = new Date();
  await db.prepare(`
    UPDATE google_connections SET access_token_encrypted = ?, access_token_expires_at = ?, updated_at = ?
    WHERE user_id = ?
  `).bind(
    await encryptSecret(
      tokens.access_token!,
      settings.encryptionKey,
      await userBoundPurpose(ACCESS_PURPOSE, userId),
    ),
    new Date(now.getTime() + Math.max(60, tokens.expires_in!) * 1000).toISOString(),
    now.toISOString(),
    userId,
  ).run();
  return tokens.access_token!;
}

export type GoogleScanLease = { pageToken: string | null; lease: string };

export async function beginGoogleScan(db: D1Database, userId: string): Promise<GoogleScanLease> {
  const now = new Date();
  const lease = `${now.toISOString()}#${randomBase64Url(12)}`;
  const result = await db.prepare(`
    UPDATE google_connections SET scan_started_at = ?, updated_at = ?
    WHERE user_id = ?
      AND (scan_started_at IS NULL OR scan_started_at < ?)
      AND (last_synced_at IS NULL OR last_synced_at < ?)
  `).bind(
    lease,
    now.toISOString(),
    userId,
    new Date(now.getTime() - 5 * 60_000).toISOString(),
    new Date(now.getTime() - 3_000).toISOString(),
  ).run();
  if ((result.meta.changes ?? 0) !== 1) {
    const exists = await db.prepare('SELECT 1 AS present FROM google_connections WHERE user_id = ? LIMIT 1')
      .bind(userId).first<{ present: number }>();
    if (!exists) throw new GoogleConnectionError('Gmailが接続されていません', 'not_connected');
    throw new GoogleConnectionError('Gmailを確認中です。少し待ってからお試しください', 'scan_in_progress');
  }
  const row = await db.prepare('SELECT gmail_page_token FROM google_connections WHERE user_id = ? LIMIT 1')
    .bind(userId).first<{ gmail_page_token: string | null }>();
  return { pageToken: row?.gmail_page_token ?? null, lease };
}

export async function finishGoogleScan(
  db: D1Database,
  userId: string,
  lease: string,
  nextPageToken: string | null,
): Promise<void> {
  const now = new Date().toISOString();
  await db.prepare(`
    UPDATE google_connections
    SET last_synced_at = ?, scan_started_at = NULL, gmail_page_token = ?, updated_at = ?
    WHERE user_id = ? AND scan_started_at = ?
  `).bind(now, nextPageToken, now, userId, lease).run();
}

export async function releaseGoogleScan(db: D1Database, userId: string, lease: string): Promise<void> {
  await db.prepare('UPDATE google_connections SET scan_started_at = NULL WHERE user_id = ? AND scan_started_at = ?')
    .bind(userId, lease).run();
}

export async function disconnectGoogle(db: D1Database, userId: string): Promise<{ providerRevoked: boolean }> {
  const row = await connectionRow(db, userId);
  let providerRevoked = !row;
  if (row) {
    try {
      const settings = config();
      const encrypted = row.refresh_token_encrypted ?? row.access_token_encrypted;
      const token = await decryptSecret(
        encrypted,
        settings.encryptionKey,
        await userBoundPurpose(row.refresh_token_encrypted ? REFRESH_PURPOSE : ACCESS_PURPOSE, userId),
      );
      const response = await fetch(REVOKE_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: formBody({ token }),
        signal: AbortSignal.timeout(8_000),
        redirect: 'error',
      });
      providerRevoked = response.ok;
    } catch {
      // Local deletion must still succeed when Google is unavailable or already revoked.
    }
  }
  await deleteGoogleConnection(db, userId);
  return { providerRevoked };
}

export { GMAIL_SCOPE };
