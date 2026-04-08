class Trade {
  final String id;
  final String symbol;
  final String action;
  final String strategy;
  final double quantity;
  final double price;
  final double pnl;
  final DateTime timestamp;
  final String status;

  Trade({
    required this.id,
    required this.symbol,
    required this.action,
    required this.strategy,
    required this.quantity,
    required this.price,
    required this.pnl,
    required this.timestamp,
    required this.status,
  });

  factory Trade.fromJson(Map json) => Trade(
    id: json['id'] ?? '',
    symbol: json['symbol'] ?? '',
    action: json['action'] ?? 'BUY',
    strategy: json['strategy'] ?? '',
    quantity: double.tryParse(json['quantity']?.toString() ?? '0') ?? 0,
    price: double.tryParse(json['price']?.toString() ?? '0') ?? 0,
    pnl: double.tryParse(json['pnl']?.toString() ?? '0') ?? 0,
    timestamp: DateTime.tryParse(json['timestamp']?.toString() ?? '') ?? DateTime.now(),
    status: json['status'] ?? 'closed',
  );
}
