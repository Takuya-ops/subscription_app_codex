import { getChatGPTUser, type ChatGPTUser } from '@/app/chatgpt-auth';
import type { SubscriptionInput } from '@/db/subscription-store';
import { isIsoDate, type BillingCycle, type SubscriptionSource, type SubscriptionStatus, type UsageLevel } from '@/lib/subscriptions';

export function errorResponse(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

export async function apiUser(): Promise<ChatGPTUser | Response> {
  const user = await getChatGPTUser();
  return user ?? errorResponse('ログインが必要です', 401);
}

export function isSameOrigin(request: Request): boolean {
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'none') return false;
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function readJsonBody(
  request: Request,
  maxBytes = 64_000,
): Promise<{ value?: unknown; error?: Response }> {
  const contentType = request.headers.get('content-type')?.toLowerCase() ?? '';
  if (!contentType.startsWith('application/json')) {
    return { error: errorResponse('JSON形式で送信してください', 415) };
  }
  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    return { error: errorResponse('入力サイズが上限を超えています', 413) };
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    return { error: errorResponse('入力サイズが上限を超えています', 413) };
  }
  try {
    return { value: JSON.parse(text) as unknown };
  } catch {
    return { error: errorResponse('JSONを読み取れませんでした', 400) };
  }
}

const cycles: BillingCycle[] = ['weekly', 'monthly', 'yearly'];
const usageLevels: UsageLevel[] = ['often', 'sometimes', 'rarely', 'unknown'];
const sources: SubscriptionSource[] = ['manual', 'csv', 'email', 'store'];
const statuses: SubscriptionStatus[] = ['active', 'paused', 'cancelled'];

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
  const priceMinor = typeof body.priceMinor === 'number' ? body.priceMinor : Number.NaN;
  const importance = typeof body.importance === 'number' ? body.importance : Number.NaN;
  const satisfaction = body.satisfaction == null ? null : typeof body.satisfaction === 'number' ? body.satisfaction : Number.NaN;

  if (!name) return { error: 'サービス名を入力してください' };
  if (body.currency !== 'JPY') return { error: '現在対応している通貨はJPYのみです' };
  if (!Number.isSafeInteger(priceMinor) || priceMinor < 0 || priceMinor > 100_000_000) return { error: '料金は0〜1億円の整数で入力してください' };
  if (!cycles.includes(body.billingCycle as BillingCycle)) return { error: '請求周期を確認してください' };
  if (!isIsoDate(body.startDate) || !isIsoDate(body.nextBillingDate)) return { error: '日付を確認してください' };
  if (body.nextBillingDate < body.startDate) return { error: '次回更新日は利用開始日以降にしてください' };
  if (!Number.isInteger(importance) || importance < 1 || importance > 5) return { error: '重要度を確認してください' };
  if (satisfaction != null && (!Number.isInteger(satisfaction) || satisfaction < 1 || satisfaction > 5)) return { error: '満足度を確認してください' };
  if (!usageLevels.includes(body.usageLevel as UsageLevel)) return { error: '利用状況を確認してください' };
  if (!sources.includes(body.source as SubscriptionSource)) return { error: '登録元を確認してください' };
  if (!statuses.includes(body.status as SubscriptionStatus)) return { error: '契約状態を確認してください' };
  if (body.lastUsedDate != null && body.lastUsedDate !== '' && !isIsoDate(body.lastUsedDate)) return { error: '最終利用日を確認してください' };

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
