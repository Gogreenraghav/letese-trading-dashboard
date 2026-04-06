/// LETESE — Login Screen
/// The Elevated Advocate Design System
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';
import 'package:dio/dio.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});
  @override ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailCtrl = TextEditingController();
  bool _otpSent = false;
  bool _loading = false;
  String? _error;

  @override void dispose() { _emailCtrl.dispose(); super.dispose(); }

  Future<void> _sendOtp() async {
    final email = _emailCtrl.text.trim();
    if (email.isEmpty || !email.contains('@')) {
      setState(() => _error = 'Enter a valid email'); return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      final dio = Dio(BaseOptions(baseUrl: 'https://api.letese.xyz/api/v1'));
      await dio.post('/auth/send-otp', data: {'email': email});
      setState(() => _otpSent = true);
    } catch (e) {
      // For demo, allow any email
      setState(() => _otpSent = true);
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter, end: Alignment.bottomCenter,
            colors: [LatticeColors.skyTop, LatticeColors.skyBot],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(28),
            child: Column(
              children: [
                const SizedBox(height: 40),

                // Logo
                Image.asset('assets/letese_logo.png',
                  height: 80,
                  errorBuilder: (_, __, ___) => Text('LETESE',
                    style: GoogleFonts.manrope(fontSize: 36, fontWeight: FontWeight.w800,
                      color: Colors.white, letterSpacing: 1))),

                const SizedBox(height: 8),
                Text('Advocate Suite',
                  style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w600,
                    color: Colors.white.withAlpha(220))),
                Text('वकीलों के लिए AI',
                  style: GoogleFonts.inter(fontSize: 14,
                    color: Colors.white.withAlpha(180))),

                const SizedBox(height: 48),

                // Form card — floating white glass
                Container(
                  padding: const EdgeInsets.all(28),
                  decoration: BoxDecoration(
                    color: LatticeColors.glassHi,
                    borderRadius: BorderRadius.circular(28),
                    boxShadow: ElevShadow.xl(LatticeColors.primary),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        _otpSent ? 'Enter Code' : 'Welcome Back',
                        style: GoogleFonts.manrope(fontSize: 22, fontWeight: FontWeight.w700,
                          color: LatticeColors.text),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 28),

                      if (!_otpSent) ...[
                        // Email field — pill input
                        Container(
                          decoration: BoxDecoration(
                            color: LatticeColors.glass,
                            borderRadius: BorderRadius.circular(100),
                            boxShadow: ElevShadow.sm(LatticeColors.primary),
                          ),
                          child: TextField(
                            controller: _emailCtrl,
                            keyboardType: TextInputType.emailAddress,
                            style: GoogleFonts.inter(fontSize: 14, color: LatticeColors.text),
                            decoration: InputDecoration(
                              hintText: 'advocate@letese.com',
                              hintStyle: GoogleFonts.inter(fontSize: 14, color: LatticeColors.textDim),
                              prefixIcon: const Icon(Icons.mail_outline, color: LatticeColors.primary, size: 20),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(100), borderSide: BorderSide.none),
                              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(100), borderSide: BorderSide.none),
                              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(100), borderSide: BorderSide.none),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
                            ),
                          ),
                        ),

                        if (_error != null) ...[
                          const SizedBox(height: 12),
                          Text(_error!,
                            style: GoogleFonts.inter(fontSize: 13, color: LatticeColors.error),
                            textAlign: TextAlign.center),
                        ],

                        const SizedBox(height: 20),

                        // Login button — pill
                        GestureDetector(
                          onTap: _loading ? null : _sendOtp,
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 15),
                            decoration: BoxDecoration(
                              color: LatticeColors.primary,
                              borderRadius: BorderRadius.circular(100),
                              boxShadow: ElevShadow.xs(LatticeColors.primary),
                            ),
                            child: _loading
                                ? const Center(child: SizedBox(height: 20, width: 20,
                                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)))
                                : Text('LOGIN',
                                    style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w700,
                                      color: Colors.white, letterSpacing: 1.2),
                                    textAlign: TextAlign.center),
                          ),
                        ),

                        const SizedBox(height: 16),

                        // Divider
                        Row(
                          children: [
                            Expanded(child: Divider(color: LatticeColors.textDim.withAlpha(30))),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 12),
                              child: Text('or continue with',
                                style: GoogleFonts.inter(fontSize: 12, color: LatticeColors.textDim)),
                            ),
                            Expanded(child: Divider(color: LatticeColors.textDim.withAlpha(30))),
                          ],
                        ),

                        const SizedBox(height: 16),

                        // Google button — pill ghost
                        GestureDetector(
                          onTap: () {},
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            decoration: BoxDecoration(
                              color: LatticeColors.glass,
                              borderRadius: BorderRadius.circular(100),
                              boxShadow: ElevShadow.sm(LatticeColors.primary),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.g_mobiledata, size: 24, color: LatticeColors.text),
                                const SizedBox(width: 8),
                                Text('Continue with Google',
                                  style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500,
                                    color: LatticeColors.text)),
                              ],
                            ),
                          ),
                        ),
                      ] else ...[
                        // OTP view
                        _OtpView(email: _emailCtrl.text,
                          onVerified: (token) async {
                            final prefs = await SharedPreferences.getInstance();
                            await prefs.setString('access_token', token);
                            if (mounted) Navigator.of(context).pushReplacementNamed('/app');
                          }),
                        const SizedBox(height: 12),
                        TextButton(
                          onPressed: () => setState(() => _otpSent = false),
                          child: Text('Change email',
                            style: GoogleFonts.inter(fontSize: 13, color: LatticeColors.primary)),
                        ),
                      ],
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // Register link
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text("Don't have an account? ",
                      style: GoogleFonts.inter(fontSize: 13, color: Colors.white.withAlpha(180))),
                    GestureDetector(
                      onTap: () {},
                      child: Text('Register',
                        style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600,
                          color: LatticeColors.green)),
                    ),
                  ],
                ),

                const SizedBox(height: 16),
                Text('Powered by Lattice',
                  style: GoogleFonts.inter(fontSize: 11, color: Colors.white.withAlpha(120))),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _OtpView extends ConsumerStatefulWidget {
  final String email;
  final Function(String) onVerified;
  const _OtpView({required this.email, required this.onVerified});
  @override ConsumerState<_OtpView> createState() => _OtpViewState();
}

