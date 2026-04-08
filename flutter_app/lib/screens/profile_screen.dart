import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../theme.dart';
import 'login_screen.dart';
import 'kyc_screen.dart';
import 'broker_setup_screen.dart';

class ProfileScreen extends StatefulWidget {
  final ApiService api;
  final VoidCallback onLogout;
  const ProfileScreen({super.key, required this.api, required this.onLogout});
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map _user = {};
  Map _limits = {};
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final portfolio = await widget.api.getPortfolio();
      final limits = await widget.api.getLimits();
      if (mounted) setState(() {
        _user = Map<String, dynamic>.from(portfolio['user'] ?? {});
        _limits = Map<String, dynamic>.from(limits);
        _loading = false;
      });
    } catch (_) { if (mounted) setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return Scaffold(appBar: AppBar(title: const Text('Profile')), body: const Center(child: CircularProgressIndicator()));

    final brokerConnected = _user['brokerConfig']?['connected'] == true;

    return Scaffold(
      appBar: AppBar(title: const Text('My Profile')),
      body: RefreshIndicator(onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Avatar + Name
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(color: AppTheme.card, borderRadius: BorderRadius.circular(20)),
              child: Row(children: [
                CircleAvatar(
                  radius: 30, backgroundColor: AppTheme.blue,
                  child: Text((_user['name'] ?? 'U')[0].toUpperCase(),
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 28)),
                ),
                const SizedBox(width: 16),
                Expanded(child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(_user['name'] ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 18)),
                    const SizedBox(height: 4),
                    Text(_user['email'] ?? '', style: const TextStyle(color: AppTheme.textDim, fontSize: 12)),
                    Text(_user['phone'] ?? '', style: const TextStyle(color: AppTheme.textDim, fontSize: 12)),
                  ],
                )),
              ]),
            ),
            const SizedBox(height: 16),

            // Status Row
            Row(children: [
              Expanded(child: _statusChip((_user['plan'] ?? 'basic').toString().toUpperCase(), AppTheme.blue)),
              const SizedBox(width: 8),
              Expanded(child: _statusChip(
                _user['kycStatus'] == 'approved' ? 'KYC ✅' : _user['kycStatus'] == 'pending' ? 'KYC ⏳' : 'KYC ❌',
                _user['kycStatus'] == 'approved' ? AppTheme.green : AppTheme.amber,
              )),
              const SizedBox(width: 8),
              Expanded(child: _statusChip(
                brokerConnected ? 'Broker ✅' : 'Broker ❌',
                brokerConnected ? AppTheme.green : AppTheme.red,
              )),
            ]),
            const SizedBox(height: 20),

            // Stats
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: AppTheme.card, borderRadius: BorderRadius.circular(16)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Account Stats', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 15)),
                  const SizedBox(height: 14),
                  _row('Trades', '${_limits['tradeLimit'] == -1 ? 'Unlimited' : (_limits['tradeLimit'] ?? '—')}'),
                  _row('API Access', (_limits['apiAccess'] == true) ? 'Enabled ✅' : 'Disabled ❌'),
                  _row('Broker', _user['brokerConfig']?['broker']?.toString() ?? 'Not connected'),
                  _row('Member Since', _user['createdAt'] != null
                    ? DateTime.parse(_user['createdAt']).toString().substring(0, 10) : '—'),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Menu Items
            Container(
              decoration: BoxDecoration(color: AppTheme.card, borderRadius: BorderRadius.circular(16)),
              child: Column(children: [
                _menuItem(Icons.verified_user_outlined, 'Complete KYC',
                  _user['kycStatus'] == 'approved' ? 'Verified' : 'Required',
                  _user['kycStatus'] == 'approved' ? AppTheme.green : AppTheme.amber,
                  () => Navigator.push(context, MaterialPageRoute(builder: (_) => KycScreen(api: widget.api))),
                ),
                Divider(color: AppTheme.textMuted.withOpacity(0.2), height: 1),
                _menuItem(Icons.link, 'Connect Broker',
                  brokerConnected ? 'Connected' : 'Tap to connect',
                  brokerConnected ? AppTheme.green : AppTheme.blue,
                  () => Navigator.push(context, MaterialPageRoute(builder: (_) => BrokerSetupScreen(api: widget.api))),
                ),
                Divider(color: AppTheme.textMuted.withOpacity(0.2), height: 1),
                _menuItem(Icons.logout, 'Logout', 'Sign out of your account', AppTheme.red,
                  () async {
                    final confirm = await showDialog<bool>(context: context, builder: (_) => AlertDialog(
                      title: const Text('Logout'),
                      content: const Text('Are you sure you want to logout?'),
                      actions: [
                        TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
                        ElevatedButton(onPressed: () => Navigator.pop(context, true), style: ElevatedButton.styleFrom(backgroundColor: AppTheme.red), child: const Text('Logout')),
                      ],
                    ));
                    if (confirm == true) widget.onLogout();
                  },
                ),
              ]),
            ),
            const SizedBox(height: 20),

            // Version
            Center(child: Text('LETESE Trading v1.0.0', style: TextStyle(color: AppTheme.textMuted.withOpacity(0.5), fontSize: 11))),

            // Features
            if ((_limits['features'] as List?)?.isNotEmpty == true) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: AppTheme.card, borderRadius: BorderRadius.circular(16)),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('My Plan Features', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14)),
                    const SizedBox(height: 10),
                    ...((_limits['features'] as List).map((f) => Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: Row(children: [
                        const Icon(Icons.check_circle, color: AppTheme.green, size: 16),
                        const SizedBox(width: 8),
                        Text(f.toString(), style: const TextStyle(color: AppTheme.textDim, fontSize: 13)),
                      ]),
                    ))),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _statusChip(String text, Color color) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
    decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8), border: Border.all(color: color.withOpacity(0.3))),
    child: Text(text, textAlign: TextAlign.center, style: TextStyle(color: color, fontWeight: FontWeight.w600, fontSize: 11)),
  );

  Widget _row(String label, String value) => Padding(
    padding: const EdgeInsets.only(bottom: 10),
    child: Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: AppTheme.textDim, fontSize: 13)),
        Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500, fontSize: 13)),
      ],
    ),
  );

  Widget _menuItem(IconData icon, String title, String subtitle, Color color, VoidCallback onTap) => InkWell(
    onTap: onTap,
    child: Padding(
      padding: const EdgeInsets.all(14),
      child: Row(children: [
        Container(
          padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
          child: Icon(icon, color: color, size: 20),
        ),
        const SizedBox(width: 14),
        Expanded(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500, fontSize: 14)),
            Text(subtitle, style: TextStyle(color: color, fontSize: 11)),
          ],
        )),
        const Icon(Icons.arrow_forward_ios, color: AppTheme.textMuted, size: 14),
      ]),
    ),
  );
}
