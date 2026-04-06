/// LETESE● Main App Entry Point
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
      theme: AppTheme.darkTheme,
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

// ── Main Shell — Bottom Navigation ─────────────────────────────────────────

class MainShell extends ConsumerStatefulWidget {
  const MainShell({super.key});
  @override
  ConsumerState<MainShell> createState() => _MainShellState();
}

class _MainShellState extends ConsumerState<MainShell> {
  int _currentIndex = 0;

  final _screens = const [
    CaseDiaryScreen(),
    InboxScreen(),
    TasksScreen(),
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
      // Let CaseDetailScreen handle its own toast via its local WS
      // Invalidate cases list to show updated data
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
                    const Text('🆕 New Order Detected',
                        style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                    Text(
                      (msg['case_name'] as String? ?? '').split('\n').first,
                      style: const TextStyle(fontSize: 11),
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
    }
  }

  void _handleInboxMessage(Map<String, dynamic> msg) {
    if (!mounted) return;
    if (msg['type'] == 'new_message') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.inbox, color: AppColors.brandGreen),
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
          backgroundColor: AppColors.bgElevated,
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
          border: Border(top: BorderSide(color: AppColors.bgBorder, width: 1)),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (i) => setState(() => _currentIndex = i),
          backgroundColor: AppColors.bgSurface,
          selectedItemColor: AppColors.neonCyan,
          unselectedItemColor: AppColors.textTertiary,
          type: BottomNavigationBarType.fixed,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.folder_copy_outlined),
              activeIcon: Icon(Icons.folder_copy),
              label: 'Cases',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.inbox_outlined),
              activeIcon: Icon(Icons.inbox),
              label: 'Inbox',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.checklist_outlined),
              activeIcon: Icon(Icons.checklist),
              label: 'Tasks',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline),
              activeIcon: Icon(Icons.person),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }
}

/// LETESE● App Theme — Glassmorphism 2.0 Dark Theme
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  static const bgObsidian = Color(0xFF0A0E1A);
  static const bgSurface = Color(0xFF0F1629);
  static const bgElevated = Color(0xFF151E38);
  static const bgBorder = Color(0xFF1E2D4A);
  static const brandBlue = Color(0xFF1A4FBF);
  static const brandBlueLight = Color(0xFF3B6FDF);
  static const brandGreen = Color(0xFF22C55E);
  static const brandGreenGlow = Color(0x3322C55E);
  static const neonCyan = Color(0xFF00D4FF);
  static const neonCyanDim = Color(0x2600D4FF);
  static const electricPurple = Color(0xFF8B5CF6);
  static const purpleDim = Color(0x268B5CF6);
  static const success = brandGreen;
  static const successBg = Color(0x1A22C55E);
  static const warning = Color(0xFFF59E0B);
  static const warningBg = Color(0x1AF59E0B);
  static const error = Color(0xFFEF4444);
  static const errorBg = Color(0x1AEF4444);
  static const info = neonCyan;
  static const textPrimary = Color(0xFFF0F4FF);
  static const textSecondary = Color(0xFF8899BB);
  static const textTertiary = Color(0xFF4A5A7A);
  static const urgent = Color(0xFFFF4545);
  static const medium = warning;
  static const low = brandGreen;
}

