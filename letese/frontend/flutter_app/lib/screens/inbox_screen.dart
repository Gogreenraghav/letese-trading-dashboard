/// LETESE● Unified Inbox Screen
/// WhatsApp, Email, Court orders, System notifications
import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';

// Inbox providers
final inboxPageProvider = FutureProvider.family<List<InboxItem>, InboxParams>((ref, params) async {
  final dio = ref.read(dioProvider);
  final resp = await dio.get('/inbox', queryParameters: {
    'tab': params.tab,
    'limit': params.limit,
    'offset': params.offset,
  });
  return (resp.data['items'] as List).map((i) => InboxItem.fromJson(i)).toList();
});

class InboxParams {
  final String tab;
  final int limit;
  final int offset;
  InboxParams({required this.tab, this.limit = 20, this.offset = 0});
  @override bool operator ==(Object o) => o is InboxParams && o.tab == tab && o.limit == limit && o.offset == offset;
  @override int get hashCode => Object.hash(tab, limit, offset);
}

class InboxItem {
  final String id;
  final String channel; // whatsapp | email | system | court
  final String caseName;
  final String sender;
  final String message;
  final String urgency; // critical | high | medium | low
  final String action; // reply_required | review_draft | info | acknowledgment
  final bool read;
  final DateTime createdAt;
  final String? caseId;

  InboxItem({required this.id, required this.channel, required this.caseName, required this.sender,
      required this.message, required this.urgency, required this.action, required this.read, required this.createdAt, this.caseId});

  factory InboxItem.fromJson(Map<String, dynamic> json) => InboxItem(
    id: json['id'] ?? '',
    channel: json['channel'] ?? 'system',
    caseName: json['case_name'] ?? json['caseName'] ?? '',
    sender: json['sender'] ?? '',
    message: json['message'] ?? '',
    urgency: json['urgency'] ?? 'low',
    action: json['action'] ?? 'info',
    read: json['read'] ?? false,
    createdAt: json['created_at'] != null ? DateTime.parse(json['created_at']) : DateTime.now(),
    caseId: json['case_id'],
  );
}

// ── Inbox Screen ─────────────────────────────────────────────────────────────

class InboxScreen extends ConsumerStatefulWidget {
  const InboxScreen({super.key});
  @override
  ConsumerState<InboxScreen> createState() => _InboxScreenState();
}

class _InboxScreenState extends ConsumerState<InboxScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isRefreshing = false;

  final _tabs = const ['urgent', 'action_needed', 'unread', 'all'];
  final _tabLabels = const ['🔴 Urgent', '📋 Action', '📭 Unread', '📁 All'];
  final _tabKeys = const ['urgent', 'action_needed', 'unread', 'all'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _connectWebSocket();
  }

  WebSocketChannel? _wsChannel;
  StreamSubscription? _wsSub;

  Future<void> _connectWebSocket() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final tenantId = prefs.getString('tenant_id') ?? '';
      final token = prefs.getString('access_token') ?? '';
      final uri = Uri.parse('wss://api.letese.xyz/ws/inbox/$tenantId?token=$token');
      _wsChannel = WebSocketChannel.connect(uri);
      _wsSub = _wsChannel!.stream.listen(
        (data) {
          if (!mounted) return;
          final msg = jsonDecode(data as String);
          if (msg['type'] == 'new_message') {
            _showNewMessageToast(msg);
            // Refresh current tab
            ref.invalidate(inboxPageProvider(InboxParams(tab: _tabKeys[_tabController.index])));
          }
        },
        onError: (_) {},
      );
    } catch (_) {}
  }

  void _showNewMessageToast(Map<String, dynamic> msg) {
    if (!mounted) return;
    final channel = msg['channel'] as String? ?? 'system';
    final icon = channel == 'whatsapp' ? '💬' : channel == 'email' ? '📧' : '🏛️';
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Text('$icon ', style: const TextStyle(fontSize: 18)),
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('${msg['sender'] ?? 'New message'} — ${msg['case_name'] ?? ''}',
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                  Text((msg['message'] as String? ?? '').split('\n').first,
                      style: const TextStyle(fontSize: 11), maxLines: 1, overflow: TextOverflow.ellipsis),
                ],
              ),
            ),
          ],
        ),
        backgroundColor: AppColors.bgElevated,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        duration: const Duration(seconds: 4),
      ),
    );
  }

  @override
  void dispose() {
    _wsSub?.cancel();
    _wsChannel?.sink.close();
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _onRefresh() async {
    setState(() => _isRefreshing = true);
    ref.invalidate(inboxPageProvider(InboxParams(tab: _tabKeys[_tabController.index])));
    await Future.delayed(const Duration(milliseconds: 800));
    if (mounted) setState(() => _isRefreshing = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgObsidian,
      appBar: AppBar(
        title: Row(
          children: [
            const LeteseLogo(fontSize: 22),
            const SizedBox(width: 16),
            const Text('Inbox', style: TextStyle(fontSize: 17)),
          ],
        ),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          indicatorColor: AppColors.neonCyan,
          labelColor: AppColors.neonCyan,
          unselectedLabelColor: AppColors.textSecondary,
          indicatorWeight: 2,
          tabAlignment: TabAlignment.start,
          tabs: _tabLabels.map((l) => Tab(text: l)).toList(),
          onTap: (_) => ref.invalidate(inboxPageProvider(InboxParams(tab: _tabKeys[_tabController.index]))),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: _tabKeys.map((tab) => _InboxTabView(tab: tab, onRefresh: _onRefresh, isRefreshing: _isRefreshing)).toList(),
      ),
    );
  }
}

