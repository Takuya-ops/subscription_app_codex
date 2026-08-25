import { gmailHeader } from './mime.ts';
import type { BillingCandidate, GmailMessage } from './types.ts';
import type { BillingCycle } from '../subscriptions.ts';

const recurringServices: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /netflix/iu, name: 'Netflix' },
  { pattern: /spotify/iu, name: 'Spotify' },
  { pattern: /youtube(?:\s+premium)?/iu, name: 'YouTube Premium' },
  { pattern: /google\s+one/iu, name: 'Google One' },
  { pattern: /adobe/iu, name: 'Adobe' },
  { pattern: /dropbox/iu, name: 'Dropbox' },
  { pattern: /notion/iu, name: 'Notion' },
  { pattern: /canva/iu, name: 'Canva' },
  { pattern: /amazon\s+prime/iu, name: 'Amazon Prime' },
  { pattern: /icloud/iu, name: 'iCloud+' },
  { pattern: /chatgpt|openai/iu, name: 'ChatGPT' },
];

const failurePattern = /\b(refund(?:ed)?|payment (?:was )?(?:declined|failed)|charge (?:was )?(?:declined|failed)|subscription (?:has been |was )?(?:cancelled|canceled)|cancell?ation (?:confirmed|confirmation))\b|返金(?:しました|されました|完了)|支払い(?:に)?失敗|決済(?:に)?失敗|(?:解約|キャンセル)(?:が)?(?:完了|されました|済み)/iu;
const successPattern = /\b(receipt|amount paid|payment (?:successful|received|confirmed)|successfully charged|charged (?:to|on))\b|領収書|お支払い(?:が)?完了|決済(?:が)?完了|請求しました/iu;
const subscriptionPattern = /\b(subscription|membership|recurring|renewal|weekly|monthly|yearly|annually|per (?:week|month|year))\b|サブスクリプション|定期(?:購入|契約|支払い)|メンバーシップ|月額|年額|毎週|毎月|毎年/iu;

function cleanMerchant(value: string): string {
  const display = value.match(/^\s*"?([^"<]+?)"?\s*</u)?.[1] ?? value.split('@', 1)[0] ?? value;
  return display.replace(/\b(no-?reply|billing|payments?|support|receipt|invoice)\b/giu, ' ').replace(/[_-]+/gu, ' ').replace(/\s+/gu, ' ').trim().slice(0, 80);
}

function explicitName(text: string): string | null {
  const match = /(?:service|merchant|サービス名|販売元)\s*[:：]\s*([^\n|]{2,80})/iu.exec(text);
  return match?.[1]?.replace(/\s+/gu, ' ').trim().slice(0, 80) ?? null;
}

function serviceName(subject: string, from: string, text: string): { name: string; known: boolean } | null {
  const combined = `${subject}\n${from}\n${text.slice(0, 3000)}`;
  const known = recurringServices.find((service) => service.pattern.test(combined));
  if (known) return { name: known.name, known: true };
  const labeled = explicitName(text);
  if (labeled) return { name: labeled, known: false };
  const subjectName = /^(?:your\s+)?(.{2,60}?)(?:\s+(?:receipt|invoice|payment|subscription|renewal)|からの(?:領収書|請求))/iu.exec(subject)?.[1]?.trim();
  if (subjectName) return { name: subjectName.slice(0, 80), known: false };
  const merchant = cleanMerchant(from);
  if (!merchant || /^(?:no reply|billing|payments?|support)$/iu.test(merchant)) return null;
  return { name: merchant, known: false };
}

type AmountMatch = { amount: number; score: number; index: number };

function amountCandidates(text: string): AmountMatch[] {
  const patterns = [
    /(?:JPY|¥|￥)\s*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)(?![.\d])/giu,
    /([0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)\s*(?:円|JPY)(?![A-Za-z])/giu,
  ];
  const results: AmountMatch[] = [];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const amount = Number((match[1] ?? '').replaceAll(',', ''));
      if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 100_000_000) continue;
      const index = match.index ?? 0;
      const lineStart = text.lastIndexOf('\n', index) + 1;
      const nextBreak = text.indexOf('\n', index + match[0].length);
      const line = text.slice(lineStart, nextBreak < 0 ? text.length : nextBreak);
      const context = text.slice(Math.max(0, index - 100), Math.min(text.length, index + match[0].length + 100));
      let score = 1;
      if (/total|amount paid|charged|payment|合計|請求額|お支払い金額|決済金額/iu.test(context)) score += 2;
      if (/total|amount paid|grand total|合計|請求額|お支払い金額|決済金額/iu.test(line)) score += 7;
      if (/subtotal|tax|discount|balance|消費税|税額|割引|ポイント|返金/iu.test(line)) score -= 8;
      results.push({ amount, score, index });
    }
  }
  return results.sort((left, right) => right.score - left.score || right.index - left.index || right.amount - left.amount);
}