class AppTheme {
  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: AppColors.bgObsidian,
      primaryColor: AppColors.brandBlue,
      colorScheme: const ColorScheme.dark(
        primary: AppColors.brandBlue,
        secondary: AppColors.neonCyan,
        tertiary: AppColors.electricPurple,
        surface: AppColors.bgSurface,
        onSurface: AppColors.textPrimary,
        error: AppColors.error,
      ),
      cardTheme: CardTheme(
        color: AppColors.bgSurface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: AppColors.bgBorder, width: 1)),
        elevation: 0,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.brandGreen,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          textStyle: GoogleFonts.inter(fontWeight: FontWeight.w600),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.brandBlueLight,
          side: const BorderSide(color: AppColors.brandBlue, width: 1),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0x0DFFFFFF),
        hintStyle: const TextStyle(color: AppColors.textTertiary),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.bgBorder)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: AppColors.bgBorder.withAlpha(128))),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.neonCyan, width: 1.5)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      ),
      textTheme: TextTheme(
        displayLarge: GoogleFonts.inter(fontSize: 56, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
        headlineMedium: GoogleFonts.inter(fontSize: 30, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
        titleLarge: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
        titleMedium: GoogleFonts.inter(fontSize: 17, fontWeight: FontWeight.w500, color: AppColors.textPrimary),
        bodyLarge: GoogleFonts.inter(fontSize: 15, color: AppColors.textPrimary, height: 1.7),
        bodyMedium: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary, height: 1.6),
        labelSmall: GoogleFonts.inter(fontSize: 11, color: AppColors.textTertiary),
      ),
      dividerTheme: const DividerThemeData(color: AppColors.bgBorder, thickness: 1),
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.bgObsidian,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
        iconTheme: const IconThemeData(color: AppColors.textPrimary),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.bgSurface,
        selectedItemColor: AppColors.neonCyan,
        unselectedItemColor: AppColors.textTertiary,
        type: BottomNavigationBarType.fixed,
      ),
    );
  }
}

class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsets? padding;
  final double? width;
  final double? height;
  final VoidCallback? onTap;
  const GlassCard({super.key, required this.child, this.padding, this.width, this.height, this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: width, height: height,
        padding: padding ?? const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white.withAlpha(13),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withAlpha(31), width: 1),
          boxShadow: const [
            BoxShadow(color: Color(0x66000000), blurRadius: 32, offset: Offset(0, 8)),
            BoxShadow(color: Color(0x14FFFFFF), blurRadius: 1, offset: Offset(0, 1)),
          ],
        ),
        child: child,
      ),
    );
  }
}

class LeteseLogo extends StatelessWidget {
  final double fontSize;
  const LeteseLogo({super.key, this.fontSize = 28});
  @override
  Widget build(BuildContext context) {
    return RichText(
      text: TextSpan(
        children: [
          TextSpan(
            text: 'LETESE',
            style: GoogleFonts.inter(fontSize: fontSize, fontWeight: FontWeight.w700, color: Colors.white),
          ),
          WidgetSpan(
            alignment: PlaceholderAlignment.belowBaseline,
            baseline: TextBaseline.alphabetic,
            child: Transform.translate(
              offset: Offset(0, fontSize * 0.15),
              child: Text('●', style: TextStyle(fontSize: fontSize * 0.44, color: AppColors.brandGreen, fontWeight: FontWeight.w700)),
            ),
          ),
        ],
      ),
    );
  }
}

class UrgencyBadge extends StatelessWidget {
  final String level;
  const UrgencyBadge({super.key, required this.level});
  Color get _color => switch (level) { 'critical' => AppColors.urgent, 'high' => AppColors.warning, 'medium' => AppColors.medium, _ => AppColors.low };
  String get _label => switch (level) { 'critical' => '🔴 CRITICAL', 'high' => '🟡 HIGH', 'medium' => '🟡 MEDIUM', _ => '🟢 LOW' };
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: _color.withAlpha(26), borderRadius: BorderRadius.circular(20), border: Border.all(color: _color.withAlpha(77))),
      child: Text(_label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: _color)),
    );
  }
}

/// LETESE● API Service
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(BaseOptions(
    baseUrl: 'https://api.letese.xyz/api/v1',
    connectTimeout: const Duration(seconds: 15),
    receiveTimeout: const Duration(seconds: 30),
    headers: {'Content-Type': 'application/json'},
  ));
  dio.interceptors.add(AuthInterceptor(ref));
  dio.interceptors.add(LogInterceptor(requestBody: true, responseBody: true, logPrint: (o) => print('[DIO] $o')));
  return dio;
});

