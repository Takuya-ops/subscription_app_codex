import 'package:flutter/material.dart';

import 'src/app/ui_atlas_app.dart';
import 'src/data/ui_catalog.dart';
import 'src/state/app_controller.dart';
import 'src/state/app_preferences.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  AppPreferences preferences;
  try {
    preferences = await SharedPreferencesAppPreferences.create();
  } on Object {
    preferences = MemoryAppPreferences();
  }

  final controller = AppController(
    preferences: preferences,
    validPatternIds: uiPatterns.map((pattern) => pattern.id).toSet(),
  );
  await controller.initialize();

  runApp(UiAtlasApp(controller: controller));
}
