import assert from 'node:assert/strict';
import test from 'node:test';
import {
  activeMonths,
  addBillingCycles,
  addMonthsClamped,
  billingOccurrencesBetween,
  estimatedPaymentCount,
  estimatedTotalPaid,
  isIsoDate,
  monthlyEquivalent,
  nextBillingDateFromStart,
  nextBillingOccurrence,
  parseJpyAmount,
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

test('利用期間は完了した経過月数として扱う', () => {
  assert.equal(activeMonths('2026-09-01', new Date('2026-08-24T00:00:00Z')), 0);
  assert.equal(activeMonths('2026-08-20', new Date('2026-08-24T00:00:00Z')), 0);
  assert.equal(activeMonths('2025-08-24', new Date('2026-08-24T00:00:00Z')), 12);
  assert.equal(activeMonths('2025-08-25', new Date('2026-08-24T00:00:00Z')), 11);
});

test('年払いの支払回数と推定累計を算出する', () => {
  const yearly = { ...base, billingCycle: 'yearly' as const, priceMinor: 12000, startDate: '2024-08-01' };
  assert.equal(estimatedPaymentCount(yearly, new Date('2026-08-24T00:00:00Z')), 3);
  assert.equal(estimatedTotalPaid(yearly, new Date('2026-08-24T00:00:00Z')), 36000);
});

test('週払いは実日数で数え、未来の開始日は0回にする', () => {
  const weekly = { ...base, billingCycle: 'weekly' as const, startDate: '2026-08-20' };
  assert.equal(estimatedPaymentCount(weekly, new Date('2026-08-24T00:00:00Z')), 1);
  assert.equal(estimatedPaymentCount(weekly, new Date('2026-08-27T00:00:00Z')), 2);
  assert.equal(estimatedPaymentCount({ ...weekly, startDate: '2026-09-01' }, new Date('2026-08-24T00:00:00Z')), 0);
});

test('月末の月加算を翌月末へクランプする', () => {
  assert.equal(addMonthsClamped('2026-01-31', 1), '2026-02-28');
  assert.equal(addMonthsClamped('2024-01-31', 1), '2024-02-29');
  assert.equal(addMonthsClamped('2024-02-29', 12), '2025-02-28');
});

test('存在しない日付を拒否する', () => {
  assert.equal(isIsoDate('2026-02-28'), true);
  assert.equal(isIsoDate('2026-02-29'), false);
  assert.equal(isIsoDate('2026-02-31'), false);
});

test('JPY金額は曖昧な外貨・小数を拒否する', () => {
  assert.equal(parseJpyAmount('¥1,500'), 1500);
  assert.equal(parseJpyAmount('￥１，５００円'), 1500);
  assert.equal(parseJpyAmount('$9.99'), null);
  assert.equal(parseJpyAmount('1.5e3'), null);
  assert.equal(parseJpyAmount('無料'), null);
});

test('30日内の週払い請求をすべて展開する', () => {
  const dates = billingOccurrencesBetween(
    { billingCycle: 'weekly', nextBillingDate: '2026-08-25' },
    '2026-08-24',
    '2026-09-23',
  );
  assert.deepEqual(dates, ['2026-08-25', '2026-09-01', '2026-09-08', '2026-09-15', '2026-09-22']);
});

test('過去の請求アンカーを次の更新日まで繰り上げる', () => {
  assert.equal(nextBillingOccurrence({ billingCycle: 'weekly', nextBillingDate: '2026-07-01' }, '2026-08-24'), '2026-08-26');
  assert.equal(nextBillingOccurrence({ billingCycle: 'monthly', nextBillingDate: '2026-01-31' }, '2026-08-24'), '2026-08-31');
  assert.equal(nextBillingOccurrence({ billingCycle: 'yearly', nextBillingDate: '2024-02-29' }, '2026-08-24'), '2027-02-28');
  assert.deepEqual(
    billingOccurrencesBetween({ billingCycle: 'monthly', nextBillingDate: '2026-01-31' }, '2026-08-24', '2026-10-31'),
    ['2026-08-31', '2026-09-30', '2026-10-31'],
  );
});

test('請求周期ごとの候補日を正しく加算する', () => {
  assert.equal(addBillingCycles('2026-08-24', 'weekly'), '2026-08-31');
  assert.equal(addBillingCycles('2026-01-31', 'monthly'), '2026-02-28');
  assert.equal(addBillingCycles('2024-02-29', 'yearly'), '2025-02-28');
});

test('開始日の月末・閏日アンカーを保ったまま次回候補を求める', () => {
  assert.equal(nextBillingDateFromStart('2026-01-31', 'monthly', '2026-08-25'), '2026-08-31');
  assert.equal(nextBillingDateFromStart('2024-02-29', 'yearly', '2028-02-01'), '2028-02-29');
  assert.equal(nextBillingDateFromStart('2024-02-29', 'yearly', '2028-03-01'), '2029-02-28');
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
