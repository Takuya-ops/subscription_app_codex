export type BillingCycle = 'weekly' | 'monthly' | 'yearly';
export type UsageLevel = 'often' | 'sometimes' | 'rarely' | 'unknown';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';
export type SubscriptionSource = 'manual' | 'csv' | 'email' | 'store';

export type Subscription = {
  id: string;
  name: string;
  plan: string;
  priceMinor: number;
  currency: string;
  billingCycle: BillingCycle;
  startDate: string;
  nextBillingDate: string;
  category: string;
  importance: number;
  satisfaction: number | null;
  usageLevel: UsageLevel;
  lastUsedDate: string | null;
  source: SubscriptionSource;
  status: SubscriptionStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type Recommendation = {
  score: number;
  label: '継続' | '見直し' | '解約候補' | '情報不足';
  confidence: '高' | '中' | '低';
  reasons: string[];
};

type PlainDateParts = { year: number; month: number; day: number };

function plainDateParts(value: string): PlainDateParts | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) return null;
  return { year, month, day };
}

function formatPlainDate({ year, month, day }: PlainDateParts): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && plainDateParts(value) !== null;
}

export function localIsoDate(date = new Date()): string {
  return formatPlainDate({ year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() });
}

export function addMonthsClamped(value: string, months: number): string {
  const parts = plainDateParts(value);
  if (!parts || !Number.isInteger(months)) return value;
  const monthIndex = parts.year * 12 + parts.month - 1 + months;
  const year = Math.floor(monthIndex / 12);
  const month = ((monthIndex % 12) + 12) % 12 + 1;
  return formatPlainDate({ year, month, day: Math.min(parts.day, daysInMonth(year, month)) });
}

export function addDays(value: string, days: number): string {
  const parts = plainDateParts(value);
  if (!parts || !Number.isInteger(days)) return value;
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return formatPlainDate({ year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() });
}

export function addBillingCycles(value: string, cycle: BillingCycle, count = 1): string {
  if (!Number.isInteger(count)) return value;
  if (cycle === 'weekly') return addDays(value, count * 7);
  return addMonthsClamped(value, count * (cycle === 'yearly' ? 12 : 1));
}

export function nextBillingDateFromStart(
  startDate: string,
  cycle: BillingCycle,
  onOrAfter = localIsoDate(),
): string {
  const firstBillingDate = addBillingCycles(startDate, cycle);
  if (!isIsoDate(startDate) || !isIsoDate(onOrAfter)) return firstBillingDate;
  let occurrence = 1;
  if (startDate < onOrAfter) {
    if (cycle === 'weekly') {
      occurrence = Math.max(1, Math.ceil(dayDifference(startDate, onOrAfter) / 7));
    } else {
      const startParts = plainDateParts(startDate)!;
      const targetParts = plainDateParts(onOrAfter)!;
      const monthStep = cycle === 'yearly' ? 12 : 1;
      const elapsedMonths = (targetParts.year - startParts.year) * 12 + targetParts.month - startParts.month;
      occurrence = Math.max(1, Math.floor(elapsedMonths / monthStep));
      while (addBillingCycles(startDate, cycle, occurrence) < onOrAfter) occurrence += 1;
    }
  }
  return addBillingCycles(startDate, cycle, occurrence);
}

function dayDifference(from: string, to: string): number {
  const start = plainDateParts(from);
  const end = plainDateParts(to);
  if (!start || !end) return 0;
  const startTime = Date.UTC(start.year, start.month - 1, start.day);
  const endTime = Date.UTC(end.year, end.month - 1, end.day);
  return Math.floor((endTime - startTime) / 86_400_000);
}

export function parseJpyAmount(value: string): number | null {
  const normalized = value.normalize('NFKC').replace(/\s+/g, '').toUpperCase();
  const match = /^(?:¥|JPY)?(\d{1,3}(?:,\d{3})*|\d+)(?:円)?$/.exec(normalized);
  if (!match) return null;
  const amount = Number(match[1].replaceAll(',', ''));
  return Number.isSafeInteger(amount) && amount >= 0 && amount <= 100_000_000 ? amount : null;
}

export function monthlyEquivalent(priceMinor: number, cycle: BillingCycle): number {
  if (cycle === 'yearly') return Math.round(priceMinor / 12);
  if (cycle === 'weekly') return Math.round((priceMinor * 52) / 12);
  return priceMinor;
}

export function activeMonths(startDate: string, now = new Date()): number {
  const start = plainDateParts(startDate);
  if (!start) return 0;
  const today = localIsoDate(now);
  if (startDate > today) return 0;
  const current = plainDateParts(today);
  if (!current) return 0;
  let months = (current.year - start.year) * 12 + current.month - start.month;
  if (addMonthsClamped(startDate, months) > today) months -= 1;
  return Math.max(0, months);
}

