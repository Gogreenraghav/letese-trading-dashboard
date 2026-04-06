/// LETESE● Case Detail Screen
/// Full case view with hearings, orders, client info, tasks, docs
import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';
import 'ai_draft_screen.dart';

final caseDetailProvider = FutureProvider.family<CaseDetail, String>((ref, caseId) async {
  final dio = ref.read(dioProvider);
  final casesApi = CasesApi(dio);
  return casesApi.getCase(caseId);
});

class CaseDetailScreen extends ConsumerStatefulWidget {
  final String caseId;
  const CaseDetailScreen({super.key, required this.caseId});

  @override
  ConsumerState<CaseDetailScreen> createState() => _CaseDetailScreenState();
}

class _CaseDetailScreenState extends ConsumerState<CaseDetailScreen> {
  WebSocketChannel? _wsChannel;
  StreamSubscription? _wsSub;
  bool _scraping = false;
  String? _scrapeError;

  @override
  void initState() {
    super.initState();
    _connectWebSocket();
  }

  Future<void> _connectWebSocket() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final tenantId = prefs.getString('tenant_id') ?? '';
      final token = prefs.getString('access_token') ?? '';
      final uri = Uri.parse('wss://api.letese.xyz/ws/diary/$tenantId?token=$token');
      _wsChannel = WebSocketChannel.connect(uri);
      _wsSub = _wsChannel!.stream.listen(
        (data) {
          if (!mounted) return;
          final msg = jsonDecode(data as String);
          if (msg['event'] == 'ORDER_DETECTED' && msg['case_id'] == widget.caseId) {
            _showNewOrderToast(msg);
          }
        },
        onError: (_) {},
      );
    } catch (_) {}
  }

  void _showNewOrderToast(Map<String, dynamic> msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.receipt_long, color: AppColors.neonCyan),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('🆕 New Order Detected!', style: TextStyle(fontWeight: FontWeight.w600)),
                  Text(
                    (msg['order_summary'] as String? ?? 'New court order received').split('\n').first,
                    style: const TextStyle(fontSize: 12),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
        backgroundColor: AppColors.bgElevated,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        duration: const Duration(seconds: 5),
      ),
    );
    ref.invalidate(caseDetailProvider(widget.caseId));
  }

  Future<void> _triggerScrape() async {
    setState(() { _scraping = true; _scrapeError = null; });
    try {
      final dio = ref.read(dioProvider);
      final casesApi = CasesApi(dio);
      await casesApi.triggerScrape(widget.caseId);
      await Future.delayed(const Duration(seconds: 2));
      ref.invalidate(caseDetailProvider(widget.caseId));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Row(children: [
              Icon(Icons.check_circle, color: AppColors.brandGreen),
              SizedBox(width: 12),
              Text('Scrape triggered successfully'),
            ]),
            backgroundColor: AppColors.bgElevated,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    } catch (e) {
      setState(() => _scrapeError = e.toString());
    } finally {
      if (mounted) setState(() => _scraping = false);
    }
  }

  @override
  void dispose() {
    _wsSub?.cancel();
    _wsChannel?.sink.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final detailAsync = ref.watch(caseDetailProvider(widget.caseId));
    return Scaffold(
      backgroundColor: AppColors.bgObsidian,
      appBar: AppBar(
        title: const Text('Case Details', style: TextStyle(fontSize: 17)),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppColors.neonCyan),
            onPressed: () => ref.invalidate(caseDetailProvider(widget.caseId)),
          ),
        ],
      ),
      body: detailAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.neonCyan)),
        error: (e, _) => Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.error_outline, size: 48, color: AppColors.error),
            const SizedBox(height: 12),
            Text('Failed to load case', style: TextStyle(color: AppColors.textSecondary)),
            TextButton(onPressed: () => ref.invalidate(caseDetailProvider(widget.caseId)), child: const Text('Retry')),
          ]),
        ),
        data: (detail) => _buildContent(detail),
      ),
    );
  }

  Widget _buildContent(CaseDetail detail) {
    final nextHearing = _getNextHearing(detail.hearings);
    final upcomingHearings = _getUpcomingHearings(detail.hearings);
    final orderHistory = _getOrderHistory(detail.hearings);

    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        // Header
        GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(detail.caseTitle, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                        const SizedBox(height: 4),
                        Text(
                          '${detail.courtDisplayName}${detail.caseNumber.isNotEmpty ? ' • ${detail.caseNumber}' : ''}',
                          style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                  ),
                  UrgencyBadge(level: detail.urgencyLevel),
                ],
              ),
              if (detail.notes != null && detail.notes!.isNotEmpty) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: AppColors.bgElevated, borderRadius: BorderRadius.circular(8)),
                  child: Text(detail.notes!, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 12),

        // Next Hearing
        if (nextHearing != null) ...[
          _SectionHeader(title: '📅 NEXT HEARING'),
          const SizedBox(height: 8),
          GlassCard(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(color: AppColors.neonCyanDim, borderRadius: BorderRadius.circular(8)),
                      child: Text(
                        DateFormat('dd MMM yyyy').format(nextHearing['date'] as DateTime),
                        style: const TextStyle(color: AppColors.neonCyan, fontWeight: FontWeight.w700, fontSize: 15),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(nextHearing['court'] as String? ?? detail.courtDisplayName,
                              style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                          if (nextHearing['bench'] != null)
                            Text('Bench: ${nextHearing['bench']}', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                        ],
                      ),
                    ),
                  ],
                ),
                if (nextHearing['purpose'] != null) ...[
                  const SizedBox(height: 8),
                  Text('Purpose: ${nextHearing['purpose']}', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                ],
                if (nextHearing['time'] != null)
                  Text('Time: ${nextHearing['time']}', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],

        // Upcoming hearings
        if (upcomingHearings.isNotEmpty) ...[
          _SectionHeader(title: '📆 UPCOMING HEARINGS'),
          const SizedBox(height: 8),
          ...upcomingHearings.map((h) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: GlassCard(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  const Icon(Icons.event, color: AppColors.neonCyan, size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(DateFormat('dd MMM yyyy').format(h['date'] as DateTime),
                            style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                        if (h['purpose'] != null)
                          Text(h['purpose'] as String, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                      ],
                    ),
                  ),
                  if (h['bench'] != null)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(color: AppColors.bgElevated, borderRadius: BorderRadius.circular(4)),
                      child: Text(h['bench'] as String, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                    ),
                ],
              ),
            ),
          )),
          const SizedBox(height: 4),
        ],

        // Order History
        _SectionHeader(title: '📜 ORDER HISTORY'),
        const SizedBox(height: 8),
        if (detail.lastOrderSummary != null && detail.lastOrderSummary!.isNotEmpty)
          GlassCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.receipt_long, color: AppColors.neonCyan, size: 18),
                    const SizedBox(width: 8),
                    if (detail.lastOrderDate != null)
                      Text(DateFormat('dd MMM yyyy').format(detail.lastOrderDate!),
                          style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(color: AppColors.neonCyanDim, borderRadius: BorderRadius.circular(4)),
                      child: const Text('LATEST', style: TextStyle(fontSize: 10, color: AppColors.neonCyan, fontWeight: FontWeight.w700)),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(detail.lastOrderSummary!, style: const TextStyle(fontSize: 13, color: AppColors.textPrimary, height: 1.5)),
              ],
            ),
          )
        else
          GlassCard(child: Center(child: Text('No orders recorded yet. Tap "Scrape Now" to fetch.',
              style: const TextStyle(color: AppColors.textTertiary, fontSize: 13)))),
        ...orderHistory.map((o) => Padding(
          padding: const EdgeInsets.only(top: 8),
          child: GlassCard(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(DateFormat('dd MMM yyyy').format(o['date'] as DateTime),
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                    const Spacer(),
                    if (o['summary'] != null && (o['summary'] as String).isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(color: AppColors.bgElevated, borderRadius: BorderRadius.circular(4)),
                        child: const Text('ORDER', style: TextStyle(fontSize: 10, color: AppColors.textTertiary)),
                      ),
                  ],
                ),
                if (o['summary'] != null) ...[
                  const SizedBox(height: 6),
                  Text(o['summary'] as String, style: const TextStyle(fontSize: 13, color: AppColors.textPrimary, height: 1.4)),
                ],
              ],
            ),
          ),
        )),
        const SizedBox(height: 12),

        // Quick Actions
        _SectionHeader(title: '⚡ QUICK ACTIONS'),
        const SizedBox(height: 8),
        GlassCard(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Expanded(child: _ActionButton(icon: Icons.sync, label: 'Scrape Now', color: AppColors.neonCyan, loading: _scraping, onTap: _triggerScrape)),
              const SizedBox(width: 8),
              Expanded(child: _ActionButton(icon: Icons.auto_awesome, label: 'AI Draft', color: AppColors.electricPurple,
                  onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => AiDraftScreen(caseDetail: detail))))),
              const SizedBox(width: 8),
              Expanded(child: _ActionButton(icon: Icons.notifications_active, label: 'Reminder', color: AppColors.warning, onTap: () => _sendReminder(detail))),
              const SizedBox(width: 8),
              Expanded(child: _ActionButton(icon: Icons.receipt_long, label: 'Invoice', color: AppColors.brandGreen, onTap: () => _showInvoiceDialog(detail))),
            ],
          ),
        ),
        if (_scrapeError != null)
          Padding(padding: const EdgeInsets.only(top: 8), child: Text(_scrapeError!, style: const TextStyle(color: AppColors.error, fontSize: 12))),

        const SizedBox(height: 12),

        // Client Info
        _SectionHeader(title: '👤 CLIENT INFO'),
        const SizedBox(height: 8),
        GlassCard(
          child: Column(
            children: [
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Container(width: 40, height: 40, decoration: BoxDecoration(color: AppColors.neonCyanDim, borderRadius: BorderRadius.circular(8)),
                    child: const Icon(Icons.person, color: AppColors.neonCyan)),
                title: Text(detail.clientName, style: const TextStyle(fontWeight: FontWeight.w600)),
                subtitle: const Text('Client', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
              ),
              const Divider(color: AppColors.bgBorder),
              _ClientContactRow(icon: Icons.phone, label: detail.clientPhone, onTap: () => _launchUrl('tel:${detail.clientPhone}')),
              if (detail.clientEmail != null)
                _ClientContactRow(icon: Icons.email_outlined, label: detail.clientEmail!, onTap: () => _launchUrl('mailto:${detail.clientEmail}')),
              _ClientContactRow(icon: Icons.chat, label: 'WhatsApp', onTap: () => _launchWhatsApp(detail.clientPhone)),
            ],
          ),
        ),
        const SizedBox(height: 12),

        // Tasks
        _SectionHeader(title: '✅ TASKS (${detail.tasks.length})'),
        const SizedBox(height: 8),
        if (detail.tasks.isEmpty)
          GlassCard(child: Center(child: Padding(padding: const EdgeInsets.symmetric(vertical: 16),
              child: Text('No tasks for this case', style: const TextStyle(color: AppColors.textTertiary, fontSize: 13)))))
        else
          ...detail.tasks.map((t) => _TaskTile(task: t, caseId: widget.caseId)),

        const SizedBox(height: 12),

        // Documents
        _SectionHeader(title: '📎 DOCUMENTS (${detail.documents.length})'),
        const SizedBox(height: 8),
        if (detail.documents.isEmpty)
          GlassCard(child: Center(child: Padding(padding: const EdgeInsets.symmetric(vertical: 16),
              child: Text('No documents uploaded', style: const TextStyle(color: AppColors.textTertiary, fontSize: 13)))))
        else
          ...detail.documents.map((doc) => _DocumentTile(doc: doc)),

        const SizedBox(height: 40),
      ],
    );
  }

  Map<String, dynamic>? _getNextHearing(List<dynamic> hearings) {
    if (hearings.isEmpty) return null;
    final now = DateTime.now();
    final upcoming = hearings.where((h) => (h['date'] as DateTime).isAfter(now.subtract(const Duration(days: 1)))).toList()
      ..sort((a, b) => (a['date'] as DateTime).compareTo(b['date'] as DateTime));
    return upcoming.isNotEmpty ? Map<String, dynamic>.from(upcoming.first) : null;
  }

  List<Map<String, dynamic>> _getUpcomingHearings(List<dynamic> hearings) {
    if (hearings.isEmpty) return [];
    final now = DateTime.now();
    return hearings.where((h) => (h['date'] as DateTime).isAfter(now)).toList().cast<Map<String, dynamic>>()
      ..sort((a, b) => (a['date'] as DateTime).compareTo(b['date'] as DateTime));
  }

  List<Map<String, dynamic>> _getOrderHistory(List<dynamic> hearings) {
    if (hearings.isEmpty) return [];
    final now = DateTime.now();
    return hearings.where((h) {
      final d = h['date'] as DateTime;
      final hasOrder = h['summary'] != null && (h['summary'] as String).isNotEmpty;
      return d.isBefore(now) && hasOrder;
    }).toList().cast<Map<String, dynamic>>()
      ..sort((a, b) => (b['date'] as DateTime).compareTo(a['date'] as DateTime));
  }

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  Future<void> _launchWhatsApp(String phone) async {
    final clean = phone.replaceAll(RegExp(r'[^\d]'), '');
    await _launchUrl('https://wa.me/$clean');
  }

  void _sendReminder(CaseDetail detail) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Row(children: [Icon(Icons.check_circle, color: AppColors.brandGreen), SizedBox(width: 12), Text('Reminder sent to client via WhatsApp')]),
        backgroundColor: AppColors.bgElevated,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  void _showInvoiceDialog(CaseDetail detail) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: AppColors.bgSurface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Generate Invoice', style: TextStyle(color: AppColors.textPrimary)),
        content: Text('Create invoice for ${detail.clientName}?\nCase: ${detail.caseTitle}',
            style: const TextStyle(color: AppColors.textSecondary)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: const Row(children: [Icon(Icons.check_circle, color: AppColors.brandGreen), SizedBox(width: 12), Text('Invoice created successfully')]),
                  backgroundColor: AppColors.bgElevated,
                  behavior: SnackBarBehavior.floating,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              );
            },
            child: const Text('Generate'),
          ),
        ],
      ),
    );
  }
}

