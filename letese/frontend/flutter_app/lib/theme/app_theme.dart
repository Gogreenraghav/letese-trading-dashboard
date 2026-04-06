/// LETESE● App Theme — Glassmorphism 2.0 Dark Theme
/// Matches: SYSTEM_MASTER_BLUEPRINT Section 4
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  // Backgrounds
  static const bgObsidian = Color(0xFF0A0E1A);
  static const bgSurface = Color(0xFF0F1629);
  static const bgElevated = Color(0xFF151E38);
  static const bgBorder = Color(0xFF1E2D4A);

  // Brand
  static const brandBlue = Color(0xFF1A4FBF);
  static const brandBlueLight = Color(0xFF3B6FDF);
  static const brandGreen = Color(0xFF22C55E);
  static const brandGreenGlow = Color(0x3322C55E);

  // Neon Accents
  static const neonCyan = Color(0xFF00D4FF);
  static const neonCyanDim = Color(0x2600D4FF);
  static const electricPurple = Color(0xFF8B5CF6);
  static const purpleDim = Color(0x268B5CF6);

  // Semantic
  static const success = brandGreen;
  static const successBg = Color(0x1A22C55E);
  static const warning = Color(0xFFF59E0B);
  static const warningBg = Color(0x1AF59E0B);
  static const error = Color(0xFFEF4444);
  static const errorBg = Color(0x1AEF4444);
  static const info = neonCyan;

  // Text
  static const textPrimary = Color(0xFFF0F4FF);
  static const textSecondary = Color(0xFF8899BB);
  static const textTertiary = Color(0xFF4A5A7A);

  // Urgency
  static const urgent = Color(0xFFFF4545);
  static const medium = warning;
  static const low = brandGreen;
}

class AppTheme {
  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: AppColors.bgObsidian,
      primaryColor: AppColors.brandBlue,
      colorScheme: const ColorScheme.dark(
        primary: AppColors.brandBlue,
        secondary: AppColors.neonCyan,
        tertiary: AppColors.electricPurple,
        surface: AppColors.bgSurface,
        onSurface: AppColors.textPrimary,
        error: AppColors.error,
      ),
      cardTheme: CardTheme(
        color: AppColors.bgSurface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: AppColors.bgBorder, width: 1),
        ),
        elevation: 0,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.brandGreen,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          textStyle: GoogleFonts.inter(fontWeight: FontWeight.w600),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.brandBlueLight,
          side: const BorderSide(color: AppColors.brandBlue, width: 1),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0x0DFFFFFF),
        hintStyle: const TextStyle(color: AppColors.textTertiary),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.bgBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: AppColors.bgBorder.withAlpha(128)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.neonCyan, width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      ),
      textTheme: TextTheme(
        displayLarge: GoogleFonts.inter(fontSize: 56, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
        headlineMedium: GoogleFonts.inter(fontSize: 30, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
        titleLarge: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
        titleMedium: GoogleFonts.inter(fontSize: 17, fontWeight: FontWeight.w500, color: AppColors.textPrimary),
        bodyLarge: GoogleFonts.inter(fontSize: 15, color: AppColors.textPrimary, height: 1.7),
        bodyMedium: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary, height: 1.6),
        labelSmall: GoogleFonts.inter(fontSize: 11, color: AppColors.textTertiary),
      ),
      dividerTheme: const DividerThemeData(color: AppColors.bgBorder, thickness: 1),
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.bgObsidian,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
        iconTheme: const IconThemeData(color: AppColors.textPrimary),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.bgSurface,
        selectedItemColor: AppColors.neonCyan,
        unselectedItemColor: AppColors.textTertiary,
        type: BottomNavigationBarType.fixed,
      ),
    );
  }
}

/// Glass Card — glassmorphism component
class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsets? padding;
  final double? width;
  final double? height;
  final VoidCallback? onTap;

  const GlassCard({
    super.key,
    required this.child,
    this.padding,
    this.width,
    this.height,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: width,
        height: height,
        padding: padding ?? const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white.withAlpha(13),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withAlpha(31), width: 1),
          boxShadow: const [
            BoxShadow(color: Color(0x66000000), blurRadius: 32, offset: Offset(0, 8)),
            BoxShadow(color: Color(0x14FFFFFF), blurRadius: 1, offset: Offset(0, 1)),
          ],
        ),
        child: child,
      ),
    );
  }
}

/// LETESE Brand Logo Widget
class LeteseLogo extends StatelessWidget {
  final double fontSize;
  const LeteseLogo({super.key, this.fontSize = 28});

  @override
  Widget build(BuildContext context) {
    return RichText(
      text: TextSpan(
        children: [
          TextSpan(
            text: 'LETESE',
            style: GoogleFonts.inter(
              fontSize: fontSize,
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
          ),
          WidgetSpan(
            alignment: PlaceholderAlignment.belowBaseline,
            baseline: TextBaseline.alphabetic,
            child: Transform.translate(
              offset: Offset(0, fontSize * 0.15),
              child: Text(
                '●',
                style: TextStyle(
                  fontSize: fontSize * 0.44,
                  color: AppColors.brandGreen,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Urgency Badge
class UrgencyBadge extends StatelessWidget {
  final String level; // critical | high | medium | low
  const UrgencyBadge({super.key, required this.level});

  Color get _color {
    return switch (level) {
      'critical' => AppColors.urgent,
      'high' => AppColors.warning,
      'medium' => AppColors.medium,
      _ => AppColors.low,
    };
  }

  String get _label {
    return switch (level) {
      'critical' => '🔴 CRITICAL',
      'high' => '🟡 HIGH',
      'medium' => '🟡 MEDIUM',
      _ => '🟢 LOW',
    };
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: _color.withAlpha(26),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: _color.withAlpha(77)),
      ),
      child: Text(_label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: _color)),
    );
  }
}
