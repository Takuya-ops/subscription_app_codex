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

export function monthlyEquivalent(priceMinor: number, cycle: BillingCycle): number {
  if (cycle === 'yearly') return Math.round(priceMinor / 12);
  if (cycle === 'weekly') return Math.round((priceMinor * 52) / 12);
  return priceMinor;
}

export function activeMonths(startDate: string, now = new Date()): number {
  const start = new Date(`${startDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || start > now) return 0;
  const months = (now.getUTCFullYear() - start.getUTCFullYear()) * 12 + now.getUTCMonth() - start.getUTCMonth();
  return Math.max(1, months + (now.getUTCDate() >= start.getUTCDate() ? 1 : 0));
}

export function estimatedPaymentCount(subscription: Pick<Subscription, 'billingCycle' | 'startDate'>, now = new Date()): number {
  const months = activeMonths(subscription.startDate, now);
  if (subscription.billingCycle === 'yearly') return Math.max(1, Math.ceil(months / 12));
  if (subscription.billingCycle === 'weekly') return Math.max(1, Math.round((months * 52) / 12));
  return months;
}

export function estimatedTotalPaid(subscription: Pick<Subscription, 'billingCycle' | 'startDate' | 'priceMinor'>, now = new Date()): number {
  return estimatedPaymentCount(subscription, now) * subscription.priceMinor;
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
