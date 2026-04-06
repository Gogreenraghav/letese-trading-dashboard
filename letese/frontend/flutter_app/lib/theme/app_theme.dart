/// LETESE — The Elevated Advocate Design System
/// Lattice Design: Sky Blue + White Glassmorphism
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// ── Brand Colors ────────────────────────────────────────────────────────────

class LatticeColors {
  // Brand
  static const primary    = Color(0xFF5070E0);
  static const primaryLo = Color(0xFF4060D0);
  static const skyTop    = Color(0xFFB0C0F0);
  static const skyBot    = Color(0xFF3050B0);
  static const green     = Color(0xFF59FEAE);  // Advocate Pulse dot
  static const greenDark = Color(0xFF40C882);

  // Surface — elevated layers
  static const bgBase    = Color(0xFFF0F3FA);  // Scaffold background
  static const glass     = Color(0xCCFFFFFF);  // 80% white glass (from screenshots)
  static const glassHi   = Color(0xE6FFFFFF);  // 90% white — floating elements
  static const glassDim  = Color(0xD9FFFFFF);  // 85% white — subtle

  // Text
  static const text    = Color(0xFF1A1D26);
  static const textSec  = Color(0xFF5A6070);
  static const textDim  = Color(0xFF8B92A0);
  static const textInv  = Color(0xFFFFFFFF);

  // Semantic
  static const success  = greenDark;
  static const successBg= Color(0x1A52F9A9);
  static const error    = Color(0xFFB41340);
  static const errorBg  = Color(0x1AB41340);
  static const warn     = Color(0xFFFFB547);
  static const warnBg   = Color(0x1AFFB547);

  // Status chips
  static const chipLive    = Color(0xFFB41340);  // red
  static const chipPending = Color(0xFF2B51C7);  // blue
  static const chipDone    = Color(0xFF1DB86E);  // green

  // Shadows — tinted with primary blue
  static const shadow = Color(0x0D5070E0);  // 5% primary blue tint
  static const shadowMd= Color(0x145070E0);  // 12% primary tint
  static const shadowLg= Color(0x1E5070E0);  // 16% primary tint
  static const shadowXl= Color(0x285070E0);  // 20% primary tint

  // Quick action accent colors
  static const qaNew  = Color(0xFF2B51C7);
  static const qaAI   = Color(0xFF1DB86E);
  static const qaSrch = Color(0xFF0E9AA7);
  static const qaTask = Color(0xFF8B5CF6);
}

// ── Typography ───────────────────────────────────────────────────────────────

class Txt {
  // Headlines — Manrope
  static displayLG(String s, {Color? c}) => GoogleFonts.manrope(
    s, fontSize: 32, fontWeight: FontWeight.w800, color: c ?? LatticeColors.text, letterSpacing: -0.5);
  static displayMD(String s, {Color? c}) => GoogleFonts.manrope(
    s, fontSize: 28, fontWeight: FontWeight.w800, color: c ?? LatticeColors.text, letterSpacing: -0.3);
  static headlineLG(String s, {Color? c}) => GoogleFonts.manrope(
    s, fontSize: 22, fontWeight: FontWeight.w700, color: c ?? LatticeColors.text);
  static headlineMD(String s, {Color? c}) => GoogleFonts.manrope(
    s, fontSize: 18, fontWeight: FontWeight.w700, color: c ?? LatticeColors.text);
  static headlineSM(String s, {Color? c}) => GoogleFonts.manrope(
    s, fontSize: 16, fontWeight: FontWeight.w700, color: c ?? LatticeColors.text);

  // Body — Inter
  static bodyLG(String s, {Color? c, FontWeight? w}) => GoogleFonts.inter(
    s, fontSize: 15, fontWeight: w ?? FontWeight.w400, color: c ?? LatticeColors.text, height: 1.6);
  static bodyMD(String s, {Color? c, FontWeight? w}) => GoogleFonts.inter(
    s, fontSize: 13, fontWeight: w ?? FontWeight.w400, color: c ?? LatticeColors.textSec, height: 1.5);
  static bodySM(String s, {Color? c, FontWeight? w}) => GoogleFonts.inter(
    s, fontSize: 12, fontWeight: w ?? FontWeight.w400, color: c ?? LatticeColors.textDim, height: 1.4);