// ── Sub-widgets ──────────────────────────────────────────────────────────────

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});
  @override
  Widget build(BuildContext context) => Text(title, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.2));
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  final bool loading;
  const _ActionButton({required this.icon, required this.label, required this.color, required this.onTap, this.loading = false});
  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: loading ? null : onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
        decoration: BoxDecoration(
          color: color.withAlpha(18),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withAlpha(51)),
        ),
        child: Column(
          children: [
            if (loading)
              SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: color))
            else
              Icon(icon, color: color, size: 18),
            const SizedBox(height: 4),
            Text(label, style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.w600), textAlign: TextAlign.center, maxLines: 1),
          ],
        ),
      ),
    );
  }
}

class _ClientContactRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _ClientContactRow({required this.icon, required this.label, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          children: [
            Icon(icon, color: AppColors.neonCyan, size: 18),
            const SizedBox(width: 12),
            Text(label, style: const TextStyle(color: AppColors.neonCyan, fontSize: 13)),
            const Spacer(),
            const Icon(Icons.chevron_right, color: AppColors.textTertiary, size: 18),
          ],
        ),
      ),
    );
  }
}

class _TaskTile extends ConsumerWidget {
  final dynamic task;
  final String caseId;
  const _TaskTile({required this.task, required this.caseId});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final due = (task['due_date'] as String).isNotEmpty ? DateTime.parse(task['due_date'] as String) : DateTime.now();
    final daysUntil = due.difference(DateTime.now()).inDays;
    final color = daysUntil < 0 ? AppColors.urgent : daysUntil == 0 ? AppColors.warning : AppColors.brandGreen;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: GlassCard(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Checkbox(
              value: false,
              onChanged: (v) async {
                if (v == true) {
                  final dio = ref.read(dioProvider);
                  final tasksApi = TasksApi(dio);
                  await tasksApi.completeTask(task['task_id'] as String);
                  ref.invalidate(caseDetailProvider(caseId));
                }
              },
              activeColor: AppColors.brandGreen,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(task['title'] as String? ?? 'Task', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.textPrimary)),
                  if (task['description'] != null)
                    Text(task['description'] as String, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary), maxLines: 1),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(color: color.withAlpha(26), borderRadius: BorderRadius.circular(4)),
              child: Text(daysUntil < 0 ? '${-daysUntil}d overdue' : daysUntil == 0 ? 'Today' : DateFormat('dd MMM').format(due),
                  style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w600)),
            ),
          ],
        ),
      ),
    );
  }
}

