/// LETESE● Authentication Screen — Lattice Design System (Light Theme)
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
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
      body: Stack(
        children: [
          // Sky gradient background
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: Container(
              height: 340,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [LatticeColors.skyTop, LatticeColors.skyBottom],
                ),
              ),
            ),
          ),
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const SizedBox(height: 40),
                    // Logo
                    Image.asset(
                      'assets/letese_logo.png',
                      height: 56,
                      errorBuilder: (_, __, ___) => Text(
                        'LETESE',
                        style: GoogleFonts.manrope(
                          fontSize: 32,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                          letterSpacing: 2,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Legal Practice Management',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        color: Colors.white.withAlpha(179),
                        letterSpacing: 1.5,
                      ),
                    ),
                    const SizedBox(height: 40),

                    // Login Card — white glass effect
                    Container(
                      decoration: BoxDecoration(
                        color: LatticeColors.surface,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: const [
                          BoxShadow(color: LatticeColors.shadow, blurRadius: 24, offset: Offset(0, 8)),
                        ],
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(28),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text(
                              _otpSent ? 'Enter Code' : 'Welcome Back',
                              style: GoogleFonts.manrope(
                                fontSize: 22,
                                fontWeight: FontWeight.w700,
                                color: LatticeColors.textPrimary,
                              ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 6),
                            Text(
                              _otpSent
                                  ? 'We sent a code to your email'
                                  : 'Sign in to your advocate account',
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                color: LatticeColors.textSecondary,
                              ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 24),

                            if (!_otpSent) ...[
                              TextField(
                                controller: _emailController,
                                keyboardType: TextInputType.emailAddress,
                                style: GoogleFonts.inter(
                                  color: LatticeColors.textPrimary,
                                  fontSize: 15,
                                ),
                                decoration: InputDecoration(
                                  labelText: 'Email Address',
                                  labelStyle: GoogleFonts.inter(color: LatticeColors.textSecondary),
                                  prefixIcon: const Icon(Icons.email_outlined, color: LatticeColors.primary),
                                  filled: true,
                                  fillColor: LatticeColors.background,
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
                                ),
                              ),
                              const SizedBox(height: 16),
                              if (_error != null)
                                Padding(
                                  padding: const EdgeInsets.only(bottom: 12),
                                  child: Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: LatticeColors.errorBg,
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Row(
                                      children: [
                                        const Icon(Icons.error_outline, color: LatticeColors.error, size: 16),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: Text(_error!,
                                              style: const TextStyle(color: LatticeColors.error, fontSize: 13)),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ElevatedButton(
                                onPressed: _loading ? null : _sendOtp,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: LatticeColors.primary,
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(vertical: 14),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  elevation: 0,
                                ),
                                child: _loading
                                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                    : Text('Send Login Code', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600)),
                              ),
                              const SizedBox(height: 16),
                              Row(
                                children: [
                                  const Expanded(child: Divider(color: LatticeColors.cardBorder)),
                                  Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 16),
                                    child: Text('or', style: GoogleFonts.inter(fontSize: 12, color: LatticeColors.textTertiary)),
                                  ),
                                  const Expanded(child: Divider(color: LatticeColors.cardBorder)),
                                ],
                              ),
                              const SizedBox(height: 16),
                              OutlinedButton.icon(
                                onPressed: () {},
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: LatticeColors.primary,
                                  side: const BorderSide(color: LatticeColors.cardBorder, width: 1.5),
                                  padding: const EdgeInsets.symmetric(vertical: 14),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                ),
                                icon: const Icon(Icons.g_mobiledata, size: 24),
                                label: Text('Continue with Google', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w500)),
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
                                child: Text('Change email', style: GoogleFonts.inter(fontSize: 14, color: LatticeColors.primary)),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
          ),
        ],
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
          style: GoogleFonts.inter(fontSize: 24, letterSpacing: 10, color: LatticeColors.primary),
          decoration: InputDecoration(
            hintText: '● ● ● ● ● ●',
            hintStyle: GoogleFonts.inter(color: LatticeColors.textTertiary.withAlpha(128)),
            counterText: '',
            filled: true,
            fillColor: LatticeColors.background,
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
          ),
        ),
        if (_error != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text(_error!, style: const TextStyle(color: LatticeColors.error, fontSize: 13)),
          ),
        const SizedBox(height: 16),
        ElevatedButton(
          onPressed: _loading ? null : _verify,
          style: ElevatedButton.styleFrom(
            backgroundColor: LatticeColors.primary,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 32),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            elevation: 0,
          ),
          child: _loading
              ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : Text('Verify & Login', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600)),
        ),
      ],
    );
  }
}