class AuthInterceptor extends Interceptor {
  final Ref ref;
  AuthInterceptor(this.ref);
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token');
    if (token != null) options.headers['Authorization'] = 'Bearer $token';
    handler.next(options);
  }
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      final prefs = await SharedPreferences.getInstance();
      final refreshToken = prefs.getString('refresh_token');
      if (refreshToken != null) {
        try {
          final dio = Dio(BaseOptions(baseUrl: 'https://api.letese.xyz/api/v1'));
          final resp = await dio.post('/auth/refresh', data: {'refresh_token': refreshToken});
          final newAccessToken = resp.data['access_token'];
          await prefs.setString('access_token', newAccessToken);
          err.requestOptions.headers['Authorization'] = 'Bearer $newAccessToken';
          final retryResp = await dio.fetch(err.requestOptions);
          return handler.resolve(retryResp);
        } catch (_) {
          await prefs.remove('access_token');
          await prefs.remove('refresh_token');
        }
      }
    }
    handler.next(err);
  }
}

class AuthApi {
  final Dio _dio;
  AuthApi(this._dio);
  Future<void> sendOtp(String email) async => await _dio.post('/auth/send-otp', data: {'email': email});
  Future<AuthResult> login(String email, String otp) async {
    final resp = await _dio.post('/auth/login', data: {'email': email, 'otp': otp});
    return AuthResult.fromJson(resp.data);
  }
  Future<AuthResult> googleAuth(String idToken) async {
    final resp = await _dio.post('/auth/google', data: {'id_token': idToken});
    return AuthResult.fromJson(resp.data);
  }
}

class AuthResult {
  final String accessToken;
  final String refreshToken;
  final LeteseUser user;
  final LeteseTenant tenant;
  AuthResult({required this.accessToken, required this.refreshToken, required this.user, required this.tenant});
  factory AuthResult.fromJson(Map<String, dynamic> json) => AuthResult(
    accessToken: json['access_token'],
    refreshToken: json['refresh_token'],
    user: LeteseUser.fromJson(json['user']),
    tenant: LeteseTenant.fromJson(json['tenant']),
  );
}

class LeteseUser {
  final String userId, email, fullName, role, tenantId;
  LeteseUser({required this.userId, required this.email, required this.fullName, required this.role, required this.tenantId});
  factory LeteseUser.fromJson(Map<String, dynamic> json) => LeteseUser(
    userId: json['user_id'], email: json['email'], fullName: json['full_name'], role: json['role'], tenantId: json['tenant_id'],
  );
}

class LeteseTenant {
  final String tenantId, name, plan, status;
  LeteseTenant({required this.tenantId, required this.name, required this.plan, required this.status});
  factory LeteseTenant.fromJson(Map<String, dynamic> json) => LeteseTenant(
    tenantId: json['tenant_id'], name: json['name'], plan: json['plan'], status: json['status'],
  );
}

class CasesApi {
  final Dio _dio;
  CasesApi(this._dio);
  Future<List<Case>> listCases({String? status, String? courtCode, String? search, int limit = 50, int offset = 0}) async {
    final params = <String, dynamic>{'limit': limit, 'offset': offset};
    if (status != null) params['status'] = status;
    if (courtCode != null) params['court_code'] = courtCode;
    if (search != null) params['search'] = search;
    final resp = await _dio.get('/cases', queryParameters: params);
    return (resp.data['cases'] as List).map((c) => Case.fromJson(c)).toList();
  }
  Future<CaseDetail> createCase({required String caseTitle, required String courtCode, required String clientName, required String clientPhone, String? petitionType, String? caseNumber, DateTime? nextHearingAt, String? clientEmail, String? clientWhatsapp}) async {
    final resp = await _dio.post('/cases', data: {
      'case_title': caseTitle, 'court_code': courtCode, 'client_name': clientName, 'client_phone': clientPhone,
      if (petitionType != null) 'petition_type': petitionType, if (caseNumber != null) 'case_number': caseNumber,
      if (nextHearingAt != null) 'next_hearing_at': nextHearingAt.toIso8601String(),
      if (clientEmail != null) 'client_email': clientEmail, if (clientWhatsapp != null) 'client_whatsapp': clientWhatsapp,
    });
    return CaseDetail.fromJson(resp.data);
  }
  Future<CaseDetail> getCase(String caseId) async {
    final resp = await _dio.get('/cases/$caseId');
    return CaseDetail.fromJson(resp.data);
  }
  Future<void> triggerScrape(String caseId) async => await _dio.post('/cases/$caseId/scrape');
}