function billingCycle(text: string): BillingCycle | null {
  if (/\b(weekly|per week|every week)\b|週額|毎週/iu.test(text)) return 'weekly';
  if (/\b(annually|yearly|per year|every year)\b|\/\s*year|年額|年間(?:プラン|契約)|毎年|12[ヶかカ]月/iu.test(text)) return 'yearly';
  if (/\b(monthly|per month|every month)\b|\/\s*month|月額|毎月|1[ヶかカ]月/iu.test(text)) return 'monthly';
  return null;
}

function isoDate(year: number, month: number, day: number): string | null {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function explicitChargedOn(text: string): string | null {
  const label = '(?:charged on|payment date|billing date|transaction date|お支払い日|決済日|請求日)';
  const numeric = new RegExp(`${label}\\s*[:：]?\\s*(\\d{4})[\\/-](\\d{1,2})[\\/-](\\d{1,2})`, 'iu').exec(text);
  if (numeric) return isoDate(Number(numeric[1]), Number(numeric[2]), Number(numeric[3]));
  const japanese = new RegExp(`${label}\\s*[:：]?\\s*(\\d{4})年(\\d{1,2})月(\\d{1,2})日`, 'iu').exec(text);
  if (japanese) return isoDate(Number(japanese[1]), Number(japanese[2]), Number(japanese[3]));
  const monthNames: Record<string, number> = {
    jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
    may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9,
    sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
  };
  const monthFirst = new RegExp(
    `${label}\\s*[:：]?\\s*([A-Za-z]{3,9})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?[,]?\\s+(\\d{4})`,
    'iu',
  ).exec(text);
  if (monthFirst) {
    const month = monthNames[monthFirst[1].toLowerCase()];
    if (month) return isoDate(Number(monthFirst[3]), month, Number(monthFirst[2]));
  }
  const dayFirst = new RegExp(
    `${label}\\s*[:：]?\\s*(\\d{1,2})(?:st|nd|rd|th)?\\s+([A-Za-z]{3,9})\\.?[,]?\\s+(\\d{4})`,
    'iu',
  ).exec(text);
  if (dayFirst) {
    const month = monthNames[dayFirst[2].toLowerCase()];
    if (month) return isoDate(Number(dayFirst[3]), month, Number(dayFirst[1]));
  }
  return null;
}

function fallbackDate(message: GmailMessage): string | null {
  const internal = Number(message.internalDate);
  const date = Number.isFinite(internal) && internal > 0 ? new Date(internal) : new Date(gmailHeader(message, 'date') ?? '');
  if (Number.isNaN(date.getTime())) return null;
  const values = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date).map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function parseBillingCandidate(message: GmailMessage, text: string): BillingCandidate | null {
  if (!message.id) return null;
  const subject = gmailHeader(message, 'subject') ?? '';
  const from = gmailHeader(message, 'from') ?? '';
  const searchable = `${subject}\n${from}\n${text}`.normalize('NFKC');
  if (failurePattern.test(searchable) || !successPattern.test(searchable)) return null;
  const service = serviceName(subject, from, text);
  if (!service) return null;
  const cycle = billingCycle(searchable);
  if (!cycle) return null;
  if (!subscriptionPattern.test(searchable) && !service.known) return null;
  const amount = amountCandidates(searchable)[0];
  if (!amount) return null;
  const explicitDate = explicitChargedOn(searchable);
  const chargedOn = explicitDate ?? fallbackDate(message);
  if (!chargedOn) return null;
  let confidence = 60;
  if (amount.score >= 4) confidence += 12;
  if (cycle) confidence += 10;
  if (service.known) confidence += 8;
  if (explicitDate) confidence += 5;
  if (/領収書|\breceipt\b/iu.test(searchable)) confidence += 5;
  return {
    messageId: message.id,
    threadId: message.threadId ?? null,
    name: service.name,
    merchant: cleanMerchant(from) || service.name,
    priceMinor: amount.amount,
    currency: 'JPY',
    billingCycle: cycle,
    chargedOn,
    confidence: Math.min(100, confidence),
  };
}
