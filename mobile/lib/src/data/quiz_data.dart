class QuizChoice {
  const QuizChoice({required this.id, required this.label});

  final String id;
  final String label;
}

class QuizQuestion {
  const QuizQuestion({
    required this.situation,
    required this.detail,
    required this.choices,
    required this.answer,
    required this.explanation,
  });

  final String situation;
  final String detail;
  final List<QuizChoice> choices;
  final String answer;
  final String explanation;
}

const quizQuestions = <QuizQuestion>[
  QuizQuestion(
    situation: 'Wi‑Fiを今すぐオン／オフしたい',
    detail: '変更は選んだ瞬間に反映され、現在の状態も常に見せます。',
    choices: <QuizChoice>[
      QuizChoice(id: 'checkbox', label: 'チェックボックス'),
      QuizChoice(id: 'switch', label: 'スイッチ'),
      QuizChoice(id: 'button', label: 'ボタン'),
    ],
    answer: 'switch',
    explanation: '即時反映する二値設定なのでスイッチ。チェックボックスはフォーム上の選択に向きます。',
  ),
  QuizQuestion(
    situation: '配送方法を3つから一つ選びたい',
    detail: '候補を見比べて選び、最後に注文ボタンで確定します。',
    choices: <QuizChoice>[
      QuizChoice(id: 'radio', label: 'ラジオボタン'),
      QuizChoice(id: 'switch', label: 'スイッチ'),
      QuizChoice(id: 'tooltip', label: 'ツールチップ'),
    ],
    answer: 'radio',
    explanation: '少数の排他的な候補を同時に比較するため、ラジオボタンが適します。',
  ),
  QuizQuestion(
    situation: 'アーカイブ完了と「元に戻す」を伝えたい',
    detail: '作業は止めず、数秒後に通知が消えても問題ありません。',
    choices: <QuizChoice>[
      QuizChoice(id: 'modal', label: 'モーダル'),
      QuizChoice(id: 'toast', label: 'トースト'),
      QuizChoice(id: 'alert-banner', label: 'バナー'),
    ],
    answer: 'toast',
    explanation: '軽い操作結果と一つのUndoにはトースト。重大な判断を求めないのでモーダルは不要です。',
  ),
  QuizQuestion(
    situation: 'スマホの主要4画面を頻繁に切り替えたい',
    detail: 'ホーム、検索、保存、自分のページはすべて同じ階層です。',
    choices: <QuizChoice>[
      QuizChoice(id: 'nav-drawer', label: 'ナビゲーションドロワー'),
      QuizChoice(id: 'bottom-nav', label: 'ボトムナビゲーション'),
      QuizChoice(id: 'breadcrumbs', label: 'パンくず'),
    ],
    answer: 'bottom-nav',
    explanation: 'スマホの主要3〜5領域は、親指で届くボトムナビゲーションが適します。',
  ),
  QuizQuestion(
    situation: '500人から担当者を一人選びたい',
    detail: '名前の一部は分かっています。候補外の人は選べません。',
    choices: <QuizChoice>[
      QuizChoice(id: 'select', label: 'セレクト'),
      QuizChoice(id: 'combobox', label: 'コンボボックス'),
      QuizChoice(id: 'textarea', label: 'テキストエリア'),
    ],
    answer: 'combobox',
    explanation: '大量の固定候補を入力で絞るため、検索可能なコンボボックスが適します。',
  ),
  QuizQuestion(
    situation: '請求データの金額・日付・状態を比較したい',
    detail: '各項目は同じ列を持ち、正確な比較が重要です。',
    choices: <QuizChoice>[
      QuizChoice(id: 'card', label: 'カード'),
      QuizChoice(id: 'carousel', label: 'カルーセル'),
      QuizChoice(id: 'table', label: 'テーブル'),
    ],
    answer: 'table',
    explanation: '同じ列を持つ多数のレコード比較にはテーブル。カードは視覚的な概要向けです。',
  ),
  QuizQuestion(
    situation: '画像カードを別の列へ移動したい',
    detail: 'ドラッグが苦手な人やキーボード利用者も同じ操作を行います。',
    choices: <QuizChoice>[
      QuizChoice(id: 'drag-drop', label: 'ドラッグ＋移動メニュー'),
      QuizChoice(id: 'drag-drop-only', label: 'ドラッグだけ'),
      QuizChoice(id: 'double-tap', label: 'ダブルタップだけ'),
    ],
    answer: 'drag-drop',
    explanation: '直接操作は便利ですが、移動先を選ぶボタンなど同じ結果になる代替が必要です。',
  ),
  QuizQuestion(
    situation: '長いFAQを見出しごとに整理したい',
    detail: '必要な質問だけ開ければよく、複数の同種セクションがあります。',
    choices: <QuizChoice>[
      QuizChoice(id: 'accordion', label: 'アコーディオン'),
      QuizChoice(id: 'tabs', label: 'タブ'),
      QuizChoice(id: 'progress-bar', label: '進捗バー'),
    ],
    answer: 'accordion',
    explanation: '同種の見出しと内容を縦に開閉する集合なので、アコーディオンが適します。',
  ),
];
