import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ui_atlas/src/app/ui_atlas_app.dart';
import 'package:ui_atlas/src/data/ui_catalog.dart';
import 'package:ui_atlas/src/screens/pattern_detail_screen.dart';
import 'package:ui_atlas/src/state/app_controller.dart';
import 'package:ui_atlas/src/state/app_preferences.dart';
import 'package:ui_atlas/src/theme/app_theme.dart';

void main() {
  late AppController controller;

  setUp(() async {
    controller = AppController(
      preferences: MemoryAppPreferences(),
      validPatternIds: uiPatterns.map((pattern) => pattern.id).toSet(),
    );
    await controller.initialize();
  });

  tearDown(() => controller.dispose());

  testWidgets('主要3画面は小画面・文字200%でも操作できる', (tester) async {
    _useCompactViewport(tester);
    await tester.pumpWidget(UiAtlasApp(controller: controller));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);

    await tester.tap(find.text('判断クイズ'));
    await tester.pumpAndSettle();
    expect(find.text('状況から、UIを選ぶ。'), findsOneWidget);
    expect(tester.takeException(), isNull);

    await tester.tap(find.text('保存'));
    await tester.pumpAndSettle();
    expect(find.text('保存したUI'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('教材詳細は小画面・文字200%で末尾まで表示できる', (tester) async {
    _useCompactViewport(tester);
    final pattern = uiPatterns.first;
    await tester.pumpWidget(
      MaterialApp(
        theme: buildAtlasTheme(),
        home: PatternDetailScreen(
          controller: controller,
          patterns: [pattern],
          initialPatternId: pattern.id,
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.scrollUntilVisible(
      find.byKey(const Key('next-pattern')),
      500,
      scrollable: find.byType(Scrollable).first,
    );
    expect(find.byKey(const Key('next-pattern')), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}

void _useCompactViewport(WidgetTester tester) {
  tester.view.devicePixelRatio = 1;
  tester.view.physicalSize = const Size(320, 568);
  tester.platformDispatcher.textScaleFactorTestValue = 2;
  addTearDown(tester.view.resetDevicePixelRatio);
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.platformDispatcher.clearTextScaleFactorTestValue);
}
