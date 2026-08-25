'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent } from 'react';
import {
  activeMonths,
  addMonthsClamped,
  estimatedPaymentCount,
  estimatedTotalPaid,
  formatYen,
  localIsoDate,
  monthlyEquivalent,
  nextBillingDateFromStart,
  nextBillingOccurrence,
  recommendationFor,
  type BillingCycle,
  type Subscription,
  type SubscriptionSource,
  type SubscriptionStatus,
  type UsageLevel,
} from '@/lib/subscriptions';

export type SubscriptionPayload = Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>;
export type DialogState = { type: 'add' } | { type: 'detail' | 'edit'; subscription: Subscription } | null;

type Props = {
  dialog: DialogState;
  sameCategoryCount: number;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (payload: SubscriptionPayload, id?: string) => Promise<void>;
  onCheckin: (subscription: Subscription, level: Exclude<UsageLevel, 'unknown'>) => Promise<void>;
  onDelete: (subscription: Subscription) => Promise<void>;
  onEdit: (subscription: Subscription) => void;
};

const today = () => localIsoDate();
const nextMonth = () => addMonthsClamped(today(), 1);
const suggestedNextBillingDate = (startDate: string, billingCycle: BillingCycle) => nextBillingDateFromStart(startDate, billingCycle);

const blankPayload = (): SubscriptionPayload => ({
  name: '',
  plan: 'スタンダード',
  priceMinor: 0,
  currency: 'JPY',
  billingCycle: 'monthly',
  startDate: today(),
  nextBillingDate: nextMonth(),
  category: '動画',
  importance: 3,
  satisfaction: null,
  usageLevel: 'unknown',
  lastUsedDate: null,
  source: 'manual',
  status: 'active',
  notes: '',
});

function toPayload(subscription: Subscription): SubscriptionPayload {
  return {
    name: subscription.name,
    plan: subscription.plan,
    priceMinor: subscription.priceMinor,
    currency: subscription.currency,
    billingCycle: subscription.billingCycle,
    startDate: subscription.startDate,
    nextBillingDate: subscription.nextBillingDate,
    category: subscription.category,
    importance: subscription.importance,
    satisfaction: subscription.satisfaction,
    usageLevel: subscription.usageLevel,
    lastUsedDate: subscription.lastUsedDate,
    source: subscription.source,
    status: subscription.status,
    notes: subscription.notes,
  };
}

const cycleLabels: Record<BillingCycle, string> = { weekly: '週払い', monthly: '月払い', yearly: '年払い' };
const sourceLabels: Record<SubscriptionSource, string> = { manual: '手入力', csv: 'CSV', email: '請求メール', store: 'ストア' };
const statusLabels: Record<SubscriptionStatus, string> = { active: '契約中', paused: '一時停止', cancelled: '解約済み' };

