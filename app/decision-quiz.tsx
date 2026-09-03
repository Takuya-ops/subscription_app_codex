'use client';

import { useState } from 'react';

type QuizQuestion = {
  situation: string;
  detail: string;
  choices: Array<{ id: string; label: string }>;
  answer: string;
  explanation: string;
};

const questions: QuizQuestion[] = [
  { situation: 'Wi‑Fiを今すぐオン／オフしたい', detail: '変更は選んだ瞬間に反映され、現在の状態も常に見せます。', choices: [{ id: 'checkbox', label: 'チェックボックス' }, { id: 'switch', label: 'スイッチ' }, { id: 'button', label: 'ボタン' }], answer: 'switch', explanation: '即時反映する二値設定なのでスイッチ。チェックボックスはフォーム上の選択に向きます。' },
  { situation: '配送方法を3つから一つ選びたい', detail: '候補を見比べて選び、最後に注文ボタンで確定します。', choices: [{ id: 'radio', label: 'ラジオボタン' }, { id: 'switch', label: 'スイッチ' }, { id: 'tooltip', label: 'ツールチップ' }], answer: 'radio', explanation: '少数の排他的な候補を同時に比較するため、ラジオボタンが適します。' },
  { situation: 'アーカイブ完了と「元に戻す」を伝えたい', detail: '作業は止めず、数秒後に通知が消えても問題ありません。', choices: [{ id: 'modal', label: 'モーダル' }, { id: 'toast', label: 'トースト' }, { id: 'alert-banner', label: 'バナー' }], answer: 'toast', explanation: '軽い操作結果と一つのUndoにはトースト。重大な判断を求めないのでモーダルは不要です。' },
  { situation: 'スマホの主要4画面を頻繁に切り替えたい', detail: 'ホーム、検索、保存、自分のページはすべて同じ階層です。', choices: [{ id: 'nav-drawer', label: 'ナビゲーションドロワー' }, { id: 'bottom-nav', label: 'ボトムナビゲーション' }, { id: 'breadcrumbs', label: 'パンくず' }], answer: 'bottom-nav', explanation: 'スマホの主要3〜5領域は、親指で届くボトムナビゲーションが適します。' },
  { situation: '500人から担当者を一人選びたい', detail: '名前の一部は分かっています。候補外の人は選べません。', choices: [{ id: 'select', label: 'セレクト' }, { id: 'combobox', label: 'コンボボックス' }, { id: 'textarea', label: 'テキストエリア' }], answer: 'combobox', explanation: '大量の固定候補を入力で絞るため、検索可能なコンボボックスが適します。' },
  { situation: '請求データの金額・日付・状態を比較したい', detail: '各項目は同じ列を持ち、正確な比較が重要です。', choices: [{ id: 'card', label: 'カード' }, { id: 'carousel', label: 'カルーセル' }, { id: 'table', label: 'テーブル' }], answer: 'table', explanation: '同じ列を持つ多数のレコード比較にはテーブル。カードは視覚的な概要向けです。' },
  { situation: '画像カードを別の列へ移動したい', detail: 'ドラッグが苦手な人やキーボード利用者も同じ操作を行います。', choices: [{ id: 'drag-drop', label: 'ドラッグ＋移動メニュー' }, { id: 'drag-drop-only', label: 'ドラッグだけ' }, { id: 'double-tap', label: 'ダブルタップだけ' }], answer: 'drag-drop', explanation: '直接操作は便利ですが、移動先を選ぶボタンなど同じ結果になる代替が必要です。' },
  { situation: '長いFAQを見出しごとに整理したい', detail: '必要な質問だけ開ければよく、複数の同種セクションがあります。', choices: [{ id: 'accordion', label: 'アコーディオン' }, { id: 'tabs', label: 'タブ' }, { id: 'progress-bar', label: '進捗バー' }], answer: 'accordion', explanation: '同種の見出しと内容を縦に開閉する集合なので、アコーディオンが適します。' },
];

