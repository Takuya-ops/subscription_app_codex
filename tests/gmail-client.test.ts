import assert from 'node:assert/strict';
import test from 'node:test';
import { GmailApiError, scanGmailBillingCandidates } from '../lib/gmail/client.ts';

function json(value: unknown, status = 200, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

function encoded(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

test('Gmail APIの一時エラーを再試行し、壊れた1通だけを隔離する', async () => {
  const originalFetch = globalThis.fetch;
  let listCalls = 0;
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.pathname.endsWith('/messages')) {
      listCalls += 1;
      if (listCalls === 1) return json({ error: 'rate limited' }, 429, { 'retry-after': '0' });
      return json({ messages: [{ id: 'good' }, { id: 'bad' }], nextPageToken: 'next_1' });
    }
    if (url.pathname.endsWith('/messages/good')) {
      return json({
        id: 'good',
        internalDate: String(Date.UTC(2026, 7, 25)),
        payload: {
          mimeType: 'text/plain',
          headers: [
            { name: 'Subject', value: 'Netflixからの領収書' },
            { name: 'From', value: 'Netflix <no-reply@netflix.com>' },
          ],
          body: { data: encoded('Netflix 月額サブスクリプション\n合計: ￥1,490\n決済日: 2026/08/25\n領収書') },
        },
      });
    }
    if (url.pathname.endsWith('/messages/bad')) {
      return json({ id: 'bad', payload: { mimeType: 'text/plain', body: { data: 'bad*base64' } } });
    }
    return json({}, 404);
  }) as typeof fetch;
  try {
    const result = await scanGmailBillingCandidates('access-token', 20);
    assert.equal(listCalls, 2);
    assert.equal(result.nextPageToken, 'next_1');
    assert.deepEqual(result.candidates.map((candidate) => candidate.name), ['Netflix']);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Gmail APIの401を再認可要求として返す', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => json({}, 401)) as typeof fetch;
  try {
    await assert.rejects(
      () => scanGmailBillingCandidates('expired-token'),
      (error: unknown) => error instanceof GmailApiError && error.reauthorizationRequired,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
