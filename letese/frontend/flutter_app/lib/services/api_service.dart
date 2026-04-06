/// LETESE● API Service — Dio HTTP client with JWT auth
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(BaseOptions(
    baseUrl: 'https://api.letese.xyz/api/v1',
    connectTimeout: const Duration(seconds: 15),
    receiveTimeout: const Duration(seconds: 30),
    headers: {'Content-Type': 'application/json'},
  ));

  dio.interceptors.add(AuthInterceptor(ref));
  dio.interceptors.add(LogInterceptor(
    requestBody: true,
    responseBody: true,
    logPrint: (o) => print('[DIO] $o'),
  ));

  return dio;
});

class AuthInterceptor extends Interceptor {
  final Ref ref;
  AuthInterceptor(this.ref);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token');
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      // Token expired — try refresh
      final prefs = await SharedPreferences.getInstance();
      final refreshToken = prefs.getString('refresh_token');
      if (refreshToken != null) {
        try {
          final dio = Dio(BaseOptions(baseUrl: 'https://api.letese.xyz/api/v1'));
          final resp = await dio.post('/auth/refresh', data: {'refresh_token': refreshToken});
          final newAccessToken = resp.data['access_token'];
          await prefs.setString('access_token', newAccessToken);
          // Retry original request
          err.requestOptions.headers['Authorization'] = 'Bearer $newAccessToken';
          final retryResp = await dio.fetch(err.requestOptions);
          return handler.resolve(retryResp);
        } catch (_) {
          // Refresh failed — clear tokens
          await prefs.remove('access_token');
          await prefs.remove('refresh_token');
        }
      }
    }
    handler.next(err);
  }
}

// ── Auth API ────────────────────────────────────────────────────────

class AuthApi {
  final Dio _dio;
  AuthApi(this._dio);

  Future<void> sendOtp(String email) async {
    await _dio.post('/auth/send-otp', data: {'email': email});
  }

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

  AuthResult({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
    required this.tenant,
  });

  factory AuthResult.fromJson(Map<String, dynamic> json) {
    return AuthResult(
      accessToken: json['access_token'],
      refreshToken: json['refresh_token'],
      user: LeteseUser.fromJson(json['user']),
      tenant: LeteseTenant.fromJson(json['tenant']),
    );
  }
}

class LeteseUser {
  final String userId;
  final String email;
  final String fullName;
  final String role;
  final String tenantId;

  LeteseUser({
    required this.userId,
    required this.email,
    required this.fullName,
    required this.role,
    required this.tenantId,
  });

  factory LeteseUser.fromJson(Map<String, dynamic> json) => LeteseUser(
        userId: json['user_id'],
        email: json['email'],
        fullName: json['full_name'],
        role: json['role'],
        tenantId: json['tenant_id'],
      );
}

class LeteseTenant {
  final String tenantId;
  final String name;
  final String plan;
  final String status;

  LeteseTenant({
    required this.tenantId,
    required this.name,
    required this.plan,
    required this.status,
  });

  factory LeteseTenant.fromJson(Map<String, dynamic> json) => LeteseTenant(
        tenantId: json['tenant_id'],
        name: json['name'],
        plan: json['plan'],
        status: json['status'],
      );
}

// ── Cases API ───────────────────────────────────────────────────────

class CasesApi {
  final Dio _dio;
  CasesApi(this._dio);

  Future<List<Case>> listCases({
    String? status,
    String? courtCode,
    String? search,
    int limit = 50,
    int offset = 0,
  }) async {
    final params = <String, dynamic>{'limit': limit, 'offset': offset};
    if (status != null) params['status'] = status;
    if (courtCode != null) params['court_code'] = courtCode;
    if (search != null) params['search'] = search;

    final resp = await _dio.get('/cases', queryParameters: params);
    final List casesJson = resp.data['cases'];
    return casesJson.map((c) => Case.fromJson(c)).toList();
  }

  Future<CaseDetail> createCase({
    required String caseTitle,
    required String courtCode,
    required String clientName,
    required String clientPhone,
    String? petitionType,
    String? caseNumber,
    DateTime? nextHearingAt,
    String? clientEmail,
    String? clientWhatsapp,
  }) async {
    final resp = await _dio.post('/cases', data: {
      'case_title': caseTitle,
      'court_code': courtCode,
      'client_name': clientName,
      'client_phone': clientPhone,
      if (petitionType != null) 'petition_type': petitionType,
      if (caseNumber != null) 'case_number': caseNumber,
      if (nextHearingAt != null) 'next_hearing_at': nextHearingAt.toIso8601String(),
      if (clientEmail != null) 'client_email': clientEmail,
      if (clientWhatsapp != null) 'client_whatsapp': clientWhatsapp,
    });
    return CaseDetail.fromJson(resp.data);
  }

