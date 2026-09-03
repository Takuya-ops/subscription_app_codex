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

  testWidgets('図鑑の主要操作はラベル・コントラスト・タップ領域を満たす', (tester) async {
    await _usePhoneViewport(tester);
    final semantics = tester.ensureSemantics();
    try {
      await tester.pumpWidget(UiAtlasApp(controller: controller));
      await tester.pumpAndSettle();

      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
      await expectLater(tester, meetsGuideline(iOSTapTargetGuideline));
      await expectLater(tester, meetsGuideline(textContrastGuideline));
    } finally {
      semantics.dispose();
    }
  });

  testWidgets('教材詳細の主要操作はラベル・コントラスト・タップ領域を満たす', (tester) async {
    await _usePhoneViewport(tester);
    final semantics = tester.ensureSemantics();
    final pattern = uiPatterns.firstWhere((item) => item.id == 'switch');

    try {
      await tester.pumpWidget(
        MaterialApp(
          locale: const Locale('ja'),
          theme: buildAtlasTheme(),
          home: PatternDetailScreen(
            controller: controller,
            patterns: [pattern],
            initialPatternId: pattern.id,
          ),
        ),
      );
      await tester.pumpAndSettle();

      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
      await expectLater(tester, meetsGuideline(iOSTapTargetGuideline));
      await expectLater(tester, meetsGuideline(textContrastGuideline));
    } finally {
      semantics.dispose();
    }
  });
}

Future<void> _usePhoneViewport(WidgetTester tester) async {
  tester.view.devicePixelRatio = 1;
  tester.view.physicalSize = const Size(390, 844);
  addTearDown(tester.view.resetDevicePixelRatio);
  addTearDown(tester.view.resetPhysicalSize);
}