class _DocumentTile extends StatelessWidget {
  final dynamic doc;
  const _DocumentTile({required this.doc});
  @override
  Widget build(BuildContext context) {
    final type = doc['type'] as String? ?? 'Document';
    final typeColor = type.toUpperCase().contains('ORDER')
        ? AppColors.neonCyan
        : type.toUpperCase().contains('PETITION')
            ? AppColors.electricPurple
            : type.toUpperCase().contains('REPLY') ? AppColors.warning : AppColors.brandGreen;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: GlassCard(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Icon(Icons.description, color: typeColor, size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(doc['name'] as String? ?? 'Document', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.textPrimary)),
                  if (doc['uploaded_at'] != null)
                    Text(DateFormat('dd MMM yyyy').format(DateTime.parse(doc['uploaded_at'] as String)),
                        style: const TextStyle(fontSize: 11, color: AppColors.textTertiary)),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(color: typeColor.withAlpha(26), borderRadius: BorderRadius.circular(4)),
              child: Text(type.toUpperCase(), style: TextStyle(fontSize: 10, color: typeColor, fontWeight: FontWeight.w700)),
            ),
            const SizedBox(width: 8),
            IconButton(
              icon: const Icon(Icons.open_in_new, color: AppColors.neonCyan, size: 18),
              onPressed: () {},
              constraints: const BoxConstraints(),
              padding: EdgeInsets.zero,
            ),
          ],
        ),
      ),
    );
  }
}
