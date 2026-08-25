'use client';

import { useEffect, useState } from 'react';
import { formatYen, type BillingCycle, type Subscription } from '@/lib/subscriptions';

type GoogleStatus = { connected: boolean; email?: string; lastSyncedAt?: string };
type GmailCandidate = {
  id: string;
  name: string;
  merchant: string;
  priceMinor: number;
  currency: 'JPY';
  billingCycle: BillingCycle;
  firstChargedOn: string;
  lastChargedOn: string;
  evidenceCount: number;
  confidence: number;
  existingSubscriptionId: string | null;
  existingSubscriptionName: string | null;
};

const cycleLabels: Record<BillingCycle, string> = { weekly: '週払い', monthly: '月払い', yearly: '年払い' };

async function responseJson<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? '通信に失敗しました');
  return body;
}

function resultMessage(value: string | null): { message: string; kind: 'success' | 'error' } | null {
  if (value === 'connected') return { message: 'Gmailの読み取り専用接続が完了しました。メールを確認するには「請求メールを探す」を押してください。', kind: 'success' };
  if (value === 'denied') return { message: 'Googleの許可は行われませんでした。必要なときに再度接続できます。', kind: 'error' };
  if (value === 'expired') return { message: 'Google接続の有効時間が切れました。もう一度接続してください。', kind: 'error' };
  if (value === 'failed') return { message: 'Google接続を完了できませんでした。少し待ってから再度お試しください。', kind: 'error' };
  return null;
}

