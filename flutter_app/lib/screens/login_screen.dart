import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import '../theme.dart';
import 'register_screen.dart';
import 'dashboard_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passController = TextEditingController();
  bool _loading = false;
  String? _error;
  final _api = ApiService();

  Future<void> _login() async {
    setState(() { _loading = true; _error = null; });
    try {
      final data = await _api.login(_emailController.text.trim(), _passController.text);
      if (data['success'] == true) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', data['token']);
        await prefs.setString('user', data['user']['name'] ?? '');
        if (mounted) Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const DashboardScreen()));
      } else {
        setState(() => _error = data['error'] ?? 'Login failed');
      }
    } catch (e) {
      setState(() => _error = 'Server error. Try again.');
    }
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 40),
              Center(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _box(Colors.red, 'L'),
                    const SizedBox(width: 8),
                    _box(AppTheme.amber, 'E'),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              const Text('LETESE Trading', textAlign: TextAlign.center, style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: Colors.white)),
              const Text('Legal & Trading Automation', textAlign: TextAlign.center, style: TextStyle(fontSize: 13, color: AppTheme.textDim)),
              const SizedBox(height: 48),
              const Text('Welcome back', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: Colors.white)),
              const SizedBox(height: 6),
              const Text('Sign in to your account', style: TextStyle(color: AppTheme.textDim)),
              const SizedBox(height: 32),
              if (_error != null) Container(
                padding: const EdgeInsets.all(12), margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(color: AppTheme.red.withOpacity(0.1), borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.red.withOpacity(0.3))),
                child: Text(_error!, style: const TextStyle(color: AppTheme.red, fontSize: 13)),
              ),
              TextField(controller: _emailController, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email', hintText: 'you@example.com', prefixIcon: Icon(Icons.email_outlined))),
              const SizedBox(height: 16),
              TextField(controller: _passController, obscureText: true, decoration: const InputDecoration(labelText: 'Password', prefixIcon: Icon(Icons.lock_outline))),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _loading ? null : _login,
                child: _loading
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Sign In'),
              ),
              const SizedBox(height: 20),
              TextButton(
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const RegisterScreen())),
                child: const Text.rich(
                  TextSpan(text: "Don't have an account? ", style: TextStyle(color: AppTheme.textDim),
                    children: [TextSpan(text: 'Register', style: TextStyle(color: AppTheme.blue, fontWeight: FontWeight.w600))]),
                ),
              ),
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: AppTheme.blue.withOpacity(0.08), borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.blue.withOpacity(0.2))),
                child: const Column(
                  children: [
                    Text('Admin Demo', style: TextStyle(color: AppTheme.blue, fontWeight: FontWeight.w600, fontSize: 12)),
                    SizedBox(height: 4),
                    Text('admin@letese.com / admin123', style: TextStyle(color: AppTheme.textDim, fontSize: 11, fontFamily: 'monospace')),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _box(Color color, String letter) => Container(
    width: 40, height: 40, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(10)),
    child: Center(child: Text(letter, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 22))),
  );
}
