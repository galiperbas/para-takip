import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/transaction_model.dart';

class DatabaseHelper {
  static final DatabaseHelper _instance = DatabaseHelper._internal();
  factory DatabaseHelper() => _instance;
  DatabaseHelper._internal();

  static Database? _database;

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, 'para_takip.db');
    return await openDatabase(
      path,
      version: 1,
      onCreate: _onCreate,
    );
  }

  Future<void> _onCreate(Database db, int version) async {
    await db.execute('''
      CREATE TABLE transactions(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        amount REAL NOT NULL,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL
      )
    ''');

    // Seed data
    final seeds = [
      {
        'title': 'Kahve Keyfi (Coffee Shop)',
        'amount': 60.0,
        'type': 'expense',
        'category': 'food',
        'date': '2026-05-14',
        'time': '08:30',
      },
      {
        'title': 'Supermarket Alisverisi',
        'amount': 450.0,
        'type': 'expense',
        'category': 'shopping',
        'date': '2026-05-14',
        'time': '12:15',
      },
      {
        'title': 'Freelance Ek Gelir',
        'amount': 3200.0,
        'type': 'income',
        'category': 'other',
        'date': '2026-05-14',
        'time': '14:00',
      },
      {
        'title': 'Yemek Karti Dolumu',
        'amount': 1500.0,
        'type': 'income',
        'category': 'food',
        'date': '2026-05-12',
        'time': '09:00',
      },
      {
        'title': 'Metrobus Gecisi',
        'amount': 45.0,
        'type': 'expense',
        'category': 'transport',
        'date': '2026-05-13',
        'time': '18:15',
      },
      {
        'title': 'Netflix Abonelik',
        'amount': 450.0,
        'type': 'expense',
        'category': 'entertainment',
        'date': '2026-05-10',
        'time': '00:00',
      },
      {
        'title': 'Spor Salonu',
        'amount': 300.0,
        'type': 'expense',
        'category': 'entertainment',
        'date': '2026-05-01',
        'time': '10:00',
      },
      {
        'title': 'Elektrik Faturasi',
        'amount': 520.0,
        'type': 'expense',
        'category': 'utilities',
        'date': '2026-05-05',
        'time': '11:00',
      },
      {
        'title': 'Maas',
        'amount': 28000.0,
        'type': 'income',
        'category': 'other',
        'date': '2026-05-01',
        'time': '09:00',
      },
    ];

    for (final seed in seeds) {
      await db.insert('transactions', seed);
    }
  }

  Future<int> insertTransaction(TransactionModel tx) async {
    final db = await database;
    return await db.insert('transactions', tx.toMap()..remove('id'));
  }

  Future<List<TransactionModel>> getTransactionsByDate(String date) async {
    final db = await database;
    final maps = await db.query(
      'transactions',
      where: 'date = ?',
      whereArgs: [date],
      orderBy: 'time DESC',
    );
    return maps.map((m) => TransactionModel.fromMap(m)).toList();
  }

  Future<List<TransactionModel>> getAllTransactions() async {
    final db = await database;
    final maps = await db.query('transactions', orderBy: 'date DESC, time DESC');
    return maps.map((m) => TransactionModel.fromMap(m)).toList();
  }

  Future<List<TransactionModel>> getTransactionsForMonth(int year, int month) async {
    final db = await database;
    final monthStr = month.toString().padLeft(2, '0');
    final maps = await db.query(
      'transactions',
      where: "date LIKE ?",
      whereArgs: ['$year-$monthStr%'],
      orderBy: 'date DESC, time DESC',
    );
    return maps.map((m) => TransactionModel.fromMap(m)).toList();
  }

  Future<int> deleteTransaction(int id) async {
    final db = await database;
    return await db.delete('transactions', where: 'id = ?', whereArgs: [id]);
  }

  Future<void> resetDatabase() async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, 'para_takip.db');
    await deleteDatabase(path);
    _database = null;
    await database; // re-create
  }
}