class Case {
  final String caseId, caseTitle, courtCode, status, urgencyLevel, clientName;
  final DateTime? nextHearingAt;
  Case({required this.caseId, required this.caseTitle, required this.courtCode, required this.status, required this.urgencyLevel, this.nextHearingAt, required this.clientName});
  factory Case.fromJson(Map<String, dynamic> json) {
    final data = json['case_id'] != null ? json : (json['data'] ?? json);
    return Case(
      caseId: data['case_id'] ?? data['caseId'] ?? '',
      caseTitle: data['case_title'] ?? data['caseTitle'] ?? '',
      courtCode: data['court_code'] ?? data['courtCode'] ?? '',
      status: data['status'] ?? 'active',
      urgencyLevel: data['urgency_level'] ?? data['urgencyLevel'] ?? 'low',
      nextHearingAt: data['next_hearing_at'] != null ? DateTime.parse(data['next_hearing_at']) : null,
      clientName: data['client_name'] ?? data['clientName'] ?? '',
    );
  }
}

class CaseDetail {
  final String caseId, caseTitle, caseNumber, courtCode, courtDisplayName, status, urgencyLevel, clientName, clientPhone;
  final String? clientEmail, lastOrderText, lastOrderSummary, notes;
  final DateTime? nextHearingAt, lastOrderDate;
  final DateTime createdAt;
  final List<dynamic> hearings, documents, tasks;
  CaseDetail({required this.caseId, required this.caseTitle, required this.caseNumber, required this.courtCode, required this.courtDisplayName, required this.status, required this.urgencyLevel, required this.clientName, required this.clientPhone, this.clientEmail, this.nextHearingAt, this.lastOrderText, this.lastOrderDate, this.lastOrderSummary, this.notes, required this.createdAt, required this.hearings, required this.documents, required this.tasks});
  factory CaseDetail.fromJson(Map<String, dynamic> json) => CaseDetail(
    caseId: json['case_id'], caseTitle: json['case_title'], caseNumber: json['case_number'] ?? '',
    courtCode: json['court_code'], courtDisplayName: json['court_display_name'] ?? json['court_code'],
    status: json['status'], urgencyLevel: json['urgency_level'],
    clientName: json['client_name'], clientPhone: json['client_phone'], clientEmail: json['client_email'],
    nextHearingAt: json['next_hearing_at'] != null ? DateTime.parse(json['next_hearing_at']) : null,
    lastOrderText: json['last_order_text'], lastOrderDate: json['last_order_date'] != null ? DateTime.parse(json['last_order_date']) : null,
    lastOrderSummary: json['last_order_summary'], notes: json['notes'],
    createdAt: DateTime.parse(json['created_at']),
    hearings: json['hearings'] ?? [], documents: json['documents'] ?? [], tasks: json['tasks'] ?? [],
  );
}

class TasksApi {
  final Dio _dio;
  TasksApi(this._dio);
  Future<List<Task>> listTasks({String? status, String? due}) async {
    final params = <String, dynamic>{};
    if (status != null) params['status'] = status;
    if (due != null) params['due'] = due;
    final resp = await _dio.get('/tasks', queryParameters: params);
    return (resp.data['tasks'] as List).map((t) => Task.fromJson(t)).toList();
  }
  Future<void> completeTask(String taskId) async => await _dio.patch('/tasks/$taskId', data: {'status': 'completed'});
}

class Task {
  final String taskId, title, priority, status, source;
  final String? caseId, description;
  final DateTime dueDate;
  Task({required this.taskId, this.caseId, required this.title, this.description, required this.dueDate, required this.priority, required this.status, required this.source});
  factory Task.fromJson(Map<String, dynamic> json) => Task(
    taskId: json['task_id'], caseId: json['case_id'], title: json['title'],
    description: json['description'], dueDate: DateTime.parse(json['due_date']),
    priority: json['priority'], status: json['status'], source: json['source'],
  );
}