export default function SubscriptionDialog({ dialog, sameCategoryCount, busy, error, onClose, onSave, onCheckin, onDelete, onEdit }: Props) {
  const isForm = dialog?.type === 'add' || dialog?.type === 'edit';
  const activeSubscription = dialog && dialog.type !== 'add' ? dialog.subscription : null;
  const [form, setForm] = useState<SubscriptionPayload>(() => dialog?.type === 'edit' ? toPayload(dialog.subscription) : blankPayload());
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const busyRef = useRef(busy);

  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => { busyRef.current = busy; }, [busy]);

  useEffect(() => {
    if (!dialog) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const background = Array.from(document.querySelectorAll<HTMLElement>('.sidebar, .main, .mobile-nav'));
    background.forEach((element) => element.setAttribute('inert', ''));
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busyRef.current) {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      )).filter((element) => !element.hasAttribute('hidden'));
      if (!focusable.length) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!dialogRef.current.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.body.classList.add('modal-open');
    window.addEventListener('keydown', keydown);
    const frame = window.requestAnimationFrame(() => {
      const preferred = dialogRef.current?.querySelector<HTMLElement>('[autofocus]');
      (preferred ?? closeButtonRef.current)?.focus();
    });
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', keydown);
      background.forEach((element) => element.removeAttribute('inert'));
      if (previousFocus?.isConnected) previousFocus.focus();
      else document.querySelector<HTMLElement>('#main-content')?.focus();
    };
  }, [dialog]);

  const recommendation = useMemo(
    () => activeSubscription ? recommendationFor(activeSubscription, sameCategoryCount) : null,
    [activeSubscription, sameCategoryCount],
  );

  if (!dialog) return null;

  const closeFromOverlay = (event: MouseEvent<HTMLDivElement>) => {
    if (event.currentTarget === event.target && !busy) onClose();
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSave(form, dialog.type === 'edit' ? dialog.subscription.id : undefined);
  };

  return (
    <div className="modal-overlay" onMouseDown={closeFromOverlay}>
      <section className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby={error ? 'dialog-error' : undefined} aria-busy={busy} tabIndex={-1} ref={dialogRef}>
        <header className="dialog-head">
          <div>
            <p className="eyebrow">{isForm ? 'SUBSCRIPTION' : 'DETAIL'}</p>
            <h2 id="dialog-title">{dialog.type === 'add' ? 'サブスクを追加' : dialog.type === 'edit' ? '登録内容を編集' : dialog.subscription.name}</h2>
          </div>
          <button className="dialog-close" type="button" onClick={onClose} disabled={busy} aria-label="閉じる" ref={closeButtonRef}>×</button>
        </header>

        {isForm ? (
          <form className="subscription-form" onSubmit={submit}>
            {error && <p className="dialog-error" id="dialog-error" role="alert">{error}</p>}
            <div className="form-grid">
              <label className="field field-wide"><span>サービス名</span><input required maxLength={80} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="例：Netflix" autoFocus /></label>
              <label className="field"><span>プラン名</span><input required maxLength={80} value={form.plan} onChange={(event) => setForm({ ...form, plan: event.target.value })} placeholder="スタンダード" /></label>
              <label className="field"><span>カテゴリ</span><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option>動画</option><option>音楽</option><option>仕事・効率化</option><option>クラウド</option><option>学習</option><option>家計管理</option><option>健康</option><option>ニュース</option><option>その他</option></select></label>
              <label className="field"><span>請求額</span><span className="input-prefix"><i>¥</i><input required min="0" max="100000000" step="1" inputMode="numeric" type="number" value={form.priceMinor || ''} onChange={(event) => setForm({ ...form, priceMinor: Number(event.target.value) })} /></span></label>
              <label className="field"><span>請求周期</span><select value={form.billingCycle} onChange={(event) => { const billingCycle = event.target.value as BillingCycle; setForm({ ...form, billingCycle, nextBillingDate: suggestedNextBillingDate(form.startDate, billingCycle) }); }}><option value="weekly">週払い</option><option value="monthly">月払い</option><option value="yearly">年払い</option></select></label>
              <label className="field"><span>利用開始日</span><input required type="date" value={form.startDate} onChange={(event) => { const startDate = event.target.value; setForm({ ...form, startDate, nextBillingDate: suggestedNextBillingDate(startDate, form.billingCycle) }); }} /></label>
              <label className="field"><span>次回更新日</span><input required type="date" value={form.nextBillingDate} onChange={(event) => setForm({ ...form, nextBillingDate: event.target.value })} /></label>
              <label className="field"><span>大切さ</span><select value={form.importance} onChange={(event) => setForm({ ...form, importance: Number(event.target.value) })}><option value="1">1 — なくても困らない</option><option value="2">2 — 低め</option><option value="3">3 — 普通</option><option value="4">4 — 大切</option><option value="5">5 — 必須</option></select></label>
              <label className="field"><span>満足度</span><select value={form.satisfaction ?? ''} onChange={(event) => setForm({ ...form, satisfaction: event.target.value ? Number(event.target.value) : null })}><option value="">まだ評価しない</option><option value="1">1 — 不満</option><option value="2">2</option><option value="3">3 — 普通</option><option value="4">4</option><option value="5">5 — とても満足</option></select></label>
              <label className="field"><span>利用頻度</span><select value={form.usageLevel} onChange={(event) => setForm({ ...form, usageLevel: event.target.value as UsageLevel })}><option value="unknown">まだ不明</option><option value="often">よく使う</option><option value="sometimes">時々使う</option><option value="rarely">ほぼ使わない</option></select></label>
              <label className="field"><span>契約状態</span><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as SubscriptionStatus })}><option value="active">契約中</option><option value="paused">一時停止</option><option value="cancelled">解約済み</option></select></label>
              <label className="field field-wide"><span>メモ（任意）</span><textarea maxLength={500} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="家族と共有、仕事で必須 など" /></label>
            </div>
            <p className="form-hint">利用状況が不明な場合、Looplyは解約を断定せず「情報不足」として扱います。</p>
            <footer className="dialog-actions"><button className="secondary-button" type="button" onClick={onClose} disabled={busy}>キャンセル</button><button className="primary-button dialog-primary" type="submit" disabled={busy}>{busy ? '保存中…' : dialog.type === 'add' ? '追加する' : '変更を保存'}</button></footer>
          </form>
        ) : activeSubscription && recommendation ? (
          <div className="detail-body">
            {error && <p className="dialog-error" id="dialog-error" role="alert">{error}</p>}
            <div className="detail-hero">
              <div className={`service-mark service-mark-large tone-${activeSubscription.name.charCodeAt(0) % 6}`} aria-hidden="true">{activeSubscription.name.slice(0, 1).toUpperCase()}</div>
              <div><p>{activeSubscription.plan}</p><strong>{formatYen(activeSubscription.priceMinor)}</strong><span> / {cycleLabels[activeSubscription.billingCycle]}</span></div>
              <span className={`status-chip status-${activeSubscription.status}`}>{statusLabels[activeSubscription.status]}</span>
            </div>

            <div className="detail-stats">
              <article><span>利用期間</span><strong>{activeMonths(activeSubscription.startDate) === 0 ? '1か月未満' : `${activeMonths(activeSubscription.startDate)}か月`}</strong><small>{activeSubscription.startDate} からの経過期間</small></article>
              <article><span>推定支払回数</span><strong>{activeSubscription.status === 'active' ? `${estimatedPaymentCount(activeSubscription)}回` : '—'}</strong><small>{activeSubscription.status === 'active' ? '開始日の請求を含む推定' : '終了日の記録がないため算出外'}</small></article>
              <article><span>推定累計</span><strong>{activeSubscription.status === 'active' ? formatYen(estimatedTotalPaid(activeSubscription)) : '—'}</strong><small>{activeSubscription.status === 'active' ? '実請求の取込で精度向上' : '解約・停止後は実請求を確認'}</small></article>
            </div>

            <section className="recommendation-box">
              <div className="recommendation-score"><span>価値スコア</span><strong>{recommendation.score}</strong><small>/100</small></div>
              <div><div className="recommendation-label-row"><span className={`decision decision-${recommendation.label}`}>{recommendation.label}</span><small>信頼度 {recommendation.confidence}</small></div><ul>{recommendation.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></div>
            </section>

            <section className="checkin-box">
              <div><h3>今月、どのくらい使いましたか？</h3><p>記録すると次回の提案が正確になります。</p></div>
              <div className="checkin-actions">
                <button type="button" onClick={() => onCheckin(activeSubscription, 'often')} disabled={busy}>よく使った</button>
                <button type="button" onClick={() => onCheckin(activeSubscription, 'sometimes')} disabled={busy}>時々</button>
                <button type="button" onClick={() => onCheckin(activeSubscription, 'rarely')} disabled={busy}>使っていない</button>
              </div>
            </section>

            <dl className="detail-list">
              <div><dt>月額換算</dt><dd>{formatYen(monthlyEquivalent(activeSubscription.priceMinor, activeSubscription.billingCycle))}</dd></div>
              <div><dt>次回更新</dt><dd>{activeSubscription.status === 'active' ? nextBillingOccurrence(activeSubscription) ?? activeSubscription.nextBillingDate : activeSubscription.nextBillingDate}</dd></div>
              <div><dt>カテゴリ</dt><dd>{activeSubscription.category}</dd></div>
              <div><dt>登録元</dt><dd>{sourceLabels[activeSubscription.source]}</dd></div>
              <div><dt>最終利用</dt><dd>{activeSubscription.lastUsedDate ?? '未確認'}</dd></div>
            </dl>

            <footer className="detail-footer">
              <button className="danger-text-button" type="button" disabled={busy} onClick={() => onDelete(activeSubscription)}>この登録を削除</button>
              <button className="secondary-button" type="button" disabled={busy} onClick={() => onEdit(activeSubscription)}>編集する</button>
            </footer>
          </div>
        ) : null}
      </section>
    </div>
  );
}