export default function DecisionQuiz({ onExit, onLearn }: { onExit: () => void; onLearn: (patternId: string) => void }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const question = questions[index];
  const correct = selected === question.answer;

  const checkAnswer = () => {
    if (!selected || checked) return;
    setChecked(true);
    if (selected === question.answer) {
      setScore((current) => current + 1);
      onLearn(question.answer);
    }
  };

  const next = () => {
    if (index === questions.length - 1) {
      setFinished(true);
      return;
    }
    setIndex((current) => current + 1);
    setSelected(null);
    setChecked(false);
  };

  const restart = () => {
    setIndex(0);
    setSelected(null);
    setChecked(false);
    setScore(0);
    setFinished(false);
  };

  if (finished) {
    const percent = Math.round((score / questions.length) * 100);
    return (
      <section className="quiz-shell quiz-finish" aria-labelledby="quiz-result-title">
        <p className="kicker"><span /> DECISION QUIZ · RESULT</p>
        <div className="score-ring" style={{ '--score': `${percent * 3.6}deg` } as React.CSSProperties}><span><strong>{score}</strong> / {questions.length}</span></div>
        <h2 id="quiz-result-title">{score === questions.length ? 'すばらしい判断です。' : score >= 6 ? 'かなり身についています。' : '比較しながら復習しましょう。'}</h2>
        <p>UIは見た目ではなく、ユーザーの目的・候補数・反映タイミングから選ぶのがコツです。</p>
        <div className="quiz-finish-actions"><button className="secondary-action" onClick={restart}>もう一度</button><button className="primary-action" onClick={onExit}>図鑑へ戻る</button></div>
      </section>
    );
  }

  return (
    <section className="quiz-shell" aria-labelledby="quiz-title">
      <header className="quiz-header">
        <div><p className="kicker"><span /> DECISION QUIZ</p><h1 id="quiz-title">状況から、UIを選ぶ。</h1></div>
        <button className="quiz-close" onClick={onExit}>図鑑へ戻る</button>
      </header>
      <div className="quiz-progress-row">
        <span>QUESTION {String(index + 1).padStart(2, '0')} / {String(questions.length).padStart(2, '0')}</span>
        <progress max={questions.length} value={index + 1}>{index + 1} / {questions.length}</progress>
        <strong>{score} correct</strong>
      </div>
      <article className="quiz-card">
        <div className="quiz-situation"><small>SCENARIO</small><h2>{question.situation}</h2><p>{question.detail}</p></div>
        <fieldset className="quiz-choices">
          <legend>最適なUIを一つ選んでください</legend>
          {question.choices.map((choice, choiceIndex) => {
            const isChosen = selected === choice.id;
            const isAnswer = checked && choice.id === question.answer;
            const isWrong = checked && isChosen && choice.id !== question.answer;
            return (
              <label key={choice.id} className={`${isChosen ? 'selected' : ''} ${isAnswer ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}>
                <input type="radio" name="answer" value={choice.id} checked={isChosen} disabled={checked} onChange={() => setSelected(choice.id)} />
                <span className="choice-letter">{String.fromCharCode(65 + choiceIndex)}</span>
                <strong>{choice.label}</strong>
                {isAnswer && <span className="choice-result">✓ 正解</span>}
                {isWrong && <span className="choice-result">× 違います</span>}
              </label>
            );
          })}
        </fieldset>
        {checked && <div className={`quiz-explanation ${correct ? 'correct' : 'wrong'}`} role="status"><span>{correct ? '✓' : '!'}</span><div><strong>{correct ? 'その判断で正解です' : 'ここを見分けよう'}</strong><p>{question.explanation}</p></div></div>}
        <div className="quiz-actions">
          {!checked ? <button className="primary-action" disabled={!selected} onClick={checkAnswer}>回答する</button> : <button className="primary-action" onClick={next}>{index === questions.length - 1 ? '結果を見る' : '次の問題'}</button>}
        </div>
      </article>
    </section>
  );
}