/// LETESE● Authentication Screens
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});
  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController();
  bool _otpSent = false;
  bool _loading = false;
  String? _error;

  @override
  void dispose() { _emailController.dispose(); super.dispose(); }

  Future<void> _sendOtp() async {
    final email = _emailController.text.trim();
    if (email.isEmpty || !email.contains('@')) { setState(() => _error = 'Enter a valid email'); return; }
    setState(() => _loading = true);
    try {
      final dio = ref.read(dioProvider);
      final authApi = AuthApi(dio);
      await authApi.sendOtp(email);
      setState(() => _otpSent = true);
    } catch (e) { setState(() => _error = e.toString()); } finally { setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: RadialGradient(center: const Alignment(-0.3, -0.5), radius: 1.2, colors: [const Color(0x331A4FBF), AppColors.bgObsidian, AppColors.bgObsidian]),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                const LeteseLogo(fontSize: 36),
                const SizedBox(height: 8),
                Text('Legal Practice Management', style: TextStyle(fontSize: 14, color: AppColors.textSecondary, letterSpacing: 2)),
                const SizedBox(height: 48),
                GlassCard(
                  padding: const EdgeInsets.all(32),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                    Text(_otpSent ? 'Enter Code' : 'Welcome Back', style: Theme.of(context).textTheme.titleLarge, textAlign: TextAlign.center),
                    const SizedBox(height: 24),
                    if (!_otpSent) ...[
                      TextField(controller: _emailController, keyboardType: TextInputType.emailAddress, style: const TextStyle(color: AppColors.textPrimary),
                          decoration: const InputDecoration(labelText: 'Email Address', labelStyle: TextStyle(color: AppColors.textSecondary), prefixIcon: Icon(Icons.email_outlined, color: AppColors.neonCyan))),
                      const SizedBox(height: 16),
                      if (_error != null) Padding(padding: const EdgeInsets.only(bottom: 12), child: Text(_error!, style: const TextStyle(color: AppColors.error, fontSize: 13))),
                      ElevatedButton(onPressed: _loading ? null : _sendOtp, child: _loading ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Send Login Code')),
                      const SizedBox(height: 16),
                      OutlinedButton.icon(onPressed: () {}, icon: const Icon(Icons.g_mobiledata, size: 24), label: const Text('Continue with Google')),
                    ] else ...[
                      _OtpInput(email: _emailController.text, onVerified: (token) async {
                        final prefs = await SharedPreferences.getInstance();
                        await prefs.setString('access_token', token);
                        if (mounted) Navigator.of(context).pushReplacementNamed('/app');
                      }),
                      const SizedBox(height: 12),
                      TextButton(onPressed: () => setState(() => _otpSent = false), child: const Text('Change email')),
                    ],
                  ]),
                ),
              ]),
            ),
          ),
        ),
      ),
    );
  }
}

class _OtpInput extends ConsumerStatefulWidget {
  final String email;
  final Function(String token) onVerified;
  const _OtpInput({required this.email, required this.onVerified});
  @override
  ConsumerState<_OtpInput> createState() => _OtpInputState();
}

class _OtpInputState extends ConsumerState<_OtpInput> {
  final _otpController = TextEditingController();
  bool _loading = false;
  String? _error;
  Future<void> _verify() async {
    setState(() => _loading = true);
    try {
      final dio = ref.read(dioProvider);
      final authApi = AuthApi(dio);
      final result = await authApi.login(widget.email, _otpController.text.trim());
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('access_token', result.accessToken);
      await prefs.setString('refresh_token', result.refreshToken);
      await prefs.setString('user_name', result.user.fullName);
      await prefs.setString('user_email', result.user.email);
      await prefs.setString('user_role', result.user.role);
      await prefs.setString('tenant_id', result.tenant.tenantId);
      await prefs.setString('tenant_name', result.tenant.name);
      await prefs.setString('plan', result.tenant.plan);
      await widget.onVerified(result.accessToken);
    } catch (e) { setState(() => _error = 'Invalid code. Please try again.'); } finally { setState(() => _loading = false); }
  }
  @override
  Widget build(BuildContext context) {
    return Column(children: [
      TextField(controller: _otpController, keyboardType: TextInputType.number, maxLength: 6, textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 24, letterSpacing: 8, color: AppColors.neonCyan),
          decoration: InputDecoration(hintText: '● ● ● ● ● ●', hintStyle: TextStyle(color: AppColors.textTertiary.withAlpha(128)), counterText: '')),
      if (_error != null) Padding(padding: const EdgeInsets.only(bottom: 8), child: Text(_error!, style: const TextStyle(color: AppColors.error, fontSize: 13))),
      const SizedBox(height: 16),
      ElevatedButton(onPressed: _loading ? null : _verify,
          child: _loading ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Verify & Login')),
    ]);
  }
}

