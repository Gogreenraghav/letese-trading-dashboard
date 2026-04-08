import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  static const String baseUrl = 'http://139.59.65.82:3010';
  String? _token;

  void setToken(String token) => _token = token;

  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    if (_token != null) 'Authorization': 'Bearer $_token',
  };

  Future<Map<String, dynamic>> get(String path) async {
    final res = await http.get(Uri.parse('$baseUrl$path'), headers: _headers);
    if (res.statusCode == 401) throw Exception('Unauthorized');
    return jsonDecode(res.body);
  }

  Future<Map<String, dynamic>> post(String path, {Map? body}) async {
    final res = await http.post(
      Uri.parse('$baseUrl$path'),
      headers: _headers,
      body: body != null ? jsonEncode(body) : null,
    );
    if (res.statusCode == 401) throw Exception('Unauthorized');
    return jsonDecode(res.body);
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    return post('/api/auth/login', body: {'email': email, 'password': password});
  }

  Future<Map<String, dynamic>> register(String name, String email, String phone, String password, String plan) async {
    return post('/api/auth/register', body: {
      'name': name, 'email': email, 'phone': phone, 'password': password, 'plan': plan,
    });
  }

  Future<Map<String, dynamic>> getPortfolio() async {
    return get('/api/customer/portfolio');
  }

  Future<Map<String, dynamic>> getPerformance() async {
    return get('/api/customer/performance');
  }

  Future<Map<String, dynamic>> getNotifications() async {
    return get('/api/customer/notifications');
  }

  Future<Map<String, dynamic>> getLimits() async {
    return get('/api/customer/limits');
  }

  Future<Map<String, dynamic>> submitKYC(Map data) async {
    return post('/api/customer/kyc', body: data);
  }

  Future<Map<String, dynamic>> getPlans() async {
    return get('/api/plans');
  }

  Future<Map<String, dynamic>> getBrokerConfig() async {
    return get('/api/customer/broker');
  }

  Future<Map<String, dynamic>> saveBroker(String broker, String apiKey, bool connected) async {
    return post('/api/customer/broker', body: {'broker': broker, 'apiKey': apiKey, 'connected': connected});
  }
}
