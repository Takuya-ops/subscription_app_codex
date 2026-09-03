import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ui_atlas/src/app/ui_atlas_app.dart';
import 'package:ui_atlas/src/data/quiz_data.dart';
import 'package:ui_atlas/src/data/ui_catalog.dart';
import 'package:ui_atlas/src/state/app_controller.dart';
import 'package:ui_atlas/src/state/app_preferences.dart';

void main() {
  testWidgets('図鑑で検索・カテゴリ・プラットフォームを絞り込み、条件を解除できる', (tester) async {
    await _pumpAtlas(tester);

    expect(find.text('99 PATTERNS'), findsOneWidget);

    await tester.enterText(find.byKey(const Key('catalog-search')), 'ＴＯＧＧＬＥ');
    await tester.pump();

    expect(find.text('1 PATTERNS'), findsOneWidget);
    expect(
      find.byKey(const ValueKey<String>('pattern-switch')),
      findsOneWidget,
    );
    expect(
      find.byKey(const ValueKey<String>('pattern-checkbox')),
      findsNothing,
    );

    await tester.tap(find.byTooltip('検索語を消去'));
    await tester.pump();

    expect(find.text('99 PATTERNS'), findsOneWidget);
    expect(
      tester
          .widget<TextField>(find.byKey(const Key('catalog-search')))
          .controller
          ?.text,
      isEmpty,
    );

    final actionsChip = find.widgetWithText(FilterChip, '操作 7');
    await tester.tap(actionsChip);
    await tester.pump();

    expect(find.text('7 PATTERNS'), findsOneWidget);
    expect(tester.widget<FilterChip>(actionsChip).selected, isTrue);

    final webChip = find.widgetWithText(ChoiceChip, 'Web');
    await tester.tap(webChip);
    await tester.pump();

    expect(find.text('6 PATTERNS'), findsOneWidget);
    expect(tester.widget<ChoiceChip>(webChip).selected, isTrue);
    expect(find.byKey(const ValueKey<String>('pattern-fab')), findsNothing);

    await tester.tap(find.text('条件を解除'));
    await tester.pump();

    expect(find.text('99 PATTERNS'), findsOneWidget);
    expect(
      tester
          .widget<ChoiceChip>(find.widgetWithText(ChoiceChip, 'すべて'))
          .selected,
      isTrue,
    );
    expect(
      tester
          .widget<FilterChip>(find.widgetWithText(FilterChip, 'すべて 99'))
          .selected,
      isTrue,
    );
    expect(
      tester
          .widget<TextField>(find.byKey(const Key('catalog-search')))
          .controller
          ?.text,
      isEmpty,
    );
  });

  testWidgets('詳細へ遷移し、お気に入りと学習済みが図鑑・保存画面へ反映される', (tester) async {
    final controller = await _pumpAtlas(tester);

    await tester.enterText(find.byKey(const Key('catalog-search')), 'ＴＯＧＧＬＥ');
    await tester.pump();

    final switchTile = find.byKey(const ValueKey<String>('pattern-switch'));
    await tester.ensureVisible(switchTile);
    await tester.pumpAndSettle();
    await tester.tap(switchTile);
    await tester.pumpAndSettle();

    expect(find.byKey(const ValueKey<String>('detail-switch')), findsOneWidget);
    expect(find.text('スイッチ・トグル'), findsOneWidget);
    expect(find.text('Switch / Toggle'), findsOneWidget);

    await tester.tap(find.byTooltip('お気に入りに追加'));
    await tester.pumpAndSettle();

    expect(controller.isFavorite('switch'), isTrue);
    expect(find.byTooltip('お気に入りから外す'), findsOneWidget);

    expect(find.text('学習済みにする'), findsOneWidget);
    await tester.tap(find.byKey(const Key('toggle-completed')));
    await tester.pumpAndSettle();

    expect(controller.isCompleted('switch'), isTrue);
    expect(find.text('学習済み'), findsOneWidget);

    await tester.tap(find.byTooltip('図鑑へ戻る'));
    await tester.pumpAndSettle();

    expect(
      find.descendant(
        of: switchTile,
        matching: find.byIcon(Icons.check_rounded),
      ),
      findsOneWidget,
    );
    expect(find.byTooltip('お気に入りから外す'), findsOneWidget);

    await tester.tap(find.text('保存'));
    await tester.pumpAndSettle();

    expect(find.text('お気に入り 1'), findsOneWidget);
    expect(find.text('学習済み 1'), findsOneWidget);
    expect(find.text('スイッチ・トグル'), findsOneWidget);

    await tester.tap(find.text('学習済み 1'));
    await tester.pumpAndSettle();

    expect(find.text('スイッチ・トグル'), findsOneWidget);
  });

  testWidgets('8問クイズは未選択を無効化し、回答を固定して結果表示と再挑戦ができる', (tester) async {
    final controller = await _pumpAtlas(tester);

    await tester.tap(find.text('判断クイズ'));
    await tester.pumpAndSettle();

    for (var index = 0; index < quizQuestions.length; index++) {
      expect(find.byKey(ValueKey<String>('question-$index')), findsOneWidget);
      expect(_primaryButton(tester).onPressed, isNull);

      final question = quizQuestions[index];
      final correctChoice = question.choices.singleWhere(
        (choice) => choice.id == question.answer,
      );
      final correctChoiceFinder = find.text(correctChoice.label);
      await tester.ensureVisible(correctChoiceFinder);
      await tester.pumpAndSettle();
      await tester.tap(correctChoiceFinder);
      await tester.pump();

      expect(_primaryButton(tester).onPressed, isNotNull);
      await _tapPrimaryAction(tester);

      expect(find.text('その判断で正解です'), findsOneWidget);
      expect(controller.isCompleted(question.answer), isTrue);

      if (index == 0) {
        final tiles = tester
            .widgetList<RadioListTile<String>>(
              find.byType(RadioListTile<String>),
            )
            .toList(growable: false);
        expect(tiles, hasLength(3));
        expect(tiles.every((tile) => tile.enabled == false), isTrue);

        final otherChoice = question.choices.firstWhere(
          (choice) => choice.id != question.answer,
        );
        await tester.tap(find.text(otherChoice.label));
        await tester.pump();

        expect(find.text('その判断で正解です'), findsOneWidget);
        expect(find.text('1 正解'), findsOneWidget);
      }

      await _tapPrimaryAction(tester);
    }

    expect(find.byKey(const ValueKey<String>('quiz-result')), findsOneWidget);
    expect(find.text('8'), findsOneWidget);
    expect(find.text('/ 8'), findsOneWidget);
    expect(find.text('すばらしい判断です。'), findsOneWidget);
    expect(
      controller.completed,
      quizQuestions.map((question) => question.answer).toSet(),
    );

    final retryButton = find.text('もう一度挑戦する');
    await tester.ensureVisible(retryButton);
    await tester.pumpAndSettle();
    await tester.tap(retryButton);
    await tester.pumpAndSettle();

    expect(find.byKey(const ValueKey<String>('question-0')), findsOneWidget);
    expect(find.text('1 / 8'), findsOneWidget);
    expect(find.text('0 正解'), findsOneWidget);
    expect(_primaryButton(tester).onPressed, isNull);
    expect(
      controller.completed,
      quizQuestions.map((question) => question.answer).toSet(),
    );
  });
}

Future<AppController> _pumpAtlas(WidgetTester tester) async {
  tester.view.devicePixelRatio = 1;
  tester.view.physicalSize = const Size(430, 932);
  addTearDown(tester.view.resetDevicePixelRatio);
  addTearDown(tester.view.resetPhysicalSize);

  final controller = AppController(
    preferences: MemoryAppPreferences(),
    validPatternIds: uiPatterns.map((pattern) => pattern.id).toSet(),
  );
  addTearDown(controller.dispose);
  await controller.initialize();

  await tester.pumpWidget(UiAtlasApp(controller: controller));
  await tester.pumpAndSettle();
  return controller;
}

FilledButton _primaryButton(WidgetTester tester) {
  return tester.widget<FilledButton>(
    find.byKey(const Key('quiz-primary-action')),
  );
}

Future<void> _tapPrimaryAction(WidgetTester tester) async {
  final action = find.byKey(const Key('quiz-primary-action'));
  await tester.ensureVisible(action);
  await tester.pumpAndSettle();
  await tester.tap(action);
  await tester.pumpAndSettle();
}
