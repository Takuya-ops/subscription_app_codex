import 'package:flutter_test/flutter_test.dart';
import 'package:ui_atlas/src/data/quiz_data.dart';
import 'package:ui_atlas/src/data/ui_catalog.dart';
import 'package:ui_atlas/src/domain/ui_pattern.dart';

void main() {
  test('UI図鑑は10カテゴリ・99パターンを重複なく収録する', () {
    expect(categories, hasLength(10));
    expect(UiCategory.values, hasLength(10));
    expect(uiPatterns, hasLength(99));
    expect(uiPatterns.map((pattern) => pattern.id).toSet(), hasLength(99));

    for (final category in UiCategory.values) {
      expect(
        uiPatterns.any((pattern) => pattern.category == category),
        isTrue,
        reason: '${category.label}が空です',
      );
    }
  });

  test('全UIパターンに判断材料、アクセシビリティ、実在例が揃う', () {
    for (final pattern in uiPatterns) {
      expect(pattern.id.trim(), isNotEmpty, reason: '${pattern.id}: ID');
      expect(pattern.name.trim(), isNotEmpty, reason: '${pattern.id}: 日本語名');
      expect(pattern.english.trim(), isNotEmpty, reason: '${pattern.id}: 英語名');
      expect(
        pattern.summary.length,
        greaterThanOrEqualTo(15),
        reason: '${pattern.id}: 概要',
      );
      expect(
        pattern.useWhen.length,
        greaterThanOrEqualTo(15),
        reason: '${pattern.id}: 使う場面',
      );
      expect(
        pattern.avoid.length,
        greaterThanOrEqualTo(15),
        reason: '${pattern.id}: 避ける場面',
      );
      expect(
        pattern.compare.length,
        greaterThanOrEqualTo(10),
        reason: '${pattern.id}: 比較ポイント',
      );
      expect(
        pattern.a11y.length,
        greaterThanOrEqualTo(20),
        reason: '${pattern.id}: アクセシビリティ',
      );
      expect(
        pattern.examples.length,
        greaterThanOrEqualTo(2),
        reason: '${pattern.id}: 実在アプリ例',
      );
      expect(
        pattern.examples.every((example) => example.trim().isNotEmpty),
        isTrue,
        reason: '${pattern.id}: 空の実在アプリ例があります',
      );
    }
  });

  test('カテゴリ別・プラットフォーム別件数がWeb版と一致する', () {
    const expectedCategories = <UiCategory, int>{
      UiCategory.actions: 7,
      UiCategory.input: 11,
      UiCategory.selection: 8,
      UiCategory.navigation: 11,
      UiCategory.feedback: 10,
      UiCategory.overlay: 11,
      UiCategory.data: 13,
      UiCategory.layout: 7,
      UiCategory.mobile: 9,
      UiCategory.gesture: 12,
    };
    const expectedPlatforms = <PlatformScope, int>{
      PlatformScope.web: 13,
      PlatformScope.mobile: 21,
      PlatformScope.shared: 65,
    };

    for (final entry in expectedCategories.entries) {
      expect(
        uiPatterns.where((pattern) => pattern.category == entry.key),
        hasLength(entry.value),
      );
    }
    for (final entry in expectedPlatforms.entries) {
      expect(
        uiPatterns.where((pattern) => pattern.platform == entry.key),
        hasLength(entry.value),
      );
    }
  });

  test('検索正規化は全角ASCII、全角空白、大小、連続空白を吸収する', () {
    expect(normalizeSearch('  ＦＡＢ　Button\t\n UI  '), 'fab button ui');
    expect(normalizeSearch('Ｔｏｇｇｌｅ'), normalizeSearch('toggle'));
  });

  test('検索、カテゴリ、プラットフォーム、お気に入りで絞り込める', () {
    expect(
      filterPatterns(query: 'ＴＯＧＧＬＥ').map((pattern) => pattern.id),
      contains('switch'),
    );

    final selection = filterPatterns(category: UiCategory.selection);
    expect(selection, isNotEmpty);
    expect(
      selection.every((pattern) => pattern.category == UiCategory.selection),
      isTrue,
    );

    final web = filterPatterns(platform: PlatformScope.web);
    expect(web, isNotEmpty);
    expect(
      web.every(
        (pattern) =>
            pattern.platform == PlatformScope.web ||
            pattern.platform == PlatformScope.shared,
      ),
      isTrue,
    );

    expect(
      filterPatterns(
        favoritesOnly: true,
        favoriteIds: const <String>{'button', 'switch'},
      ).map((pattern) => pattern.id).toSet(),
      const <String>{'button', 'switch'},
    );
  });

  test('判断クイズ8問の正答は選択肢とUI図鑑の両方に存在する', () {
    expect(quizQuestions, hasLength(8));
    final patternIds = uiPatterns.map((pattern) => pattern.id).toSet();

    for (final question in quizQuestions) {
      expect(question.situation.trim(), isNotEmpty);
      expect(question.detail.trim(), isNotEmpty);
      expect(question.explanation.trim(), isNotEmpty);
      expect(question.choices, hasLength(3));
      expect(
        question.choices.any((choice) => choice.id == question.answer),
        isTrue,
        reason: '${question.situation}: 正答が選択肢にありません',
      );
      expect(
        patternIds.contains(question.answer),
        isTrue,
        reason: '${question.situation}: 正答IDがUI図鑑にありません',
      );
    }
  });
}
