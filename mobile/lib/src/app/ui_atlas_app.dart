import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import '../screens/catalog_screen.dart';
import '../screens/quiz_screen.dart';
import '../screens/saved_screen.dart';
import '../state/app_controller.dart';
import '../theme/app_theme.dart';

class UiAtlasApp extends StatelessWidget {
  const UiAtlasApp({required this.controller, super.key});

  final AppController controller;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'UI Atlas',
      debugShowCheckedModeBanner: false,
      locale: const Locale('ja'),
      supportedLocales: const [Locale('ja')],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      theme: buildAtlasTheme(),
      home: AtlasHome(controller: controller),
    );
  }
}

class AtlasHome extends StatefulWidget {
  const AtlasHome({required this.controller, super.key});

  final AppController controller;

  @override
  State<AtlasHome> createState() => _AtlasHomeState();
}

class _AtlasHomeState extends State<AtlasHome> {
  int _selectedIndex = 0;
  String? _shownStorageError;

  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_handleControllerUpdate);
    WidgetsBinding.instance.addPostFrameCallback(
      (_) => _handleControllerUpdate(),
    );
  }

  @override
  void dispose() {
    widget.controller.removeListener(_handleControllerUpdate);
    super.dispose();
  }

  void _handleControllerUpdate() {
    if (!mounted) return;
    final error = widget.controller.storageError;
    if (error == null || error == _shownStorageError) return;
    _shownStorageError = error;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          SnackBar(
            content: Text(error),
            action: SnackBarAction(
              label: '閉じる',
              textColor: AtlasColors.acid,
              onPressed: widget.controller.clearStorageError,
            ),
          ),
        );
    });
  }

  void _selectDestination(int value) {
    if (value == _selectedIndex) return;
    setState(() => _selectedIndex = value);
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: _selectedIndex == 0,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop && _selectedIndex != 0) _selectDestination(0);
      },
      child: Scaffold(
        body: SafeArea(
          bottom: false,
          child: IndexedStack(
            index: _selectedIndex,
            children: [
              CatalogScreen(controller: widget.controller),
              QuizScreen(controller: widget.controller),
              SavedScreen(controller: widget.controller),
            ],
          ),
        ),
        bottomNavigationBar: NavigationBar(
          selectedIndex: _selectedIndex,
          onDestinationSelected: _selectDestination,
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.grid_view_rounded),
              selectedIcon: Icon(
                Icons.grid_view_rounded,
                color: AtlasColors.blue,
              ),
              label: '図鑑',
              tooltip: 'UI図鑑',
            ),
            NavigationDestination(
              icon: Icon(Icons.psychology_alt_outlined),
              selectedIcon: Icon(
                Icons.psychology_alt_rounded,
                color: AtlasColors.blue,
              ),
              label: '判断クイズ',
              tooltip: 'UI判断クイズ',
            ),
            NavigationDestination(
              icon: Icon(Icons.bookmark_border_rounded),
              selectedIcon: Icon(
                Icons.bookmark_rounded,
                color: AtlasColors.blue,
              ),
              label: '保存',
              tooltip: 'お気に入りと学習済み',
            ),
          ],
        ),
      ),
    );
  }
}
