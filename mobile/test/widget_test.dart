import 'package:flutter_test/flutter_test.dart';
import 'package:ui_atlas/src/app/ui_atlas_app.dart';
import 'package:ui_atlas/src/data/ui_catalog.dart';
import 'package:ui_atlas/src/state/app_controller.dart';
import 'package:ui_atlas/src/state/app_preferences.dart';

void main() {
  testWidgets('主要な3画面を下部ナビゲーションで移動できる', (tester) async {
    final controller = AppController(
      preferences: MemoryAppPreferences(),
      validPatternIds: uiPatterns.map((pattern) => pattern.id).toSet(),
    );
    await controller.initialize();

    await tester.pumpWidget(UiAtlasApp(controller: controller));
    await tester.pumpAndSettle();

    expect(find.text('触ってわかる、\nUIの使い分け。'), findsOneWidget);

    await tester.tap(find.text('判断クイズ'));
    await tester.pumpAndSettle();
    expect(find.text('状況から、UIを選ぶ。'), findsOneWidget);

    await tester.tap(find.text('保存'));
    await tester.pumpAndSettle();
    expect(find.text('保存したUI'), findsOneWidget);
  });
}
