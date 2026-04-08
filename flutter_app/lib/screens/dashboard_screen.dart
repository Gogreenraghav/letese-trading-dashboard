import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';
import '../theme.dart';
import 'login_screen.dart';
import 'trades_screen.dart';
import 'profile_screen.dart';
import 'kyc_screen.dart';
import 'broker_setup_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final ApiService _api = ApiService();
  int _currentIndex = 0;
  bool _loading = true;
  Map _portfolio = {};
  Map _stats = {};
  Map _plan = {};
  Map _user = {};

  @override
  void initState() {
    super.initState();
    _initAndLoad();
  }

  Future<void> _initAndLoad() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    if (token == null) {
      if (mounted) Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
      return;
    }
    _api.setToken(token);
    await _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final data = await _api.getPortfolio();
      if (mounted) {
        setState(() {
          _portfolio = data;
          _stats = Map<String, dynamic>.from(data['stats'] ?? {});
          _plan = Map<String, dynamic>.from(data['plan'] ?? {});
          _user = Map<String, dynamic>.from(data['user'] ?? {});
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: [
          _buildDashboard(),
          TradesScreen(api: _api),
          ProfileScreen(api: _api, onLogout: _logout),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (i) => setState(() => _currentIndex = i),
        backgroundColor: AppTheme.bg,
        indicatorColor: AppTheme.blue.withOpacity(0.2),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.dashboard_outlined), selectedIcon: Icon(Icons.dashboard, color: AppTheme.blue), label: 'Dashboard'),
          NavigationDestination(icon: Icon(Icons.bar_chart_outlined), selectedIcon: Icon(Icons.bar_chart, color: AppTheme.blue), label: 'Trades'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person, color: AppTheme.blue), label: 'Profile'),
        ],
      ),
    );
  }

  Widget _buildDashboard() {
    if (_loading) return Scaffold(appBar: AppBar(title: const Text('LETESE')), body: const Center(child: CircularProgressIndicator()));

    final pnl = double.tryParse(_stats['totalPnL']?.toString() ?? '0') ?? 0;
    final portfolioValue = 50000 + pnl;
    final winRate = double.tryParse(_stats['winRate']?.toString() ?? '0') ?? 0;
    final wins = int.tryParse(_stats['wins']?.toString() ?? '0') ?? 0;
    final losses = int.tryParse(_stats['losses']?.toString() ?? '0') ?? 0;
    final brokerConnected = _user['brokerConfig']?['connected'] == true;

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Hi, ${_user['name']?.toString().split(' ').first ?? 'User'}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            Text(DateFormat('EEE, dd MMM').format(DateTime.now()), style: const TextStyle(fontSize: 11, color: AppTheme.textDim)),
          ],
        ),
        actions: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(color: AppTheme.blue.withOpacity(0.15), borderRadius: BorderRadius.circular(20)),
            child: Text((_user['plan'] ?? 'basic').toString().toUpperCase(), style: const TextStyle(color: AppTheme.blue, fontWeight: FontWeight.w700, fontSize: 11)),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: RefreshIndicator(onRefresh: _loadData,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Portfolio Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppTheme.blue.withOpacity(0.2), AppTheme.purple.withOpacity(0.1)],
                  begin: Alignment.topLeft, end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppTheme.blue.withOpacity(0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Portfolio Value', style: TextStyle(color: AppTheme.textDim, fontSize: 12)),
                  const SizedBox(height: 4),
                  Text('₹${NumberFormat('#,##,###').format(portfolioValue.round())}',
                    style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w800, color: Colors.white)),
                  const SizedBox(height: 8),
                  Row(children: [
                    Icon(pnl >= 0 ? Icons.arrow_upward : Icons.arrow_downward, color: pnl >= 0 ? AppTheme.green : AppTheme.red, size: 16),
                    const SizedBox(width: 4),
                    Text('${pnl >= 0 ? '+' : ''}₹${pnl.toStringAsFixed(0)}', style: TextStyle(color: pnl >= 0 ? AppTheme.green : AppTheme.red, fontWeight: FontWeight.w600)),
                    const SizedBox(width: 4),
                    const Text('all time', style: TextStyle(color: AppTheme.textDim, fontSize: 12)),
                  ]),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // KYC Alert
            if (_user['kycStatus'] != 'approved')
              GestureDetector(
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => KycScreen(api: _api))),
                child: Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppTheme.amber.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppTheme.amber.withOpacity(0.3)),
                  ),
                  child: Row(children: [
                    const Icon(Icons.warning_amber, color: AppTheme.amber),
                    const SizedBox(width: 12),
                    Expanded(child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Complete KYC', style: TextStyle(fontWeight: FontWeight.w600, color: AppTheme.amber, fontSize: 13)),
                        Text(_user['kycStatus'] == 'pending' ? 'Under review' : 'Required for live trading', style: const TextStyle(color: AppTheme.textDim, fontSize: 11)),
                      ],
                    )),
                    const Icon(Icons.arrow_forward_ios, color: AppTheme.amber, size: 16),
                  ]),
                ),
              ),

            // Stats Row 1
            Row(children: [
              Expanded(child: _statCard('Win Rate', '${winRate.toStringAsFixed(1)}%', winRate >= 50 ? AppTheme.green : AppTheme.red)),
              const SizedBox(width: 10),
              Expanded(child: _statCard('Total P&L', '${pnl >= 0 ? '+' : ''}₹${pnl.toStringAsFixed(0)}', pnl >= 0 ? AppTheme.green : AppTheme.red)),
            ]),
            const SizedBox(height: 10),
            // Stats Row 2
            Row(children: [
              Expanded(child: _statCard('Wins', '$wins', AppTheme.green)),
              const SizedBox(width: 10),
              Expanded(child: _statCard('Losses', '$losses', AppTheme.red)),
              const SizedBox(width: 10),
              Expanded(child: _statCard('Trades', '${wins + losses}', AppTheme.blue)),
            ]),
            const SizedBox(height: 20),

            // Plan + Broker Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: AppTheme.card, borderRadius: BorderRadius.circular(16)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    const Text('My Plan', style: TextStyle(fontWeight: FontWeight.w600, color: Colors.white, fontSize: 14)),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(color: AppTheme.blue.withOpacity(0.15), borderRadius: BorderRadius.circular(6)),
                      child: Text((_user['plan'] ?? 'basic').toString().toUpperCase(), style: const TextStyle(color: AppTheme.blue, fontWeight: FontWeight.w700, fontSize: 11)),
                    ),
                  ]),
                  const SizedBox(height: 10),
                  if ((_plan['features'] as List?)?.isNotEmpty == true)
                    ...((_plan['features'] as List).take(4).map((f) => Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Row(children: [const Icon(Icons.check, color: AppTheme.green, size: 14), const SizedBox(width: 8), Text(f.toString(), style: const TextStyle(color: AppTheme.textDim, fontSize: 12))]),
                    ))),
                  const SizedBox(height: 10),
                  SizedBox(width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => BrokerSetupScreen(api: _api))),
                      icon: Icon(brokerConnected ? Icons.check_circle : Icons.link, size: 16),
                      label: Text(brokerConnected ? 'Broker Connected ✅' : 'Connect Broker 🔌'),
                      style: ElevatedButton.styleFrom(backgroundColor: brokerConnected ? AppTheme.green : AppTheme.blue),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Recent Trades
            Row(children: [
              const Text('Recent Trades', style: TextStyle(fontWeight: FontWeight.w600, color: Colors.white, fontSize: 15)),
              const Spacer(),
              TextButton(onPressed: () => setState(() => _currentIndex = 1), child: const Text('See All', style: TextStyle(color: AppTheme.blue, fontSize: 12))),
            ]),
            const SizedBox(height: 8),
            _buildRecentTrades(),
          ],
        ),
      ),
    );
  }

  Widget _statCard(String label, String value, Color color) => Container(
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(color: AppTheme.card, borderRadius: BorderRadius.circular(12)),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: AppTheme.textDim, fontSize: 11)),
        const SizedBox(height: 4),
        Text(value, style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 15)),
      ],
    ),
  );

  Widget _buildRecentTrades() {
    final trades = (_portfolio['trades'] as List?)?.take(5).toList() ?? [];
    if (trades.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24), alignment: Alignment.center,
        decoration: BoxDecoration(color: AppTheme.card, borderRadius: BorderRadius.circular(14)),
        child: Column(children: [
          const Icon(Icons.bar_chart, color: AppTheme.textMuted, size: 40),
          const SizedBox(height: 8),
          const Text('No trades yet', style: TextStyle(color: AppTheme.textDim)),
          const Text('Connect broker to start', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
        ]),
      );
    }
    return Column(
      children: trades.map((t) {
        final pnl = double.tryParse(t['pnl']?.toString() ?? '0') ?? 0;
        final isBuy = (t['action'] ?? 'BUY') == 'BUY';
        final date = t['exitTime'] != null ? DateFormat('dd MMM').format(DateTime.parse(t['exitTime'])) : '';
        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: AppTheme.card, borderRadius: BorderRadius.circular(12)),
          child: Row(children: [
            Container(width: 8, height: 8, decoration: BoxDecoration(color: isBuy ? AppTheme.green : AppTheme.red, shape: BoxShape.circle, boxShadow: [BoxShadow(color: (isBuy ? AppTheme.green : AppTheme.red).withOpacity(0.5), blurRadius: 6)])),
            const SizedBox(width: 12),
            Expanded(child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(t['symbol'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.white)),
                Text('${t['strategy'] ?? 'Signal'} · $date', style: const TextStyle(color: AppTheme.textDim, fontSize: 11)),
              ],
            )),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(isBuy ? 'BUY' : 'SELL', style: TextStyle(color: isBuy ? AppTheme.green : AppTheme.red, fontWeight: FontWeight.w600, fontSize: 11)),
                Text('${pnl >= 0 ? '+' : ''}₹${pnl.toStringAsFixed(0)}', style: TextStyle(color: pnl >= 0 ? AppTheme.green : AppTheme.red, fontWeight: FontWeight.w700)),
              ],
            ),
          ]),
        );
      }).toList(),
    );
  }

  Future<void> _logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    if (mounted) Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
  }
}
