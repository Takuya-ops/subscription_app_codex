'use client';

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import type { UiPattern } from '@/lib/ui-patterns';

function Surface({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`demo-surface ${className}`}>{children}</div>;
}

function MiniButton({ children, tone = 'primary', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'primary' | 'quiet' | 'danger' }) {
  return <button type="button" className={`mini-button ${tone}`} {...props}>{children}</button>;
}

const navItems = ['ホーム', '検索', '保存', '自分'];

export default function PatternPlayground({ pattern }: { pattern: UiPattern }) {
  const [enabled, setEnabled] = useState(true);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [count, setCount] = useState(1);
  const [value, setValue] = useState('');
  const [range, setRange] = useState(62);
  const [rating, setRating] = useState(3);
  const [selected, setSelected] = useState<string[]>(['デザイン']);
  const [status, setStatus] = useState('操作して変化を確認してください');
  const [fileName, setFileName] = useState('');
  const [order, setOrder] = useState(['リサーチ', 'ワイヤーフレーム', 'テスト']);
  const [dragging, setDragging] = useState(false);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const longPressTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  const cycleStatus = () => {
    const next = count + 1;
    setCount(next);
    setStatus(`${next}回実行しました`);
  };

  const toggleSelected = (item: string) => {
    setSelected((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item]);
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    setOrder((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setStatus('順番を変更しました');
  };

  const beginPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointerStart.current = { x: event.clientX, y: event.clientY };
    if (pattern.id === 'long-press') {
      longPressTimer.current = window.setTimeout(() => {
        setStatus('長押しを検知：追加メニューを開きました');
        setOpen(true);
      }, 650);
    }
  };

  const endPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (pattern.id.includes('swipe') || pattern.id === 'edge-swipe') {
      if (Math.abs(dx) > 45) setStatus(dx > 0 ? '右スワイプを検知しました' : '左スワイプを検知しました');
      else setStatus('もう少し横へ動かしてみてください');
    } else if (pattern.id === 'pan') {
      setStatus(`キャンバスを x:${Math.round(dx)} / y:${Math.round(dy)} 移動しました`);
    }
  };

  const renderAction = () => {
    if (pattern.id === 'link') return <Surface><p className="demo-copy">現在地：UI Atlas</p><button className="text-link" onClick={() => setStatus('用語集へ移動する想定です')}>用語集を見る <span>↗</span></button><p className="demo-result">{status}</p></Surface>;
    if (pattern.id === 'icon-button') return <Surface><button className={`heart-button ${enabled ? 'active' : ''}`} aria-pressed={enabled} aria-label={enabled ? '保存を解除' : '保存'} onClick={() => setEnabled(!enabled)}>♥</button><p className="demo-result">{enabled ? '保存済み' : '未保存'} — アイコンにも名前が必要です</p></Surface>;
    if (pattern.id === 'menu-button') return <Surface><div className="menu-anchor"><MiniButton tone="quiet" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>その他 •••</MiniButton>{open && <div className="mini-menu" role="menu"><button role="menuitem" onClick={() => { setStatus('複製しました'); setOpen(false); }}>複製</button><button role="menuitem" onClick={() => { setStatus('アーカイブしました'); setOpen(false); }}>アーカイブ</button><button role="menuitem" onClick={() => { setStatus('削除は確認が必要です'); setOpen(false); }}>削除…</button></div>}</div><p className="demo-result">{status}</p></Surface>;
    if (pattern.id === 'fab') return <Surface className="phone-demo"><div className="phone-content"><span>メモ {count - 1}件</span></div><button className="fab-button" aria-label="新しいメモを作成" onClick={cycleStatus}>＋</button><p className="demo-result">{status}</p></Surface>;
    if (pattern.id === 'toolbar') return <Surface><div className="mini-toolbar" role="toolbar" aria-label="文字の書式"><button aria-pressed={selected.includes('太字')} onClick={() => toggleSelected('太字')}><b>B</b></button><button aria-pressed={selected.includes('斜体')} onClick={() => toggleSelected('斜体')}><i>I</i></button><button aria-pressed={selected.includes('下線')} onClick={() => toggleSelected('下線')}><u>U</u></button></div><p className={`format-sample ${selected.includes('太字') ? 'is-bold' : ''} ${selected.includes('斜体') ? 'is-italic' : ''} ${selected.includes('下線') ? 'is-underline' : ''}`}>選択した書式が反映されます</p></Surface>;
    if (pattern.id === 'command-palette') return <Surface><div className="command-box"><label><span>⌘</span><input autoFocus={false} value={value} onChange={(event) => setValue(event.target.value)} placeholder="コマンドを検索" /></label>{['新しいページ', 'テーマを変更', '設定を開く'].filter((item) => item.includes(value)).map((item, index) => <button key={item} className={index === 0 ? 'active' : ''} onClick={() => setStatus(`${item}を実行しました`)}>{item}<kbd>↵</kbd></button>)}</div><p className="demo-result">{status}</p></Surface>;
    return <Surface><MiniButton onClick={cycleStatus}>{pattern.name}を実行</MiniButton><p className="demo-result" role="status">{status}</p></Surface>;
  };

  const renderInput = () => {
    if (pattern.id === 'number-stepper') return <Surface><div className="number-stepper"><button aria-label="人数を1人減らす" onClick={() => setCount(Math.max(1, count - 1))}>−</button><span><strong>{count}</strong><small>人</small></span><button aria-label="人数を1人増やす" onClick={() => setCount(Math.min(9, count + 1))}>＋</button></div><p className="demo-result">1〜9人の範囲で変更できます</p></Surface>;
    if (pattern.id === 'slider') return <Surface><label className="range-demo"><span>音量 <strong>{range}%</strong></span><input type="range" min="0" max="100" value={range} onChange={(event) => setRange(Number(event.target.value))} /></label><p className="demo-result">矢印キーでも1ずつ調整できます</p></Surface>;
    if (pattern.id === 'date-picker') return <Surface><label className="field-demo"><span>来店日</span><input type="date" value={value} onChange={(event) => setValue(event.target.value)} min="2026-09-04" /></label><p className="demo-result">{value ? `${value} を選択中` : '日付を選んでください'}</p></Surface>;
    if (pattern.id === 'file-uploader') return <Surface><label className="upload-zone"><input type="file" onChange={(event) => setFileName(event.target.files?.[0]?.name ?? '')} /><span>↑</span><strong>{fileName || 'ファイルを選択'}</strong><small>ボタンでもドラッグでも追加できます</small></label></Surface>;
    if (pattern.id === 'otp') return <Surface><label className="otp-demo"><span>6桁の確認コード</span><input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={value} onChange={(event) => setValue(event.target.value.replace(/\D/g, ''))} placeholder="000000" /></label><p className="demo-result">{value.length}/6桁 — 貼り付けも一度でできます</p></Surface>;
    if (pattern.id === 'password-field') return <Surface><label className="field-demo"><span>パスワード</span><div className="password-row"><input type={enabled ? 'password' : 'text'} value={value} onChange={(event) => setValue(event.target.value)} placeholder="8文字以上" /><button onClick={() => setEnabled(!enabled)} aria-label={enabled ? 'パスワードを表示' : 'パスワードを隠す'}>{enabled ? '表示' : '隠す'}</button></div></label><p className="demo-result">{value.length >= 8 ? '✓ 文字数を満たしています' : `あと${Math.max(0, 8 - value.length)}文字`}</p></Surface>;
    if (pattern.id === 'textarea') return <Surface><label className="field-demo"><span>コメント</span><textarea value={value} onChange={(event) => setValue(event.target.value)} placeholder="考えたことを書いてください" rows={3} /><small>{value.length}/120文字</small></label></Surface>;
    if (pattern.id === 'autocomplete' || pattern.id === 'search-field') return <Surface><label className="field-demo search-field-demo"><span>{pattern.id === 'search-field' ? 'UIを検索' : '目的地'}</span><input value={value} onChange={(event) => setValue(event.target.value)} placeholder={pattern.id === 'search-field' ? '例：トグル' : '例：東京'} /></label>{value && <div className="suggestion-list">{['東京都', '東京駅', '東京タワー'].filter((item) => item.includes(value)).map((item) => <button key={item} onClick={() => setValue(item)}>{item}<span>↗</span></button>)}</div>}<p className="demo-result">{value ? `「${value}」で絞り込み中` : '入力すると候補・結果が変わります'}</p></Surface>;
    if (pattern.id === 'rich-text') return <Surface><div className="mini-toolbar" role="toolbar" aria-label="文章の書式"><button aria-pressed={enabled} onClick={() => setEnabled(!enabled)}><b>B</b></button><button onClick={() => setValue(`${value} リンク`)}>🔗</button></div><label className="field-demo"><span>本文</span><textarea className={enabled ? 'is-bold' : ''} value={value} onChange={(event) => setValue(event.target.value)} placeholder="見出しやリンクを含む文書" rows={3} /></label></Surface>;
    return <Surface><label className="field-demo"><span>表示名</span><input value={value} onChange={(event) => setValue(event.target.value)} placeholder="例：佐藤 葵" aria-describedby="field-help" /><small id="field-help">プロフィールに表示される名前です</small></label><p className="demo-result">{value ? `プレビュー：${value}` : 'ラベルは入力中も消えません'}</p></Surface>;
  };

  const renderSelection = () => {
    if (pattern.id === 'switch') return <Surface><div className="setting-row"><span><strong>ダークモード</strong><small>{enabled ? 'オンになっています' : 'オフになっています'}</small></span><button className="switch-control" role="switch" aria-checked={enabled} onClick={() => setEnabled(!enabled)}><span /></button></div></Surface>;
    if (pattern.id === 'checkbox') return <Surface><fieldset className="choice-group"><legend>興味のある分野（複数可）</legend>{['デザイン', '開発', 'リサーチ'].map((item) => <label key={item}><input type="checkbox" checked={selected.includes(item)} onChange={() => toggleSelected(item)} /><span>{item}</span></label>)}</fieldset><p className="demo-result">選択：{selected.join('、') || 'なし'}</p></Surface>;
    if (pattern.id === 'radio') return <Surface><fieldset className="choice-group"><legend>配送方法（一つ選択）</legend>{['通常便', 'お急ぎ便', '日時指定'].map((item, index) => <label key={item}><input type="radio" name="shipping" checked={active === index} onChange={() => setActive(index)} /><span>{item}</span></label>)}</fieldset><p className="demo-result">選択：{['通常便', 'お急ぎ便', '日時指定'][active]}</p></Surface>;
    if (pattern.id === 'select' || pattern.id === 'combobox') return <Surface><label className="field-demo"><span>{pattern.id === 'select' ? '表示言語' : '担当者を検索して選択'}</span>{pattern.id === 'select' ? <select value={value} onChange={(event) => setValue(event.target.value)}><option value="">選択してください</option><option>日本語</option><option>English</option><option>Español</option></select> : <><input list="people" value={value} onChange={(event) => setValue(event.target.value)} placeholder="名前を入力" /><datalist id="people"><option value="佐藤 葵" /><option value="鈴木 海" /><option value="高橋 凛" /></datalist></>}</label><p className="demo-result">{value ? `${value}を選択中` : 'まだ選択されていません'}</p></Surface>;
    if (pattern.id === 'chip') return <Surface><div className="chip-demo">{['デザイン', 'Web', '初心者'].map((item) => <button key={item} aria-pressed={selected.includes(item)} onClick={() => toggleSelected(item)}>{selected.includes(item) && '✓ '}{item}</button>)}</div><p className="demo-result">選択中のチップ：{selected.join('、') || 'なし'}</p></Surface>;
    if (pattern.id === 'rating') return <Surface><fieldset className="rating-demo"><legend>このレッスンは役立ちましたか？</legend>{[1, 2, 3, 4, 5].map((item) => <button key={item} aria-label={`${item}つ星`} aria-pressed={rating === item} onClick={() => setRating(item)}>★</button>)}</fieldset><p className="demo-result">{rating} / 5</p></Surface>;
    return <Surface><div className="segmented-demo" aria-label="表示方法">{['リスト', 'グリッド', '地図'].map((item, index) => <button key={item} aria-pressed={active === index} onClick={() => setActive(index)}>{item}</button>)}</div><p className="demo-result">{['リスト', 'グリッド', '地図'][active]}表示</p></Surface>;
  };

  const renderNavigation = () => {
    if (pattern.id === 'breadcrumbs') return <Surface><nav className="breadcrumb-demo" aria-label="パンくず"><button onClick={() => setActive(0)}>プロジェクト</button><span>/</span><button onClick={() => setActive(1)}>デザイン</button><span>/</span><strong>画面設計</strong></nav><p className="demo-result">親階層へ直接戻れます</p></Surface>;
    if (pattern.id === 'pagination') return <Surface><nav className="pagination-demo" aria-label="ページ送り"><button disabled={active === 0} onClick={() => setActive(Math.max(0, active - 1))}>‹</button>{[0, 1, 2, 3].map((page) => <button key={page} aria-current={active === page ? 'page' : undefined} onClick={() => setActive(page)}>{page + 1}</button>)}<button disabled={active === 3} onClick={() => setActive(Math.min(3, active + 1))}>›</button></nav><p className="demo-result">{active + 1}ページ目</p></Surface>;
    if (pattern.id === 'step-indicator') return <Surface><ol className="stepper-demo">{['情報入力', '確認', '完了'].map((item, index) => <li key={item} className={index < active ? 'done' : index === active ? 'current' : ''}><span>{index < active ? '✓' : index + 1}</span>{item}</li>)}</ol><div className="demo-actions"><MiniButton tone="quiet" disabled={active === 0} onClick={() => setActive(active - 1)}>戻る</MiniButton><MiniButton disabled={active === 2} onClick={() => setActive(active + 1)}>次へ</MiniButton></div></Surface>;
    if (pattern.id === 'tree-nav') return <Surface><div className="tree-demo"><button aria-expanded={open} onClick={() => setOpen(!open)}>{open ? '▾' : '▸'} src</button>{open && <div><button onClick={() => setStatus('componentsを選択')}>▸ components</button><button onClick={() => setStatus('appを選択')}>▸ app</button><button onClick={() => setStatus('index.tsを選択')}>◇ index.ts</button></div>}</div><p className="demo-result">{status}</p></Surface>;
    if (pattern.id === 'nav-drawer') return <Surface className="phone-demo"><MiniButton tone="quiet" aria-expanded={open} onClick={() => setOpen(!open)}>☰ メニュー</MiniButton>{open && <div className="drawer-demo"><button onClick={() => setActive(0)}>受信トレイ</button><button onClick={() => setActive(1)}>スター付き</button><button onClick={() => setActive(2)}>設定</button></div>}<p className="demo-result">低頻度の移動先を収納します</p></Surface>;
    if (pattern.id === 'back-up') return <Surface><div className="demo-actions"><MiniButton tone="quiet" onClick={() => setStatus('履歴上の前画面へ戻りました')}>← Back</MiniButton><MiniButton tone="quiet" onClick={() => setStatus('親フォルダへ移動しました')}>↑ Up</MiniButton></div><p className="demo-result">{status}</p></Surface>;
    if (pattern.id === 'inpage-nav') return <Surface><nav className="toc-demo"><span>このページ</span>{['概要', '使い方', '注意点'].map((item, index) => <button key={item} aria-current={active === index ? 'location' : undefined} onClick={() => setActive(index)}>{item}</button>)}</nav><p className="demo-result">「{['概要', '使い方', '注意点'][active]}」へ移動</p></Surface>;
    const items = pattern.id === 'tabs' ? ['概要', '状態', '実装'] : navItems;
    return <Surface className={pattern.id === 'bottom-nav' ? 'phone-demo' : ''}><nav className={`generic-nav-demo ${pattern.id}`} aria-label={`${pattern.name}の例`}>{items.map((item, index) => <button key={item} aria-current={active === index ? 'page' : undefined} onClick={() => setActive(index)}><span>{['⌂', '⌕', '♡', '○'][index] ?? '•'}</span>{item}</button>)}</nav><p className="demo-result">現在地：{items[active] ?? items[0]}</p></Surface>;
  };

  const renderFeedback = () => {
    if (pattern.id === 'inline-validation') return <Surface><label className={`field-demo ${value && !value.includes('@') ? 'has-error' : ''}`}><span>メールアドレス</span><input value={value} onChange={(event) => setValue(event.target.value)} placeholder="name@example.com" aria-invalid={Boolean(value && !value.includes('@'))} />{value && !value.includes('@') && <small role="alert">@を含む形式で入力してください</small>}</label></Surface>;
    if (pattern.id === 'alert-banner') return <Surface>{enabled ? <div className="banner-demo" role="status"><span>!</span><p><strong>メンテナンス予定</strong> 9月8日 2:00〜3:00は編集できません。</p><button aria-label="お知らせを閉じる" onClick={() => setEnabled(false)}>×</button></div> : <MiniButton tone="quiet" onClick={() => setEnabled(true)}>バナーを再表示</MiniButton>}</Surface>;
    if (pattern.id === 'toast') return <Surface><MiniButton onClick={() => { setOpen(true); window.setTimeout(() => setOpen(false), 2600); }}>アーカイブ</MiniButton>{open && <div className="toast-demo" role="status"><span>✓</span>アーカイブしました <button onClick={() => { setOpen(false); setStatus('元に戻しました'); }}>元に戻す</button></div>}<p className="demo-result">{status}</p></Surface>;
    if (pattern.id === 'spinner') return <Surface><MiniButton onClick={() => { setOpen(true); window.setTimeout(() => setOpen(false), 1600); }} disabled={open}>{open ? <><span className="spinner-dot" /> 読み込み中</> : 'データを読み込む'}</MiniButton><p className="demo-result" aria-live="polite">{open ? '処理しています…' : '待機中'}</p></Surface>;
    if (pattern.id === 'progress-bar') return <Surface><label className="progress-demo"><span>アップロード <strong>{range}%</strong></span><progress max="100" value={range}>{range}%</progress></label><div className="demo-actions"><MiniButton tone="quiet" onClick={() => setRange(Math.max(0, range - 10))}>−10</MiniButton><MiniButton onClick={() => setRange(Math.min(100, range + 10))}>＋10</MiniButton></div></Surface>;
    if (pattern.id === 'skeleton') return <Surface>{enabled ? <div className="skeleton-demo" aria-label="読み込み中"><span /><div><i /><i /><i /></div></div> : <div className="loaded-demo"><span>UA</span><div><strong>UI Atlas</strong><small>コンテンツを読み込みました</small></div></div>}<MiniButton tone="quiet" onClick={() => setEnabled(!enabled)}>{enabled ? '読み込みを完了' : 'もう一度見る'}</MiniButton></Surface>;
    if (pattern.id === 'badge') return <Surface><button className="inbox-demo" onClick={() => setCount(0)}>受信トレイ {count > 0 && <span aria-label={`${count}件の未読`}>{count > 99 ? '99+' : count}</span>}</button><div className="demo-actions"><MiniButton tone="quiet" onClick={() => setCount(count + 1)}>未読を追加</MiniButton><MiniButton tone="quiet" onClick={() => setCount(0)}>既読にする</MiniButton></div></Surface>;
    if (pattern.id === 'empty-state') return <Surface>{count === 1 ? <div className="empty-demo"><span>◇</span><strong>まだプロジェクトがありません</strong><p>最初のプロジェクトを作ると、ここに表示されます。</p><MiniButton onClick={() => setCount(2)}>作成する</MiniButton></div> : <div className="loaded-demo"><span>01</span><div><strong>はじめてのプロジェクト</strong><small>たった今作成</small></div></div>}</Surface>;
    if (pattern.id === 'save-status') return <Surface><textarea className="save-area" value={value} onChange={(event) => { setValue(event.target.value); setStatus('保存中…'); window.setTimeout(() => setStatus('すべての変更を保存しました'), 700); }} placeholder="入力すると保存状態が変わります" /><p className="sync-status" role="status"><i className={status.includes('保存しました') ? 'saved' : ''} />{status}</p></Surface>;
    return <Surface>{enabled ? <div className="error-demo" role="alert"><span>!</span><div><strong>データを読み込めませんでした</strong><p>接続を確認して再試行してください。</p><MiniButton onClick={() => { setEnabled(false); setStatus('再試行に成功しました'); }}>再試行</MiniButton></div></div> : <div className="success-demo">✓ {status}</div>}</Surface>;
  };

  const renderOverlay = () => {
    if (pattern.id === 'accordion' || pattern.id === 'disclosure') return <Surface><div className="accordion-demo"><button aria-expanded={open} onClick={() => setOpen(!open)}>{pattern.id === 'accordion' ? '配送には何日かかりますか？' : '詳細設定'}<span>{open ? '−' : '+'}</span></button>{open && <div>{pattern.id === 'accordion' ? '通常は2〜3営業日で発送します。発送後に追跡リンクをお送りします。' : '高度な設定は必要な人だけが変更できます。'}</div>}</div></Surface>;
    if (pattern.id === 'tooltip') return <Surface><div className="tooltip-anchor"><button aria-describedby="tooltip-copy">?</button><span role="tooltip" id="tooltip-copy">ショートカット：⌘ K</span></div><p className="demo-result">ボタンへホバーまたはフォーカス</p></Surface>;
    if (pattern.id === 'popover' || pattern.id === 'context-menu') return <Surface><div className="menu-anchor">{pattern.id === 'context-menu' ? <div className="context-target" onContextMenu={(event) => { event.preventDefault(); setOpen(true); }}>右クリック、または下のボタン</div> : <MiniButton tone="quiet" aria-expanded={open} onClick={() => setOpen(!open)}>文字色を選ぶ</MiniButton>} {pattern.id === 'context-menu' && <MiniButton tone="quiet" onClick={() => setOpen(true)}>メニューを開く</MiniButton>}{open && <div className="popover-demo"><strong>{pattern.id === 'context-menu' ? 'メッセージ操作' : '文字色'}</strong><button onClick={() => setStatus('青を選択')}>● 青</button><button onClick={() => setStatus('緑を選択')}>● 緑</button><button onClick={() => setOpen(false)}>閉じる</button></div>}</div><p className="demo-result">{status}</p></Surface>;
    if (pattern.id === 'bottom-sheet' || pattern.id === 'side-sheet') return <Surface className="phone-demo"><MiniButton onClick={() => setOpen(true)}>詳細を開く</MiniButton>{open && <div className={`sheet-demo ${pattern.id}`} role="dialog" aria-label="場所の詳細"><span className="sheet-handle" /><button className="sheet-close" aria-label="閉じる" onClick={() => setOpen(false)}>×</button><strong>東京駅</strong><p>現在地から12分・営業中</p><MiniButton>経路を見る</MiniButton></div>}</Surface>;
    if (pattern.id === 'lightbox') return <Surface><button className="image-placeholder" onClick={() => setOpen(true)}><span>▧</span>画像を拡大</button>{open && <div className="lightbox-demo" role="dialog" aria-modal="true" aria-label="画像ビューア"><button aria-label="閉じる" onClick={() => setOpen(false)}>×</button><div><span>サンプル画像</span><small>{active + 1} / 3</small></div><button aria-label="前の画像" onClick={() => setActive((active + 2) % 3)}>‹</button><button aria-label="次の画像" onClick={() => setActive((active + 1) % 3)}>›</button></div>}</Surface>;
    if (pattern.id === 'coachmark') return <Surface><div className="coach-target">新しい分析</div>{enabled && <div className="coachmark-demo"><small>1 / 2</small><strong>新しい分析機能</strong><p>ここから比較レポートを作れます。</p><div><button onClick={() => setEnabled(false)}>スキップ</button><MiniButton onClick={() => setEnabled(false)}>次へ</MiniButton></div></div>}{!enabled && <MiniButton tone="quiet" onClick={() => setEnabled(true)}>ガイドを再表示</MiniButton>}</Surface>;
    const isAlert = pattern.id === 'alert-dialog';
    return <Surface><MiniButton tone={isAlert ? 'danger' : 'primary'} onClick={() => setOpen(true)}>{isAlert ? 'データを削除' : '共有設定を開く'}</MiniButton>{open && <div className="modal-scrim"><div className="modal-demo" role={isAlert ? 'alertdialog' : 'dialog'} aria-modal="true" aria-labelledby="demo-dialog-title"><h3 id="demo-dialog-title">{isAlert ? '本当に削除しますか？' : 'プロジェクトを共有'}</h3><p>{isAlert ? 'この操作は取り消せません。' : 'リンクを知っているメンバーが閲覧できます。'}</p><div><MiniButton tone="quiet" onClick={() => setOpen(false)}>キャンセル</MiniButton><MiniButton tone={isAlert ? 'danger' : 'primary'} onClick={() => { setOpen(false); setStatus(isAlert ? '削除しました' : '共有設定を保存しました'); }}>{isAlert ? '削除する' : '完了'}</MiniButton></div></div></div>}<p className="demo-result">{status}</p></Surface>;
  };

  const renderData = () => {
    if (pattern.id === 'table' || pattern.id === 'data-grid') return <Surface><div className="table-wrap"><table className="table-demo"><thead><tr><th><button onClick={() => setEnabled(!enabled)}>名前 {enabled ? '↑' : '↓'}</button></th><th>状態</th><th>担当</th></tr></thead><tbody>{(enabled ? order : [...order].reverse()).map((item, index) => <tr key={item}><td>{pattern.id === 'data-grid' && index === active ? <input value={item} onChange={(event) => setOrder((current) => current.map((value, itemIndex) => itemIndex === index ? event.target.value : value))} /> : <button onClick={() => setActive(index)}>{item}</button>}</td><td><span className="status-pill">進行中</span></td><td>{['葵', '海', '凛'][index]}</td></tr>)}</tbody></table></div><p className="demo-result">見出しで並べ替え、{pattern.id === 'data-grid' ? '名前を押してセル編集' : '行を選択'}できます</p></Surface>;
    if (pattern.id === 'kanban') return <Surface><div className="kanban-demo">{['To do', 'Doing', 'Done'].map((column, index) => <section key={column}><strong>{column}</strong>{active === index && <article>UIを調べる<button onClick={() => setActive(Math.min(2, index + 1))}>次へ →</button></article>}</section>)}</div><p className="demo-result">ドラッグの代わりに「次へ」でも移動できます</p></Surface>;
    if (pattern.id === 'chart') return <Surface><div className="chart-demo" role="img" aria-label="月別利用者数。4月42、5月66、6月55、7月82"><span style={{ height: '42%' }}><i>42</i></span><span style={{ height: '66%' }}><i>66</i></span><span style={{ height: '55%' }}><i>55</i></span><span className={enabled ? 'active' : ''} style={{ height: '82%' }}><i>82</i></span></div><MiniButton tone="quiet" onClick={() => setEnabled(!enabled)}>7月を{enabled ? '非表示' : '表示'}</MiniButton></Surface>;
    if (pattern.id === 'metric') return <Surface><div className="metric-demo"><small>{enabled ? '今月' : '先月'}の完了率</small><strong>{enabled ? '84' : '71'}<span>%</span></strong><p>↗ 前月比 {enabled ? '+13' : '+6'}pt</p></div><div className="segmented-demo"><button aria-pressed={enabled} onClick={() => setEnabled(true)}>今月</button><button aria-pressed={!enabled} onClick={() => setEnabled(false)}>先月</button></div></Surface>;
    if (pattern.id === 'calendar') return <Surface><div className="calendar-demo"><header><button onClick={() => setCount(count - 1)}>‹</button><strong>2026年9月</strong><button onClick={() => setCount(count + 1)}>›</button></header><div>{['月','火','水','木','金','土','日'].map((day) => <small key={day}>{day}</small>)}{Array.from({ length: 14 }, (_, index) => <button key={index} aria-pressed={active === index} onClick={() => setActive(index)}>{index + 1}</button>)}</div></div><p className="demo-result">9月{active + 1}日を選択中</p></Surface>;
    if (pattern.id === 'carousel') return <Surface><div className="carousel-demo"><button aria-label="前へ" onClick={() => setActive((active + 2) % 3)}>‹</button><article><small>FEATURE {active + 1}</small><strong>{['基本コンポーネント', 'モバイル設計', 'アクセシビリティ'][active]}</strong></article><button aria-label="次へ" onClick={() => setActive((active + 1) % 3)}>›</button></div><div className="carousel-dots">{[0,1,2].map((item) => <button key={item} aria-label={`${item + 1}枚目`} aria-current={active === item} onClick={() => setActive(item)} />)}</div></Surface>;
    if (pattern.id === 'map') return <Surface><div className="map-demo"><div className="map-grid" /><span style={{ transform: `translate(${(active % 3 - 1) * 18}px, ${Math.floor(active / 3 - 1) * 18}px)` }}>●</span><div className="map-controls"><button aria-label="上へ" onClick={() => setActive(Math.max(0, active - 3))}>↑</button><button aria-label="左へ" onClick={() => setActive(Math.max(0, active - 1))}>←</button><button aria-label="右へ" onClick={() => setActive(Math.min(8, active + 1))}>→</button><button aria-label="下へ" onClick={() => setActive(Math.min(8, active + 3))}>↓</button></div></div><p className="demo-result">ボタンはパン操作の代替になります</p></Surface>;
    if (pattern.id === 'tag') return <Surface><div className="tag-demo"><span>デザイン</span><span>優先度：高</span><span>進行中</span></div><p className="demo-result">表示専用なので、押せる見た目にしません</p></Surface>;
    if (pattern.id === 'tree-view') return <Surface><div className="tree-demo"><button aria-expanded={open} onClick={() => setOpen(!open)}>{open ? '▾' : '▸'} デザインシステム</button>{open && <div><button>◇ Colors</button><button>◇ Typography</button><button>▸ Components</button></div>}</div></Surface>;
    const itemNames = pattern.id === 'timeline' ? ['14:20 仕様を更新', '11:05 コメントを追加', '昨日 レビュー完了'] : ['UIの基礎', 'フォーム設計', 'モバイル設計'];
    return <Surface><div className={`data-list-demo ${pattern.id}`}>{itemNames.map((item, index) => <button key={item} aria-pressed={active === index} onClick={() => setActive(index)}><span>{pattern.id === 'card' ? '▧' : String(index + 1).padStart(2, '0')}</span><div><strong>{item}</strong><small>{pattern.id === 'timeline' ? 'プロジェクトの活動' : 'クリックして選択'}</small></div></button>)}</div><p className="demo-result">選択：{itemNames[active]}</p></Surface>;
  };

  const renderLayout = () => {
    if (pattern.id === 'split-view') return <Surface><div className="split-demo" style={{ gridTemplateColumns: `${range}% ${100 - range}%` }}><section>編集</section><section>プレビュー</section></div><label className="range-demo compact"><span>境界位置 {range}%</span><input type="range" min="25" max="75" value={range} onChange={(event) => setRange(Number(event.target.value))} /></label></Surface>;
    if (pattern.id === 'master-detail') return <Surface><div className="master-detail-demo"><nav>{['佐藤さん', '鈴木さん', '高橋さん'].map((item, index) => <button key={item} aria-current={active === index} onClick={() => setActive(index)}>{item}</button>)}</nav><section><strong>{['佐藤さん', '鈴木さん', '高橋さん'][active]}</strong><p>選択した項目の詳細を、一覧を残したまま確認できます。</p></section></div></Surface>;
    if (pattern.id === 'responsive-grid' || pattern.id === 'masonry') return <Surface><div className="segmented-demo"><button aria-pressed={enabled} onClick={() => setEnabled(true)}>広い画面</button><button aria-pressed={!enabled} onClick={() => setEnabled(false)}>狭い画面</button></div><div className={`responsive-grid-demo ${enabled ? 'wide' : 'narrow'} ${pattern.id}`}>{[1,2,3,4,5,6].map((item) => <span key={item} style={pattern.id === 'masonry' ? { minHeight: `${42 + (item % 3) * 22}px` } : undefined}>{item}</span>)}</div></Surface>;
    if (pattern.id === 'scroll-container' || pattern.id === 'sticky') return <Surface><div className="scroll-demo"><header>{pattern.id === 'sticky' ? '固定された見出し' : '会話履歴'}</header>{Array.from({ length: 7 }, (_, index) => <p key={index}>項目 {index + 1} — 内部だけをスクロール</p>)}</div><p className="demo-result">スクロール領域へフォーカスして操作できます</p></Surface>;
    return <Surface><div className="app-shell-demo"><header>ヘッダー</header><nav>ナビ</nav><main>主な作業領域</main></div><p className="demo-result">共通の骨格を保ちながら内容だけを切り替えます</p></Surface>;
  };

  const renderMobile = () => {
    if (pattern.id === 'keyboard-avoidance') return <Surface><div className="mobile-frame"><div className="mobile-content">メッセージ<br />入力中も送信欄を見せます</div>{open && <div className="soft-keyboard">Q W E R T Y<br />A S D F G</div>}<label><input value={value} onFocus={() => setOpen(true)} onChange={(event) => setValue(event.target.value)} placeholder="メッセージ" /><button onClick={() => setStatus('送信しました')}>送信</button></label></div><p className="demo-result">{status}</p></Surface>;
    if (pattern.id === 'permission-prompt') return <Surface><div className="permission-demo"><span>⌖</span><strong>近くの場所を表示</strong><p>現在地は周辺スポットを探すためだけに使います。</p><div><MiniButton tone="quiet" onClick={() => setStatus('今回は許可しませんでした')}>後で</MiniButton><MiniButton onClick={() => setStatus('OSの権限画面を開きます')}>位置情報を許可</MiniButton></div></div><p className="demo-result">{status}</p></Surface>;
    if (pattern.id === 'share-sheet') return <Surface><MiniButton onClick={() => setOpen(true)}>共有…</MiniButton>{open && <div className="share-sheet-demo"><strong>“UI Atlas”を共有</strong><div>{['コピー', 'メッセージ', 'メール'].map((item) => <button key={item} onClick={() => { setStatus(`${item}を選択`); setOpen(false); }}><span>{item.slice(0,1)}</span>{item}</button>)}</div><button onClick={() => setOpen(false)}>キャンセル</button></div>}<p className="demo-result">{status}</p></Surface>;
    if (pattern.id === 'biometric') return <Surface><div className="biometric-demo"><span>{enabled ? '◎' : '✓'}</span><strong>{enabled ? 'Face IDでロック解除' : '認証しました'}</strong><MiniButton onClick={() => { setEnabled(false); setStatus('成功。失敗時は端末PINへ戻します'); }}>認証を試す</MiniButton></div><p className="demo-result">{status}</p></Surface>;
    if (pattern.id === 'haptics') return <Surface><MiniButton onClick={() => { navigator.vibrate?.(35); setStatus('短い触覚フィードバックを送信しました'); }}>触覚を試す</MiniButton><p className="demo-result">{status}（対応端末のみ）</p></Surface>;
    if (pattern.id === 'notification-deeplink') return <Surface><button className="notification-demo" onClick={() => setStatus('該当する「UIレビュー」画面を開きました')}><span>UA</span><div><strong>レビューの時間です</strong><p>「UIレビュー」が10分後に始まります</p></div><small>今</small></button><p className="demo-result">{status}</p></Surface>;
    if (pattern.id === 'offline-sync') return <Surface><div className="offline-demo"><button aria-pressed={!enabled} onClick={() => setEnabled(!enabled)}>{enabled ? '● オンライン' : '○ オフライン'}</button><textarea value={value} onChange={(event) => { setValue(event.target.value); setStatus(enabled ? '同期しました' : '端末に保存しました。再接続後に同期します'); }} placeholder="接続状態を切り替えて入力" /></div><p className="demo-result">{status}</p></Surface>;
    return <Surface><div className={`mobile-frame ${pattern.id}`}><div className="safe-top">9:41</div><div className="reach-zone"><span>{pattern.id === 'safe-area' ? 'セーフエリア内に配置' : '親指が届きやすい領域'}</span><MiniButton onClick={cycleStatus}>主要操作</MiniButton></div><div className="home-indicator" /></div><p className="demo-result">{status}</p></Surface>;
  };

  const renderGesture = () => {
    if (pattern.id === 'drag-drop') return <Surface><div className="drop-demo"><button draggable onDragStart={() => setDragging(true)} onDragEnd={() => setDragging(false)}>カードA</button><div className={dragging ? 'ready' : ''} onDragOver={(event) => event.preventDefault()} onDrop={() => { setDragging(false); setStatus('Doneへ移動しました'); }}>ここへドロップ</div></div><MiniButton tone="quiet" onClick={() => setStatus('移動先メニューからDoneを選択しました')}>ボタンで移動</MiniButton><p className="demo-result">{status}</p></Surface>;
    if (pattern.id === 'reorder') return <Surface><ol className="reorder-demo">{order.map((item, index) => <li key={item}><span>⠿</span><strong>{item}</strong><button disabled={index === 0} aria-label={`${item}を上へ`} onClick={() => moveItem(index, -1)}>↑</button><button disabled={index === order.length - 1} aria-label={`${item}を下へ`} onClick={() => moveItem(index, 1)}>↓</button></li>)}</ol><p className="demo-result">{status}</p></Surface>;
    if (pattern.id === 'pinch' || pattern.id === 'scrub') return <Surface><div className={`zoom-object ${pattern.id}`} style={{ transform: pattern.id === 'pinch' ? `scale(${range / 62})` : undefined }}>{pattern.id === 'pinch' ? 'UI' : `${Math.floor(range * 2.4)}秒`}</div><label className="range-demo compact"><span>{pattern.id === 'pinch' ? `ズーム ${Math.round(range / 0.62)}%` : '再生位置'}</span><input type="range" min="30" max="100" value={range} onChange={(event) => setRange(Number(event.target.value))} /></label></Surface>;
    if (pattern.id === 'pull-refresh') return <Surface><div className="refresh-demo"><span className={open ? 'spinning' : ''}>↻</span><strong>{open ? '更新中…' : '最新のフィード'}</strong><MiniButton tone="quiet" onClick={() => { setOpen(true); setTimeout(() => { setOpen(false); setStatus('たった今更新しました'); }, 900); }}>下へ引く代わりに更新</MiniButton></div><p className="demo-result">{status}</p></Surface>;
    const instruction = pattern.id === 'double-tap' ? 'ここをダブルタップ' : pattern.id === 'long-press' ? 'ここを長押し' : pattern.id === 'pan' ? 'ここをドラッグして移動' : pattern.id.includes('swipe') || pattern.id === 'edge-swipe' ? 'ここを横へスワイプ' : 'ここをタップ';
    return <Surface><div className={`gesture-pad ${pattern.id}`} onClick={() => pattern.id === 'tap' && setStatus('タップを検知しました')} onDoubleClick={() => pattern.id === 'double-tap' && setStatus('ダブルタップを検知しました')} onPointerDown={beginPointer} onPointerUp={endPointer} onPointerCancel={endPointer}><span>{pattern.id.includes('swipe') || pattern.id === 'edge-swipe' ? '↔' : pattern.id === 'pan' ? '✣' : '◎'}</span><strong>{instruction}</strong><small>マウスでも試せます</small></div>{open && pattern.id === 'long-press' && <div className="mini-menu inline"><button onClick={() => setOpen(false)}>プレビュー</button><button onClick={() => setOpen(false)}>その他</button></div>}<div className="demo-actions"><MiniButton tone="quiet" onClick={() => setStatus(`${pattern.name}の代替ボタンを実行しました`)}>代替ボタン</MiniButton></div><p className="demo-result" role="status">{status}</p></Surface>;
  };

  const renderDemo = () => {
    switch (pattern.category) {
      case 'actions': return renderAction();
      case 'input': return renderInput();
      case 'selection': return renderSelection();
      case 'navigation': return renderNavigation();
      case 'feedback': return renderFeedback();
      case 'overlay': return renderOverlay();
      case 'data': return renderData();
      case 'layout': return renderLayout();
      case 'mobile': return renderMobile();
      case 'gesture': return renderGesture();
    }
  };

  return (
    <div className="live-lab">
      <div className="lab-header">
        <span><i /> LIVE PLAYGROUND</span>
        <small>操作すると状態が変わります</small>
      </div>
      <div className="demo-stage">{renderDemo()}</div>
    </div>
  );
}

