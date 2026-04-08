class Plan {
  final String id;
  final String name;
  final int price;
  final List<String> features;
  final int maxTradesPerDay;
  final bool liveTrading;
  final bool aiSignals;
  final bool backtesting;

  Plan({
    required this.id,
    required this.name,
    required this.price,
    required this.features,
    required this.maxTradesPerDay,
    required this.liveTrading,
    required this.aiSignals,
    required this.backtesting,
  });

  factory Plan.fromJson(Map json) => Plan(
    id: json['id'] ?? '',
    name: json['name'] ?? '',
    price: int.tryParse(json['price']?.toString() ?? '0') ?? 0,
    features: List<String>.from(json['features'] ?? []),
    maxTradesPerDay: int.tryParse(json['maxTradesPerDay']?.toString() ?? '10') ?? 10,
    liveTrading: json['liveTrading'] ?? false,
    aiSignals: json['aiSignals'] ?? false,
    backtesting: json['backtesting'] ?? false,
  );
}
