enum UiCategory {
  actions(
    id: 'actions',
    label: '操作・実行',
    shortLabel: '操作',
    description: '何かを実行する',
    accessibility: '目的が分かる名前を付け、キーボードでも実行できるようにします。押下・無効・処理中を色以外でも示します。',
  ),
  input(
    id: 'input',
    label: '入力',
    shortLabel: '入力',
    description: '文字や値を受け取る',
    accessibility: '見えるラベルと説明を入力欄に関連付け、エラー時も入力値を残します。タッチ領域とフォーカス表示を確保します。',
  ),
  selection(
    id: 'selection',
    label: '選択',
    shortLabel: '選択',
    description: '候補や状態を選ぶ',
    accessibility: '選択状態を見た目と支援技術の両方へ伝え、グループ名とキーボード操作を用意します。',
  ),
  navigation(
    id: 'navigation',
    label: 'ナビゲーション',
    shortLabel: '移動',
    description: '場所や内容を移動する',
    accessibility: '現在地を伝え、意味のある順序でフォーカス移動できるようにします。戻る操作の結果を予測可能にします。',
  ),
  feedback(
    id: 'feedback',
    label: 'フィードバック・状態',
    shortLabel: '状態',
    description: '結果や進行を伝える',
    accessibility: '色だけに頼らず状態を文字でも伝えます。重要度に合った live region を使い、フォーカスを不意に奪いません。',
  ),
  overlay(
    id: 'overlay',
    label: 'オーバーレイ・開閉',
    shortLabel: '開閉',
    description: '文脈の上に補助情報を出す',
    accessibility: '開いたら適切にフォーカスを移し、Escapeと明示的なボタンで閉じられ、閉じた後は起点へ戻るようにします。',
  ),
  data(
    id: 'data',
    label: 'データ表示',
    shortLabel: '表示',
    description: '情報を読み比べる',
    accessibility: '見た目だけでなく読み上げ順と見出し関係を保ちます。視覚表現にはテキストや表の代替も用意します。',
  ),
  layout(
    id: 'layout',
    label: 'レイアウト・構造',
    shortLabel: '構造',
    description: '画面全体を組み立てる',
    accessibility: '拡大・狭幅でも内容や操作を失わず、見た目とDOMの読み順を一致させます。ランドマークを明確にします。',
  ),
  mobile(
    id: 'mobile',
    label: 'モバイル固有',
    shortLabel: '端末',
    description: '端末機能と小画面に合わせる',
    accessibility: 'ノッチ、ホームインジケーター、仮想キーボードを考慮し、主要なタップ領域は44px相当を目安にします。',
  ),
  gesture(
    id: 'gesture',
    label: 'ジェスチャー',
    shortLabel: 'ジェスチャー',
    description: '直接触れて操作する',
    accessibility: 'ジェスチャーだけに依存せず、タップやボタンでも同じ結果へ到達できる代替操作を必ず用意します。',
  );

  const UiCategory({
    required this.id,
    required this.label,
    required this.shortLabel,
    required this.description,
    required this.accessibility,
  });

  final String id;
  final String label;
  final String shortLabel;
  final String description;
  final String accessibility;
}

enum PlatformScope {
  web('Web'),
  mobile('スマホ'),
  shared('共通');

  const PlatformScope(this.label);

  final String label;
}

class UiPattern {
  const UiPattern({
    required this.id,
    required this.name,
    required this.english,
    required this.category,
    required this.platform,
    required this.summary,
    required this.useWhen,
    required this.avoid,
    required this.examples,
    required this.compare,
    this.accessibilityOverride,
  });

  final String id;
  final String name;
  final String english;
  final UiCategory category;
  final PlatformScope platform;
  final String summary;
  final String useWhen;
  final String avoid;
  final List<String> examples;
  final String compare;
  final String? accessibilityOverride;

  String get when => useWhen;

  String get a11y => accessibilityOverride ?? category.accessibility;

  String get accessibility => a11y;
}

String normalizeSearch(String value) {
  final normalizedWidth = StringBuffer();

  for (final codePoint in value.runes) {
    if (codePoint == 0x3000) {
      normalizedWidth.write(' ');
    } else if (codePoint >= 0xff01 && codePoint <= 0xff5e) {
      normalizedWidth.writeCharCode(codePoint - 0xfee0);
    } else {
      normalizedWidth.writeCharCode(codePoint);
    }
  }

  return normalizedWidth
      .toString()
      .toLowerCase()
      .replaceAll(RegExp(r'\s+'), ' ')
      .trim();
}
