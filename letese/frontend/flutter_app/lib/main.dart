/// LETESE● Main App Entry Point
/// Updated: Lattice Design System — Light theme, 5-tab bottom nav
import 'package:google_fonts/google_fonts.dart';
import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'theme/app_theme.dart';
import 'screens/auth_screen.dart';
import 'screens/case_diary_screen.dart';
import 'screens/case_detail_screen.dart';
import 'screens/inbox_screen.dart';
import 'screens/tasks_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/aipot_feed_screen.dart';

void main() {
  runApp(const ProviderScope(child: LeteseApp()));
}

class LeteseApp extends StatelessWidget {
  const LeteseApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LETESE● Legal',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      initialRoute: '/login',
      routes: {
        '/login': (_) => const LoginScreen(),
        '/app': (_) => const MainShell(),
        '/cases/new': (_) => const NewCaseScreen(),
      },
      onGenerateRoute: (settings) {
        if (settings.name == '/cases/detail') {
          final caseId = settings.arguments as String;
          return MaterialPageRoute(builder: (_) => CaseDetailScreen(caseId: caseId));
        }
        return null;
      },
    );
  }
}

// ── WebSocket Manager ────────────────────────────────────────────────────────

class WsManager {
  WebSocketChannel? _diaryChannel;
  WebSocketChannel? _inboxChannel;
  StreamSubscription? _diarySub;
  StreamSubscription? _inboxSub;
  Function(Map<String, dynamic>)? onDiaryMessage;
  Function(Map<String, dynamic>)? onInboxMessage;

  Future<void> connect() async {
    final prefs = await SharedPreferences.getInstance();
    final tenantId = prefs.getString('tenant_id') ?? '';
    final token = prefs.getString('access_token') ?? '';
    if (tenantId.isEmpty) return;

    try {
      // Diary WebSocket
      final diaryUri = Uri.parse('wss://api.letese.xyz/ws/diary/$tenantId?token=$token');
      _diaryChannel = WebSocketChannel.connect(diaryUri);
      _diarySub = _diaryChannel!.stream.listen(
        (data) {
          final msg = jsonDecode(data as String);
          onDiaryMessage?.call(Map<String, dynamic>.from(msg));
        },
        onError: (_) {},
      );

      // Inbox WebSocket
      final inboxUri = Uri.parse('wss://api.letese.xyz/ws/inbox/$tenantId?token=$token');
      _inboxChannel = WebSocketChannel.connect(inboxUri);
      _inboxSub = _inboxChannel!.stream.listen(
        (data) {
          final msg = jsonDecode(data as String);
          onInboxMessage?.call(Map<String, dynamic>.from(msg));
        },
        onError: (_) {},
      );
    } catch (_) {}
  }

  void disconnect() {
    _diarySub?.cancel();
    _inboxSub?.cancel();
    _diaryChannel?.sink.close();
    _inboxChannel?.sink.close();
    _diaryChannel = null;
    _inboxChannel = null;
  }
}

final wsManagerProvider = Provider<WsManager>((ref) {
  final manager = WsManager();
  ref.onDispose(() => manager.disconnect());
  return manager;
});

// ── Main Shell — 5-Tab Bottom Navigation ─────────────────────────────────────

class MainShell extends ConsumerStatefulWidget {
  const MainShell({super.key});
  @override
  ConsumerState<MainShell> createState() => _MainShellState();
}

class _MainShellState extends ConsumerState<MainShell> {
  int _currentIndex = 0;

  final _screens = const [
    DashboardScreen(),
    CaseDiaryScreen(),
    AipotFeedScreen(),
    InboxScreen(),
    ProfileScreen(),
  ];

  @override
  void initState() {
    super.initState();
    _initWs();
  }

  Future<void> _initWs() async {
    final ws = ref.read(wsManagerProvider);
    ws.onDiaryMessage = _handleDiaryMessage;
    ws.onInboxMessage = _handleInboxMessage;
    await ws.connect();
  }

  void _handleDiaryMessage(Map<String, dynamic> msg) {
    if (!mounted) return;
    if (msg['event'] == 'ORDER_DETECTED') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.receipt_long, color: LatticeColors.primary),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('🆕 New Order Detected',
                        style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: LatticeColors.textPrimary)),
                    Text(
                      (msg['case_name'] as String? ?? '').split('\n').first,
                      style: const TextStyle(fontSize: 11, color: LatticeColors.textSecondary),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
          backgroundColor: LatticeColors.surface,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          duration: const Duration(seconds: 5),
        ),
      );
    }
  }

  void _handleInboxMessage(Map<String, dynamic> msg) {
    if (!mounted) return;
    if (msg['type'] == 'new_message') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.inbox, color: LatticeColors.primary),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  '${msg['sender'] ?? 'New message'}: ${(msg['message'] as String? ?? '').split('\n').first}',
                  style: const TextStyle(fontSize: 12),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          backgroundColor: LatticeColors.surface,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          duration: const Duration(seconds: 4),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: _screens),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: LatticeColors.surface,
          border: Border(top: BorderSide(color: LatticeColors.cardBorder, width: 1)),
          boxShadow: [
            BoxShadow(color: LatticeColors.shadow, blurRadius: 16, offset: Offset(0, -4)),
          ],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _NavItem(
                  icon: Icons.home_outlined,
                  activeIcon: Icons.home,
                  label: 'Home',
                  isActive: _currentIndex == 0,
                  onTap: () => setState(() => _currentIndex = 0),
                ),
                _NavItem(
                  icon: Icons.folder_copy_outlined,
                  activeIcon: Icons.folder_copy,
                  label: 'Cases',
                  isActive: _currentIndex == 1,
                  onTap: () => setState(() => _currentIndex = 1),
                ),
                _NavItem(
                  icon: Icons.smart_toy_outlined,
                  activeIcon: Icons.smart_toy,
                  label: 'AIPOT',
                  isActive: _currentIndex == 2,
                  onTap: () => setState(() => _currentIndex = 2),
                  badge: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                    decoration: BoxDecoration(
                      color: LatticeColors.liveRed,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text(
                      'LIVE',
                      style: TextStyle(fontSize: 8, fontWeight: FontWeight.w700, color: Colors.white),
                    ),
                  ),
                ),
                _NavItem(
                  icon: Icons.inbox_outlined,
                  activeIcon: Icons.inbox,
                  label: 'Inbox',
                  isActive: _currentIndex == 3,
                  onTap: () => setState(() => _currentIndex = 3),
                ),
                _NavItem(
                  icon: Icons.person_outline,
                  activeIcon: Icons.person,
                  label: 'Profile',
                  isActive: _currentIndex == 4,
                  onTap: () => setState(() => _currentIndex = 4),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Nav Item Widget ────────────────────────────────────────────────────────────

class _NavItem extends StatelessWidget {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool isActive;
  final VoidCallback onTap;
  final Widget? badge;

  const _NavItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.isActive,
    required this.onTap,
    this.badge,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        width: 64,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: isActive ? LatticeColors.primary.withAlpha(20) : Colors.transparent,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    isActive ? activeIcon : icon,
                    color: isActive ? LatticeColors.primary : LatticeColors.textTertiary,
                    size: 22,
                  ),
                ),
                if (badge != null)
                  Positioned(
                    top: -4,
                    right: -4,
                    child: badge!,
                  ),
              ],
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 10,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
                color: isActive ? LatticeColors.primary : LatticeColors.textTertiary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Google Fonts import needed for _NavItem
import 'package:google_fonts/google_fonts.dart';