import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ui_atlas/src/data/ui_catalog.dart';
import 'package:ui_atlas/src/theme/app_theme.dart';
import 'package:ui_atlas/src/widgets/pattern_demo.dart';

void main() {
  for (final pattern in uiPatterns) {
    testWidgets('${pattern.id} は小画面・文字200%でも描画できる', (tester) async {
      tester.view.devicePixelRatio = 1;
      tester.view.physicalSize = const Size(320, 568);
      addTearDown(tester.view.resetDevicePixelRatio);
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        MaterialApp(
          theme: buildAtlasTheme(),
          builder: (context, child) => MediaQuery(
            data: MediaQuery.of(context)
                .copyWith(textScaler: const TextScaler.linear(2)),
            child: child!,
          ),
          home: Scaffold(
            body: SingleChildScrollView(
              padding: const EdgeInsets.all(10),
              child: PatternDemo(pattern: pattern),
            ),
          ),
        ),
      );
      await tester.pump(const Duration(milliseconds: 16));

      expect(
        tester.takeException(),
        isNull,
        reason: '${pattern.id} が小画面・文字200%で描画できません',
      );
    });
  }
}
