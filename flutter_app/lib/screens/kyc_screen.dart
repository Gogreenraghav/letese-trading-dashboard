import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../theme.dart';

class KycScreen extends StatefulWidget {
  final ApiService api;
  const KycScreen({super.key, required this.api});
  @override
  State<KycScreen> createState() => _KycScreenState();
}

class _KycScreenState extends State<KycScreen> {
  final _pan = TextEditingController();
  final _aadhaar = TextEditingController();
  final _address = TextEditingController();
  final _city = TextEditingController();
  final _state = TextEditingController();
  final _pincode = TextEditingController();
  final _whatsapp = TextEditingController();
  String _occupation = '';
  String _income = '';
  bool _loading = false;
  String? _error;
  String? _success;

  Future<void> _submit() async {
    final pan = _pan.text.trim().toUpperCase();
    if (pan.length < 10) {
      setState(() => _error = 'Please enter a valid 10-character PAN');
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      final data = await widget.api.submitKYC({
        'pan': pan,
        'aadhaar': _aadhaar.text.trim(),
        'occupation': _occupation,
        'incomeRange': _income,
        'address': _address.text.trim(),
        'city': _city.text.trim(),
        'state': _state.text.trim(),
        'pincode': _pincode.text.trim(),
        'whatsapp': _whatsapp.text.trim(),
      });
      if (data['success'] == true) {
        setState(() => _success = 'KYC submitted! Admin will review within 24 hours.');
      } else {
        setState(() => _error = data['error'] ?? 'Submission failed');
      }
    } catch (e) {
      setState(() => _error = 'Server error. Please try again.');
    }
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('KYC Verification')),
      body: _success != null ? _successView() : SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_error != null) _alert(_error!, AppTheme.red),
            const SizedBox(height: 8),
            const Text('Personal Information', style: TextStyle(fontWeight: FontWeight.w700, color: Colors.white, fontSize: 16)),
            const SizedBox(height: 14),
            TextField(controller: _pan, textCapitalization: TextCapitalization.characters,
              decoration: const InputDecoration(labelText: 'PAN Number *', hintText: 'ABCDE1234F', prefixIcon: Icon(Icons.badge_outlined))),
            const SizedBox(height: 14),
            TextField(controller: _aadhaar, keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Aadhaar Number *', hintText: 'XXXX XXXX XXXX', prefixIcon: Icon(Icons.credit_card_outlined))),
            const SizedBox(height: 14),
            _dropdown('Occupation', _occupation, ['Salaried', 'Business', 'Professional', 'Trading', 'Retired', 'Other'], (v) => setState(() => _occupation = v ?? '')),
            const SizedBox(height: 14),
            _dropdown('Annual Income', _income, ['<5L', '5-10L', '10-25L', '25-50L', '>50L'], (v) => setState(() => _income = v ?? '')),
            const SizedBox(height: 24),
            const Text('Address', style: TextStyle(fontWeight: FontWeight.w700, color: Colors.white, fontSize: 16)),
            const SizedBox(height: 14),
            TextField(controller: _address, maxLines: 2, decoration: const InputDecoration(labelText: 'Full Address', prefixIcon: Icon(Icons.home_outlined))),
            const SizedBox(height: 14),
            Row(children: [
              Expanded(child: TextField(controller: _city, decoration: const InputDecoration(labelText: 'City'))),
              const SizedBox(width: 14),
              Expanded(child: TextField(controller: _state, decoration: const InputDecoration(labelText: 'State'))),
            ]),
            const SizedBox(height: 14),
            TextField(controller: _pincode, keyboardType: TextInputType.number, maxLength: 6,
              decoration: const InputDecoration(labelText: 'Pincode', prefixIcon: Icon(Icons.location_on_outlined))),
            const SizedBox(height: 24),
            const Text('WhatsApp Notifications', style: TextStyle(fontWeight: FontWeight.w700, color: AppTheme.green, fontSize: 16)),
            const SizedBox(height: 4),
            const Text('Get trade alerts on WhatsApp', style: TextStyle(color: AppTheme.textDim, fontSize: 12)),
            const SizedBox(height: 14),
            TextField(controller: _whatsapp, keyboardType: TextInputType.phone,
              decoration: const InputDecoration(labelText: 'WhatsApp Number', hintText: '+91 98765 43210', prefixIcon: Icon(Icons.message_outlined))),
            const SizedBox(height: 30),
            ElevatedButton(
              onPressed: _loading ? null : _submit,
              child: _loading
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Submit KYC'),
            ),
            const SizedBox(height: 16),
            Center(child: Text('Your data is encrypted as per SEBI guidelines', style: TextStyle(color: AppTheme.textMuted.withOpacity(0.6), fontSize: 11))),
          ],
        ),
      ),
    );
  }

  Widget _successView() => Center(
    child: Padding(padding: const EdgeInsets.all(32),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Container(padding: const EdgeInsets.all(20), decoration: BoxDecoration(color: AppTheme.green.withOpacity(0.1), shape: BoxShape.circle),
          child: const Icon(Icons.check_circle, color: AppTheme.green, size: 60)),
        const SizedBox(height: 24),
        const Text('KYC Submitted!', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 22)),
        const SizedBox(height: 12),
        const Text('Your KYC is under review. Admin will approve within 24 hours.',
          textAlign: TextAlign.center, style: TextStyle(color: AppTheme.textDim, fontSize: 14)),
        const SizedBox(height: 32),
        ElevatedButton(onPressed: () => Navigator.pop(context), child: const Text('Go Back')),
      ]),
    ),
  );

  Widget _dropdown(String label, String value, List<String> items, Function(String?) onChanged) => DropdownButtonFormField<String>(
    value: value.isEmpty ? null : value,
    decoration: InputDecoration(labelText: label, prefixIcon: const Icon(Icons.list_outlined)),
    items: items.map((i) => DropdownMenuItem(value: i, child: Text(i))).toList(),
    onChanged: onChanged,
  );

  Widget _alert(String msg, Color color) => Container(
    padding: const EdgeInsets.all(12), margin: const EdgeInsets.only(bottom: 12),
    decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(12), border: Border.all(color: color.withOpacity(0.3))),
    child: Text(msg, style: TextStyle(color: color, fontSize: 13)),
  );
}
