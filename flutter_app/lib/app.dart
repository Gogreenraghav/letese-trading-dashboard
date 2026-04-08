import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'theme.dart';

class LeteseApp extends StatelessWidget {
  final SharedPreferences prefs;
  const LeteseApp({super.key, required this.prefs});

  @override
  Widget build(BuildContext context) {
    final token = prefs.getString('token');
    return MaterialApp(
      title: 'LETESE Trading',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark,
      home: token != null ? const DashboardScreen() : const LoginScreen(),
    );
  }
}
