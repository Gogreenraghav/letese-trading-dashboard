class User {
  final String id;
  final String name;
  final String email;
  final String phone;
  final String role;
  final String plan;
  final String kycStatus;
  final Map profile;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.role,
    required this.plan,
    required this.kycStatus,
    this.profile = const {},
  });

  factory User.fromJson(Map json) => User(
    id: json['id'] ?? '',
    name: json['name'] ?? '',
    email: json['email'] ?? '',
    phone: json['phone'] ?? '',
    role: json['role'] ?? 'customer',
    plan: json['plan'] ?? 'basic',
    kycStatus: json['kycStatus'] ?? 'pending',
    profile: Map<String, dynamic>.from(json['profile'] ?? {}),
  );
}

class TradeStats {
  final int totalTrades;
  final int wins;
  final int losses;
  final String winRate;
  final String totalPnL;
  final String avgWin;
  final String avgLoss;

  TradeStats({
    required this.totalTrades,
    required this.wins,
    required this.losses,
    required this.winRate,
    required this.totalPnL,
    required this.avgWin,
    required this.avgLoss,
  });

  factory TradeStats.fromJson(Map json) => TradeStats(
    totalTrades: int.tryParse(json['totalTrades']?.toString() ?? '0') ?? 0,
    wins: int.tryParse(json['wins']?.toString() ?? '0') ?? 0,
    losses: int.tryParse(json['losses']?.toString() ?? '0') ?? 0,
    winRate: json['winRate']?.toString() ?? '0',
    totalPnL: json['totalPnL']?.toString() ?? '0',
    avgWin: json['avgWin']?.toString() ?? '0',
    avgLoss: json['avgLoss']?.toString() ?? '0',
  );
}