  Future<CaseDetail> getCase(String caseId) async {
    final resp = await _dio.get('/cases/$caseId');
    return CaseDetail.fromJson(resp.data);
  }

  Future<void> triggerScrape(String caseId) async {
    await _dio.post('/cases/$caseId/scrape');
  }
}

class Case {
  final String caseId;
  final String caseTitle;
  final String courtCode;
  final String status;
  final String urgencyLevel;
  final DateTime? nextHearingAt;
  final String clientName;

  Case({
    required this.caseId,
    required this.caseTitle,
    required this.courtCode,
    required this.status,
    required this.urgencyLevel,
    this.nextHearingAt,
    required this.clientName,
  });

  factory Case.fromJson(Map<String, dynamic> json) {
    // Handle wrapped JSON: {case_id: ..., case_title: ...} or flat
    final data = json['case_id'] != null ? json : (json['data'] ?? json);
    return Case(
      caseId: data['case_id'] ?? data['caseId'] ?? '',
      caseTitle: data['case_title'] ?? data['caseTitle'] ?? '',
      courtCode: data['court_code'] ?? data['courtCode'] ?? '',
      status: data['status'] ?? 'active',
      urgencyLevel: data['urgency_level'] ?? data['urgencyLevel'] ?? 'low',
      nextHearingAt: data['next_hearing_at'] != null
          ? DateTime.parse(data['next_hearing_at'])
          : null,
      clientName: data['client_name'] ?? data['clientName'] ?? '',
    );
  }
}

class CaseDetail {
  final String caseId;
  final String caseTitle;
  final String caseNumber;
  final String courtCode;
  final String courtDisplayName;
  final String status;
  final String urgencyLevel;
  final String clientName;
  final String clientPhone;
  final String? clientEmail;
  final DateTime? nextHearingAt;
  final String? lastOrderText;
  final DateTime? lastOrderDate;
  final String? lastOrderSummary;
  final String? notes;
  final DateTime createdAt;
  final List<dynamic> hearings;
  final List<dynamic> documents;
  final List<dynamic> tasks;

  CaseDetail({
    required this.caseId,
    required this.caseTitle,
    required this.caseNumber,
    required this.courtCode,
    required this.courtDisplayName,
    required this.status,
    required this.urgencyLevel,
    required this.clientName,
    required this.clientPhone,
    this.clientEmail,
    this.nextHearingAt,
    this.lastOrderText,
    this.lastOrderDate,
    this.lastOrderSummary,
    this.notes,
    required this.createdAt,
    required this.hearings,
    required this.documents,
    required this.tasks,
  });

  factory CaseDetail.fromJson(Map<String, dynamic> json) => CaseDetail(
        caseId: json['case_id'],
        caseTitle: json['case_title'],
        caseNumber: json['case_number'] ?? '',
        courtCode: json['court_code'],
        courtDisplayName: json['court_display_name'] ?? json['court_code'],
        status: json['status'],
        urgencyLevel: json['urgency_level'],
        clientName: json['client_name'],
        clientPhone: json['client_phone'],
        clientEmail: json['client_email'],
        nextHearingAt: json['next_hearing_at'] != null
            ? DateTime.parse(json['next_hearing_at'])
            : null,
        lastOrderText: json['last_order_text'],
        lastOrderDate: json['last_order_date'] != null
            ? DateTime.parse(json['last_order_date'])
            : null,
        lastOrderSummary: json['last_order_summary'],
        notes: json['notes'],
        createdAt: DateTime.parse(json['created_at']),
        hearings: json['hearings'] ?? [],
        documents: json['documents'] ?? [],
        tasks: json['tasks'] ?? [],
      );
}

// ── Tasks API ────────────────────────────────────────────────────────

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

  Future<void> completeTask(String taskId) async {
    await _dio.patch('/tasks/$taskId', data: {'status': 'completed'});
  }
}

class Task {
  final String taskId;
  final String? caseId;
  final String title;
  final String? description;
  final DateTime dueDate;
  final String priority;
  final String status;
  final String source;

  Task({
    required this.taskId,
    this.caseId,
    required this.title,
    this.description,
    required this.dueDate,
    required this.priority,
    required this.status,
    required this.source,
  });

  factory Task.fromJson(Map<String, dynamic> json) => Task(
        taskId: json['task_id'],
        caseId: json['case_id'],
        title: json['title'],
        description: json['description'],
        dueDate: DateTime.parse(json['due_date']),
        priority: json['priority'],
        status: json['status'],
        source: json['source'],
      );
}
