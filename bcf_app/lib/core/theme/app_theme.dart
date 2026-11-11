import 'package:flutter/material.dart';

class AppTheme {
  AppTheme._();

  // Brand & Semantic Palette
  static const Color emerald = Color(0xFF10B981);
  static const Color emeraldBright = Color(0xFF34D399);
  static const Color emeraldDark = Color(0xFF047857);
  static const Color gold = Color(0xFFF59E0B);
  static const Color goldBright = Color(0xFFFBBF24);

  // Obsidian Dark Surfaces (layered depth)
  static const Color darkBg = Color(0xFF060A11);
  static const Color darkSurface = Color(0xFF0D1420);
  static const Color darkCard = Color(0xFF131C2C);
  static const Color darkCardElevated = Color(0xFF192438);
  static const Color darkBorder = Color(0x16FFFFFF);

  // Crisp Light Surfaces
  static const Color lightBg = Color(0xFFF3F6FA);
  static const Color lightSurface = Color(0xFFFFFFFF);
  static const Color lightCardMuted = Color(0xFFF8FAFC);
  static const Color lightBorder = Color(0xFFE2E8F0);

  // Status Tones
  static const Color danger = Color(0xFFEF4444);
  static const Color warning = Color(0xFFF59E0B);
  static const Color info = Color(0xFF38BDF8);
  static const Color indigo = Color(0xFF818CF8);

