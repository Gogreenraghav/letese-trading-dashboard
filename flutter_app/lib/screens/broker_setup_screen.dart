import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../theme.dart';

class BrokerSetupScreen extends StatefulWidget {
  final ApiService api;
  const BrokerSetupScreen({super.key, required this.api});
  @override
  State<BrokerSetupScreen> createState() => _BrokerSetupScreenState();
}

class _BrokerSetupScreenState extends State<BrokerSetupScreen> {
  String? _selectedBroker;
  final _apiKeyController = TextEditingController();
  final _apiSecretController = TextEditingController();
  bool _loading = false;
  bool _connected = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadStatus();
  }

  Future<void> _loadStatus() async {
    try {
      final data = await widget.api.getBrokerConfig();
      if (mounted && data['config']?['connected'] == true) {
        setState(() => _connected = true);
      }
    } catch (_) {}
  }

  Future<void> _connect() async {
    if (_selectedBroker == null) { setState(() => _error = 'Please select a broker'); return; }
    if (_apiKeyController.text.isEmpty) { setState(() => _error = 'Please enter API Key'); return; }
    if (_apiSecretController.text.isEmpty) { setState(() => _error = 'Please enter API Secret'); return; }

    setState(() { _loading = true; _error = null; });
    try {
      await widget.api.saveBroker(_selectedBroker!, _apiKeyController.text, true);
      setState(() { _loading = false; _connected = true; });
    } catch (e) {
      setState(() { _loading = false; _error = 'Connection failed. Please check your credentials.'; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Broker Setup')),
      body: _connected ? _connectedView() : SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_error != null) Container(
              padding: const EdgeInsets.all(12), margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(color: AppTheme.red.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
              child: Text(_error!, style: const TextStyle(color: AppTheme.red, fontSize: 13)),
            ),
            const Text('Select Your Broker', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 18)),
            const SizedBox(height: 6),
            const Text('Connect your trading account to enable auto-trading', style: TextStyle(color: AppTheme.textDim, fontSize: 13)),
            const SizedBox(height: 20),
            _brokerCard('Upstox', '📈', 'Free APIs, Beginner friendly', 'upstox'),
            const SizedBox(height: 12),
            _brokerCard('Zerodha', '📊', 'Kite Connect, Most popular', 'zerodha'),
            const SizedBox(height: 12),
            _brokerCard('AliceBlue', '🏦', 'Low brokerage, Advanced APIs', 'aliceblue'),
            if (_selectedBroker != null) ...[
              const SizedBox(height: 30),
              const Text('API Configuration', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 18)),
              const SizedBox(height: 16),
              TextField(controller: _apiKeyController, decoration: const InputDecoration(labelText: 'API Key / App Key *', prefixIcon: Icon(Icons.key))),
              const SizedBox(height: 14),
              TextField(controller: _apiSecretController, obscureText: true, decoration: const InputDecoration(labelText: 'API Secret *', prefixIcon: Icon(Icons.lock))),
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: AppTheme.amber.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                child: Row(children: [
                  const Icon(Icons.warning_amber, color: AppTheme.amber, size: 20),
                  const SizedBox(width: 10),
                  Expanded(child: Text('Enable only "Place Orders" permission. Never share your secrets.',
                    style: TextStyle(color: AppTheme.amber.withOpacity(0.9), fontSize: 12))),
                ]),
              ),
              const SizedBox(height: 24),
              ElevatedButton(onPressed: _loading ? null : _connect,
                child: _loading
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('🔗 Connect Broker'),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _brokerCard(String name, String emoji, String desc, String id) {
    final selected = _selectedBroker == id;
    return GestureDetector(
      onTap: () => setState(() => _selectedBroker = id),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: selected ? AppTheme.blue.withOpacity(0.1) : AppTheme.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: selected ? AppTheme.blue : AppTheme.cardLight, width: selected ? 2 : 1),
        ),
        child: Row(children: [
          Text(emoji, style: const TextStyle(fontSize: 28)),
          const SizedBox(width: 14),
          Expanded(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 16)),
              Text(desc, style: const TextStyle(color: AppTheme.textDim, fontSize: 12)),
            ],
          )),
          Icon(selected ? Icons.check_circle : Icons.circle_outlined, color: selected ? AppTheme.blue : AppTheme.textMuted),
        ]),
      ),
    );
  }

  Widget _connectedView() => Center(
    child: Padding(padding: const EdgeInsets.all(32),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Container(padding: const EdgeInsets.all(20), decoration: BoxDecoration(color: AppTheme.green.withOpacity(0.1), shape: BoxShape.circle),
          child: const Icon(Icons.check_circle, color: AppTheme.green, size: 60)),
        const SizedBox(height: 24),
        const Text('Broker Connected!', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 22)),
        const SizedBox(height: 12),
        const Text('Your trading account is now linked to LETESE. Auto-trading is enabled.',
          textAlign: TextAlign.center, style: TextStyle(color: AppTheme.textDim, fontSize: 14)),
        const SizedBox(height: 32),
        ElevatedButton(onPressed: () => Navigator.pop(context), child: const Text('Go to Dashboard')),
      ]),
    ),
  );
}
