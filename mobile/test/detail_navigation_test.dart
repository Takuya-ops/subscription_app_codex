import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ui_atlas/src/data/ui_catalog.dart';
import 'package:ui_atlas/src/screens/pattern_detail_screen.dart';
import 'package:ui_atlas/src/state/app_controller.dart';
import 'package:ui_atlas/src/state/app_preferences.dart';
import 'package:ui_atlas/src/theme/app_theme.dart';

void main() {
  testWidgets('次のUIへ移動すると教材の開始位置へ戻る', (tester) async {
    tester.view.devicePixelRatio = 1;
    tester.view.physicalSize = const Size(390, 844);
    addTearDown(tester.view.resetDevicePixelRatio);
    addTearDown(tester.view.resetPhysicalSize);

    final patterns = uiPatterns.take(2).toList(growable: false);
    final controller = AppController(
      preferences: MemoryAppPreferences(),
      validPatternIds: patterns.map((pattern) => pattern.id).toSet(),
    );
    addTearDown(controller.dispose);
    await controller.initialize();

    await tester.pumpWidget(
      MaterialApp(
        theme: buildAtlasTheme(),
        home: PatternDetailScreen(
          controller: controller,
          patterns: patterns,
          initialPatternId: patterns.first.id,
        ),
      ),
    );
    await tester.pumpAndSettle();

    final pageScrollable = find.byType(Scrollable).first;
    await tester.scrollUntilVisible(
      find.byKey(const Key('next-pattern')),
      500,
      scrollable: pageScrollable,
    );
    final before = tester
        .state<ScrollableState>(pageScrollable)
        .position
        .pixels;
    expect(before, greaterThan(0));

    await tester.tap(find.byKey(const Key('next-pattern')));
    await tester.pumpAndSettle();

    expect(find.text(patterns.last.name), findsOneWidget);
    expect(
      tester.state<ScrollableState>(pageScrollable).position.pixels,
      moreOrLessEquals(0, epsilon: 0.5),
    );
  });
}