class _OtpViewState extends ConsumerState<_OtpView> {
  final _ctrl = TextEditingController();
  bool _loading = false;

  Future<void> _verify() async {
    if (_ctrl.text.length < 4) return;
    setState(() => _loading = true);
    // Demo: accept any 4+ digit code
    await Future.delayed(const Duration(seconds: 1));
    widget.onVerified('demo_token_${_ctrl.text}');
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TextField(
          controller: _ctrl,
          keyboardType: TextInputType.number,
          maxLength: 6,
          textAlign: TextAlign.center,
          style: GoogleFonts.inter(fontSize: 24, letterSpacing: 10, color: LatticeColors.primary),
          decoration: InputDecoration(
            hintText: '● ● ● ● ● ●',
            hintStyle: GoogleFonts.inter(fontSize: 20, color: LatticeColors.textDim),
            counterText: '',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
            filled: true,
            fillColor: LatticeColors.glass,
            contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          ),
        ),
        const SizedBox(height: 20),
        GestureDetector(
          onTap: _loading ? null : _verify,
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 15),
            decoration: BoxDecoration(
              color: LatticeColors.primary,
              borderRadius: BorderRadius.circular(100),
              boxShadow: ElevShadow.xs(LatticeColors.primary),
            ),
            child: Text('VERIFY & LOGIN',
              style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w700,
                color: Colors.white, letterSpacing: 1.2),
              textAlign: TextAlign.center),
          ),
        ),
      ],
    );
  }
}
