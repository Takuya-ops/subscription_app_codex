'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import SubscriptionDialog, { type DialogState, type SubscriptionPayload } from '@/app/subscription-dialog';
import GmailIntegration from '@/app/gmail-integration';
import { parseCsvStrict } from '@/lib/csv';
import {
  activeMonths,
  addBillingCycles,
  addDays,
  billingOccurrencesBetween,
  formatYen,
  isIsoDate,
  localIsoDate,
  monthlyEquivalent,
  nextBillingOccurrence,
  parseJpyAmount,
  recommendationFor,
  type BillingCycle,
  type Subscription,
  type UsageLevel,
} from '@/lib/subscriptions';

type View = 'home' | 'subscriptions' | 'calendar' | 'analysis' | 'settings';
type User = { displayName: string; email: string };
type Toast = { message: string; kind: 'success' | 'error' };

const navigation: Array<{ id: View; label: string; mobileLabel: string; symbol: string }> = [
  { id: 'home', label: 'ホーム', mobileLabel: 'ホーム', symbol: '⌂' },
  { id: 'subscriptions', label: 'サブスク', mobileLabel: '一覧', symbol: '▣' },
  { id: 'calendar', label: '更新カレンダー', mobileLabel: '更新', symbol: '□' },
  { id: 'analysis', label: '分析レポート', mobileLabel: '分析', symbol: '↗' },
  { id: 'settings', label: '連携・設定', mobileLabel: '設定', symbol: '⚙' },
];

const viewTitles: Record<View, { eyebrow: string; title: string }> = {
  home: { eyebrow: 'YOUR SUBSCRIPTIONS', title: 'おかえりなさい' },
  subscriptions: { eyebrow: 'SUBSCRIPTIONS', title: 'サブスク一覧' },
  calendar: { eyebrow: 'RENEWAL CALENDAR', title: '更新カレンダー' },
  analysis: { eyebrow: 'VALUE REPORT', title: '価値レポート' },
  settings: { eyebrow: 'CONNECTIONS & PRIVACY', title: '連携・設定' },
};

const cycleLabels: Record<BillingCycle, string> = { weekly: '週', monthly: '月', yearly: '年' };
const statusLabelsForList = { active: '契約中', paused: '一時停止中', cancelled: '解約済み' } as const;
function displayUserName(user: User): string {
  const value = user.displayName.includes('@') ? user.email.split('@')[0] : user.displayName;
  return value.trim().split(/\s+/)[0] || 'ユーザー';
}