  // Labels — Inter SemiBold
  static label(String s, {Color? c}) => GoogleFonts.inter(
    s, fontSize: 12, fontWeight: FontWeight.w600, color: c ?? LatticeColors.textSec, letterSpacing: 0.4);
  static labelSM(String s, {Color? c}) => GoogleFonts.inter(
    s, fontSize: 11, fontWeight: FontWeight.w600, color: c ?? LatticeColors.textDim, letterSpacing: 0.3);

  // Button — Manrope Bold
  static btn(String s) => GoogleFonts.manrope(
    s, fontSize: 14, fontWeight: FontWeight.w700, letterSpacing: 0.8);
}

// ── Elevated Advocate Shadow System ───────────────────────────────────────────

class ElevShadow {
  /// Most elevated — hero cards
  static List<BoxShadow> xl(Color tint) => [
    BoxShadow(color: tint.withAlpha(32), blurRadius: 32, offset: const Offset(0, 12), spreadRadius: -4),
    BoxShadow(color: tint.withAlpha(16), blurRadius: 16, offset: const Offset(0, 6)),
  ];

  /// Card-level elevation
  static List<BoxShadow> lg(Color tint) => [
    BoxShadow(color: tint.withAlpha(22), blurRadius: 24, offset: const Offset(0, 8), spreadRadius: -2),
    BoxShadow(color: tint.withAlpha(10), blurRadius: 8, offset: const Offset(0, 3)),
  ];

  /// Standard card
  static List<BoxShadow> md(Color tint) => [
    BoxShadow(color: tint.withAlpha(18), blurRadius: 16, offset: const Offset(0, 4), spreadRadius: -1),
    BoxShadow(color: tint.withAlpha(8), blurRadius: 6, offset: const Offset(0, 2)),
  ];

  /// Floating row / list item
  static List<BoxShadow> sm(Color tint) => [
    BoxShadow(color: tint.withAlpha(14), blurRadius: 12, offset: const Offset(0, 3)),
    BoxShadow(color: tint.withAlpha(6), blurRadius: 4, offset: const Offset(0, 1)),
  ];

  /// Subtle — chips, tags
  static List<BoxShadow> xs(Color tint) => [
    BoxShadow(color: tint.withAlpha(10), blurRadius: 8, offset: const Offset(0, 2)),
  ];

  /// Input focus glow
  static List<BoxShadow> focus(Color tint) => [
    BoxShadow(color: tint.withAlpha(40), blurRadius: 20, offset: Offset.zero, spreadRadius: 2),
    BoxShadow(color: tint.withAlpha(20), blurRadius: 10, offset: Offset.zero),
  ];
}

// ── Advocate Pulse Dot ──────────────────────────────────────────────────────

class AdvocatePulse extends StatefulWidget {
  final Color color;
  final double size;
  final bool animate;
  const AdvocatePulse({super.key, required this.color, this.size = 8, this.animate = true});

  @override
  State<AdvocatePulse> createState() => _AdvocatePulseState();
}

class _AdvocatePulseState extends State<AdvocatePulse> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(duration: const Duration(milliseconds: 1400), vsync: this)..repeat();
    _anim = Tween<double>(begin: 0.4, end: 1.0).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    if (!widget.animate) {
      return Container(
        width: widget.size, height: widget.size,
        decoration: BoxDecoration(color: widget.color, shape: BoxShape.circle),
      );
    }
    return AnimatedBuilder(animation: _anim, builder: (_, __) {
      return Container(
        width: widget.size, height: widget.size,
        decoration: BoxDecoration(
          color: widget.color,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(color: widget.color.withAlpha((_anim.value * 120).toInt()), blurRadius: _anim.value * 8),
          ],
        ),
      );
    });
  }
}

