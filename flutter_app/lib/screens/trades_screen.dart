import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';
import '../theme.dart';

class TradesScreen extends StatefulWidget {
  final ApiService api;
  const TradesScreen({super.key, required this.api});
  @override
  State<TradesScreen> createState() => _TradesScreenState();
}

class _TradesScreenState extends State<TradesScreen> {
  List _trades = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final data = await widget.api.getPortfolio();
      if (mounted) setState(() { _trades = List.from(data['trades'] ?? []); _loading = false; });
    } catch (_) { if (mounted) setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Trades')),
      body: _loading
        ? const Center(child: CircularProgressIndicator())
        : _trades.isEmpty
          ? _empty()
          : RefreshIndicator(onRefresh: _load, child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: _trades.length,
            itemBuilder: (_, i) => _tradeCard(_trades[i]),
          )),
    );
  }

  Widget _empty() => Center(
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      const Icon(Icons.bar_chart, size: 60, color: AppTheme.textMuted),
      const SizedBox(height: 16),
      const Text('No trades yet', style: TextStyle(color: AppTheme.textDim, fontSize: 16)),
      const SizedBox(height: 8),
      const Text('Connect your broker to start', style: TextStyle(color: AppTheme.textMuted, fontSize: 13)),
    ]),
  );

  Widget _tradeCard(Map t) {
    final pnl = double.tryParse(t['pnl']?.toString() ?? '0') ?? 0;
    final isBuy = (t['action'] ?? 'BUY') == 'BUY';
    final entry = double.tryParse(t['entryPrice']?.toString() ?? '0') ?? 0;
    final exit = double.tryParse(t['exitPrice']?.toString() ?? '0') ?? 0;
    final date = t['exitTime'] != null ? DateFormat('dd MMM yyyy').format(DateTime.parse(t['exitTime'])) : DateFormat('dd MMM yyyy').format(DateTime.now());

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: AppTheme.card, borderRadius: BorderRadius.circular(14)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: isBuy ? AppTheme.green.withOpacity(0.15) : AppTheme.red.withOpacity(0.15),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: isBuy ? AppTheme.green.withOpacity(0.3) : AppTheme.red.withOpacity(0.3)),
              ),
              child: Text(isBuy ? 'BUY' : 'SELL', style: TextStyle(color: isBuy ? AppTheme.green : AppTheme.red, fontWeight: FontWeight.w700, fontSize: 12)),
            ),
            const SizedBox(width: 10),
            Text(t['symbol'] ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 16)),
            const Spacer(),
            Text('${pnl >= 0 ? '+' : ''}₹${pnl.toStringAsFixed(0)}',
              style: TextStyle(color: pnl >= 0 ? AppTheme.green : AppTheme.red, fontWeight: FontWeight.w800, fontSize: 18)),
          ]),
          const SizedBox(height: 10),
          Row(children: [
            _infoCol('Entry', '₹${entry.toStringAsFixed(1)}'),
            const SizedBox(width: 20),
            _infoCol('Exit', '₹${exit.toStringAsFixed(1)}'),
            const SizedBox(width: 20),
            _infoCol('Qty', '${t['quantity'] ?? '—'}'),
          ]),
          const SizedBox(height: 8),
          Row(children: [
            _infoCol('Strategy', t['strategy'] ?? 'Signal'),
            const Spacer(),
            Text(date, style: const TextStyle(color: AppTheme.textMuted, fontSize: 11)),
          ]),
        ],
      ),
    );
  }

  Widget _infoCol(String label, String value) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(label, style: const TextStyle(color: AppTheme.textMuted, fontSize: 10)),
      Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
    ],
  );
}
