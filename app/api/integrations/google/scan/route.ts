import { apiUser, errorResponse, isSameOrigin } from '@/app/api/api-helpers';
import { ensureSchema } from '@/db/runtime';
import { saveGmailCandidates } from '@/db/gmail-store';
import { GmailApiError, scanGmailBillingCandidates } from '@/lib/gmail';
import {
  beginGoogleScan,
  finishGoogleScan,
  getGoogleAccessToken,
  GoogleConnectionError,
  releaseGoogleScan,
} from '@/lib/server/google-oauth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) return errorResponse('不正なリクエストです', 403);
  const user = await apiUser();
  if (user instanceof Response) return user;
  const db = await ensureSchema();
  let scanLease: string | null = null;
  try {
    const { pageToken, lease } = await beginGoogleScan(db, user.userId);
    scanLease = lease;
    let token = await getGoogleAccessToken(db, user.userId);
    let scan;
    try {
      scan = await scanGmailBillingCandidates(token, 20, pageToken);
    } catch (error) {
      if (error instanceof GmailApiError && error.reauthorizationRequired) {
        token = await getGoogleAccessToken(db, user.userId, true);
        scan = await scanGmailBillingCandidates(token, 20, pageToken);
      } else if (error instanceof GmailApiError && error.status === 400 && pageToken) {
        scan = await scanGmailBillingCandidates(token, 20, null);
      } else {
        throw error;
      }
    }
    const candidates = await saveGmailCandidates(db, user.userId, scan.candidates);
    await finishGoogleScan(db, user.userId, lease, scan.nextPageToken);
    scanLease = null;
    return Response.json(
      { candidates, hasMore: Boolean(scan.nextPageToken) },
      { headers: { 'cache-control': 'private, no-store' } },
    );
  } catch (error) {
    if (error instanceof GoogleConnectionError) {
      const status = error.code === 'not_connected' || error.code === 'reauthorization_required'
        ? 409
        : error.code === 'scan_in_progress'
          ? 429
          : error.code === 'google_unavailable'
            ? 503
            : 500;
      return errorResponse(error.message, status);
    }
    if (error instanceof GmailApiError) {
      if (error.reauthorizationRequired) {
        await db.batch([
          db.prepare('DELETE FROM gmail_import_candidates WHERE user_id = ?').bind(user.userId),
          db.prepare('DELETE FROM google_connections WHERE user_id = ?').bind(user.userId),
        ]);
      }
      return errorResponse(error.message, error.reauthorizationRequired ? 409 : 502);
    }
    return errorResponse('Gmailの請求候補を取得できませんでした', 500);
  } finally {
    if (scanLease) await releaseGoogleScan(db, user.userId, scanLease).catch(() => undefined);
  }
}