function serviceTone(name: string): number {
  return [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 6;
}

function dateLabel(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat('ja-JP', { month: 'short', day: 'numeric', weekday: 'short' }).format(date);
}

function daysUntil(isoDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${isoDate}T00:00:00`);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

function durationLabel(startDate: string): string {
  const months = activeMonths(startDate);
  return months === 0 ? '1か月未満' : `${months}か月`;
}

async function responseJson<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? '通信に失敗しました');
  return body;
}

export default function Dashboard({ initialSubscriptions, user }: { initialSubscriptions: Subscription[]; user: User }) {
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions);
  const [view, setView] = useState<View>('home');
  const [dialog, setDialog] = useState<DialogState>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'attention' | 'cancelled'>('all');
  const [monthlyBudget, setMonthlyBudget] = useState(() => {
    if (typeof window === 'undefined') return 20_000;
    const saved = Number(window.localStorage.getItem('looply-monthly-budget'));
    return saved > 0 ? saved : 20_000;
  });
  const csvInput = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const firstViewRender = useRef(true);
  const name = displayUserName(user);

  const showToast = (message: string, kind: Toast['kind'] = 'success') => setToast({ message, kind });

  useEffect(() => {
    if (!new URL(window.location.href).searchParams.has('google')) return;
    const timer = window.setTimeout(() => setView('settings'), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!toast || toast.kind === 'error') return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (firstViewRender.current) {
      firstViewRender.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
    window.requestAnimationFrame(() => mainRef.current?.focus({ preventScroll: true }));
  }, [view]);

  const categoryCounts = useMemo(() => subscriptions.reduce<Record<string, number>>((counts, subscription) => {
    if (subscription.status === 'active') counts[subscription.category] = (counts[subscription.category] ?? 0) + 1;
    return counts;
  }, {}), [subscriptions]);

  const openDetail = (subscription: Subscription) => { setDialogError(null); setDialog({ type: 'detail', subscription }); };
  const openAdd = () => { setDialogError(null); setDialog({ type: 'add' }); };
  const closeDialog = () => { setDialogError(null); setDialog(null); };
  const editSubscription = (subscription: Subscription) => { setDialogError(null); setDialog({ type: 'edit', subscription }); };

  const saveSubscription = async (payload: SubscriptionPayload, id?: string) => {
    setBusy(true);
    try {
      const response = await fetch(id ? `/api/subscriptions/${id}` : '/api/subscriptions', {
        method: id ? 'PUT' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await responseJson<{ subscription: Subscription }>(response);
      setSubscriptions((current) => id ? current.map((item) => item.id === id ? data.subscription : item) : [...current, data.subscription]);
      closeDialog();
      showToast(id ? '変更を保存しました' : `${data.subscription.name}を追加しました`);
    } catch (error) {
      setDialogError(error instanceof Error ? error.message : '保存に失敗しました');
    } finally { setBusy(false); }
  };

  const checkin = async (subscription: Subscription, level: Exclude<UsageLevel, 'unknown'>) => {
    setBusy(true);
    try {
      const response = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ subscriptionId: subscription.id, level, usedOn: localIsoDate() }),
      });
      const data = await responseJson<{ subscription: Subscription }>(response);
      setSubscriptions((current) => current.map((item) => item.id === subscription.id ? data.subscription : item));
      setDialogError(null);
      setDialog({ type: 'detail', subscription: data.subscription });
      showToast('今月の利用状況を記録しました');
    } catch (error) {
      setDialogError(error instanceof Error ? error.message : '記録に失敗しました');
    } finally { setBusy(false); }
  };

  const deleteSubscription = async (subscription: Subscription) => {
    const confirmation = window.prompt(`削除するには「${subscription.name}」と入力してください。`);
    if (confirmation !== subscription.name) {
      if (confirmation != null) setDialogError('サービス名が一致しないため削除しませんでした');
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/subscriptions/${subscription.id}`, {
        method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ confirmName: confirmation }),
      });
      if (!response.ok) await responseJson(response);
      setSubscriptions((current) => current.filter((item) => item.id !== subscription.id));
      closeDialog();
      showToast('登録を削除しました');
    } catch (error) {
      setDialogError(error instanceof Error ? error.message : '削除に失敗しました');
    } finally { setBusy(false); }
  };

  const importCsv = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 1_000_000) { showToast('CSVは1MB以下にしてください', 'error'); return; }
    setBusy(true);
    try {
      const rows = parseCsvStrict(await file.text());
      if (rows.length < 2) throw new Error('ヘッダーと1件以上のデータが必要です');
      if (rows.length > 101) throw new Error('一度に取り込めるのは100件までです');
      const headers = rows[0].map((header) => header.toLowerCase().replace(/\s/g, ''));
      const find = (aliases: string[]) => headers.findIndex((header) => aliases.includes(header));
      const indexes = {
        name: find(['name', 'サービス名', 'サブスク名']), price: find(['price', '料金', '請求額']),
        cycle: find(['cycle', '周期', '請求周期']), start: find(['startdate', '開始日', '利用開始日']),
        next: find(['nextbillingdate', '更新日', '次回更新日']), category: find(['category', 'カテゴリ']), plan: find(['plan', 'プラン']),
      };
      if ([indexes.name, indexes.price, indexes.cycle, indexes.start, indexes.next].some((value) => value < 0)) {
        throw new Error('必須列は「サービス名、料金、請求周期、利用開始日、次回更新日」です');
      }

      const payloads = rows.slice(1).map((row, index): SubscriptionPayload => {
        const rowNumber = index + 2;
        const name = (row[indexes.name] ?? '').trim();
        if (!name) throw new Error(`${rowNumber}行目のサービス名が空です`);
        const priceMinor = parseJpyAmount(row[indexes.price] ?? '');
        if (priceMinor == null) throw new Error(`${rowNumber}行目の料金はJPYの整数（例：1,500円）で入力してください`);

        const cycleText = (row[indexes.cycle] ?? '').normalize('NFKC').trim().toLowerCase();
        let billingCycle: BillingCycle;
        if (['monthly', 'month', '月', '月額', '月払い'].includes(cycleText)) billingCycle = 'monthly';
        else if (['yearly', 'year', '年', '年額', '年払い'].includes(cycleText)) billingCycle = 'yearly';
        else if (['weekly', 'week', '週', '週払い'].includes(cycleText)) billingCycle = 'weekly';
        else throw new Error(`${rowNumber}行目の請求周期を確認してください`);

        const startDate = (row[indexes.start] ?? '').trim();
        const nextBillingDate = (row[indexes.next] ?? '').trim();
        if (!isIsoDate(startDate)) throw new Error(`${rowNumber}行目の利用開始日はYYYY-MM-DDで入力してください`);
        if (!isIsoDate(nextBillingDate)) throw new Error(`${rowNumber}行目の次回更新日はYYYY-MM-DDで入力してください`);
        if (nextBillingDate < startDate) throw new Error(`${rowNumber}行目の次回更新日は利用開始日以降にしてください`);

        return {
          name,
          plan: indexes.plan >= 0 && row[indexes.plan]?.trim() ? row[indexes.plan].trim() : 'スタンダード',
          priceMinor,
          currency: 'JPY',
          billingCycle,
          startDate,
          nextBillingDate,
          category: indexes.category >= 0 && row[indexes.category]?.trim() ? row[indexes.category].trim() : 'その他',
          importance: 3,
          satisfaction: null,
          usageLevel: 'unknown',
          lastUsedDate: null,
          source: 'csv',
          status: 'active',
          notes: '',
        };
      });
      const response = await fetch('/api/subscriptions/import', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ subscriptions: payloads }),
      });
      const data = await responseJson<{ subscriptions: Subscription[] }>(response);
      setSubscriptions((current) => [...current, ...data.subscriptions]);
      showToast(`${data.subscriptions.length}件をCSVから取り込みました`);
      setView('subscriptions');
    } catch (error) { showToast(error instanceof Error ? error.message : 'CSVの取り込みに失敗しました', 'error'); }
    finally { setBusy(false); }
  };

  const downloadCsvTemplate = () => {
    const startDate = localIsoDate();
    const nextBillingDate = addBillingCycles(startDate, 'monthly');
    const csv = [
      'サービス名,料金,請求周期,利用開始日,次回更新日,プラン,カテゴリ',
      `例サービス,1500,月払い,${startDate},${nextBillingDate},スタンダード,仕事・効率化`,
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'looply-subscriptions-template.csv';
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const exportData = async () => {
    setBusy(true);
    try {
      const response = await fetch('/api/data/export');
      if (!response.ok) await responseJson(response);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `looply-export-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      showToast('データを書き出しました');
    } catch (error) { showToast(error instanceof Error ? error.message : '書き出しに失敗しました', 'error'); }
    finally { setBusy(false); }
  };

  const deleteAllData = async () => {
    const confirmation = window.prompt('サブスク・利用記録・請求履歴をすべて削除します。続けるには「削除」と入力してください。');
    if (confirmation !== '削除') { if (confirmation != null) showToast('確認が一致しないため削除しませんでした', 'error'); return; }
    setBusy(true);
    try {
      const response = await fetch('/api/account', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ confirmation }) });
      if (!response.ok) await responseJson(response);
      setSubscriptions([]);
      showToast('サブスクデータをすべて削除しました');
      setView('subscriptions');
    } catch (error) { showToast(error instanceof Error ? error.message : '削除に失敗しました', 'error'); }
    finally { setBusy(false); }
  };

  const changeBudget = (value: number) => {
    if (!Number.isInteger(value) || value < 1_000 || value > 1_000_000 || value % 500 !== 0) {
      showToast('予算は1,000円〜1,000,000円の範囲で500円単位にしてください', 'error');
      return;
    }
    setMonthlyBudget(value);
    window.localStorage.setItem('looply-monthly-budget', String(value));
    showToast('月の予算を保存しました');
  };

  const detailCategoryCount = dialog && dialog.type !== 'add' ? categoryCounts[dialog.subscription.category] ?? 1 : 1;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand brand-button" type="button" onClick={() => setView('home')} aria-label="Looply ホーム">
          <span className="brand-mark" aria-hidden="true"><i /><i /></span><span>Looply</span>
        </button>
        <nav className="side-nav" aria-label="メインメニュー">
          <p className="nav-label">メニュー</p>
          {navigation.map((item) => (
            <button className={view === item.id ? 'nav-item active' : 'nav-item'} type="button" key={item.id} onClick={() => setView(item.id)} aria-current={view === item.id ? 'page' : undefined}>
              <span className="nav-symbol" aria-hidden="true">{item.symbol}</span>{item.label}
              {item.id === 'analysis' && <span className="nav-count">{subscriptions.filter((subscription) => recommendationFor(subscription, categoryCounts[subscription.category] ?? 1).label !== '継続').length}</span>}
            </button>
          ))}
        </nav>
        <BudgetCard subscriptions={subscriptions} budget={monthlyBudget} />
        <button className="profile-card profile-button" type="button" onClick={() => setView('settings')}>
          <span className="avatar" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
          <span><strong>{name}</strong><small>{user.email}</small></span><span aria-hidden="true">›</span>
        </button>
      </aside>

      <main className="main" id="main-content" ref={mainRef} tabIndex={-1}>
        <header className="topbar">
          <div><p className="eyebrow">{viewTitles[view].eyebrow}</p><h1>{view === 'home' ? `${viewTitles[view].title}、${name}さん` : viewTitles[view].title}</h1></div>
          <div className="top-actions">
            <button className="icon-button" type="button" aria-label="お知らせ" onClick={() => showToast('新しいお知らせはありません')}><span aria-hidden="true">°</span><i /></button>
            <button className="primary-button" type="button" onClick={openAdd}><span aria-hidden="true">＋</span>サブスクを追加</button>
          </div>
        </header>

        {view === 'home' && <HomeView subscriptions={subscriptions} categoryCounts={categoryCounts} budget={monthlyBudget} onDetail={openDetail} onAdd={openAdd} onReview={() => setView('analysis')} />}
        {view === 'subscriptions' && <SubscriptionsView subscriptions={subscriptions} categoryCounts={categoryCounts} search={search} statusFilter={statusFilter} onSearch={setSearch} onFilter={setStatusFilter} onDetail={openDetail} onAdd={openAdd} />}
        {view === 'calendar' && <CalendarView subscriptions={subscriptions} onDetail={openDetail} />}
        {view === 'analysis' && <AnalysisView subscriptions={subscriptions} categoryCounts={categoryCounts} onDetail={openDetail} onAdd={openAdd} onViewSubscriptions={() => setView('subscriptions')} />}
        {view === 'settings' && <SettingsView user={user} budget={monthlyBudget} busy={busy} onBudget={changeBudget} onChooseCsv={() => csvInput.current?.click()} onDownloadCsvTemplate={downloadCsvTemplate} onExport={exportData} onDelete={deleteAllData} onGmailImported={(imported) => setSubscriptions((current) => { const updates = new Map(imported.map((item) => [item.id, item])); return [...current.map((item) => updates.get(item.id) ?? item), ...imported.filter((item) => !current.some((existing) => existing.id === item.id))]; })} />}
      </main>

      <nav className="mobile-nav" aria-label="モバイルメニュー">
        {navigation.map((item) => <button type="button" className={view === item.id ? 'active' : ''} onClick={() => setView(item.id)} key={item.id} aria-current={view === item.id ? 'page' : undefined}><span aria-hidden="true">{item.symbol}</span>{item.mobileLabel}</button>)}
      </nav>

      <input ref={csvInput} className="visually-hidden" type="file" accept=".csv,text/csv" onChange={importCsv} aria-label="CSVファイルを選択" />
      {dialog && <SubscriptionDialog key={dialog.type === 'add' ? 'add' : `${dialog.type}-${dialog.subscription.id}`} dialog={dialog} sameCategoryCount={detailCategoryCount} busy={busy} error={dialogError} onClose={closeDialog} onSave={saveSubscription} onCheckin={checkin} onDelete={deleteSubscription} onEdit={editSubscription} />}
      {toast && <div className={`toast toast-${toast.kind}`} role={toast.kind === 'error' ? 'alert' : 'status'}><span aria-hidden="true">{toast.kind === 'error' ? '!' : '✓'}</span><p>{toast.message}</p><button type="button" onClick={() => setToast(null)} aria-label="通知を閉じる">×</button></div>}
    </div>
  );
}

function BudgetCard({ subscriptions, budget }: { subscriptions: Subscription[]; budget: number }) {
  const total = subscriptions.filter((item) => item.status === 'active').reduce((sum, item) => sum + monthlyEquivalent(item.priceMinor, item.billingCycle), 0);
  const percent = Math.min(100, Math.round((total / budget) * 100));
  return <section className="budget-card" aria-labelledby="budget-title"><div className="budget-head"><p id="budget-title">今月の予算</p><span>{percent}%</span></div><strong>{formatYen(total)}</strong><small>/ {formatYen(budget)}</small><div className="budget-track" aria-hidden="true"><span style={{ width: `${percent}%` }} /></div><p className="budget-note">{total <= budget ? `あと ${formatYen(budget - total)} 使えます` : `${formatYen(total - budget)} 超過しています`}</p></section>;
}

type HomeProps = { subscriptions: Subscription[]; categoryCounts: Record<string, number>; budget: number; onDetail: (subscription: Subscription) => void; onAdd: () => void; onReview: () => void };
function HomeView({ subscriptions, categoryCounts, onDetail, onAdd, onReview }: HomeProps) {
  const active = subscriptions.filter((item) => item.status === 'active');
  if (!active.length) return <EmptyState onAdd={onAdd} title={subscriptions.length ? '現在契約中のサブスクはありません' : undefined} description={subscriptions.length ? '新しい契約を追加するか、解約済みの登録を一覧から確認できます。' : undefined} />;
  const monthly = active.reduce((sum, item) => sum + monthlyEquivalent(item.priceMinor, item.billingCycle), 0);
  const recommendations = active.map((subscription) => ({ subscription, recommendation: recommendationFor(subscription, categoryCounts[subscription.category] ?? 1) }));
  const attention = recommendations.filter(({ recommendation }) => recommendation.label !== '継続');
  const used = active.filter((item) => item.usageLevel === 'often' || item.usageLevel === 'sometimes').length;
  const usageRate = active.length ? Math.round((used / active.length) * 100) : 0;
  const health = recommendations.length ? Math.round(recommendations.reduce((sum, item) => sum + item.recommendation.score, 0) / recommendations.length) : 0;
  const saving = recommendations.filter(({ recommendation }) => recommendation.label === '解約候補').reduce((sum, item) => sum + monthlyEquivalent(item.subscription.priceMinor, item.subscription.billingCycle) * 12, 0);
  const upcoming = active
    .map((subscription) => ({ subscription, date: nextBillingOccurrence(subscription) }))
    .filter((item): item is { subscription: Subscription; date: string } => item.date !== null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);
  return <>
    <section className="summary-grid" aria-label="今月のサマリー">
      <article className="summary-card"><div className="summary-heading"><span className="summary-icon green" aria-hidden="true">¥</span><span className="trend up">契約中 {active.length}件</span></div><p>月額の合計</p><strong>{formatYen(monthly)}</strong><small>年間予測 {formatYen(monthly * 12)}</small><div className="summary-method">登録した請求額を月額換算</div></article>
      <article className="summary-card"><div className="summary-heading"><span className="summary-icon lavender" aria-hidden="true">◎</span><span className="trend down">最新の確認</span></div><p>利用実感</p><strong>{usageRate}%</strong><small>{active.length}件中 {used}件が「よく・時々使う」</small><div className="usage-row" aria-hidden="true"><span className="usage-ring" /><div><b>{usageRate >= 70 ? '良好' : '確認しましょう'}</b><em>最後に登録した利用状況</em></div></div></article>
      <article className="summary-card alert-card"><div className="summary-heading"><span className="summary-icon amber" aria-hidden="true">!</span><span className="review-badge">要チェック</span></div><p>見直し候補</p><strong>{attention.length}件</strong><small>{saving ? `解約候補は年間 ${formatYen(saving)}` : '利用確認で提案が正確になります'}</small><button className="text-button" type="button" onClick={onReview}>候補を確認する <span>→</span></button></article>
    </section>
    <section className="insight-banner"><div className="insight-mark" aria-hidden="true"><span>✦</span></div><div className="insight-copy"><p className="eyebrow">現在のインサイト</p><h2>支払いを、納得に変えよう。</h2><p>{attention.length ? `使い方と大切さをもとに、${attention.length}つの契約を確認すると安心です。` : '登録済みの利用状況と契約のバランスが取れています。'}</p></div><div className="insight-score"><span>健全度スコア</span><strong>{health}<small>/100</small></strong><em>利用・満足度・重複から算出</em></div></section>
    <div className="content-grid">
      <section className="panel"><div className="panel-head"><div><p className="eyebrow">NEXT PAYMENT</p><h2>まもなく更新</h2></div><span className="data-note">次の4件</span></div><div className="payment-list">{upcoming.map(({ subscription, date }) => <button className="payment-row payment-button" type="button" key={subscription.id} onClick={() => onDetail(subscription)}><ServiceMark subscription={subscription} /><div className="service-copy"><strong>{subscription.name}</strong><span>{dateLabel(date)} に更新</span></div><div className="payment-price"><strong>{formatYen(subscription.priceMinor)}</strong><span>{cycleLabels[subscription.billingCycle]}払い</span></div><span className="row-chevron" aria-hidden="true">›</span></button>)}</div></section>
      <section className="panel"><div className="panel-head"><div><p className="eyebrow">SMART REVIEW</p><h2>見直しのヒント</h2></div><span className="data-note">理由を明示</span></div><div className="review-list">{attention.slice(0, 3).map(({ subscription, recommendation }) => <button className="review-row review-button" type="button" key={subscription.id} onClick={() => onDetail(subscription)}><ServiceMark subscription={subscription} /><div className="review-copy"><div><strong>{subscription.name}</strong><span className={`decision decision-${recommendation.label}`}>{recommendation.label}</span></div><p>{recommendation.reasons[0]}</p><small>月額換算 {formatYen(monthlyEquivalent(subscription.priceMinor, subscription.billingCycle))}</small></div><div className="score-pill"><span>価値</span><strong>{recommendation.score}</strong></div></button>)}{!attention.length && <div className="compact-empty"><span>✓</span><p>今月の見直し候補はありません</p></div>}</div></section>
    </div>
  </>;
}

function SubscriptionsView({ subscriptions, categoryCounts, search, statusFilter, onSearch, onFilter, onDetail, onAdd }: { subscriptions: Subscription[]; categoryCounts: Record<string, number>; search: string; statusFilter: 'all' | 'active' | 'attention' | 'cancelled'; onSearch: (value: string) => void; onFilter: (value: 'all' | 'active' | 'attention' | 'cancelled') => void; onDetail: (subscription: Subscription) => void; onAdd: () => void }) {
  const visible = subscriptions.filter((subscription) => {
    const matchesSearch = `${subscription.name} ${subscription.plan} ${subscription.category}`.toLowerCase().includes(search.toLowerCase());
    const recommendation = recommendationFor(subscription, categoryCounts[subscription.category] ?? 1);
    const matchesFilter = statusFilter === 'all' || (statusFilter === 'active' && subscription.status === 'active') || (statusFilter === 'cancelled' && subscription.status === 'cancelled') || (statusFilter === 'attention' && recommendation.label !== '継続');
    return matchesSearch && matchesFilter;
  });
  if (!subscriptions.length) return <EmptyState onAdd={onAdd} />;
  return <section className="list-surface"><div className="list-toolbar"><label className="search-field"><span aria-hidden="true">⌕</span><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="サービス名・カテゴリで検索" aria-label="サブスクを検索" /></label><div className="filter-tabs" role="group" aria-label="表示フィルター">{([['all', 'すべて'], ['active', '契約中'], ['attention', '見直し'], ['cancelled', '解約済み']] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={statusFilter === value} className={statusFilter === value ? 'active' : ''} onClick={() => onFilter(value)}>{label}</button>)}</div></div><div className="subscription-table"><div className="table-head"><span>サービス</span><span>月額換算</span><span>利用期間</span><span>次回更新</span><span>判断</span><span /></div>{visible.map((subscription) => { const recommendation = recommendationFor(subscription, categoryCounts[subscription.category] ?? 1); const displayedNext = subscription.status === 'active' ? nextBillingOccurrence(subscription) ?? subscription.nextBillingDate : subscription.nextBillingDate; return <button className="subscription-table-row" type="button" key={subscription.id} onClick={() => onDetail(subscription)}><span className="subscription-identity"><ServiceMark subscription={subscription} /><span><strong>{subscription.name}</strong><small>{subscription.plan} · {subscription.category}</small></span></span><span data-label="月額換算"><strong>{formatYen(monthlyEquivalent(subscription.priceMinor, subscription.billingCycle))}</strong><small>{cycleLabels[subscription.billingCycle]}払い</small></span><span data-label="利用期間"><strong>{durationLabel(subscription.startDate)}</strong><small>{subscription.startDate}〜</small></span><span data-label="次回更新"><strong>{dateLabel(displayedNext)}</strong><small>{subscription.status === 'active' ? `あと${daysUntil(displayedNext)}日` : statusLabelsForList[subscription.status]}</small></span><span data-label="判断"><i className={`decision decision-${recommendation.label}`}>{recommendation.label}</i><small>価値 {recommendation.score}</small></span><span className="row-chevron">›</span></button>; })}{!visible.length && <div className="filter-empty">条件に一致するサブスクはありません</div>}</div></section>;
}

function CalendarView({ subscriptions, onDetail }: { subscriptions: Subscription[]; onDetail: (subscription: Subscription) => void }) {
  const rangeStart = localIsoDate();
  const rangeEnd = addDays(rangeStart, 30);
  const upcoming = subscriptions
    .filter((item) => item.status === 'active')
    .map((item) => ({ ...item, nextBillingDate: nextBillingOccurrence(item, rangeStart) ?? item.nextBillingDate }))
    .sort((a, b) => a.nextBillingDate.localeCompare(b.nextBillingDate));
  const occurrences = upcoming.flatMap((subscription) => billingOccurrencesBetween(subscription, rangeStart, rangeEnd).map((date) => ({ subscription, date })));
  const total30 = occurrences.reduce((sum, item) => sum + item.subscription.priceMinor, 0);
  return <div className="calendar-layout"><section className="calendar-summary"><p className="eyebrow">NEXT 30 DAYS</p><h2>今後30日の更新</h2><strong>{formatYen(total30)}</strong><span>{occurrences.length}件の請求予定</span><div className="calendar-summary-note"><i aria-hidden="true">!</i><p>週払いは期間内の全請求回数を反映し、年払いは実際の更新額で表示します。</p></div></section><section className="timeline-panel"><div className="panel-head"><div><p className="eyebrow">TIMELINE</p><h2>更新タイムライン</h2></div><span className="data-note">{upcoming.length}件</span></div><div className="renewal-timeline">{upcoming.map((subscription) => { const date = new Date(`${subscription.nextBillingDate}T12:00:00`); return <button className="timeline-row" type="button" key={subscription.id} onClick={() => onDetail(subscription)}><span className="date-tile"><strong>{date.getDate()}</strong><small>{date.toLocaleDateString('ja-JP', { month: 'short' })}</small></span><span className="timeline-line" aria-hidden="true"><i /></span><ServiceMark subscription={subscription} /><span className="timeline-copy"><strong>{subscription.name}</strong><small>{subscription.plan} · あと{daysUntil(subscription.nextBillingDate)}日</small></span><span className="timeline-price"><strong>{formatYen(subscription.priceMinor)}</strong><small>{cycleLabels[subscription.billingCycle]}払い</small></span><span className="row-chevron">›</span></button>; })}{!upcoming.length && <div className="filter-empty">更新予定はありません。過去日付の登録は一覧から修正してください。</div>}</div></section></div>;
}

function AnalysisView({ subscriptions, categoryCounts, onDetail, onAdd, onViewSubscriptions }: { subscriptions: Subscription[]; categoryCounts: Record<string, number>; onDetail: (subscription: Subscription) => void; onAdd: () => void; onViewSubscriptions: () => void }) {
  const active = subscriptions.filter((item) => item.status === 'active');
  if (!active.length) return <EmptyState onAdd={onAdd} title="分析できる契約中のサブスクがありません" description="契約中のサブスクを追加すると、年間支出と価値スコアを確認できます。" onSecondary={subscriptions.length ? onViewSubscriptions : undefined} secondaryLabel="解約済みの一覧を見る" />;
  const categoryTotals = Object.entries(active.reduce<Record<string, number>>((totals, item) => { totals[item.category] = (totals[item.category] ?? 0) + monthlyEquivalent(item.priceMinor, item.billingCycle); return totals; }, {})).sort((a, b) => b[1] - a[1]);
  const maximum = Math.max(...categoryTotals.map((entry) => entry[1]), 1);
  const scored = active.map((subscription) => ({ subscription, recommendation: recommendationFor(subscription, categoryCounts[subscription.category] ?? 1) })).sort((a, b) => a.recommendation.score - b.recommendation.score);
  const monthly = active.reduce((sum, item) => sum + monthlyEquivalent(item.priceMinor, item.billingCycle), 0);
  const potential = scored.filter((item) => item.recommendation.label === '解約候補').reduce((sum, item) => sum + monthlyEquivalent(item.subscription.priceMinor, item.subscription.billingCycle), 0);
  return <div className="analysis-layout"><section className="analysis-hero"><div><p className="eyebrow">ANNUAL OUTLOOK</p><h2>年間支出の見通し</h2><strong>{formatYen(monthly * 12)}</strong><span>現在の契約が続いた場合</span></div><div className="savings-card"><span>見直し余地</span><strong>{formatYen(potential * 12)}</strong><small>解約候補のみを年間換算</small></div></section><div className="analysis-grid"><section className="panel category-panel"><div className="panel-head"><div><p className="eyebrow">BY CATEGORY</p><h2>カテゴリ別の月額</h2></div></div><div className="category-bars">{categoryTotals.map(([category, total], index) => <div className="category-row" key={category}><span className={`category-dot tone-${index % 6}`} /><span>{category}</span><div><i style={{ width: `${Math.round((total / maximum) * 100)}%` }} /></div><strong>{formatYen(total)}</strong></div>)}</div></section><section className="panel score-guide"><p className="eyebrow">HOW IT WORKS</p><h2>価値スコアの考え方</h2><p>利用頻度、大切さ、費用対効果、満足度、似た契約の重複を100点で評価します。</p><dl><div><dt>70〜100</dt><dd><span className="decision decision-継続">継続</span>価値を感じている契約</dd></div><div><dt>40〜69</dt><dd><span className="decision decision-見直し">見直し</span>プランや重複を確認</dd></div><div><dt>0〜39</dt><dd><span className="decision decision-解約候補">解約候補</span>根拠を見て本人が判断</dd></div></dl><small>利用データが足りない場合は点数に関係なく「情報不足」です。</small></section></div><section className="recommendation-surface"><div className="panel-head"><div><p className="eyebrow">ALL RECOMMENDATIONS</p><h2>サブスクごとの判断</h2></div><span className="data-note">自動解約はしません</span></div><div className="recommendation-cards">{scored.map(({ subscription, recommendation }) => <button className="recommendation-card" type="button" key={subscription.id} onClick={() => onDetail(subscription)}><ServiceMark subscription={subscription} /><span className="recommendation-card-copy"><strong>{subscription.name}</strong><small>{recommendation.reasons[0]}</small></span><span className={`decision decision-${recommendation.label}`}>{recommendation.label}</span><span className="recommendation-card-score"><strong>{recommendation.score}</strong><small>/100</small></span><span className="row-chevron">›</span></button>)}</div></section></div>;
}

type SettingsViewProps = {
  user: User;
  budget: number;
  busy: boolean;
  onBudget: (value: number) => void;
  onChooseCsv: () => void;
  onDownloadCsvTemplate: () => void;
  onExport: () => void;
  onDelete: () => void;
  onGmailImported: (subscriptions: Subscription[]) => void;
};

function SettingsView({ user, budget, busy, onBudget, onChooseCsv, onDownloadCsvTemplate, onExport, onDelete, onGmailImported }: SettingsViewProps) {
  const [draftBudget, setDraftBudget] = useState(String(budget));
  const submitBudget = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onBudget(Number(draftBudget));
  };

  return (
    <div className="settings-layout">
      <section className="settings-section">
        <div className="settings-title"><p className="eyebrow">ACCOUNT</p><h2>アカウント</h2><p>データはログイン中のアカウントごとに分離されます。</p></div>
        <div className="settings-card account-row">
          <span className="avatar settings-avatar">{displayUserName(user).slice(0, 1).toUpperCase()}</span>
          <div><strong>{displayUserName(user)}</strong><small>{user.email}</small></div>
          <span className="connected-chip"><i />認証済み</span>
          <a className="signout-link" href="/signout-with-chatgpt?return_to=%2F">ログアウト</a>
        </div>
      </section>
      <section className="settings-section">
        <div className="settings-title"><p className="eyebrow">IMPORT & CONNECTIONS</p><h2>データを取り込む</h2><p>元データと推定値を区別し、取り込み後に必ず確認できます。</p></div>
        <div className="connection-grid">
          <GmailIntegration onImported={onGmailImported} />
          <article className="connection-card">
            <div className="connection-icon csv-icon">CSV</div>
            <div><h3>サブスク一覧CSV</h3><p>契約一覧を事前検証し、すべての行が正しい場合だけ一括登録します。</p></div>
            <span className="ready-chip">利用可能</span>
            <button type="button" onClick={onChooseCsv} disabled={busy}>CSVを選ぶ</button>
            <button type="button" onClick={onDownloadCsvTemplate} disabled={busy}>テンプレートをダウンロード</button>
            <small>必須列：サービス名、料金（JPY）、請求周期、利用開始日、次回更新日。最大100件・1MB。</small>
          </article>
        </div>
      </section>
      <section className="settings-section">
        <div className="settings-title"><p className="eyebrow">PREFERENCES</p><h2>予算</h2></div>
        <form className="settings-card budget-setting" onSubmit={submitBudget}>
          <div><strong>月のサブスク予算</strong><small>この端末の表示設定として保存されます。</small></div>
          <label htmlFor="monthly-budget"><span aria-hidden="true">¥</span><span className="visually-hidden">月のサブスク予算</span><input id="monthly-budget" aria-label="月のサブスク予算" type="number" min="1000" max="1000000" step="500" required value={draftBudget} onChange={(event) => setDraftBudget(event.target.value)} /></label>
          <button className="secondary-button" type="submit">保存</button>
        </form>
      </section>
      <section className="settings-section">
        <div className="settings-title"><p className="eyebrow">YOUR DATA</p><h2>プライバシー</h2><p>いつでも本人分のデータを書き出し、サブスクデータを削除できます。</p></div>
        <div className="settings-card privacy-actions">
          <div><strong>データを書き出す</strong><small>登録・利用記録・請求履歴をJSONで取得します。</small></div>
          <button className="secondary-button" type="button" onClick={onExport} disabled={busy}>書き出す</button>
          <div><strong>サブスクデータを全削除</strong><small>サブスク、利用記録、請求履歴、Gmail接続を削除します。ChatGPTのアカウント認証は残ります。</small></div>
          <button className="danger-button" type="button" onClick={onDelete} disabled={busy}>全削除</button>
        </div>
      </section>
    </div>
  );
}

function ServiceMark({ subscription }: { subscription: Subscription }) {
  return <span className={`service-mark tone-${serviceTone(subscription.name)}`} aria-hidden="true">{subscription.name.slice(0, 1).toUpperCase()}</span>;
}

function EmptyState({ onAdd, title = '最初のサブスクを登録しましょう', description = '料金、請求周期、開始日を入れると、月額換算と見直しのヒントがすぐに表示されます。', onSecondary, secondaryLabel }: { onAdd: () => void; title?: string; description?: string; onSecondary?: () => void; secondaryLabel?: string }) {
  return <section className="empty-state"><span className="empty-mark" aria-hidden="true">＋</span><h2>{title}</h2><p>{description}</p><div className="empty-actions"><button className="primary-button" type="button" onClick={onAdd}><span>＋</span>サブスクを追加</button>{onSecondary && secondaryLabel && <button className="secondary-button" type="button" onClick={onSecondary}>{secondaryLabel}</button>}</div></section>;
}