class _InboxTabView extends ConsumerWidget {
  final String tab;
  final Future<void> Function() onRefresh;
  final bool isRefreshing;
  const _InboxTabView({required this.tab, required this.onRefresh, required this.isRefreshing});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncItems = ref.watch(inboxPageProvider(InboxParams(tab: tab)));

    return RefreshIndicator(
      onRefresh: onRefresh,
      color: AppColors.neonCyan,
      backgroundColor: AppColors.bgSurface,
      child: asyncItems.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.neonCyan)),
        error: (e, _) => Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.error_outline, size: 48, color: AppColors.error),
            const SizedBox(height: 12),
            Text('Failed to load inbox', style: TextStyle(color: AppColors.textSecondary)),
            TextButton(onPressed: () => ref.invalidate(inboxPageProvider(InboxParams(tab: tab))), child: const Text('Retry')),
          ]),
        ),
        data: (items) {
          if (items.isEmpty) {
            return Center(
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                Icon(Icons.inbox_outlined, size: 64, color: AppColors.textTertiary),
                const SizedBox(height: 16),
                Text(_emptyMessage(tab), style: TextStyle(color: AppColors.textSecondary, fontSize: 15)),
              ]),
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: items.length,
            itemBuilder: (context, index) {
              final item = items[index];
              return _InboxItemCard(item: item);
            },
          );
        },
      ),
    );
  }

  String _emptyMessage(String tab) {
    return switch (tab) {
      'urgent' => 'No urgent items',
      'action_needed' => 'No pending actions',
      'unread' => 'All caught up!',
      _ => 'Your inbox is empty',
    };
  }
}

// ── Inbox Item Card ─────────────────────────────────────────────────────────

class _InboxItemCard extends StatelessWidget {
  final InboxItem item;
  const _InboxItemCard({required this.item});

  Color get _urgencyColor {
    return switch (item.urgency) {
      'critical' => AppColors.urgent,
      'high' => AppColors.warning,
      'medium' => AppColors.medium,
      _ => AppColors.brandGreen,
    };
  }

  IconData get _channelIcon {
    return switch (item.channel) {
      'whatsapp' => Icons.chat,
      'email' => Icons.email_outlined,
      'court' => Icons.gavel,
      _ => Icons.info_outline,
    };
  }

  Color get _channelColor {
    return switch (item.channel) {
      'whatsapp' => const Color(0xFF25D366),
      'email' => AppColors.neonCyan,
      'court' => AppColors.electricPurple,
      _ => AppColors.textSecondary,
    };
  }

  String get _actionLabel {
    return switch (item.action) {
      'reply_required' => 'Reply Required',
      'review_draft' => 'Review Draft',
      'acknowledgment' => 'Acknowledge',
      'info' => 'Info',
      _ => item.action.replaceAll('_', ' ').toUpperCase(),
    };
  }

