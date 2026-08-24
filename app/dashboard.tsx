'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import SubscriptionDialog, { type DialogState, type SubscriptionPayload } from '@/app/subscription-dialog';
import {
  activeMonths,
  formatYen,
  monthlyEquivalent,
  recommendationFor,
  type BillingCycle,
  type Subscription,
  type UsageLevel,
} from '@/lib/subscriptions';

type View = 'home' | 'subscriptions' | 'calendar' | 'analysis' | 'settings';
type User = { displayName: string; email: string };

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

async function responseJson<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? '通信に失敗しました');
  return body;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"' && quoted && text[index + 1] === '"') { cell += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(cell.trim()); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = []; cell = '';
    } else cell += char;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

export default function Dashboard({ initialSubscriptions, user }: { initialSubscriptions: Subscription[]; user: User }) {
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions);
  const [view, setView] = useState<View>('home');
  const [dialog, setDialog] = useState<DialogState>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'attention' | 'cancelled'>('all');
  const [monthlyBudget, setMonthlyBudget] = useState(() => {
    if (typeof window === 'undefined') return 20_000;
    const saved = Number(window.localStorage.getItem('looply-monthly-budget'));
    return saved > 0 ? saved : 20_000;
  });
  const csvInput = useRef<HTMLInputElement>(null);
  const name = displayUserName(user);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const categoryCounts = useMemo(() => subscriptions.reduce<Record<string, number>>((counts, subscription) => {
    if (subscription.status === 'active') counts[subscription.category] = (counts[subscription.category] ?? 0) + 1;
    return counts;
  }, {}), [subscriptions]);

  const openDetail = (subscription: Subscription) => setDialog({ type: 'detail', subscription });

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
      setDialog(null);
      setToast(id ? '変更を保存しました' : `${data.subscription.name}を追加しました`);
    } catch (error) {
      setToast(error instanceof Error ? error.message : '保存に失敗しました');
    } finally { setBusy(false); }
  };

  const checkin = async (subscription: Subscription, level: Exclude<UsageLevel, 'unknown'>) => {
    setBusy(true);
    try {
      const response = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ subscriptionId: subscription.id, level }),
      });
      const data = await responseJson<{ subscription: Subscription }>(response);
      setSubscriptions((current) => current.map((item) => item.id === subscription.id ? data.subscription : item));
      setDialog({ type: 'detail', subscription: data.subscription });
      setToast('今月の利用状況を記録しました');
    } catch (error) {
      setToast(error instanceof Error ? error.message : '記録に失敗しました');
    } finally { setBusy(false); }
  };

  const deleteSubscription = async (subscription: Subscription) => {
    const confirmation = window.prompt(`削除するには「${subscription.name}」と入力してください。`);
    if (confirmation !== subscription.name) {
      if (confirmation != null) setToast('サービス名が一致しないため削除しませんでした');
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/subscriptions/${subscription.id}`, {
        method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ confirmName: confirmation }),
      });
      if (!response.ok) await responseJson(response);
      setSubscriptions((current) => current.filter((item) => item.id !== subscription.id));
      setDialog(null);
      setToast('登録を削除しました');
    } catch (error) {
      setToast(error instanceof Error ? error.message : '削除に失敗しました');
    } finally { setBusy(false); }
  };

  const importCsv = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 1_000_000) { setToast('CSVは1MB以下にしてください'); return; }
    const rows = parseCsv(await file.text());
    if (rows.length < 2) { setToast('ヘッダーと1件以上のデータが必要です'); return; }
    const headers = rows[0].map((header) => header.toLowerCase().replace(/\s/g, ''));
    const find = (aliases: string[]) => headers.findIndex((header) => aliases.includes(header));
    const indexes = {
      name: find(['name', 'サービス名', 'サブスク名']), price: find(['price', '料金', '請求額']),
      cycle: find(['cycle', '周期', '請求周期']), start: find(['startdate', '開始日', '利用開始日']),
      next: find(['nextbillingdate', '更新日', '次回更新日']), category: find(['category', 'カテゴリ']), plan: find(['plan', 'プラン']),
    };
    if (indexes.name < 0 || indexes.price < 0) { setToast('CSVには「サービス名」と「料金」が必要です'); return; }
    if (rows.length > 101) { setToast('一度に取り込めるのは100件までです'); return; }

    const today = new Date().toISOString().slice(0, 10);
    const next = new Date(); next.setUTCMonth(next.getUTCMonth() + 1);
    setBusy(true);
    let imported = 0;
    try {
      for (const row of rows.slice(1)) {
        const cycleText = indexes.cycle >= 0 ? row[indexes.cycle]?.toLowerCase() : '';
        const billingCycle: BillingCycle = /year|年/.test(cycleText) ? 'yearly' : /week|週/.test(cycleText) ? 'weekly' : 'monthly';
        const payload: SubscriptionPayload = {
          name: row[indexes.name] ?? '', plan: indexes.plan >= 0 && row[indexes.plan] ? row[indexes.plan] : 'スタンダード',
          priceMinor: Number((row[indexes.price] ?? '').replace(/[^0-9]/g, '')), currency: 'JPY', billingCycle,
          startDate: indexes.start >= 0 && /^\d{4}-\d{2}-\d{2}$/.test(row[indexes.start] ?? '') ? row[indexes.start] : today,
          nextBillingDate: indexes.next >= 0 && /^\d{4}-\d{2}-\d{2}$/.test(row[indexes.next] ?? '') ? row[indexes.next] : next.toISOString().slice(0, 10),
          category: indexes.category >= 0 && row[indexes.category] ? row[indexes.category] : 'その他', importance: 3, satisfaction: null,
          usageLevel: 'unknown', lastUsedDate: null, source: 'csv', status: 'active', notes: '',
        };
        const response = await fetch('/api/subscriptions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await responseJson<{ subscription: Subscription }>(response);
        setSubscriptions((current) => [...current, data.subscription]);
        imported += 1;
      }
      setToast(`${imported}件をCSVから取り込みました`);
      setView('subscriptions');
    } catch (error) { setToast(`${imported}件取り込み後に停止しました：${error instanceof Error ? error.message : 'エラー'}`); }
    finally { setBusy(false); }
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
      setToast('データを書き出しました');
    } catch (error) { setToast(error instanceof Error ? error.message : '書き出しに失敗しました'); }
    finally { setBusy(false); }
  };

  const deleteAllData = async () => {
    const confirmation = window.prompt('サブスク・利用記録・請求履歴をすべて削除します。続けるには「削除」と入力してください。');
    if (confirmation !== '削除') { if (confirmation != null) setToast('確認が一致しないため削除しませんでした'); return; }
    setBusy(true);
    try {
      const response = await fetch('/api/account', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ confirmation }) });
      if (!response.ok) await responseJson(response);
      setSubscriptions([]);
      setToast('サブスクデータをすべて削除しました');
      setView('subscriptions');
    } catch (error) { setToast(error instanceof Error ? error.message : '削除に失敗しました'); }
    finally { setBusy(false); }
  };

  const changeBudget = (value: number) => {
    const next = Math.max(1_000, Math.min(1_000_000, value || 1_000));
    setMonthlyBudget(next);
    window.localStorage.setItem('looply-monthly-budget', String(next));
    setToast('月の予算を保存しました');
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

      <main className="main" id="main-content">
        <header className="topbar">
          <div><p className="eyebrow">{viewTitles[view].eyebrow}</p><h1>{view === 'home' ? `${viewTitles[view].title}、${name}さん` : viewTitles[view].title}</h1></div>
          <div className="top-actions">
            <button className="icon-button" type="button" aria-label="お知らせ" onClick={() => setToast('新しいお知らせはありません')}><span aria-hidden="true">°</span><i /></button>
            <button className="primary-button" type="button" onClick={() => setDialog({ type: 'add' })}><span aria-hidden="true">＋</span>サブスクを追加</button>
          </div>
        </header>

        {view === 'home' && <HomeView subscriptions={subscriptions} categoryCounts={categoryCounts} budget={monthlyBudget} onDetail={openDetail} onAdd={() => setDialog({ type: 'add' })} onReview={() => setView('analysis')} />}
        {view === 'subscriptions' && <SubscriptionsView subscriptions={subscriptions} categoryCounts={categoryCounts} search={search} statusFilter={statusFilter} onSearch={setSearch} onFilter={setStatusFilter} onDetail={openDetail} onAdd={() => setDialog({ type: 'add' })} />}
        {view === 'calendar' && <CalendarView subscriptions={subscriptions} onDetail={openDetail} />}
        {view === 'analysis' && <AnalysisView subscriptions={subscriptions} categoryCounts={categoryCounts} onDetail={openDetail} />}
        {view === 'settings' && <SettingsView user={user} budget={monthlyBudget} busy={busy} onBudget={changeBudget} onChooseCsv={() => csvInput.current?.click()} onExport={exportData} onDelete={deleteAllData} />}
      </main>

      <nav className="mobile-nav" aria-label="モバイルメニュー">
        {navigation.map((item) => <button type="button" className={view === item.id ? 'active' : ''} onClick={() => setView(item.id)} key={item.id} aria-current={view === item.id ? 'page' : undefined}><span aria-hidden="true">{item.symbol}</span>{item.mobileLabel}</button>)}
      </nav>

      <input ref={csvInput} className="visually-hidden" type="file" accept=".csv,text/csv" onChange={importCsv} aria-label="CSVファイルを選択" />
      {dialog && <SubscriptionDialog key={dialog.type === 'add' ? 'add' : `${dialog.type}-${dialog.subscription.id}`} dialog={dialog} sameCategoryCount={detailCategoryCount} busy={busy} onClose={() => setDialog(null)} onSave={saveSubscription} onCheckin={checkin} onDelete={deleteSubscription} onEdit={(subscription) => setDialog({ type: 'edit', subscription })} />}
      {toast && <div className="toast" role="status" aria-live="polite"><span aria-hidden="true">✓</span>{toast}</div>}
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
  const monthly = active.reduce((sum, item) => sum + monthlyEquivalent(item.priceMinor, item.billingCycle), 0);
  const recommendations = active.map((subscription) => ({ subscription, recommendation: recommendationFor(subscription, categoryCounts[subscription.category] ?? 1) }));
  const attention = recommendations.filter(({ recommendation }) => recommendation.label !== '継続');
  const used = active.filter((item) => item.usageLevel === 'often' || item.usageLevel === 'sometimes').length;
  const usageRate = active.length ? Math.round((used / active.length) * 100) : 0;
  const health = recommendations.length ? Math.round(recommendations.reduce((sum, item) => sum + item.recommendation.score, 0) / recommendations.length) : 0;
  const saving = recommendations.filter(({ recommendation }) => recommendation.label === '解約候補').reduce((sum, item) => sum + monthlyEquivalent(item.subscription.priceMinor, item.subscription.billingCycle) * 12, 0);
  const upcoming = [...active].sort((a, b) => a.nextBillingDate.localeCompare(b.nextBillingDate)).slice(0, 4);
  const bars = [73, 76, 74, 78, 81, 79, 84, 83, 86, 84, 88, 92];

  if (!subscriptions.length) return <EmptyState onAdd={onAdd} />;
  return <>
    <section className="summary-grid" aria-label="今月のサマリー">
      <article className="summary-card"><div className="summary-heading"><span className="summary-icon green" aria-hidden="true">¥</span><span className="trend up">契約中 {active.length}件</span></div><p>月額の合計</p><strong>{formatYen(monthly)}</strong><small>年間予測 {formatYen(monthly * 12)}</small><div className="mini-bars" aria-label="直近12か月の支出推移">{bars.map((height, index) => <span className={index === bars.length - 1 ? 'current' : ''} key={index} style={{ height: `${height}%` }} />)}</div></article>
      <article className="summary-card"><div className="summary-heading"><span className="summary-icon lavender" aria-hidden="true">◎</span><span className="trend down">今月の確認</span></div><p>利用実感</p><strong>{usageRate}%</strong><small>{active.length}件中 {used}件を利用</small><div className="usage-row" aria-hidden="true"><span className="usage-ring" /><div><b>{usageRate >= 70 ? '良好' : '確認しましょう'}</b><em>利用状況から集計</em></div></div></article>
      <article className="summary-card alert-card"><div className="summary-heading"><span className="summary-icon amber" aria-hidden="true">!</span><span className="review-badge">要チェック</span></div><p>見直し候補</p><strong>{attention.length}件</strong><small>{saving ? `解約候補は年間 ${formatYen(saving)}` : '利用確認で提案が正確になります'}</small><button className="text-button" type="button" onClick={onReview}>候補を確認する <span>→</span></button></article>
    </section>
    <section className="insight-banner"><div className="insight-mark" aria-hidden="true"><span>✦</span></div><div className="insight-copy"><p className="eyebrow">今週のインサイト</p><h2>支払いを、納得に変えよう。</h2><p>{attention.length ? `使い方と大切さをもとに、${attention.length}つの契約を確認すると安心です。` : '今月の契約は利用状況とのバランスが取れています。'}</p></div><div className="insight-score"><span>健全度スコア</span><strong>{health}<small>/100</small></strong><em>利用・満足度・重複から算出</em></div></section>
    <div className="content-grid">
      <section className="panel"><div className="panel-head"><div><p className="eyebrow">NEXT PAYMENT</p><h2>まもなく更新</h2></div><span className="data-note">次の4件</span></div><div className="payment-list">{upcoming.map((service) => <button className="payment-row payment-button" type="button" key={service.id} onClick={() => onDetail(service)}><ServiceMark subscription={service} /><div className="service-copy"><strong>{service.name}</strong><span>{dateLabel(service.nextBillingDate)} に更新</span></div><div className="payment-price"><strong>{formatYen(service.priceMinor)}</strong><span>{cycleLabels[service.billingCycle]}払い</span></div><span className="row-chevron" aria-hidden="true">›</span></button>)}</div></section>
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
  return <section className="list-surface"><div className="list-toolbar"><label className="search-field"><span aria-hidden="true">⌕</span><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="サービス名・カテゴリで検索" aria-label="サブスクを検索" /></label><div className="filter-tabs" role="group" aria-label="表示フィルター">{([['all', 'すべて'], ['active', '契約中'], ['attention', '見直し'], ['cancelled', '解約済み']] as const).map(([value, label]) => <button type="button" key={value} className={statusFilter === value ? 'active' : ''} onClick={() => onFilter(value)}>{label}</button>)}</div></div><div className="subscription-table"><div className="table-head"><span>サービス</span><span>月額換算</span><span>利用期間</span><span>次回更新</span><span>判断</span><span /></div>{visible.map((subscription) => { const recommendation = recommendationFor(subscription, categoryCounts[subscription.category] ?? 1); return <button className="subscription-table-row" type="button" key={subscription.id} onClick={() => onDetail(subscription)}><span className="subscription-identity"><ServiceMark subscription={subscription} /><span><strong>{subscription.name}</strong><small>{subscription.plan} · {subscription.category}</small></span></span><span data-label="月額換算"><strong>{formatYen(monthlyEquivalent(subscription.priceMinor, subscription.billingCycle))}</strong><small>{cycleLabels[subscription.billingCycle]}払い</small></span><span data-label="利用期間"><strong>{activeMonths(subscription.startDate)}か月</strong><small>{subscription.startDate}〜</small></span><span data-label="次回更新"><strong>{dateLabel(subscription.nextBillingDate)}</strong><small>{daysUntil(subscription.nextBillingDate) >= 0 ? `あと${daysUntil(subscription.nextBillingDate)}日` : '日付を確認'}</small></span><span data-label="判断"><i className={`decision decision-${recommendation.label}`}>{recommendation.label}</i><small>価値 {recommendation.score}</small></span><span className="row-chevron">›</span></button>; })}{!visible.length && <div className="filter-empty">条件に一致するサブスクはありません</div>}</div></section>;
}

function CalendarView({ subscriptions, onDetail }: { subscriptions: Subscription[]; onDetail: (subscription: Subscription) => void }) {
  const upcoming = subscriptions.filter((item) => item.status === 'active').sort((a, b) => a.nextBillingDate.localeCompare(b.nextBillingDate));
  const next30 = upcoming.filter((item) => daysUntil(item.nextBillingDate) >= 0 && daysUntil(item.nextBillingDate) <= 30);
  const total30 = next30.reduce((sum, item) => sum + item.priceMinor, 0);
  return <div className="calendar-layout"><section className="calendar-summary"><p className="eyebrow">NEXT 30 DAYS</p><h2>今後30日の更新</h2><strong>{formatYen(total30)}</strong><span>{next30.length}件の請求予定</span><div className="calendar-summary-note"><i aria-hidden="true">!</i><p>年払いは請求額が大きくなります。月額換算と実際の更新額を分けて表示しています。</p></div></section><section className="timeline-panel"><div className="panel-head"><div><p className="eyebrow">TIMELINE</p><h2>更新タイムライン</h2></div><span className="data-note">{upcoming.length}件</span></div><div className="renewal-timeline">{upcoming.map((subscription) => { const date = new Date(`${subscription.nextBillingDate}T12:00:00`); return <button className="timeline-row" type="button" key={subscription.id} onClick={() => onDetail(subscription)}><span className="date-tile"><strong>{date.getDate()}</strong><small>{date.toLocaleDateString('ja-JP', { month: 'short' })}</small></span><span className="timeline-line" aria-hidden="true"><i /></span><ServiceMark subscription={subscription} /><span className="timeline-copy"><strong>{subscription.name}</strong><small>{subscription.plan} · {daysUntil(subscription.nextBillingDate) >= 0 ? `あと${daysUntil(subscription.nextBillingDate)}日` : '更新日を確認'}</small></span><span className="timeline-price"><strong>{formatYen(subscription.priceMinor)}</strong><small>{cycleLabels[subscription.billingCycle]}払い</small></span><span className="row-chevron">›</span></button>; })}{!upcoming.length && <div className="filter-empty">更新予定はありません</div>}</div></section></div>;
}

function AnalysisView({ subscriptions, categoryCounts, onDetail }: { subscriptions: Subscription[]; categoryCounts: Record<string, number>; onDetail: (subscription: Subscription) => void }) {
  const active = subscriptions.filter((item) => item.status === 'active');
  const categoryTotals = Object.entries(active.reduce<Record<string, number>>((totals, item) => { totals[item.category] = (totals[item.category] ?? 0) + monthlyEquivalent(item.priceMinor, item.billingCycle); return totals; }, {})).sort((a, b) => b[1] - a[1]);
  const maximum = Math.max(...categoryTotals.map((entry) => entry[1]), 1);
  const scored = active.map((subscription) => ({ subscription, recommendation: recommendationFor(subscription, categoryCounts[subscription.category] ?? 1) })).sort((a, b) => a.recommendation.score - b.recommendation.score);
  const monthly = active.reduce((sum, item) => sum + monthlyEquivalent(item.priceMinor, item.billingCycle), 0);
  const potential = scored.filter((item) => item.recommendation.label === '解約候補').reduce((sum, item) => sum + monthlyEquivalent(item.subscription.priceMinor, item.subscription.billingCycle), 0);
  return <div className="analysis-layout"><section className="analysis-hero"><div><p className="eyebrow">ANNUAL OUTLOOK</p><h2>年間支出の見通し</h2><strong>{formatYen(monthly * 12)}</strong><span>現在の契約が続いた場合</span></div><div className="savings-card"><span>見直し余地</span><strong>{formatYen(potential * 12)}</strong><small>解約候補のみを年間換算</small></div></section><div className="analysis-grid"><section className="panel category-panel"><div className="panel-head"><div><p className="eyebrow">BY CATEGORY</p><h2>カテゴリ別の月額</h2></div></div><div className="category-bars">{categoryTotals.map(([category, total], index) => <div className="category-row" key={category}><span className={`category-dot tone-${index % 6}`} /><span>{category}</span><div><i style={{ width: `${Math.round((total / maximum) * 100)}%` }} /></div><strong>{formatYen(total)}</strong></div>)}</div></section><section className="panel score-guide"><p className="eyebrow">HOW IT WORKS</p><h2>価値スコアの考え方</h2><p>利用頻度、大切さ、費用対効果、満足度、似た契約の重複を100点で評価します。</p><dl><div><dt>70〜100</dt><dd><span className="decision decision-継続">継続</span>価値を感じている契約</dd></div><div><dt>40〜69</dt><dd><span className="decision decision-見直し">見直し</span>プランや重複を確認</dd></div><div><dt>0〜39</dt><dd><span className="decision decision-解約候補">解約候補</span>根拠を見て本人が判断</dd></div></dl><small>利用データが足りない場合は点数に関係なく「情報不足」です。</small></section></div><section className="recommendation-surface"><div className="panel-head"><div><p className="eyebrow">ALL RECOMMENDATIONS</p><h2>サブスクごとの判断</h2></div><span className="data-note">自動解約はしません</span></div><div className="recommendation-cards">{scored.map(({ subscription, recommendation }) => <button className="recommendation-card" type="button" key={subscription.id} onClick={() => onDetail(subscription)}><ServiceMark subscription={subscription} /><span className="recommendation-card-copy"><strong>{subscription.name}</strong><small>{recommendation.reasons[0]}</small></span><span className={`decision decision-${recommendation.label}`}>{recommendation.label}</span><span className="recommendation-card-score"><strong>{recommendation.score}</strong><small>/100</small></span><span className="row-chevron">›</span></button>)}</div></section></div>;
}

function SettingsView({ user, budget, busy, onBudget, onChooseCsv, onExport, onDelete }: { user: User; budget: number; busy: boolean; onBudget: (value: number) => void; onChooseCsv: () => void; onExport: () => void; onDelete: () => void }) {
  const [draftBudget, setDraftBudget] = useState(budget);
  return <div className="settings-layout"><section className="settings-section"><div className="settings-title"><p className="eyebrow">ACCOUNT</p><h2>アカウント</h2><p>データはログイン中のアカウントごとに分離されます。</p></div><div className="settings-card account-row"><span className="avatar settings-avatar">{displayUserName(user).slice(0, 1).toUpperCase()}</span><div><strong>{displayUserName(user)}</strong><small>{user.email}</small></div><span className="connected-chip"><i />認証済み</span></div></section><section className="settings-section"><div className="settings-title"><p className="eyebrow">IMPORT & CONNECTIONS</p><h2>データを取り込む</h2><p>元データと推定値を区別し、取り込み後に必ず確認できます。</p></div><div className="connection-grid"><article className="connection-card"><div className="connection-icon google-icon">G</div><div><h3>Gmailの請求メール</h3><p>請求・領収メールから候補を抽出します。本文は保存せず、確認後に登録する設計です。</p></div><span className="pending-chip">未接続</span><button type="button" disabled title="Google OAuthの認証情報と審査が必要です">認証情報の設定後に有効</button><small>Googleログインとは別の読み取り許可が必要です。</small></article><article className="connection-card"><div className="connection-icon csv-icon">CSV</div><div><h3>カード明細・一覧CSV</h3><p>ファイルはブラウザで解析し、サービス名と料金を確認して登録します。</p></div><span className="ready-chip">利用可能</span><button type="button" onClick={onChooseCsv} disabled={busy}>CSVを選ぶ</button><small>必須列：サービス名、料金。最大100件・1MB。</small></article></div></section><section className="settings-section"><div className="settings-title"><p className="eyebrow">PREFERENCES</p><h2>予算と通知</h2></div><div className="settings-card budget-setting"><div><strong>月のサブスク予算</strong><small>この端末の表示設定として保存されます。</small></div><label><span>¥</span><input type="number" min="1000" max="1000000" step="500" value={draftBudget} onChange={(event) => setDraftBudget(Number(event.target.value))} /></label><button className="secondary-button" type="button" onClick={() => onBudget(draftBudget)}>保存</button></div></section><section className="settings-section"><div className="settings-title"><p className="eyebrow">YOUR DATA</p><h2>プライバシー</h2><p>いつでも本人分のデータを書き出し、サブスクデータを削除できます。</p></div><div className="settings-card privacy-actions"><div><strong>データを書き出す</strong><small>登録・利用記録・請求履歴をJSONで取得します。</small></div><button className="secondary-button" type="button" onClick={onExport} disabled={busy}>書き出す</button><div><strong>サブスクデータを全削除</strong><small>サブスク、利用記録、請求履歴を削除します。アカウント認証は残ります。</small></div><button className="danger-button" type="button" onClick={onDelete} disabled={busy}>全削除</button></div></section></div>;
}

function ServiceMark({ subscription }: { subscription: Subscription }) {
  return <span className={`service-mark tone-${serviceTone(subscription.name)}`} aria-hidden="true">{subscription.name.slice(0, 1).toUpperCase()}</span>;
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return <section className="empty-state"><span className="empty-mark" aria-hidden="true">＋</span><h2>最初のサブスクを登録しましょう</h2><p>料金、請求周期、開始日を入れると、月額換算と見直しのヒントがすぐに表示されます。</p><button className="primary-button" type="button" onClick={onAdd}><span>＋</span>サブスクを追加</button></section>;
}