/// LETESE● Case Diary Workstation
final casesProvider = FutureProvider<List<Case>>((ref) async {
  final dio = ref.read(dioProvider);
  final casesApi = CasesApi(dio);
  return casesApi.listCases();
});

final selectedCaseProvider = StateProvider<String?>((ref) => null);

class CaseDiaryScreen extends ConsumerStatefulWidget {
  const CaseDiaryScreen({super.key});
  @override
  ConsumerState<CaseDiaryScreen> createState() => _CaseDiaryScreenState();
}

class _CaseDiaryScreenState extends ConsumerState<CaseDiaryScreen> {
  String? _filterStatus;
  String? _filterCourt;
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final casesAsync = ref.watch(casesProvider);
    return Scaffold(
      backgroundColor: AppColors.bgObsidian,
      appBar: AppBar(
        title: Row(children: [const LeteseLogo(fontSize: 22), const SizedBox(width: 16), const Text('Case Diary', style: TextStyle(fontSize: 17))]),
        actions: [
          IconButton(icon: const Icon(Icons.refresh, color: AppColors.neonCyan), onPressed: () => ref.invalidate(casesProvider)),
          IconButton(icon: const Icon(Icons.add_circle_outline, color: AppColors.brandGreen), onPressed: () => Navigator.of(context).pushNamed('/cases/new')),
        ],
      ),
      body: Column(children: [
        Container(
          padding: const EdgeInsets.all(12),
          color: AppColors.bgSurface,
          child: Column(children: [
            TextField(onChanged: (v) => setState(() => _searchQuery = v), style: const TextStyle(color: AppColors.textPrimary),
                decoration: InputDecoration(hintText: 'Search cases, clients...', prefixIcon: const Icon(Icons.search, color: AppColors.textTertiary),
                    filled: true, fillColor: AppColors.bgElevated, border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)), contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 0))),
            const SizedBox(height: 8),
            SingleChildScrollView(scrollDirection: Axis.horizontal, child: Row(children: [
              _FilterChip(label: 'All', selected: _filterStatus == null, onTap: () => setState(() => _filterStatus = null)),
              _FilterChip(label: '🔴 Urgent', selected: _filterStatus == 'critical', onTap: () => setState(() => _filterStatus = 'critical')),
              _FilterChip(label: 'Active', selected: _filterStatus == 'active', onTap: () => setState(() => _filterStatus = 'active')),
              const SizedBox(width: 8),
              _FilterChip(label: 'PHAHC', selected: _filterCourt == 'PHAHC', onTap: () => setState(() => _filterCourt = _filterCourt == 'PHAHC' ? null : 'PHAHC')),
              _FilterChip(label: 'DHC', selected: _filterCourt == 'DHC', onTap: () => setState(() => _filterCourt = _filterCourt == 'DHC' ? null : 'DHC')),
              _FilterChip(label: 'SC', selected: _filterCourt == 'SC', onTap: () => setState(() => _filterCourt = _filterCourt == 'SC' ? null : 'SC')),
            ])),
          ]),
        ),
        Expanded(child: casesAsync.when(
          loading: () => const Center(child: () => const Center(child: CircularProgressIndicator(color: AppColors.neonCyan)),
          error: (e, _) => Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.error_outline, size: 48, color: AppColors.error),
            const SizedBox(height: 12),
            Text('Failed to load cases', style: TextStyle(color: AppColors.textSecondary)),
            TextButton(onPressed: () => ref.invalidate(casesProvider), child: const Text('Retry')),
          ])),
          data: (cases) {
            var filtered = cases.where((c) {
              if (_filterStatus != null && c.status != _filterStatus) return false;
              if (_filterCourt != null && c.courtCode != _filterCourt) return false;
              if (_searchQuery.isNotEmpty) {
                final q = _searchQuery.toLowerCase();
                return c.caseTitle.toLowerCase().contains(q) || c.clientName.toLowerCase().contains(q);
              }
              return true;
            }).toList();
            if (filtered.isEmpty) {
              return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                Icon(Icons.folder_open, size: 64, color: AppColors.textTertiary),
                const SizedBox(height: 16),
                Text('No cases found', style: TextStyle(color: AppColors.textSecondary, fontSize: 16)),
                const SizedBox(height: 8),
                ElevatedButton.icon(onPressed: () => Navigator.of(context).pushNamed('/cases/new'), icon: const Icon(Icons.add), label: const Text('Add First Case')),
              ]));
            }
            return ListView.builder(padding: const EdgeInsets.all(12), itemCount: filtered.length, itemBuilder: (context, index) => _CaseCard(case_: filtered[index]));
          },
        )),
      ]),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _FilterChip({required this.label, required this.selected, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: selected ? AppColors.neonCyanDim : AppColors.bgElevated,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: selected ? AppColors.neonCyan : AppColors.bgBorder),
          ),
          child: Text(label, style: TextStyle(fontSize: 12, color: selected ? AppColors.neonCyan : AppColors.textSecondary)),
        ),
      ),
    );
  }
}