export function estimatedPaymentCount(subscription: Pick<Subscription, 'billingCycle' | 'startDate'>, now = new Date()): number {
  const today = localIsoDate(now);
  if (!isIsoDate(subscription.startDate) || subscription.startDate > today) return 0;
  if (subscription.billingCycle === 'weekly') return Math.floor(dayDifference(subscription.startDate, today) / 7) + 1;
  if (subscription.billingCycle === 'yearly') {
    const start = plainDateParts(subscription.startDate)!;
    const current = plainDateParts(today)!;
    let years = current.year - start.year;
    if (addMonthsClamped(subscription.startDate, years * 12) > today) years -= 1;
    return Math.max(0, years) + 1;
  }
  return activeMonths(subscription.startDate, now) + 1;
}

export function estimatedTotalPaid(subscription: Pick<Subscription, 'billingCycle' | 'startDate' | 'priceMinor'>, now = new Date()): number {
  return estimatedPaymentCount(subscription, now) * subscription.priceMinor;
}

export function billingOccurrencesBetween(
  subscription: Pick<Subscription, 'billingCycle' | 'nextBillingDate'>,
  rangeStart: string,
  rangeEnd: string,
): string[] {
  if (!isIsoDate(rangeStart) || !isIsoDate(rangeEnd) || !isIsoDate(subscription.nextBillingDate)) return [];
  if (rangeEnd < rangeStart) return [];
  const anchor = subscription.nextBillingDate;
  let occurrence = 0;
  if (anchor < rangeStart) {
    if (subscription.billingCycle === 'weekly') {
      occurrence = Math.ceil(dayDifference(anchor, rangeStart) / 7);
    } else {
      const anchorParts = plainDateParts(anchor)!;
      const startParts = plainDateParts(rangeStart)!;
      const monthStep = subscription.billingCycle === 'yearly' ? 12 : 1;
      const elapsedMonths = (startParts.year - anchorParts.year) * 12 + startParts.month - anchorParts.month;
      occurrence = Math.max(0, Math.floor(elapsedMonths / monthStep));
      while (addBillingCycles(anchor, subscription.billingCycle, occurrence) < rangeStart) occurrence += 1;
    }
  }
  const results: string[] = [];
  let cursor = addBillingCycles(anchor, subscription.billingCycle, occurrence);
  for (let count = 0; cursor <= rangeEnd && count < 64; count += 1) {
    results.push(cursor);
    occurrence += 1;
    cursor = addBillingCycles(anchor, subscription.billingCycle, occurrence);
  }
  return results;
}

export function nextBillingOccurrence(
  subscription: Pick<Subscription, 'billingCycle' | 'nextBillingDate'>,
  onOrAfter = localIsoDate(),
): string | null {
  if (!isIsoDate(onOrAfter)) return null;
  return billingOccurrencesBetween(subscription, onOrAfter, addBillingCycles(onOrAfter, 'yearly', 200))[0] ?? null;
}

export function recommendationFor(subscription: Subscription, sameCategoryCount = 1): Recommendation {
  const reasons: string[] = [];
  const usagePoints = { often: 25, sometimes: 16, rarely: 5, unknown: 12 }[subscription.usageLevel];
  const importancePoints = subscription.importance * 5;
  const satisfactionPoints = subscription.satisfaction == null ? 8 : subscription.satisfaction * 3;
  const monthly = monthlyEquivalent(subscription.priceMinor, subscription.billingCycle);
  const costPoints = subscription.usageLevel === 'often'
    ? (monthly <= 3000 ? 20 : monthly <= 6000 ? 15 : 10)
    : subscription.usageLevel === 'sometimes'
      ? (monthly <= 1500 ? 18 : monthly <= 3500 ? 12 : 7)
      : (monthly <= 1000 ? 12 : monthly <= 2500 ? 7 : 3);
  const uniquenessPoints = sameCategoryCount > 1 ? 7 : 15;
  const score = Math.min(100, usagePoints + importancePoints + satisfactionPoints + costPoints + uniquenessPoints);

  if (subscription.usageLevel === 'unknown' || subscription.satisfaction == null) reasons.push('利用状況の確認がまだ十分ではありません');
  if (subscription.usageLevel === 'rarely') reasons.push('直近の利用頻度が低くなっています');
  if (sameCategoryCount > 1) reasons.push(`同じカテゴリを${sameCategoryCount}件契約しています`);
  if (monthly >= 3000) reasons.push(`月額換算が¥${monthly.toLocaleString('ja-JP')}です`);
  if (subscription.importance >= 4) reasons.push('大切な契約として設定されています');
  if (reasons.length === 0) reasons.push('利用頻度と満足度のバランスが良好です');

  if (subscription.usageLevel === 'unknown' || subscription.satisfaction == null) return { score, label: '情報不足', confidence: '低', reasons };
  if (score >= 70) return { score, label: '継続', confidence: '高', reasons };
  if (score >= 40) return { score, label: '見直し', confidence: '中', reasons };
  return { score, label: '解約候補', confidence: '中', reasons };
}

export function formatYen(amountMinor: number): string {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(amountMinor);
}
