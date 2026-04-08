import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../theme.dart';
import 'dashboard_screen.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});
  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passController = TextEditingController();
  bool _loading = false;
  String? _error;
  String _selectedPlan = 'basic';
  List _plans = [];
  final _api = ApiService();

  @override
  void initState() {
    super.initState();
    _loadPlans();
  }

  Future<void> _loadPlans() async {
    try {
      final data = await _api.getPlans();
      if (mounted) setState(() => _plans = data['plans'] ?? []);
    } catch (_) {
      setState(() => _plans = [
        {'id': 'basic', 'name': 'Basic', 'price': 999},
        {'id': 'professional', 'name': 'Professional', 'price': 2499},
        {'id': 'elite', 'name': 'Elite', 'price': 4999},
      ]);
    }
  }

  Future<void> _register() async {
    setState(() { _loading = true; _error = null; });
    try {
      final data = await _api.register(
        _nameController.text.trim(),
        _emailController.text.trim(),
        _phoneController.text.trim(),
        _passController.text,
        _selectedPlan,
      );
      if (data['success'] == true) {
        if (mounted) Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const DashboardScreen()));
      } else {
        setState(() => _error = data['error'] ?? 'Registration failed');
      }
    } catch (e) {
      setState(() => _error = 'Server error. Try again.');
    }
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create Account')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_error != null) Container(
              padding: const EdgeInsets.all(12), margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(color: AppTheme.red.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
              child: Text(_error!, style: const TextStyle(color: AppTheme.red, fontSize: 13)),
            ),
            TextField(controller: _nameController, decoration: const InputDecoration(labelText: 'Full Name', prefixIcon: Icon(Icons.person_outline))),
            const SizedBox(height: 14),
            TextField(controller: _emailController, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.email_outlined))),
            const SizedBox(height: 14),
            TextField(controller: _phoneController, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Phone', prefixIcon: Icon(Icons.phone_outlined))),
            const SizedBox(height: 14),
            TextField(controller: _passController, obscureText: true, decoration: const InputDecoration(labelText: 'Password', prefixIcon: Icon(Icons.lock_outline))),
            const SizedBox(height: 24),
            const Text('Select Plan', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15, color: Colors.white)),
            const SizedBox(height: 10),
            ...(_plans.map((p) => _planCard(p))),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loading ? null : _register,
              child: _loading
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Create Account'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _planCard(Map p) {
    final selected = _selectedPlan == p['id'];
    return GestureDetector(
      onTap: () => setState(() => _selectedPlan = p['id']),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: selected ? AppTheme.blue.withOpacity(0.1) : AppTheme.card,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: selected ? AppTheme.blue : AppTheme.cardLight, width: selected ? 2 : 1),
        ),
        child: Row(
          children: [
            Icon(selected ? Icons.check_circle : Icons.circle_outlined, color: selected ? AppTheme.blue : AppTheme.textMuted, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(p['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.white)),
                  Text('₹${p['price'] ?? 0}/mo', style: const TextStyle(color: AppTheme.textDim, fontSize: 12)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
