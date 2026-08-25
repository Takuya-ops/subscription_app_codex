import assert from 'node:assert/strict';
import test from 'node:test';
import { decodeBase64UrlText, extractGmailMessageText, htmlToSafeText, parseBillingCandidate } from '../lib/gmail/index.ts';
import type { GmailMessage } from '../lib/gmail/types.ts';

function base64url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function message(text: string, overrides: Partial<GmailMessage> = {}): GmailMessage {
  return {
    id: '18fa123abc',
    threadId: '18fa123abc',
    internalDate: String(Date.UTC(2026, 7, 25)),
    payload: {
      mimeType: 'text/plain',
      headers: [
        { name: 'Subject', value: 'Netflixからの領収書' },
        { name: 'From', value: 'Netflix <no-reply@netflix.com>' },
      ],
      body: { data: base64url(text) },
    },
    ...overrides,
  };
}

test('日本語の月額領収書からJPY候補を抽出する', async () => {
  const value = message('Netflix 月額サブスクリプション\nお支払い金額: ￥1,490\nお支払い日: 2026年8月25日\n領収書');
  const text = await extractGmailMessageText(value);
  const candidate = parseBillingCandidate(value, text);
  assert.deepEqual(candidate && {
    name: candidate.name,
    priceMinor: candidate.priceMinor,
    billingCycle: candidate.billingCycle,
    chargedOn: candidate.chargedOn,
  }, { name: 'Netflix', priceMinor: 1490, billingCycle: 'monthly', chargedOn: '2026-08-25' });
  assert.ok((candidate?.confidence ?? 0) >= 82);
});

test('税額より合計金額を優先し、年額周期を認識する', async () => {
  const value = message('Adobe 年額サブスクリプションの領収書\n合計: 12,000円\n税: 1,200円\n決済日: 2026/08/25', {
    payload: {
      mimeType: 'text/plain',
      headers: [
        { name: 'Subject', value: 'Your Adobe receipt' },
        { name: 'From', value: 'Adobe <mail@adobe.com>' },
      ],
      body: { data: base64url('Adobe 年額サブスクリプションの領収書\n合計: 12,000円\n税: 1,200円\n決済日: 2026/08/25') },
    },
  });
  const candidate = parseBillingCandidate(value, await extractGmailMessageText(value));
  assert.equal(candidate?.priceMinor, 12_000);
  assert.equal(candidate?.billingCycle, 'yearly');
});

test('返金・決済失敗・周期のない一般注文を候補にしない', async () => {
  const refunded = message('Netflix 月額プラン ￥1,490 を返金しました。領収書');
  assert.equal(parseBillingCandidate(refunded, await extractGmailMessageText(refunded)), null);
  const order = message('ご注文の領収書\n合計 ￥3,000', {
    payload: {
      mimeType: 'text/plain',
      headers: [
        { name: 'Subject', value: 'Amazon ご注文の領収書' },
        { name: 'From', value: 'Amazon <shipment-tracking@amazon.co.jp>' },
      ],
      body: { data: base64url('ご注文の領収書\n合計 ￥3,000') },
    },
  });
  assert.equal(parseBillingCandidate(order, await extractGmailMessageText(order)), null);
  const noCycle = message('Netflixの領収書\n合計: ￥1,490\n決済日: 2026/08/25');
  assert.equal(parseBillingCandidate(noCycle, await extractGmailMessageText(noCycle)), null);
});

test('通常のキャンセル導線を含む領収書は除外しない', async () => {
  const value = message('Netflix 月額サブスクリプション\n合計: ￥1,490\n決済日: 2026/08/25\nサブスクリプションをキャンセルする\n領収書');
  const candidate = parseBillingCandidate(value, await extractGmailMessageText(value));
  assert.equal(candidate?.priceMinor, 1_490);
});

test('multipart/alternativeはplain本文を優先して重複しない', async () => {
  const value: GmailMessage = {
    id: 'abc123',
    payload: {
      mimeType: 'multipart/alternative',
      parts: [
        { mimeType: 'text/plain', body: { data: base64url('PLAIN BODY') } },
        { mimeType: 'text/html', body: { data: base64url('<p>HTML BODY</p>') } },
      ],
    },
  };
  assert.equal(await extractGmailMessageText(value), 'PLAIN BODY');
});

test('HTML本文は危険要素を除去して改行と文字参照を復元する', () => {
  const text = htmlToSafeText('<style>.x{}</style><script>alert(1)</script><p>Total &yen;1,490</p><div>A&amp;B</div>');
  assert.equal(text.includes('alert'), false);
  assert.equal(text.includes('.x'), false);
  assert.match(text, /Total ¥1,490/u);
  assert.match(text, /A&B/u);
  assert.equal(htmlToSafeText('<p>safe</p><script>secret').includes('secret'), false);
});

test('大きすぎるplain添付は読み込まずHTML代替本文を使う', async () => {
  const value: GmailMessage = {
    id: 'abc123',
    payload: {
      mimeType: 'multipart/alternative',
      parts: [
        { mimeType: 'text/plain', body: { attachmentId: 'large', size: 300_000 } },
        { mimeType: 'text/html', body: { data: base64url('<p>SAFE HTML</p>') } },
      ],
    },
  };
  let requested = false;
  const text = await extractGmailMessageText(value, async () => {
    requested = true;
    return '';
  });
  assert.equal(requested, false);
  assert.equal(text, 'SAFE HTML');
});

test('英語表記の決済日と日本時間の日付境界を処理する', async () => {
  const english = message('Netflix monthly subscription receipt\nAmount paid: JPY 1,490\nPayment date: August 25, 2026');
  assert.equal(parseBillingCandidate(english, await extractGmailMessageText(english))?.chargedOn, '2026-08-25');
  const tokyoBoundary = message('Netflix monthly subscription receipt\nAmount paid: JPY 1,490', {
    internalDate: String(Date.UTC(2026, 7, 24, 15, 30)),
  });
  assert.equal(parseBillingCandidate(tokyoBoundary, await extractGmailMessageText(tokyoBoundary))?.chargedOn, '2026-08-25');
});

test('base64urlは日本語を復号し、不正値を拒否する', () => {
  assert.equal(decodeBase64UrlText(base64url('領収書')), '領収書');
  assert.throws(() => decodeBase64UrlText('bad*value'));
  assert.throws(() => decodeBase64UrlText('a'));
});
