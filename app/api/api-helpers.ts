import { getChatGPTUser, type ChatGPTUser } from '@/app/chatgpt-auth';
import type { SubscriptionInput } from '@/db/subscription-store';
import type { BillingCycle, SubscriptionSource, SubscriptionStatus, UsageLevel } from '@/lib/subscriptions';

export function errorResponse(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

export async function apiUser(): Promise<ChatGPTUser | Response> {
  const user = await getChatGPTUser();
  return user ?? errorResponse('ログインが必要です', 401);
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

const cycles: BillingCycle[] = ['weekly', 'monthly', 'yearly'];
const usageLevels: UsageLevel[] = ['often', 'sometimes', 'rarely', 'unknown'];
const sources: SubscriptionSource[] = ['manual', 'csv', 'email', 'store'];
const statuses: SubscriptionStatus[] = ['active', 'paused', 'cancelled'];

function isDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
}

function stringValue(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const clean = value.trim();
  return clean.length > 0 && clean.length <= max ? clean : null;
}

export function parseSubscriptionInput(value: unknown): { value?: SubscriptionInput; error?: string } {
  if (!value || typeof value !== 'object') return { error: '入力内容を確認してください' };
  const body = value as Record<string, unknown>;
  const name = stringValue(body.name, 80);
  const plan = stringValue(body.plan, 80) ?? 'スタンダード';
  const category = stringValue(body.category, 40) ?? 'その他';
  const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 500) : '';
  const priceMinor = Number(body.priceMinor);
  const importance = Number(body.importance);
  const satisfaction = body.satisfaction == null || body.satisfaction === '' ? null : Number(body.satisfaction);

  if (!name) return { error: 'サービス名を入力してください' };
  if (!Number.isSafeInteger(priceMinor) || priceMinor < 0 || priceMinor > 100_000_000) return { error: '料金は0〜1億円の整数で入力してください' };
  if (!cycles.includes(body.billingCycle as BillingCycle)) return { error: '請求周期を確認してください' };
  if (!isDate(body.startDate) || !isDate(body.nextBillingDate)) return { error: '日付を確認してください' };
  if (!Number.isInteger(importance) || importance < 1 || importance > 5) return { error: '重要度を確認してください' };
  if (satisfaction != null && (!Number.isInteger(satisfaction) || satisfaction < 1 || satisfaction > 5)) return { error: '満足度を確認してください' };
  if (!usageLevels.includes(body.usageLevel as UsageLevel)) return { error: '利用状況を確認してください' };
  if (!sources.includes(body.source as SubscriptionSource)) return { error: '登録元を確認してください' };
  if (!statuses.includes(body.status as SubscriptionStatus)) return { error: '契約状態を確認してください' };
  if (body.lastUsedDate != null && body.lastUsedDate !== '' && !isDate(body.lastUsedDate)) return { error: '最終利用日を確認してください' };

  return {
    value: {
      name,
      plan,
      priceMinor,
      currency: 'JPY',
      billingCycle: body.billingCycle as BillingCycle,
      startDate: body.startDate as string,
      nextBillingDate: body.nextBillingDate as string,
      category,
      importance,
      satisfaction,
      usageLevel: body.usageLevel as UsageLevel,
      lastUsedDate: typeof body.lastUsedDate === 'string' && body.lastUsedDate ? body.lastUsedDate : null,
      source: body.source as SubscriptionSource,
      status: body.status as SubscriptionStatus,
      notes,
    },
  };
}
