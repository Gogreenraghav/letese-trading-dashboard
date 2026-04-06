/// LETESE● App Theme — Lattice Design System (Light Theme)
/// Matches: Stitch design system — sky blue, glass cards, premium feel
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// ── Lattice Colors ───────────────────────────────────────────────────────────

class LatticeColors {
  // Brand
  static const primary = Color(0xFF2B51C7);
  static const primaryLight = Color(0xFF3B6FDF);
  static const skyTop = Color(0xFF819BFF);
  static const skyBottom = Color(0xFF2B51C7);

  // Surface
  static const background = Color(0xFFF4F6FB);
  static const surface = Color(0xFFFFFFFF);
  static const surfaceElevated = Color(0xFFF8FAFF);
  static const cardBorder = Color(0xFFE8EBF5);

  // Text
  static const textPrimary = Color(0xFF2C2F33);
  static const textSecondary = Color(0xFF585C60);
  static const textTertiary = Color(0xFF8A8F99);

  // Semantic
  static const success = Color(0xFF52F9A9);
  static const successDark = Color(0xFF1DB86E);
  static const successBg = Color(0x1A52F9A9);
  static const error = Color(0xFFB41340);
  static const errorBg = Color(0x1AB41340);
  static const warning = Color(0xFFFFB547);
  static const warningBg = Color(0x1AFFB547);
  static const info = Color(0xFF2B51C7);

  // Status chips
  static const liveRed = Color(0xFFB41340);
  static const pendingBlue = Color(0xFF2B51C7);
  static const doneGreen = Color(0xFF1DB86E);

  // Quick action colors
  static const actionNewCase = Color(0xFF2B51C7);
  static const actionAiDraft = Color(0xFF1DB86E);
  static const actionSearch = Color(0xFF0E9AA7);
  static const actionTasks = Color(0xFF8B5CF6);

  // Shadow
  static const shadow = Color(0x0D000000);
  static const shadowMedium = Color(0x14000000);
}

// ── App Theme (Light) ────────────────────────────────────────────────────────

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      brightness: Brightness.light,
      scaffoldBackgroundColor: LatticeColors.background,
      primaryColor: LatticeColors.primary,
      colorScheme: const ColorScheme.light(
        primary: LatticeColors.primary,
        secondary: LatticeColors.skyTop,
        tertiary: Color(0xFF8B5CF6),
        surface: LatticeColors.surface,
        onSurface: LatticeColors.textPrimary,
        error: LatticeColors.error,
      ),
      cardTheme: CardTheme(
        color: LatticeColors.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: LatticeColors.cardBorder, width: 1),
        ),
        elevation: 0,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: LatticeColors.primary,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
          textStyle: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14),
          elevation: 0,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: LatticeColors.primary,
          side: const BorderSide(color: LatticeColors.primary, width: 1.5),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: LatticeColors.primary,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: LatticeColors.surface,
        hintStyle: GoogleFonts.inter(color: LatticeColors.textTertiary, fontSize: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: LatticeColors.cardBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: LatticeColors.cardBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: LatticeColors.primary, width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      textTheme: TextTheme(
        displayLarge: GoogleFonts.manrope(fontSize: 56, fontWeight: FontWeight.w700, color: LatticeColors.textPrimary),
        headlineLarge: GoogleFonts.manrope(fontSize: 36, fontWeight: FontWeight.w700, color: LatticeColors.textPrimary),
        headlineMedium: GoogleFonts.manrope(fontSize: 28, fontWeight: FontWeight.w700, color: LatticeColors.textPrimary),
        titleLarge: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w600, color: LatticeColors.textPrimary),
        titleMedium: GoogleFonts.inter(fontSize: 17, fontWeight: FontWeight.w500, color: LatticeColors.textPrimary),
        bodyLarge: GoogleFonts.inter(fontSize: 15, color: LatticeColors.textPrimary, height: 1.7),
        bodyMedium: GoogleFonts.inter(fontSize: 13, color: LatticeColors.textSecondary, height: 1.6),
        labelLarge: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: LatticeColors.textPrimary),
        labelSmall: GoogleFonts.inter(fontSize: 11, color: LatticeColors.textTertiary),
      ),
      dividerTheme: const DividerThemeData(color: LatticeColors.cardBorder, thickness: 1),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700, color: LatticeColors.textPrimary),
        iconTheme: const IconThemeData(color: LatticeColors.textPrimary),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: LatticeColors.surface,
        selectedItemColor: LatticeColors.primary,
        unselectedItemColor: LatticeColors.textTertiary,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
      ),
    );
  }
}

