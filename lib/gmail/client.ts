import { extractGmailMessageText } from './mime.ts';
import type { BillingCandidate, GmailMessage } from './types.ts';
import { parseBillingCandidate } from './candidate.ts';

const API_ROOT = 'https://gmail.googleapis.com/gmail/v1/users/me';
const BILLING_QUERY = '{subject:receipt subject:"payment confirmation" subject:"renewal confirmation" subject:領収書 subject:お支払い subject:更新} -in:spam -in:trash newer_than:730d';

type GmailListResponse = { messages?: Array<{ id?: string }>; nextPageToken?: string; resultSizeEstimate?: number };

export class GmailApiError extends Error {
  readonly reauthorizationRequired: boolean;
  readonly status: number | null;

  constructor(message: string, reauthorizationRequired = false, status: number | null = null) {
    super(message);
    this.reauthorizationRequired = reauthorizationRequired;
    this.status = status;
  }
}

async function gmailFetch<T>(accessToken: string, url: URL): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(url, {
        headers: { authorization: `Bearer ${accessToken}`, accept: 'application/json' },
        signal: AbortSignal.timeout(12_000),
      });
    } catch {
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
        continue;
      }
      throw new GmailApiError('Gmailに接続できませんでした。しばらくしてからお試しください');
    }
    if (response.ok) {
      return response.json().catch(() => {
        throw new GmailApiError('Gmailから不正な応答を受け取りました');
      }) as Promise<T>;
    }
    if ((response.status === 429 || response.status >= 500) && attempt < 2) {
      const retryAfter = Number(response.headers.get('retry-after'));
      const wait = Number.isFinite(retryAfter) && retryAfter >= 0
        ? Math.min(1_000, retryAfter * 1_000)
        : 250 * (attempt + 1);
      await new Promise((resolve) => setTimeout(resolve, wait));
      continue;
    }
    throw new GmailApiError(
      response.status === 401 ? 'Googleの許可が期限切れです。再接続してください' : 'Gmailの読み取りに失敗しました',
      response.status === 401,
      response.status,
    );
  }
  throw new GmailApiError('Gmailの読み取りに失敗しました');
}

function safeId(value: string, label: string): string {
  if (!/^[A-Za-z0-9_-]{1,256}$/u.test(value)) throw new GmailApiError(`${label}が無効です`);
  return value;
}

async function getMessage(accessToken: string, messageId: string): Promise<GmailMessage> {
  const url = new URL(`${API_ROOT}/messages/${encodeURIComponent(safeId(messageId, 'メールID'))}`);
  url.searchParams.set('format', 'full');
  return gmailFetch<GmailMessage>(accessToken, url);
}

async function getAttachment(accessToken: string, messageId: string, attachmentId: string): Promise<string> {
  const safeMessageId = safeId(messageId, 'メールID');
  const safeAttachmentId = safeId(attachmentId, '添付ID');
  const url = new URL(`${API_ROOT}/messages/${encodeURIComponent(safeMessageId)}/attachments/${encodeURIComponent(safeAttachmentId)}`);
  const response = await gmailFetch<{ data?: string }>(accessToken, url);
  if (typeof response.data !== 'string' || response.data.length > 350_000) {
    throw new GmailApiError('Gmail本文を読み取れませんでした');
  }
  return response.data;
}

export type GmailScanResult = { candidates: BillingCandidate[]; nextPageToken: string | null };

export async function scanGmailBillingCandidates(
  accessToken: string,
  maximum = 20,
  pageToken: string | null = null,
): Promise<GmailScanResult> {
  const limit = Math.max(1, Math.min(20, Math.trunc(maximum)));
  const listUrl = new URL(`${API_ROOT}/messages`);
  listUrl.searchParams.set('q', BILLING_QUERY);
  listUrl.searchParams.set('maxResults', String(limit));
  listUrl.searchParams.set('fields', 'messages/id,nextPageToken,resultSizeEstimate');
  if (pageToken) {
    if (!/^[A-Za-z0-9_-]{1,2048}$/u.test(pageToken)) throw new GmailApiError('Gmailの続き位置が無効です');
    listUrl.searchParams.set('pageToken', pageToken);
  }
  const list = await gmailFetch<GmailListResponse>(accessToken, listUrl);
  const ids = (list.messages ?? []).map((item) => item.id).filter((id): id is string => typeof id === 'string').slice(0, limit);
  const results: BillingCandidate[] = [];
  let successfulMessages = 0;
  for (let index = 0; index < ids.length; index += 5) {
    const batch = await Promise.allSettled(ids.slice(index, index + 5).map(async (id) => {
      const message = await getMessage(accessToken, id);
      const text = await extractGmailMessageText(message, (messageId, attachmentId) => getAttachment(accessToken, messageId, attachmentId));
      return parseBillingCandidate(message, text);
    }));
    for (const item of batch) {
      if (item.status === 'fulfilled') {
        successfulMessages += 1;
        if (item.value) results.push(item.value);
      } else if (item.reason instanceof GmailApiError && item.reason.reauthorizationRequired) {
        throw item.reason;
      }
    }
  }
  if (ids.length && successfulMessages === 0) {
    throw new GmailApiError('請求メールを読み取れませんでした。しばらくしてからお試しください');
  }
  const nextPageToken = typeof list.nextPageToken === 'string' && /^[A-Za-z0-9_-]{1,2048}$/u.test(list.nextPageToken)
    ? list.nextPageToken
    : null;
  return { candidates: results, nextPageToken };
}

export { BILLING_QUERY };