class _CaseCard extends ConsumerWidget {
  final Case case_;
  const _CaseCard({required this.case_});
  Color get _urgencyColor => switch (case_.urgencyLevel) { 'critical' => AppColors.urgent, 'high' => AppColors.warning, 'medium' => AppColors.medium, _ => AppColors.low };
  String get _daysUntilHearing {
    if (case_.nextHearingAt == null) return 'No date';
    final days = case_.nextHearingAt!.difference(DateTime.now()).inDays;
    if (days < 0) return '${-days}d overdue';
    if (days == 0) return 'Today';
    if (days == 1) return 'Tomorrow';
    return '$days days';
  }
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return GestureDetector(
      onTap: () {
        ref.read(selectedCaseProvider.notifier).state = case_.caseId;
        Navigator.of(context).pushNamed('/cases/detail', arguments: case_.caseId);
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.bgSurface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.bgBorder),
          boxShadow: [BoxShadow(color: _urgencyColor.withAlpha(13), blurRadius: 8, offset: const Offset(0, 2))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Container(width: 4, height: 36, decoration: BoxDecoration(color: _urgencyColor, borderRadius: BorderRadius.circular(2))),
              const SizedBox(width: 10),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(case_.caseTitle, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15, color: AppColors.textPrimary), maxLines: 1, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 2),
                Text('${case_.courtCode} • ${case_.clientName}', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
              ])),
              Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                UrgencyBadge(level: case_.urgencyLevel),
                const SizedBox(height: 4),
                Text(_daysUntilHearing, style: TextStyle(fontSize: 11, color: _urgencyColor, fontWeight: FontWeight.w600)),
              ]),
            ]),
          ],
        ),
      ),
    );
  }
}

/// New Case Form Screen
class NewCaseScreen extends ConsumerStatefulWidget {
  const NewCaseScreen({super.key});
  @override
  ConsumerState<NewCaseScreen> createState() => _NewCaseScreenState();
}

