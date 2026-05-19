import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../database/database_helper.dart';
import '../models/transaction_model.dart';

class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  final DatabaseHelper _db = DatabaseHelper();
  List<TransactionModel> _monthTransactions = [];
  double _budget = 3500;
  bool _loading = true;

  static const _categories = [
    {'key': 'food', 'name': 'Yemek & Restoran', 'color': Color(0xFFF59E0B), 'barColor': Color(0xFFD97706)},
    {'key': 'shopping', 'name': 'Alisveris & Market', 'color': Color(0xFF3B82F6), 'barColor': Color(0xFF2563EB)},
    {'key': 'transport', 'name': 'Ulasim & Seyahat', 'color': Color(0xFF10B981), 'barColor': Color(0xFF059669)},
    {'key': 'utilities', 'name': 'Kira & Faturalar', 'color': Color(0xFF8B5CF6), 'barColor': Color(0xFF7C3AED)},
    {'key': 'entertainment', 'name': 'Eglence & Sosyal', 'color': Color(0xFFEC4899), 'barColor': Color(0xFFDB2777)},
    {'key': 'other', 'name': 'Diger Odemeler', 'color': Color(0xFF6B7280), 'barColor': Color(0xFF4B5563)},
  ];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final now = DateTime.now();
    final txs = await _db.getTransactionsForMonth(now.year, now.month);
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _monthTransactions = txs;
      _budget = prefs.getDouble('budget') ?? 3500;
      _loading = false;
    });
  }

  Future<void> _saveBudget(double value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setDouble('budget', value);
    setState(() => _budget = value);
  }

  double get _totalExpense => _monthTransactions
      .where((tx) => tx.type == 'expense')
      .fold(0.0, (sum, tx) => sum + tx.amount);

  double get _totalIncome => _monthTransactions
      .where((tx) => tx.type == 'income')
      .fold(0.0, (sum, tx) => sum + tx.amount);

  List<Map<String, dynamic>> get _categoryAggregates {
    final list = _categories.map((cat) {
      final sum = _monthTransactions
          .where((tx) => tx.type == 'expense' && tx.category == cat['key'])
          .fold(0.0, (double s, tx) => s + tx.amount);
      return {...cat, 'sum': sum};
    }).toList();
    list.sort((a, b) => (b['sum'] as double).compareTo(a['sum'] as double));
    return list;
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildBudgetHealthCard(),
        const SizedBox(height: 16),
        _buildSummaryRow(),
        const SizedBox(height: 16),
        _buildTrendCard(),
        const SizedBox(height: 16),
        _buildCategoriesCard(),
      ],
    );
  }

  Widget _buildBudgetHealthCard() {
    final pct = _budget > 0 ? (_totalExpense / _budget * 100).clamp(0, 100) : 0.0;
    final isDanger = pct >= 90;
    final isWarning = pct >= 70;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Butce Sagligi Durumu', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.blue.shade900)),
                  const SizedBox(height: 2),
                  Text('${DateFormat('MMMM', 'tr_TR').format(DateTime.now())} ayi genel tasarruf hedefiniz',
                      style: TextStyle(fontSize: 12, color: Colors.grey.shade400)),
                ],
              ),
              Row(
                children: [
                  Text('Hedef:', style: TextStyle(fontSize: 11, color: Colors.grey.shade400)),
                  const SizedBox(width: 4),
                  SizedBox(
                    width: 80,
                    height: 30,
                    child: TextField(
                      controller: TextEditingController(text: _budget.toStringAsFixed(0)),
                      keyboardType: TextInputType.number,
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.blue.shade700),
                      decoration: InputDecoration(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: BorderSide(color: Colors.blue.shade100)),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: BorderSide(color: Colors.blue.shade100)),
                        filled: true,
                        fillColor: const Color(0xFFFAF9FF),
                      ),
                      onSubmitted: (v) {
                        final val = double.tryParse(v);
                        if (val != null && val > 0) _saveBudget(val);
                      },
                    ),
                  ),
                  const SizedBox(width: 4),
                  Text('TL', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.blue.shade700)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('BU AY HARCANAN', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: Colors.grey.shade400, letterSpacing: 1)),
                  const SizedBox(height: 4),
                  Text('₺${NumberFormat('#,##0.00', 'tr_TR').format(_totalExpense)}',
                      style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Colors.blue.shade900)),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('HEDEF SINIR LIMITI', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: Colors.grey.shade400, letterSpacing: 1)),
                  const SizedBox(height: 4),
                  Text('₺${NumberFormat('#,##0', 'tr_TR').format(_budget)}',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.grey.shade500)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: pct / 100,
              minHeight: 10,
              backgroundColor: Colors.grey.shade100,
              color: isDanger ? Colors.red.shade500 : isWarning ? Colors.amber.shade500 : const Color(0xFF2563EB),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Aylik butce kotanizin ${pct.toStringAsFixed(0)}%\'lik kismini kullandiniz.',
            textAlign: TextAlign.right,
            style: TextStyle(
              fontSize: 12,
              color: isDanger
                  ? Colors.red.shade600
                  : isWarning
                      ? Colors.amber.shade600
                      : Colors.grey.shade500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryRow() {
    return Row(
      children: [
        Expanded(child: _buildSummaryCard('Toplam Gelir', _totalIncome, Colors.green.shade600, Icons.trending_up)),
        const SizedBox(width: 12),
        Expanded(child: _buildSummaryCard('Toplam Gider', _totalExpense, Colors.red.shade500, Icons.trending_down)),
        const SizedBox(width: 12),
        Expanded(child: _buildSummaryCard('Islem Sayisi', _monthTransactions.length.toDouble(), Colors.blue.shade600, Icons.receipt_long, isCount: true)),
      ],
    );
  }

  Widget _buildSummaryCard(String label, double value, Color color, IconData icon, {bool isCount = false}) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 6, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: color),
          const SizedBox(height: 8),
          Text(
            isCount ? value.toInt().toString() : '₺${NumberFormat('#,##0', 'tr_TR').format(value)}',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Colors.blue.shade900),
          ),
          const SizedBox(height: 2),
          Text(label, style: TextStyle(fontSize: 10, color: Colors.grey.shade400, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Widget _buildTrendCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('3 Aylik Egilim', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.blue.shade900)),
          const SizedBox(height: 4),
          Text('Oransal harcama dalgalanmalari', style: TextStyle(fontSize: 12, color: Colors.grey.shade400)),
          const SizedBox(height: 20),
          SizedBox(
            height: 140,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                _buildBar('Mart', 0.6, Colors.blue.shade400),
                const SizedBox(width: 16),
                _buildBar('Nisan', 0.85, Colors.blue.shade400),
                const SizedBox(width: 16),
                _buildBar('Mayis', _budget > 0 ? (_totalExpense / _budget).clamp(0.1, 1.0) : 0.5, const Color(0xFF2563EB)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBar(String label, double fraction, Color color) {
    return Expanded(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          Expanded(
            child: Container(
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
                border: Border.all(color: Colors.grey.shade100),
              ),
              child: Align(
                alignment: Alignment.bottomCenter,
                child: FractionallySizedBox(
                  heightFactor: fraction,
                  child: Container(
                    decoration: BoxDecoration(
                      color: color,
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(6)),
                    ),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Colors.grey.shade500)),
        ],
      ),
    );
  }

  Widget _buildCategoriesCard() {
    final aggregates = _categoryAggregates;
    final maxVal = aggregates.isNotEmpty ? (aggregates.first['sum'] as double) : 1.0;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('En Yuksek Kategoriler', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.blue.shade900)),
                  const SizedBox(height: 2),
                  Text('Gider dagiliminizin pay grafigi degerleri', style: TextStyle(fontSize: 12, color: Colors.grey.shade400)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          ...aggregates.map((cat) {
            final sum = cat['sum'] as double;
            final pct = maxVal > 0 ? sum / maxVal : 0.0;
            return Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 24,
                            height: 24,
                            decoration: BoxDecoration(
                              color: cat['color'] as Color,
                              shape: BoxShape.circle,
                            ),
                            child: const Center(child: Text('#', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Colors.white))),
                          ),
                          const SizedBox(width: 8),
                          Text(cat['name'] as String, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.grey.shade700)),
                        ],
                      ),
                      Text('₺${NumberFormat('#,##0.00', 'tr_TR').format(sum)}',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.grey.shade900)),
                    ],
                  ),
                  const SizedBox(height: 6),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: pct,
                      minHeight: 6,
                      backgroundColor: Colors.grey.shade100,
                      color: cat['barColor'] as Color,
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}