  // Context Helpers
  static bool isDark(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark;

  static Color bg(BuildContext context) =>
      isDark(context) ? darkBg : lightBg;

  static Color surface(BuildContext context) =>
      isDark(context) ? darkSurface : lightSurface;

  static Color card(BuildContext context) =>
      isDark(context) ? darkCard : lightSurface;

  static Color cardElevated(BuildContext context) =>
      isDark(context) ? darkCardElevated : lightCardMuted;

  static Color border(BuildContext context) =>
      isDark(context) ? Colors.white.withValues(alpha: 0.08) : lightBorder;

  static Color borderStrong(BuildContext context) =>
      isDark(context)
          ? Colors.white.withValues(alpha: 0.14)
          : const Color(0xFFCBD5E1);

  static Color mutedText(BuildContext context) =>
      isDark(context) ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

  static TextStyle tabular(TextStyle base) => base.copyWith(
    fontFeatures: const [FontFeature.tabularFigures()],
  );

  static ThemeData dark() {
    const colorScheme = ColorScheme.dark(
      primary: emerald,
      secondary: emeraldBright,
      tertiary: gold,
      surface: darkSurface,
      error: danger,
      onPrimary: Color(0xFF021A11),
      onSurface: Color(0xFFF1F5F9),
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: darkBg,
      dividerColor: Colors.white.withValues(alpha: 0.08),
      dividerTheme: DividerThemeData(
        color: Colors.white.withValues(alpha: 0.08),
        thickness: 1,
        space: 1,
      ),
      textTheme: const TextTheme(
        headlineMedium: TextStyle(
          fontWeight: FontWeight.w900,
          letterSpacing: -0.6,
          color: Color(0xFFF8FAFC),
        ),
        headlineSmall: TextStyle(
          fontWeight: FontWeight.w800,
          letterSpacing: -0.5,
          color: Color(0xFFF8FAFC),
        ),
        titleLarge: TextStyle(
          fontWeight: FontWeight.w800,
          letterSpacing: -0.4,
          color: Color(0xFFF8FAFC),
        ),
        titleMedium: TextStyle(
          fontWeight: FontWeight.w700,
          letterSpacing: -0.2,
          color: Color(0xFFF1F5F9),
        ),
        bodyMedium: TextStyle(color: Color(0xFFE2E8F0)),
        bodySmall: TextStyle(color: Color(0xFF94A3B8), fontSize: 12.5),
        labelSmall: TextStyle(
          color: Color(0xFF94A3B8),
          letterSpacing: 0.5,
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: darkSurface,
        foregroundColor: const Color(0xFFF8FAFC),
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleSpacing: 16,
        shape: Border(
          bottom: BorderSide(color: Colors.white.withValues(alpha: 0.07)),
        ),
      ),
      cardTheme: CardThemeData(
        color: darkCard,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: Colors.white.withValues(alpha: 0.08)),
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: darkSurface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
        ),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: darkSurface,
        surfaceTintColor: Colors.transparent,
        modalBackgroundColor: darkSurface,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: darkBg,
        hintStyle: const TextStyle(color: Color(0xFF64748B), fontSize: 14),
        labelStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13.5),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: emerald, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: danger, width: 1.2),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: emerald,
          foregroundColor: const Color(0xFF022015),
          elevation: 0,
          textStyle: const TextStyle(
            fontWeight: FontWeight.w800,
            letterSpacing: -0.1,
            fontSize: 14,
          ),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: const Color(0xFFE2E8F0),
          side: BorderSide(color: Colors.white.withValues(alpha: 0.14)),
          textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: emeraldBright,
          textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: emerald,
        foregroundColor: const Color(0xFF022015),
        elevation: 4,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        extendedTextStyle: const TextStyle(
          fontWeight: FontWeight.w800,
          letterSpacing: -0.1,
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: darkCard,
        selectedColor: emerald.withValues(alpha: 0.18),
        disabledColor: darkSurface,
        checkmarkColor: emeraldBright,
        side: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
        labelStyle: const TextStyle(
          fontSize: 12.5,
          fontWeight: FontWeight.w700,
          color: Color(0xFFE2E8F0),
        ),
        secondaryLabelStyle: const TextStyle(
          fontSize: 12.5,
          fontWeight: FontWeight.w800,
          color: emeraldBright,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        contentTextStyle: const TextStyle(
          fontWeight: FontWeight.w700,
          color: Colors.white,
        ),
      ),
      tabBarTheme: TabBarThemeData(
        indicatorColor: emerald,
        labelColor: emeraldBright,
        unselectedLabelColor: const Color(0xFF94A3B8),
        dividerColor: Colors.white.withValues(alpha: 0.08),
        labelStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
        unselectedLabelStyle: const TextStyle(
          fontWeight: FontWeight.w600,
          fontSize: 13,
        ),
      ),
      popupMenuTheme: PopupMenuThemeData(
        color: darkCardElevated,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
        ),
      ),
    );
  }

  static ThemeData light() {
    const colorScheme = ColorScheme.light(
      primary: emeraldDark,
      secondary: emerald,
      tertiary: gold,
      surface: lightSurface,
      error: danger,
      onPrimary: Colors.white,
      onSurface: Color(0xFF0F172A),
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: lightBg,
      dividerColor: lightBorder,
      dividerTheme: const DividerThemeData(
        color: lightBorder,
        thickness: 1,
        space: 1,
      ),
      textTheme: const TextTheme(
        headlineMedium: TextStyle(
          fontWeight: FontWeight.w900,
          letterSpacing: -0.6,
          color: Color(0xFF0F172A),
        ),
        headlineSmall: TextStyle(
          fontWeight: FontWeight.w800,
          letterSpacing: -0.5,
          color: Color(0xFF0F172A),
        ),
        titleLarge: TextStyle(
          fontWeight: FontWeight.w800,
          letterSpacing: -0.4,
          color: Color(0xFF0F172A),
        ),
        titleMedium: TextStyle(
          fontWeight: FontWeight.w700,
          letterSpacing: -0.2,
          color: Color(0xFF0F172A),
        ),
        bodyMedium: TextStyle(color: Color(0xFF1E293B)),
        bodySmall: TextStyle(color: Color(0xFF64748B), fontSize: 12.5),
        labelSmall: TextStyle(
          color: Color(0xFF64748B),
          letterSpacing: 0.5,
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: lightSurface,
        foregroundColor: Color(0xFF0F172A),
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleSpacing: 16,
        shape: Border(
          bottom: BorderSide(color: lightBorder),
        ),
      ),
      cardTheme: CardThemeData(
        color: lightSurface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: lightBorder),
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: lightSurface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: lightBorder),
        ),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: lightSurface,
        surfaceTintColor: Colors.transparent,
        modalBackgroundColor: lightSurface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: lightCardMuted,
        hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 14),
        labelStyle: const TextStyle(color: Color(0xFF475569), fontSize: 13.5),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: lightBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: lightBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: emeraldDark, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: danger, width: 1.2),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: emeraldDark,
          foregroundColor: Colors.white,
          elevation: 0,
          textStyle: const TextStyle(
            fontWeight: FontWeight.w800,
            letterSpacing: -0.1,
            fontSize: 14,
          ),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: const Color(0xFF0F172A),
          side: const BorderSide(color: Color(0xFFCBD5E1)),
          textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: emeraldDark,
          textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: emeraldDark,
        foregroundColor: Colors.white,
        elevation: 3,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        extendedTextStyle: const TextStyle(
          fontWeight: FontWeight.w800,
          letterSpacing: -0.1,
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: lightSurface,
        selectedColor: emeraldDark.withValues(alpha: 0.12),
        disabledColor: lightBg,
        checkmarkColor: emeraldDark,
        side: const BorderSide(color: lightBorder),
        labelStyle: const TextStyle(
          fontSize: 12.5,
          fontWeight: FontWeight.w700,
          color: Color(0xFF334155),
        ),
        secondaryLabelStyle: const TextStyle(
          fontSize: 12.5,
          fontWeight: FontWeight.w800,
          color: emeraldDark,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      tabBarTheme: const TabBarThemeData(
        indicatorColor: emeraldDark,
        labelColor: emeraldDark,
        unselectedLabelColor: Color(0xFF64748B),
        dividerColor: lightBorder,
        labelStyle: TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
        unselectedLabelStyle: TextStyle(
          fontWeight: FontWeight.w600,
          fontSize: 13,
        ),
      ),
      popupMenuTheme: PopupMenuThemeData(
        color: lightSurface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: const BorderSide(color: lightBorder),
        ),
      ),
    );
  }
}