class _NewCaseScreenState extends ConsumerState<NewCaseScreen> {
  final _form = GlobalKey<FormState>();
  final _caseTitleCtrl = TextEditingController();
  final _clientNameCtrl = TextEditingController();
  final _clientPhoneCtrl = TextEditingController();
  final _caseNumberCtrl = TextEditingController();
  String _courtCode = 'PHAHC';
  String _petitionType = 'CWP';
  DateTime? _nextHearing;
  bool _loading = false;
  String? _error;
  final _courtOptions = {'PHAHC': 'Punjab & Haryana HC', 'DHC': 'Delhi High Court', 'SC': 'Supreme Court', 'NCDRC': 'NCDRC', 'CHD_DC': 'Chandigarh DC'};
  final _petitionOptions = {'CWP': 'Civil Writ Petition', 'CRM': 'Criminal Misc', 'SLP': 'Special Leave Petition', 'CS': 'Civil Suit', 'WP': 'Writ Petition'};
  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      final dio = ref.read(dioProvider);
      final casesApi = CasesApi(dio);
      await casesApi.createCase(caseTitle: _caseTitleCtrl.text.trim(), courtCode: _courtCode, clientName: _clientNameCtrl.text.trim(), clientPhone: _clientPhoneCtrl.text.trim(), petitionType: _petitionType, caseNumber: _caseNumberCtrl.text.isNotEmpty ? _caseNumberCtrl.text.trim() : null, nextHearingAt: _nextHearing);
      if (mounted) Navigator.of(context).pop();
    } catch (e) { setState(() => _error = e.toString()); } finally { setState(() => _loading = false); }
  }
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgObsidian,
      appBar: AppBar(title: const Text('New Case')),
      body: Form(
        key: _form,
        child: ListView(padding: const EdgeInsets.all(16), children: [
          GlassCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Case Details', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
            const SizedBox(height: 16),
            TextFormField(controller: _caseTitleCtrl, style: const TextStyle(color: AppColors.textPrimary), decoration: const InputDecoration(labelText: 'Case Title *', hintText: 'Sharma v. Union of India'), validator: (v) => v == null || v.isEmpty ? 'Required' : null),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(value: _courtCode, dropdownColor: AppColors.bgElevated, style: const TextStyle(color: AppColors.textPrimary), decoration: const InputDecoration(labelText: 'Court *'),
                items: _courtOptions.entries.map((e) => DropdownMenuItem(value: e.key, child: Text(e.value))).toList(), onChanged: (v) => setState(() => _courtCode = v!)),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(value: _petitionType, dropdownColor: AppColors.bgElevated, style: const TextStyle(color: AppColors.textPrimary), decoration: const InputDecoration(labelText: 'Petition Type'),
                items: _petitionOptions.entries.map((e) => DropdownMenuItem(value: e.key, child: Text(e.value))).toList(), onChanged: (v) => setState(() => _petitionType = v!)),
            const SizedBox(height: 12),
            TextFormField(controller: _caseNumberCtrl, style: const TextStyle(color: AppColors.textPrimary), decoration: const InputDecoration(labelText: 'Case Number (optional)')),
            const SizedBox(height: 12),
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(_nextHearing != null ? '${_nextHearing!.day}/${_nextHearing!.month}/${_nextHearing!.year}' : 'Next Hearing Date (optional)',
                  style: TextStyle(color: _nextHearing != null ? AppColors.textPrimary : AppColors.textTertiary)),
              trailing: const Icon(Icons.calendar_today, color: AppColors.neonCyan),
              onTap: () async {
                final date = await showDatePicker(context: context, initialDate: DateTime.now().add(const Duration(days: 30)), firstDate: DateTime.now(), lastDate: DateTime.now().add(const Duration(days: 3650)));
                if (date != null) setState(() => _nextHearing = date);
              },
            ),
          ])),
          const SizedBox(height: 16),
          GlassCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Client Details', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
            const SizedBox(height: 16),
            TextFormField(controller: _clientNameCtrl, style: const TextStyle(color: AppColors.textPrimary), decoration: const InputDecoration(labelText: 'Client Name *'), validator: (v) => v == null || v.isEmpty ? 'Required' : null),
            const SizedBox(height: 12),
            TextFormField(controller: _clientPhoneCtrl, keyboardType: TextInputType.phone, style: const TextStyle(color: AppColors.textPrimary),
                decoration: const InputDecoration(labelText: 'Phone *', hintText: '+919876543210'),
                validator: (v) { if (v == null || v.isEmpty) return 'Required'; if (!v.startsWith('+')) return 'Must include country code (e.g. +91)'; return null; }),
          ])),
          if (_error != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(_error!, style: const TextStyle(color: AppColors.error, fontSize: 13))),
          const SizedBox(height: 24),
          ElevatedButton(onPressed: _loading ? null : _submit,
              child: _loading ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Create Case')),
        ]),
      ),
    );
  }
}