  Color get _actionColor {
    return switch (item.action) {
      'reply_required' => AppColors.urgent,
      'review_draft' => AppColors.electricPurple,
      'acknowledgment' => AppColors.warning,
      _ => AppColors.textTertiary,
    };
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => _openInboxDetail(context, item),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: item.read ? AppColors.bgSurface : AppColors.bgSurface.withAlpha(204),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: item.read ? AppColors.bgBorder : _urgencyColor.withAlpha(77),
            width: item.read ? 1 : 1.5,
          ),
          boxShadow: item.read ? null : [
            BoxShadow(color: _urgencyColor.withAlpha(13), blurRadius: 8, offset: const Offset(0, 2)),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                // Channel icon
                Container(
                  width: 32, height: 32,
                  decoration: BoxDecoration(color: _channelColor.withAlpha(26), borderRadius: BorderRadius.circular(8)),
                  child: Icon(_channelIcon, color: _channelColor, size: 16),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(item.sender, style: TextStyle(fontSize: 13, fontWeight: item.read ? FontWeight.w400 : FontWeight.w600, color: AppColors.textPrimary)),
                      Text(item.caseName, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    if (item.urgency != 'low')
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: _urgencyColor.withAlpha(26),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          item.urgency == 'critical' ? '🔴' : '🟡',
                          style: const TextStyle(fontSize: 10),
                        ),
                      )
                    else
                      const SizedBox(height: 18),
                    const SizedBox(height: 4),
                    Text(
                      _formatTime(item.createdAt),
                      style: const TextStyle(fontSize: 10, color: AppColors.textTertiary),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              item.message,
              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, height: 1.4),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: _actionColor.withAlpha(18),
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: _actionColor.withAlpha(51)),
              ),
              child: Text(
                _actionLabel,
                style: TextStyle(fontSize: 10, color: _actionColor, fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return DateFormat('dd MMM').format(dt);
  }

  void _openInboxDetail(BuildContext context, InboxItem item) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _InboxDetailSheet(item: item),
    );
  }
}

// ── Inbox Detail Sheet ──────────────────────────────────────────────────────

class _InboxDetailSheet extends StatelessWidget {
  final InboxItem item;
  const _InboxDetailSheet({required this.item});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.75,
      decoration: const BoxDecoration(
        color: AppColors.bgSurface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        border: Border(top: BorderSide(color: AppColors.bgBorder)),
      ),
      child: Column(
        children: [
          // Handle
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40, height: 4,
            decoration: BoxDecoration(color: AppColors.bgBorder, borderRadius: BorderRadius.circular(2)),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                // Header
                Row(
                  children: [
                    Container(
                      width: 48, height: 48,
                      decoration: BoxDecoration(color: AppColors.neonCyanDim, borderRadius: BorderRadius.circular(12)),
                      child: Icon(_channelIcon(item.channel), color: AppColors.neonCyan, size: 24),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(item.sender, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                          const SizedBox(height: 2),
                          Text(item.caseName, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                        ],
                      ),
                    ),
                    Text(DateFormat('dd MMM yyyy, HH:mm').format(item.createdAt),
                        style: const TextStyle(fontSize: 11, color: AppColors.textTertiary)),
                  ],
                ),
                const SizedBox(height: 20),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.bgElevated,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: SelectableText(item.message, style: const TextStyle(fontSize: 14, color: AppColors.textPrimary, height: 1.6)),
                ),
              ],
            ),
          ),

          // Action bar
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: AppColors.bgElevated,
              border: Border(top: BorderSide(color: AppColors.bgBorder)),
            ),
            child: Row(
              children: [
                if (item.action == 'reply_required' && item.channel == 'whatsapp')
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {},
                      icon: const Icon(Icons.chat, size: 18),
                      label: const Text('Reply on WhatsApp'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF25D366),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  )
                else if (item.action == 'reply_required' && item.channel == 'email')
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {},
                      icon: const Icon(Icons.email_outlined, size: 18),
                      label: const Text('Reply via Email'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.neonCyan,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  )
                else if (item.action == 'review_draft')
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {},
                      icon: const Icon(Icons.edit_document, size: 18),
                      label: const Text('Review Draft'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.electricPurple,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  )
                else
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.check, size: 18),
                      label: const Text('Acknowledge'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.brandGreen,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                const SizedBox(width: 12),
                OutlinedButton(
                  onPressed: () => Navigator.pop(context),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.textSecondary,
                    side: const BorderSide(color: AppColors.bgBorder),
                    padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                  ),
                  child: const Text('Close'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  IconData _channelIcon(String channel) {
    return switch (channel) {
      'whatsapp' => Icons.chat,
      'email' => Icons.email_outlined,
      'court' => Icons.gavel,
      _ => Icons.info_outline,
    };
  }
}
