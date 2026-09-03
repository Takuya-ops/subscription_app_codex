'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import DecisionQuiz from '@/app/decision-quiz';
import PatternPlayground from '@/app/pattern-playground';
import { categories, categoryLabel, uiPatterns, type CategoryId, type PlatformScope } from '@/lib/ui-patterns';

type FilterCategory = 'all' | CategoryId;
type FilterPlatform = 'すべて' | PlatformScope;
type ScreenMode = 'library' | 'quiz';
type DemoState = '通常' | 'ホバー' | 'フォーカス' | '無効' | 'エラー' | '読込中' | '空' | '成功';

const demoStates: DemoState[] = ['通常', 'ホバー', 'フォーカス', '無効', 'エラー', '読込中', '空', '成功'];
const stateDescriptions: Record<DemoState, string> = {
  通常: '何ができるか、現在値は何かを迷わず理解できる基本状態。',
  ホバー: 'ポインターが重なったことを伝える補助状態。ホバーだけに機能を隠しません。',
  フォーカス: 'キーボード操作の現在位置。背景に埋もれない明確な輪郭が必要です。',
  無効: '操作できない状態。理由が必要なら近くに説明を置きます。',
  エラー: '何が問題で、どう直せばよいかを値を失わずに伝えます。',
  読込中: '処理中であることを知らせ、二重操作を防ぎます。',
  空: '初回データなしと検索0件を区別し、次の行動を示します。',
  成功: '結果を色だけでなく文字でも示し、本体の状態にも反映します。',
};

function normalize(value: string) {
  return value.normalize('NFKC').toLocaleLowerCase('ja').replace(/\s+/g, ' ').trim();
}

