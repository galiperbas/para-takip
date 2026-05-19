class TransactionModel {
  final int? id;
  final String title;
  final double amount;
  final String type; // "income" | "expense"
  final String category; // food, transport, utilities, entertainment, shopping, other
  final String date; // YYYY-MM-DD
  final String time; // HH:MM

  TransactionModel({
    this.id,
    required this.title,
    required this.amount,
    required this.type,
    required this.category,
    required this.date,
    required this.time,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'title': title,
      'amount': amount,
      'type': type,
      'category': category,
      'date': date,
      'time': time,
    };
  }

  factory TransactionModel.fromMap(Map<String, dynamic> map) {
    return TransactionModel(
      id: map['id'] as int?,
      title: map['title'] as String,
      amount: (map['amount'] as num).toDouble(),
      type: map['type'] as String,
      category: map['category'] as String,
      date: map['date'] as String,
      time: map['time'] as String,
    );
  }

  String get categoryName {
    switch (category) {
      case 'food':
        return 'Yemek & Restoran';
      case 'transport':
        return 'Ulasim & Seyahat';
      case 'utilities':
        return 'Kira & Faturalar';
      case 'entertainment':
        return 'Eglence & Sosyal';
      case 'shopping':
        return 'Alisveris & Market';
      default:
        return 'Diger Odemeler';
    }
  }

  String get categoryEmoji {
    switch (category) {
      case 'food':
        return '🍱';
      case 'transport':
        return '🚗';
      case 'utilities':
        return '🏢';
      case 'entertainment':
        return '🎬';
      case 'shopping':
        return '🛒';
      default:
        return '💵';
    }
  }
}