// ── Glass Card — Elevated Advocate ──────────────────────────────────────────

class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsets? pad;
  final double? w, h;
  final double radius;
  final VoidCallback? onTap;
  final Color? glassColor;
  final Color tintColor;  // Shadow tint — pass primary blue for branded look
  final List<BoxShadow>? customShadow;

  const GlassCard({
    super.key,
    required this.child,
    this.pad,
    this.w, this.h,
    this.radius = 20,
    this.onTap,
    this.glassColor,
    this.tintColor = LatticeColors.primary,
    this.customShadow,
  });

  /// Hero / most elevated card
  factory GlassCard.hero({required Widget child, EdgeInsets? pad, VoidCallback? onTap}) =>
    GlassCard(child: child, pad: pad ?? const EdgeInsets.all(20), onTap: onTap, radius: 24,
      tintColor: LatticeColors.primary, customShadow: ElevShadow.xl(LatticeColors.primary));

  /// Standard card
  factory GlassCard.std({required Widget child, EdgeInsets? pad, VoidCallback? onTap}) =>
    GlassCard(child: child, pad: pad ?? const EdgeInsets.all(16), onTap: onTap, radius: 16,
      tintColor: LatticeColors.primary, customShadow: ElevShadow.lg(LatticeColors.primary));

  /// Compact card — smaller padding
  factory GlassCard.cmp({required Widget child, EdgeInsets? pad, VoidCallback? onTap}) =>
    GlassCard(child: child, pad: pad ?? const EdgeInsets.all(12), onTap: onTap, radius: 14,
      tintColor: LatticeColors.primary, customShadow: ElevShadow.md(LatticeColors.primary));

  @override
  Widget build(BuildContext context) {
    final shadow = customShadow ?? ElevShadow.lg(tintColor);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: w, height: h,
        padding: pad ?? const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: glassColor ?? LatticeColors.glassHi,
          borderRadius: BorderRadius.circular(radius),
          boxShadow: shadow,
        ),
        child: child,
      ),
    );
  }
}

// ── Floating Row — for list items, no solid border ─────────────────────────

class FloatingRow extends StatelessWidget {
  final Widget child;
  final EdgeInsets? pad;
  final double radius;
  final Color tintColor;
  final VoidCallback? onTap;
  final Color? accentColor;  // left accent bar
  final double accentWidth;

  const FloatingRow({
    super.key,
    required this.child,
    this.pad,
    this.radius = 14,
    this.tintColor = LatticeColors.primary,
    this.onTap,
    this.accentColor,
    this.accentWidth = 4,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: pad ?? const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: LatticeColors.glassHi,
          borderRadius: BorderRadius.circular(radius),
          boxShadow: ElevShadow.sm(tintColor),
        ),
        child: Row(
          children: [
            if (accentColor != null)
              Container(width: accentWidth, height: 44, margin: const EdgeInsets.only(right: 14),
                decoration: BoxDecoration(
                  color: accentColor,
                  borderRadius: BorderRadius.circular(2),
                )),
            Expanded(child: child),
          ],
        ),
      ),
    );
  }
}

// ── Status Chip — Advocate Pulse Style ──────────────────────────────────────

class StatusChip extends StatelessWidget {
  final String label;
  final Color color;
  final bool showPulse;
  final bool outlined;

  const StatusChip({super.key, required this.label, required this.color,
    this.showPulse = true, this.outlined = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: outlined ? Colors.transparent : color.withAlpha(20),
        borderRadius: BorderRadius.circular(100),
        border: Border.all(color: color.withAlpha(outlined ? 180 : 80)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (showPulse) ...[
            AdvocatePulse(color: color, size: 6, animate: false),
            const SizedBox(width: 6),
          ],
          Text(label, style: GoogleFonts.inter(
            fontSize: 11, fontWeight: FontWeight.w700, color: color, letterSpacing: 0.5)),
        ],
      ),
    );
  }
}

