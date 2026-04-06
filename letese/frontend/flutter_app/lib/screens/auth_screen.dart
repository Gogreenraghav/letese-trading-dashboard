/// LETESE● Authentication Screens
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController();
  bool _otpSent = false;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _sendOtp() async {
    final email = _emailController.text.trim();
    if (email.isEmpty || !email.contains('@')) {
      setState(() => _error = 'Enter a valid email');
      return;
    }
    setState(() => _loading = true);
    try {
      final dio = ref.read(dioProvider);
      final authApi = AuthApi(dio);
      await authApi.sendOtp(email);
      setState(() => _otpSent = true);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: RadialGradient(
            center: const Alignment(-0.3, -0.5),
            radius: 1.2,
            colors: [
              const Color(0x331A4FBF),
              AppColors.bgObsidian,
              AppColors.bgObsidian,
            ],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Logo
                  const LeteseLogo(fontSize: 36),
                  const SizedBox(height: 8),
                  Text(
                    'Legal Practice Management',
                    style: TextStyle(
                      fontSize: 14,
                      color: AppColors.textSecondary,
                      letterSpacing: 2,
                    ),
                  ),
                  const SizedBox(height: 48),

                  // Login Card
                  GlassCard(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          _otpSent ? 'Enter Code' : 'Welcome Back',
                          style: Theme.of(context).textTheme.titleLarge,
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 24),

                        if (!_otpSent) ...[
                          TextField(
                            controller: _emailController,
                            keyboardType: TextInputType.emailAddress,
                            style: const TextStyle(color: AppColors.textPrimary),
                            decoration: const InputDecoration(
                              labelText: 'Email Address',
                              labelStyle: TextStyle(color: AppColors.textSecondary),
                              prefixIcon: Icon(Icons.email_outlined, color: AppColors.neonCyan),
                            ),
                          ),
                          const SizedBox(height: 16),
                          if (_error != null)
                            Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: Text(_error!,
                                  style: const TextStyle(color: AppColors.error, fontSize: 13)),
                            ),
                          ElevatedButton(
                            onPressed: _loading ? null : _sendOtp,
                            child: _loading
                                ? const SizedBox(height: 20, width: 20,
                                    child: CircularProgressIndicator(strokeWidth: 2))
                                : const Text('Send Login Code'),
                          ),
                          const SizedBox(height: 16),
                          OutlinedButton.icon(
                            onPressed: () {
                              // Google OAuth — would use google_sign_in package
                            },
                            icon: const Icon(Icons.g_mobiledata, size: 24),
                            label: const Text('Continue with Google'),
                          ),
                        ] else ...[
                          _OtpInput(
                            email: _emailController.text,
                            onVerified: (token) async {
                              final prefs = await SharedPreferences.getInstance();
                              await prefs.setString('access_token', token);
                              if (mounted) {
                                Navigator.of(context).pushReplacementNamed('/app');
                              }
                            },
                          ),
                          const SizedBox(height: 12),
                          TextButton(
                            onPressed: () => setState(() => _otpSent = false),
                            child: const Text('Change email'),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _OtpInput extends ConsumerStatefulWidget {
  final String email;
  final Function(String token) onVerified;
  const _OtpInput({required this.email, required this.onVerified});

  @override
  ConsumerState<_OtpInput> createState() => _OtpInputState();
}

class _OtpInputState extends ConsumerState<_OtpInput> {
  final _otpController = TextEditingController();
  bool _loading = false;
  String? _error;

  Future<void> _verify() async {
    setState(() => _loading = true);
    try {
      final dio = ref.read(dioProvider);
      final authApi = AuthApi(dio);
      final result = await authApi.login(widget.email, _otpController.text.trim());
      await widget.onVerified(result.accessToken);
    } catch (e) {
      setState(() => _error = 'Invalid code. Please try again.');
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TextField(
          controller: _otpController,
          keyboardType: TextInputType.number,
          maxLength: 6,
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 24, letterSpacing: 8, color: AppColors.neonCyan),
          decoration: InputDecoration(
            hintText: '● ● ● ● ● ●',
            hintStyle: TextStyle(color: AppColors.textTertiary.withAlpha(128)),
            counterText: '',
          ),
        ),
        if (_error != null)
          Padding(padding: const EdgeInsets.only(bottom: 8),
              child: Text(_error!, style: const TextStyle(color: AppColors.error, fontSize: 13))),
        const SizedBox(height: 16),
        ElevatedButton(
          onPressed: _loading ? null : _verify,
          child: _loading
              ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
              : const Text('Verify & Login'),
        ),
      ],
    );
  }
}
