import assert from 'node:assert/strict';
import test from 'node:test';
import {
  activeMonths,
  estimatedPaymentCount,
  estimatedTotalPaid,
  monthlyEquivalent,
  recommendationFor,
  type Subscription,
} from '../lib/subscriptions.ts';

const base: Subscription = {
  id: 'subscription-1',
  name: 'Example',
  plan: 'Standard',
  priceMinor: 1200,
  currency: 'JPY',
  billingCycle: 'monthly',
  startDate: '2025-01-15',
  nextBillingDate: '2026-09-15',
  category: '動画',
  importance: 3,
  satisfaction: 3,
  usageLevel: 'sometimes',
  lastUsedDate: '2026-08-10',
  source: 'manual',
  status: 'active',
  notes: '',
  createdAt: '2025-01-15T00:00:00.000Z',
  updatedAt: '2026-08-10T00:00:00.000Z',
};

test('月額・年額・週額を月額換算する', () => {
  assert.equal(monthlyEquivalent(1200, 'monthly'), 1200);
  assert.equal(monthlyEquivalent(12000, 'yearly'), 1000);
  assert.equal(monthlyEquivalent(300, 'weekly'), 1300);
});

test('利用開始日前は0か月、開始月は1か月として扱う', () => {
  assert.equal(activeMonths('2026-09-01', new Date('2026-08-24T00:00:00Z')), 0);
  assert.equal(activeMonths('2026-08-20', new Date('2026-08-24T00:00:00Z')), 1);
  assert.equal(activeMonths('2025-08-24', new Date('2026-08-24T00:00:00Z')), 13);
});

test('年払いの支払回数と推定累計を算出する', () => {
  const yearly = { ...base, billingCycle: 'yearly' as const, priceMinor: 12000, startDate: '2024-08-01' };
  assert.equal(estimatedPaymentCount(yearly, new Date('2026-08-24T00:00:00Z')), 3);
  assert.equal(estimatedTotalPaid(yearly, new Date('2026-08-24T00:00:00Z')), 36000);
});

test('利用データ不足を解約候補と断定しない', () => {
  const result = recommendationFor({ ...base, usageLevel: 'unknown', satisfaction: null }, 2);
  assert.equal(result.label, '情報不足');
  assert.equal(result.confidence, '低');
});

test('利用頻度が高く大切な契約は継続になる', () => {
  const result = recommendationFor({ ...base, usageLevel: 'often', importance: 5, satisfaction: 5 }, 1);
  assert.equal(result.label, '継続');
  assert.ok(result.score >= 70);
});

test('低利用・低満足・重複は解約候補になる', () => {
  const result = recommendationFor({ ...base, priceMinor: 4000, usageLevel: 'rarely', importance: 1, satisfaction: 1 }, 3);
  assert.equal(result.label, '解約候補');
  assert.ok(result.reasons.some((reason) => reason.includes('同じカテゴリ')));
});