// ── Pill Button — full rounded ──────────────────────────────────────────────

class PillBtn extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  final Color? bg, fg;
  final IconData? icon;
  final bool outlined;

  const PillBtn({super.key, required this.label, this.onTap, this.bg, this.fg, this.icon, this.outlined = false});

  @override
  Widget build(BuildContext context) {
    final isPrimary = bg == null && !outlined;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        decoration: BoxDecoration(
          color: outlined
              ? Colors.transparent
              : (bg ?? LatticeColors.primary),
          borderRadius: BorderRadius.circular(100),
          border: outlined ? Border.all(color: bg ?? LatticeColors.primary, width: 1.5) : null,
          boxShadow: isPrimary ? ElevShadow.xs(LatticeColors.primary) : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 16, color: fg ?? Colors.white),
              const SizedBox(width: 6),
            ],
            Text(label, style: Txt.btn().copyWith(
              color: outlined ? (bg ?? LatticeColors.primary) : (fg ?? Colors.white))),
          ],
        ),
      ),
    );
  }
}

// ── Pill Input — full rounded ───────────────────────────────────────────────

class PillInput extends StatelessWidget {
  final String? hint;
  final IconData? prefix;
  final TextEditingController? ctrl;
  final ValueChanged<String>? onChanged;
  final bool obscure;
  final Widget? suffix;

  const PillInput({super.key, this.hint, this.prefix, this.ctrl,
    this.onChanged, this.obscure = false, this.suffix});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: LatticeColors.glass,
        borderRadius: BorderRadius.circular(100),
        boxShadow: ElevShadow.sm(LatticeColors.primary),
      ),
      child: TextField(
        controller: ctrl,
        obscureText: obscure,
        onChanged: onChanged,
        style: GoogleFonts.inter(fontSize: 14, color: LatticeColors.text),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: GoogleFonts.inter(fontSize: 14, color: LatticeColors.textDim),
          prefixIcon: prefix != null ? Icon(prefix, color: LatticeColors.primary, size: 20) : null,
          suffixIcon: suffix,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(100), borderSide: BorderSide.none),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(100), borderSide: BorderSide.none),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(100),
            borderSide: BorderSide.none,
          ),
          filled: false,
          contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        ),
      ),
    );
  }
}

// ── Quick Action Card ───────────────────────────────────────────────────────

class QACard extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback? onTap;

  const QACard({super.key, required this.icon, required this.label, required this.color, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: LatticeColors.glassHi,
          borderRadius: BorderRadius.circular(16),
          boxShadow: ElevShadow.md(color),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 48, height: 48,
              decoration: BoxDecoration(color: color.withAlpha(20), shape: BoxShape.circle),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(height: 8),
            Text(label, style: Txt.bodySM(LatticeColors.textSec, w: FontWeight.w600), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}

// ── Sky Gradient Scaffold ──────────────────────────────────────────────────

class SkyScaffold extends StatelessWidget {
  final Widget body;
  final PreferredSizeWidget? appBar;
  final Widget? bottomNav;

  const SkyScaffold({super.key, required this.body, this.appBar, this.bottomNav});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: LatticeColors.bgBase,
      appBar: appBar,
      body: Stack(
        children: [
          Positioned(
            top: 0, left: 0, right: 0,
            child: Container(
              height: 220,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter, end: Alignment.bottomCenter,
                  colors: [LatticeColors.skyTop, LatticeColors.skyBot],
                ),
              ),
            ),
          ),
          body,
        ],
      ),
      bottomNavigationBar: bottomNav,
    );
  }
}

// ── App Theme ───────────────────────────────────────────────────────────────