export default function GmailIntegration({ onImported }: { onImported: (subscriptions: Subscription[]) => void }) {
  const [status, setStatus] = useState<GoogleStatus | null>(null);
  const [candidates, setCandidates] = useState<GmailCandidate[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hasMore, setHasMore] = useState(false);
  const [busy, setBusy] = useState<'status' | 'scan' | 'import' | 'disconnect' | null>('status');
  const [notice, setNotice] = useState<{ message: string; kind: 'success' | 'error' } | null>(() => {
    if (typeof window === 'undefined') return null;
    return resultMessage(new URL(window.location.href).searchParams.get('google'));
  });

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/integrations/google/status', { cache: 'no-store' });
      setStatus(await responseJson<GoogleStatus>(response));
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : '接続状態を確認できませんでした', kind: 'error' });
    } finally {
      setBusy(null);
    }
  };

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has('google')) {
      url.searchParams.delete('google');
      window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    }
    const timer = window.setTimeout(() => void loadStatus(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const scan = async () => {
    setBusy('scan');
    setNotice(null);
    try {
      const response = await fetch('/api/integrations/google/scan', { method: 'POST' });
      const data = await responseJson<{ candidates: GmailCandidate[]; hasMore: boolean }>(response);
      setCandidates(data.candidates);
      setHasMore(data.hasMore);
      setSelected(new Set());
      setNotice({
        message: data.candidates.length
          ? `${data.candidates.length}件の候補が見つかりました。内容を確認して登録するものを選んでください。${data.hasMore ? ' 未確認のメールがあるため、続けて探せます。' : ''}`
          : data.hasMore
            ? 'この範囲には候補がありませんでした。未確認のメールを続けて探せます。'
            : '継続課金と判断できる新しい請求メールは見つかりませんでした。',
        kind: 'success',
      });
      await loadStatus();
    } catch (error) {
      const message = error instanceof Error ? error.message : '請求メールを確認できませんでした';
      setNotice({ message, kind: 'error' });
      if (/再接続|接続されていません/u.test(message)) setStatus({ connected: false });
    } finally {
      setBusy(null);
    }
  };

  const importSelected = async () => {
    if (!selected.size) {
      setNotice({ message: '登録する候補を1件以上選んでください。', kind: 'error' });
      return;
    }
    if (selected.size > 10) {
      setNotice({ message: '一度に登録できる候補は10件までです。', kind: 'error' });
      return;
    }
    setBusy('import');
    setNotice(null);
    try {
      const response = await fetch('/api/integrations/google/import', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ candidateIds: [...selected] }),
      });
      const data = await responseJson<{ subscriptions: Subscription[]; importedCount: number; matchedCount: number }>(response);
      onImported(data.subscriptions);
      setCandidates((current) => current.filter((candidate) => !selected.has(candidate.id)));
      setSelected(new Set());
      setNotice({
        message: `${data.importedCount}件を登録しました${data.matchedCount ? `（既存の${data.matchedCount}件は請求情報を更新）` : ''}。利用頻度と満足度も入力すると判断精度が上がります。`,
        kind: 'success',
      });
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : '候補を登録できませんでした', kind: 'error' });
    } finally {
      setBusy(null);
    }
  };

  const disconnect = async () => {
    if (!window.confirm('Gmailとの接続を解除しますか？すでに登録したサブスクは残ります。')) return;
    setBusy('disconnect');
    setNotice(null);
    try {
      const response = await fetch('/api/integrations/google/disconnect', { method: 'POST' });
      const result = await responseJson<{ providerRevoked: boolean }>(response);
      setStatus({ connected: false });
      setCandidates([]);
      setHasMore(false);
      setSelected(new Set());
      setNotice({
        message: result.providerRevoked
          ? 'Gmailとの接続を解除しました。登録済みのサブスクは残っています。'
          : 'Looply内の接続情報は削除しました。Google側の許可取消は確認できなかったため、Googleアカウントの接続設定もご確認ください。',
        kind: result.providerRevoked ? 'success' : 'error',
      });
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : '接続を解除できませんでした', kind: 'error' });
    } finally {
      setBusy(null);
    }
  };

  const toggle = (id: string) => {
    if (!selected.has(id) && selected.size >= 10) {
      setNotice({ message: '一度に選択できる候補は10件までです。', kind: 'error' });
      return;
    }
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <article className="connection-card gmail-connection-card">
      <div className="connection-icon google-icon" aria-hidden="true">G</div>
      <div className="gmail-card-heading">
        <h3>Gmailの請求メール</h3>
        <p>領収書から継続課金の候補だけを抽出します。メール本文は保存せず、選んだ候補だけ登録します。</p>
      </div>
      {status?.connected
        ? <span className="ready-chip"><i />接続済み</span>
        : <span className="pending-chip">{busy === 'status' ? '確認中' : '未接続'}</span>}

      {status?.connected ? (
        <div className="gmail-actions">
          <p className="gmail-account"><span>接続先</span><strong>{status.email}</strong>{status.lastSyncedAt && <small>最終確認 {new Date(status.lastSyncedAt).toLocaleString('ja-JP')}</small>}</p>
          <button type="button" onClick={scan} disabled={busy != null}>{busy === 'scan' ? '確認しています…' : hasMore ? '続きを探す' : '請求メールを探す'}</button>
          <button className="text-button" type="button" onClick={disconnect} disabled={busy != null}>{busy === 'disconnect' ? '解除しています…' : '接続を解除'}</button>
        </div>
      ) : (
        <div className="gmail-actions">
          <a className="connection-button" href="/api/integrations/google/connect" aria-disabled={busy === 'status'}>Googleに接続</a>
          <small>読み取り専用権限を使います。メールの変更・送信・削除はできません。現在のGoogleテスト公開では7日ごとに再接続が必要です。</small>
        </div>
      )}

      {notice && <p className={`gmail-notice ${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'}>{notice.message}</p>}

      {!!candidates.length && (
        <section className="gmail-candidates" aria-labelledby="gmail-candidates-title">
          <div className="gmail-candidates-head">
            <div><strong id="gmail-candidates-title">登録候補</strong><small>推定内容を確認して選択してください。自動登録はしません。</small></div>
            <span>{selected.size}/{candidates.length}件選択</span>
          </div>
          <div className="gmail-candidate-list">
            {candidates.map((candidate) => (
              <label className="gmail-candidate" key={candidate.id}>
                <input
                  type="checkbox"
                  checked={selected.has(candidate.id)}
                  disabled={!selected.has(candidate.id) && selected.size >= 10}
                  onChange={() => toggle(candidate.id)}
                />
                <span className="gmail-candidate-main">
                  <strong>{candidate.name}</strong>
                  <small>{candidate.merchant} · {candidate.evidenceCount}件のメールを確認{candidate.existingSubscriptionName ? ` · 既存「${candidate.existingSubscriptionName}」を更新` : ''}</small>
                </span>
                <span><strong>{formatYen(candidate.priceMinor)}</strong><small>{cycleLabels[candidate.billingCycle]}</small></span>
                <span><strong>{candidate.lastChargedOn}</strong><small>直近の請求日</small></span>
                <span className={`confidence confidence-${candidate.confidence >= 82 ? 'high' : 'medium'}`}>確度 {candidate.confidence}%</span>
              </label>
            ))}
          </div>
          <button className="gmail-import-button" type="button" onClick={importSelected} disabled={busy != null || !selected.size}>
            {busy === 'import' ? '登録しています…' : `選択した${selected.size}件を登録`}
          </button>
        </section>
      )}
    </article>
  );
}