export default function UiAcademy() {
  const [screenMode, setScreenMode] = useState<ScreenMode>('library');
  const [selectedId, setSelectedId] = useState('switch');
  const [category, setCategory] = useState<FilterCategory>('all');
  const [platform, setPlatform] = useState<FilterPlatform>('すべて');
  const [query, setQuery] = useState('');
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [demoState, setDemoState] = useState<DemoState>('通常');
  const [showAllStates, setShowAllStates] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const detailRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const initialPattern = params.get('pattern');
      if (initialPattern && uiPatterns.some((pattern) => pattern.id === initialPattern)) setSelectedId(initialPattern);
      try {
        const saved = JSON.parse(window.localStorage.getItem('ui-atlas-progress') ?? '[]') as string[];
        setCompleted(new Set(saved.filter((id) => uiPatterns.some((pattern) => pattern.id === id))));
      } catch {
        window.localStorage.removeItem('ui-atlas-progress');
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setScreenMode('library');
        window.setTimeout(() => searchRef.current?.focus(), 0);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const visiblePatterns = useMemo(() => {
    const needle = normalize(query);
    return uiPatterns.filter((pattern) => {
      const categoryMatches = category === 'all' || pattern.category === category;
      const platformMatches = platform === 'すべて' || pattern.platform === '共通' || pattern.platform === platform;
      const haystack = normalize([
        pattern.name,
        pattern.english,
        pattern.summary,
        pattern.when,
        pattern.avoid,
        pattern.compare,
        pattern.a11y,
        ...pattern.examples,
      ].join(' '));
      return categoryMatches && platformMatches && (!needle || haystack.includes(needle));
    });
  }, [category, platform, query]);

  const selectedPattern = uiPatterns.find((pattern) => pattern.id === selectedId) ?? uiPatterns[0];
  const selectedIndex = visiblePatterns.findIndex((pattern) => pattern.id === selectedPattern.id);
  const progress = Math.round((completed.size / uiPatterns.length) * 100);

  const selectPattern = (id: string) => {
    setSelectedId(id);
    setDemoState('通常');
    setShowAllStates(false);
    const url = new URL(window.location.href);
    url.searchParams.set('pattern', id);
    window.history.replaceState({}, '', url);
    window.requestAnimationFrame(() => detailRef.current?.focus({ preventScroll: true }));
  };

  const saveCompleted = (next: Set<string>) => {
    setCompleted(next);
    window.localStorage.setItem('ui-atlas-progress', JSON.stringify([...next]));
  };

  const toggleCompleted = (id: string) => {
    const next = new Set(completed);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    saveCompleted(next);
  };

  const markLearnedFromQuiz = (id: string) => {
    if (!uiPatterns.some((pattern) => pattern.id === id)) return;
    const next = new Set(completed);
    next.add(id);
    saveCompleted(next);
  };

  const clearFilters = () => {
    setQuery('');
    setCategory('all');
    setPlatform('すべて');
    window.setTimeout(() => searchRef.current?.focus(), 0);
  };

  const moveSelection = (direction: -1 | 1) => {
    if (!visiblePatterns.length) return;
    const current = selectedIndex >= 0 ? selectedIndex : 0;
    const nextIndex = (current + direction + visiblePatterns.length) % visiblePatterns.length;
    selectPattern(visiblePatterns[nextIndex].id);
  };

  return (
    <main className="atlas-shell">
      <a className="skip-link" href="#atlas-main">本文へ移動</a>
      <header className="atlas-header">
        <button className="atlas-brand" onClick={() => { setScreenMode('library'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-label="UI Atlas ホーム">
          <span className="brand-glyph" aria-hidden="true"><i /><i /><i /></span>
          <span>UI Atlas<small>INTERACTION FIELD GUIDE</small></span>
        </button>
        <nav className="mode-switch" aria-label="学習モード">
          <button aria-current={screenMode === 'library' ? 'page' : undefined} onClick={() => setScreenMode('library')}>図鑑</button>
          <button aria-current={screenMode === 'quiz' ? 'page' : undefined} onClick={() => setScreenMode('quiz')}>判断クイズ <span>8</span></button>
        </nav>
        <div className="header-progress">
          <div><span>この端末の進捗</span><strong>{completed.size} / {uiPatterns.length}</strong></div>
          <progress max={uiPatterns.length} value={completed.size} aria-label={`学習進捗 ${progress}%`}>{progress}%</progress>
        </div>
      </header>

      {screenMode === 'quiz' ? (
        <DecisionQuiz onExit={() => setScreenMode('library')} onLearn={markLearnedFromQuiz} />
      ) : (
        <>
          <section className="atlas-intro" id="top">
            <div>
              <p className="kicker"><span /> WEB &amp; MOBILE UI LIBRARY</p>
              <h1>触ってわかる、<br /><em>UIの使い分け。</em></h1>
            </div>
            <div className="intro-side">
              <p>名前だけでなく「いつ使うか」「いつ避けるか」まで。実在アプリの例とライブデモで、UIパターンを身体で覚えます。</p>
              <dl><div><dt>{uiPatterns.length}</dt><dd>UI PATTERNS</dd></div><div><dt>{categories.length}</dt><dd>CATEGORIES</dd></div><div><dt>2</dt><dd>PLATFORMS</dd></div></dl>
            </div>
          </section>

          <section className="atlas-toolbar" aria-label="UIパターンを探す">
            <label className="search-box">
              <span aria-hidden="true">⌕</span>
              <span className="visually-hidden">UIを検索</span>
              <input ref={searchRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="UI名・用途・アプリ名で検索" />
              {query ? <button type="button" aria-label="検索語を消去" onClick={() => { setQuery(''); searchRef.current?.focus(); }}>×</button> : <kbd>⌘ K</kbd>}
            </label>
            <div className="platform-filter" aria-label="プラットフォーム">
              {(['すべて', 'Web', 'スマホ'] as FilterPlatform[]).map((item) => <button key={item} aria-pressed={platform === item} onClick={() => setPlatform(item)}>{item}</button>)}
            </div>
            <button className="quiz-launch" onClick={() => setScreenMode('quiz')}><span>?</span><strong>判断クイズ</strong><small>8問・約3分</small></button>
          </section>

          <nav className="category-strip" aria-label="UIカテゴリ">
            <button aria-pressed={category === 'all'} onClick={() => setCategory('all')}><strong>すべて</strong><span>{uiPatterns.length}</span></button>
            {categories.map((item, index) => {
              const count = uiPatterns.filter((pattern) => pattern.category === item.id).length;
              return <button key={item.id} aria-pressed={category === item.id} onClick={() => setCategory(item.id)}><small>{String(index + 1).padStart(2, '0')}</small><strong>{item.short}</strong><span>{count}</span></button>;
            })}
          </nav>

          <div className="atlas-workspace" id="atlas-main">
            <aside className="pattern-index" aria-label="UIパターン一覧">
              <div className="index-heading"><span>{visiblePatterns.length} PATTERNS</span><span>{category === 'all' ? 'ALL CATEGORIES' : categoryLabel(category)}</span></div>
              {visiblePatterns.length ? (
                <div className="pattern-list">
                  {visiblePatterns.map((pattern, index) => (
                    <button key={pattern.id} type="button" className={selectedPattern.id === pattern.id ? 'pattern-row active' : 'pattern-row'} aria-current={selectedPattern.id === pattern.id ? 'true' : undefined} onClick={() => selectPattern(pattern.id)}>
                      <span className="pattern-number">{String(index + 1).padStart(2, '0')}</span>
                      <span><strong>{pattern.name}</strong><small>{pattern.english}</small></span>
                      {completed.has(pattern.id) && <span className="learned-mark" aria-label="学習済み">✓</span>}
                      <span className={`platform-tag platform-${pattern.platform}`}>{pattern.platform}</span>
                      <span className="row-arrow" aria-hidden="true">↗</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="index-empty"><span>⌕</span><strong>一致するUIがありません</strong><p>検索語や絞り込みを変えてください。</p><button onClick={clearFilters}>条件をすべて解除</button></div>
              )}
            </aside>

            <article className="pattern-detail" tabIndex={-1} ref={detailRef} aria-labelledby="pattern-title">
              <div className="detail-topline">
                <span className="lesson-label">LESSON · {categoryLabel(selectedPattern.category)}</span>
                <div><span className={`lesson-platform platform-${selectedPattern.platform}`}>{selectedPattern.platform}</span><button className={completed.has(selectedPattern.id) ? 'learn-button learned' : 'learn-button'} aria-pressed={completed.has(selectedPattern.id)} onClick={() => toggleCompleted(selectedPattern.id)}>{completed.has(selectedPattern.id) ? '✓ 学習済み' : '○ 学習済みにする'}</button></div>
              </div>
              <h2 id="pattern-title">{selectedPattern.name}</h2>
              <p className="english-name">{selectedPattern.english}</p>
              <p className="detail-summary">{selectedPattern.summary}</p>

              <PatternPlayground key={selectedPattern.id} pattern={selectedPattern} />

              <div className="usage-grid">
                <section><span className="usage-icon good">✓</span><div><h3>使うとき</h3><p>{selectedPattern.when}</p></div></section>
                <section><span className="usage-icon caution">!</span><div><h3>避けるとき</h3><p>{selectedPattern.avoid}</p></div></section>
              </div>

              <section className="compare-card">
                <div><p className="section-caption">DON&apos;T CONFUSE</p><h3>似たUIとの見分け方</h3></div>
                <p>{selectedPattern.compare}</p>
              </section>

              <section className="example-section">
                <p className="section-caption">REAL WORLD EXAMPLES</p>
                <h3>実在アプリでは</h3>
                <div>{selectedPattern.examples.map((example, index) => <span key={example}><i>{String(index + 1).padStart(2, '0')}</i>{example}</span>)}</div>
                <small>画面はOS・プラン・更新時期により変わることがあります。用途を手がかりに観察しましょう。</small>
              </section>

              <section className="state-lab">
                <div className="section-heading-row"><div><p className="section-caption">STATE CHECK</p><h3>UIは「状態」までが設計</h3></div><button onClick={() => setShowAllStates(!showAllStates)}>{showAllStates ? '閉じる' : '全8状態を見る'}</button></div>
                <div className="state-tabs">{(showAllStates ? demoStates : demoStates.slice(0, 4)).map((state) => <button key={state} aria-pressed={demoState === state} onClick={() => setDemoState(state)}>{state}</button>)}</div>
                <div className={`state-preview state-${demoState}`}>
                  <button disabled={demoState === '無効'}>{demoState === '読込中' && <i />} {demoState === 'エラー' ? 'もう一度入力' : demoState === '空' ? '最初の項目を作成' : demoState === '成功' ? '✓ 保存済み' : 'サンプル操作'}</button>
                  <p>{stateDescriptions[demoState]}</p>
                </div>
              </section>

              <section className="a11y-note"><span aria-hidden="true">A11Y</span><div><h3>アクセシビリティの要点</h3><p>{selectedPattern.a11y}</p></div></section>

              <nav className="lesson-nav" aria-label="前後のUIパターン">
                <button onClick={() => moveSelection(-1)} disabled={!visiblePatterns.length}>← 前のUI</button>
                <span>{selectedIndex >= 0 ? selectedIndex + 1 : '—'} / {visiblePatterns.length}</span>
                <button onClick={() => moveSelection(1)} disabled={!visiblePatterns.length}>次のUI →</button>
              </nav>
            </article>
          </div>
          <footer className="atlas-footer"><strong>UI Atlas</strong><span>{uiPatterns.length} patterns across web &amp; mobile</span><button onClick={() => { setScreenMode('quiz'); window.scrollTo({ top: 0 }); }}>判断クイズで確かめる →</button></footer>
        </>
      )}
    </main>
  );
}