// ── Glass Card (Light) ────────────────────────────────────────────────────────

class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsets? padding;
  final double? width;
  final double? height;
  final VoidCallback? onTap;
  final Color? borderColor;
  final double borderRadius;

  const GlassCard({
    super.key,
    required this.child,
    this.padding,
    this.width,
    this.height,
    this.onTap,
    this.borderColor,
    this.borderRadius = 16,
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
          color: LatticeColors.surface,
          borderRadius: BorderRadius.circular(borderRadius),
          border: Border.all(
            color: borderColor ?? LatticeColors.cardBorder,
            width: 1,
          ),
          boxShadow: const [
            BoxShadow(color: LatticeColors.shadow, blurRadius: 16, offset: Offset(0, 4)),
            BoxShadow(color: LatticeColors.shadowMedium, blurRadius: 4, offset: Offset(0, 1)),
          ],
        ),
        child: child,
      ),
    );
  }
}

// ── LETESE Brand Logo Widget (no green dot — uses image) ──────────────────────

class LeteseLogo extends StatelessWidget {
  final double fontSize;
  final bool useImage;
  const LeteseLogo({super.key, this.fontSize = 28, this.useImage = false});

  @override
  Widget build(BuildContext context) {
    if (useImage) {
      return Image.asset(
        'assets/letese_logo.png',
        height: fontSize * 1.2,
        errorBuilder: (_, __, ___) => _textLogo,
      );
    }
    return _textLogo;
  }

  Widget get _textLogo => Text(
    'LETESE',
    style: GoogleFonts.manrope(
      fontSize: fontSize,
      fontWeight: FontWeight.w800,
      color: LatticeColors.primary,
      letterSpacing: 1,
    ),
  );
}

// ── Sky Gradient Scaffold ────────────────────────────────────────────────────

class SkyGradientScaffold extends StatelessWidget {
  final Widget body;
  final PreferredSizeWidget? appBar;
  final Widget? bottomNav;

  const SkyGradientScaffold({
    super.key,
    required this.body,
    this.appBar,
    this.bottomNav,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: LatticeColors.background,
      appBar: appBar,
      body: Stack(
        children: [
          // Sky gradient at top
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: Container(
              height: 200,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [LatticeColors.skyTop, LatticeColors.skyBottom],
                ),
              ),
            ),
          ),
          // Content
          body,
        ],
      ),
      bottomNavigationBar: bottomNav,
    );
  }
}

// ── Urgency Badge (legacy) ───────────────────────────────────────────────────

class UrgencyBadge extends StatelessWidget {
  final String level;
  const UrgencyBadge({super.key, required this.level});

  Color get _color => switch (level) {
    'critical' => LatticeColors.error,
    'high' => LatticeColors.warning,
    'medium' => LatticeColors.warning,
    _ => LatticeColors.successDark,
  };

  String get _label => switch (level) {
    'critical' => '🔴 CRITICAL',
    'high' => '🟡 HIGH',
    'medium' => '🟡 MEDIUM',
    _ => '🟢 LOW',
  };

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

// ── AppColors (legacy alias for existing screens) ─────────────────────────────

class AppColors {
  static const bgObsidian = Color(0xFF0A0E1A);
  static const bgSurface = Color(0xFF0F1629);
  static const bgElevated = Color(0xFF151E38);
  static const bgBorder = Color(0xFF1E2D4A);
  static const brandBlue = Color(0xFF1A4FBF);
  static const brandBlueLight = Color(0xFF3B6FDF);
  static const brandGreen = Color(0xFF22C55E);
  static const neonCyan = Color(0xFF00D4FF);
  static const electricPurple = Color(0xFF8B5CF6);
  static const textPrimary = Color(0xFFF0F4FF);
  static const textSecondary = Color(0xFF8899BB);
  static const textTertiary = Color(0xFF4A5A7A);
  static const urgent = Color(0xFFFF4545);
  static const error = Color(0xFFEF4444);
  static const warning = Color(0xFFF59E0B);
  static const success = Color(0xFF22C55E);
  static const successBg = Color(0x1A22C55E);
  static const errorBg = Color(0x1AEF4444);
  static const warningBg = Color(0x1AF59E0B);
  static const warningBgVal = Color(0x1AF59E0B);
}