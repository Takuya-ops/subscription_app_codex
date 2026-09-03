import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ui_atlas/src/data/ui_catalog.dart';
import 'package:ui_atlas/src/theme/app_theme.dart';
import 'package:ui_atlas/src/widgets/pattern_demo.dart';

void main() {
  test('99件すべてのカタログIDと対応デモIDが完全一致する', () {
    final catalogIds = uiPatterns.map((pattern) => pattern.id).toSet();
    final missingDemoIds = catalogIds.difference(supportedDemoIds);
    final unexpectedDemoIds = supportedDemoIds.difference(catalogIds);

    expect(catalogIds, hasLength(99));
    expect(supportedDemoIds, hasLength(99));
    expect(
      missingDemoIds,
      isEmpty,
      reason: 'デモがないカタログID: ${missingDemoIds.toList()..sort()}',
    );
    expect(
      unexpectedDemoIds,
      isEmpty,
      reason: 'カタログにないデモID: ${unexpectedDemoIds.toList()..sort()}',
    );
  });

  for (final pattern in uiPatterns) {
    testWidgets('${pattern.id} のデモを標準スマホ幅で表示できる', (tester) async {
      tester.view.devicePixelRatio = 1;
      tester.view.physicalSize = const Size(390, 844);
      addTearDown(tester.view.resetDevicePixelRatio);
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        MaterialApp(
          theme: buildAtlasTheme(),
          home: Scaffold(
            body: SingleChildScrollView(
              padding: const EdgeInsets.all(18),
              child: PatternDemo(pattern: pattern),
            ),
          ),
        ),
      );
      await tester.pump(const Duration(milliseconds: 16));

      expect(find.byType(PatternDemo), findsOneWidget);
      expect(
        tester.takeException(),
        isNull,
        reason: '${pattern.id} のデモ表示中に例外が発生しました',
      );
    });
  }
}
