import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  static const bg = Color(0xFF0A0E1A);
  static const card = Color(0xFF1E293B);
  static const cardLight = Color(0xFF334155);
  static const green = Color(0xFF22C55E);
  static const red = Color(0xFFEF4444);
  static const blue = Color(0xFF3B82F6);
  static const amber = Color(0xFFF59E0B);
  static const purple = Color(0xFF8B5CF6);
  static const text = Color(0xFFE2E8F0);
  static const textDim = Color(0xFF94A3B8);
  static const textMuted = Color(0xFF64748B);

  static ThemeData get dark => ThemeData(
    brightness: Brightness.dark,
    scaffoldBackgroundColor: bg,
    primaryColor: blue,
    colorScheme: const ColorScheme.dark(
      primary: blue,
      secondary: green,
      error: red,
      surface: card,
    ),
    textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme).apply(
      bodyColor: text,
      displayColor: text,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: bg,
      elevation: 0,
      centerTitle: false,
    ),
    cardTheme: const CardThemeData(
      color: card,
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(16))),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: blue,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        textStyle: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 15),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: cardLight.withOpacity(0.3),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: cardLight.withOpacity(0.5)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: blue, width: 2),
      ),
      hintStyle: const TextStyle(color: textMuted),
      labelStyle: const TextStyle(color: textDim),
    ),
  );
}
