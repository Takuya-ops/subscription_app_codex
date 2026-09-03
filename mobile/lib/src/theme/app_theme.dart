import 'package:flutter/material.dart';

abstract final class AtlasColors {
  static const ink = Color(0xFF15213D);
  static const blue = Color(0xFF3457D5);
  static const blueDark = Color(0xFF2442AA);
  static const acid = Color(0xFFD8FF56);
  static const canvas = Color(0xFFF3F6FB);
  static const paper = Color(0xFFFFFFFF);
  static const line = Color(0xFFDCE3EF);
  static const muted = Color(0xFF59667B);
  static const success = Color(0xFF12785B);
  static const warning = Color(0xFFB95D00);
  static const danger = Color(0xFFB73D35);
}

ThemeData buildAtlasTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: AtlasColors.blue,
    brightness: Brightness.light,
    primary: AtlasColors.blue,
    onPrimary: Colors.white,
    secondary: AtlasColors.acid,
    onSecondary: AtlasColors.ink,
    surface: AtlasColors.paper,
    onSurface: AtlasColors.ink,
    error: AtlasColors.danger,
  );

  const radius = BorderRadius.all(Radius.circular(16));

  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: AtlasColors.canvas,
    visualDensity: VisualDensity.standard,
    splashFactory: InkSparkle.splashFactory,
    textTheme: const TextTheme(
      displaySmall: TextStyle(
        color: AtlasColors.ink,
        fontSize: 38,
        fontWeight: FontWeight.w900,
        height: 1.06,
        letterSpacing: -1.4,
      ),
      headlineMedium: TextStyle(
        color: AtlasColors.ink,
        fontSize: 28,
        fontWeight: FontWeight.w900,
        height: 1.12,
        letterSpacing: -0.8,
      ),
      titleLarge: TextStyle(
        color: AtlasColors.ink,
        fontSize: 20,
        fontWeight: FontWeight.w800,
        height: 1.25,
      ),
      titleMedium: TextStyle(
        color: AtlasColors.ink,
        fontSize: 16,
        fontWeight: FontWeight.w800,
        height: 1.35,
      ),
      bodyLarge: TextStyle(
        color: AtlasColors.ink,
        fontSize: 16,
        fontWeight: FontWeight.w500,
        height: 1.65,
      ),
      bodyMedium: TextStyle(
        color: AtlasColors.muted,
        fontSize: 14,
        fontWeight: FontWeight.w500,
        height: 1.6,
      ),
      labelLarge: TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: AtlasColors.canvas,
      foregroundColor: AtlasColors.ink,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(
        color: AtlasColors.ink,
        fontSize: 20,
        fontWeight: FontWeight.w900,
        letterSpacing: -0.4,
      ),
    ),
    cardTheme: const CardThemeData(
      color: AtlasColors.paper,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: radius,
        side: BorderSide(color: AtlasColors.line),
      ),
    ),
    inputDecorationTheme: const InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 15),
      border: OutlineInputBorder(
        borderRadius: radius,
        borderSide: BorderSide(color: AtlasColors.line),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: radius,
        borderSide: BorderSide(color: AtlasColors.line),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: radius,
        borderSide: BorderSide(color: AtlasColors.blue, width: 2),
      ),
      hintStyle: TextStyle(
        color: Color(0xFF8995A9),
        fontWeight: FontWeight.w500,
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size(48, 48),
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(14)),
        ),
        textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(48, 48),
        side: const BorderSide(color: AtlasColors.line),
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(14)),
        ),
        textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
      ),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: Colors.white,
      selectedColor: const Color(0xFFE9EEFF),
      disabledColor: const Color(0xFFF0F2F6),
      side: const BorderSide(color: AtlasColors.line),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(12)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 7),
      labelStyle: const TextStyle(
        color: AtlasColors.muted,
        fontSize: 13,
        fontWeight: FontWeight.w700,
      ),
      secondaryLabelStyle: const TextStyle(
        color: AtlasColors.blue,
        fontSize: 13,
        fontWeight: FontWeight.w800,
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      height: 72,
      backgroundColor: Colors.white,
      indicatorColor: const Color(0xFFE7EDFF),
      elevation: 0,
      labelTextStyle: WidgetStateProperty.resolveWith(
        (states) => TextStyle(
          color: states.contains(WidgetState.selected)
              ? AtlasColors.blue
              : AtlasColors.muted,
          fontSize: 12,
          fontWeight: FontWeight.w800,
        ),
      ),
    ),
    dividerTheme: const DividerThemeData(color: AtlasColors.line, thickness: 1),
    snackBarTheme: const SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: AtlasColors.ink,
      contentTextStyle: TextStyle(
        color: Colors.white,
        fontWeight: FontWeight.w600,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(14)),
      ),
    ),
  );
}