class AppTheme {
  static ThemeData get light => ThemeData(
    brightness: Brightness.light,
    scaffoldBackgroundColor: LatticeColors.bgBase,
    primaryColor: LatticeColors.primary,
    colorScheme: const ColorScheme.light(
      primary: LatticeColors.primary,
      secondary: LatticeColors.skyTop,
      tertiary: LatticeColors.qaTask,
      surface: LatticeColors.glass,
      onSurface: LatticeColors.text,
      error: LatticeColors.error,
    ),
    cardTheme: CardTheme(
      color: LatticeColors.glassHi,
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: LatticeColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
        textStyle: Txt.btn(),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: LatticeColors.primary,
        side: const BorderSide(color: LatticeColors.primary, width: 1.5),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: false,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(100), borderSide: BorderSide.none),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(100), borderSide: BorderSide.none),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(100),
        borderSide: BorderSide.none,
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      hintStyle: GoogleFonts.inter(fontSize: 14, color: LatticeColors.textDim),
    ),
    textTheme: TextTheme(
      displayLarge: GoogleFonts.manrope(fontSize: 32, fontWeight: FontWeight.w800, color: LatticeColors.text, letterSpacing: -0.5),
      displayMedium: GoogleFonts.manrope(fontSize: 28, fontWeight: FontWeight.w800, color: LatticeColors.text, letterSpacing: -0.3),
      headlineLarge: GoogleFonts.manrope(fontSize: 22, fontWeight: FontWeight.w700, color: LatticeColors.text),
      headlineMedium: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700, color: LatticeColors.text),
      headlineSmall: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w700, color: LatticeColors.text),
      titleLarge: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w600, color: LatticeColors.text),
      bodyLarge: GoogleFonts.inter(fontSize: 15, color: LatticeColors.text, height: 1.6),
      bodyMedium: GoogleFonts.inter(fontSize: 13, color: LatticeColors.textSec, height: 1.5),
      bodySmall: GoogleFonts.inter(fontSize: 12, color: LatticeColors.textDim, height: 1.4),
      labelLarge: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: LatticeColors.textSec, letterSpacing: 0.4),
      labelSmall: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: LatticeColors.textDim, letterSpacing: 0.3),
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: Colors.transparent,
      elevation: 0,
      titleTextStyle: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700, color: LatticeColors.text),
      iconTheme: const IconThemeData(color: LatticeColors.text),
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: LatticeColors.glassHi,
      selectedItemColor: LatticeColors.primary,
      unselectedItemColor: LatticeColors.textDim,
      type: BottomNavigationBarType.fixed,
      elevation: 0,
    ),
    dividerTheme: DividerThemeData(
      color: LatticeColors.textDim.withAlpha(20),
      thickness: 1,
    ),
  );
}

// ── Legacy Aliases (for existing screens) ───────────────────────────────────

class AppColors {
  static const bgObsidian = Color(0xFF0A0E1A);
  static const bgSurface  = Color(0xFFF0F3FA);  // maps to new bgBase
  static const bgElevated = Color(0xFFF8FAFF);
  static const bgBorder   = Color(0xFFE8EBF5);
  static const brandBlue  = Color(0xFF2B51C7);
  static const brandBlueLight = Color(0xFF3B6FDF);
  static const brandGreen = Color(0xFF52F9A9);
  static const neonCyan  = Color(0xFF00D4FF);
  static const electricPurple = Color(0xFF8B5CF6);
  static const textPrimary = Color(0xFF1A1D26);
  static const textSecondary = Color(0xFF5A6070);
  static const textTertiary = Color(0xFF8B92A0);
  static const urgent  = Color(0xFFB41340);
  static const error  = Color(0xFFB41340);
  static const warning = Color(0xFFFFB547);
  static const success = Color(0xFF1DB86E);
  static const successBg = Color(0x1A52F9A9);
  static const errorBg   = Color(0x1AB41340);
  static const warningBg = Color(0x1AFFB547);
}

// Keep GlassCard name for existing code
typedef GlassCard2 = GlassCard;
