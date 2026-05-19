import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../database/database_helper.dart';
import '../models/transaction_model.dart';

class HomeScreen extends StatefulWidget {
  final VoidCallback onNavigateToAdd;
  const HomeScreen({super.key, required this.onNavigateToAdd});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final DatabaseHelper _db = DatabaseHelper();
  List<TransactionModel> _transactions = [];
  String _selectedDate = DateFormat('yyyy-MM-dd').format(DateTime.now());
  String _filter = 'all';
  bool _loading = true;

  late List<DateTime> _weekDays;

  @override
  void initState() {
    super.initState();
    _buildWeekDays();
    _loadTransactions();
  }

  void _buildWeekDays() {
    final now = DateTime.now();
    final monday = now.subtract(Duration(days: now.weekday - 1));
    _weekDays = List.generate(7, (i) => monday.add(Duration(days: i)));
  }

  Future<void> _loadTransactions() async {
    setState(() => _loading = true);
    final txs = await _db.getTransactionsByDate(_selectedDate);
    setState(() {
      _transactions = txs;
      _loading = false;
    });
  }

  double get _totalIncome => _transactions
      .where((tx) => tx.type == 'income')
      .fold(0.0, (sum, tx) => sum + tx.amount);

  double get _totalExpense => _transactions
      .where((tx) => tx.type == 'expense')
      .fold(0.0, (sum, tx) => sum + tx.amount);

  List<TransactionModel> get _filtered {
    if (_filter == 'all') return _transactions;
    return _transactions.where((tx) => tx.category == _filter).toList();
  }

  Future<void> _deleteTransaction(int id) async {
    await _db.deleteTransaction(id);
    _loadTransactions();
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _loadTransactions,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildCalendarStrip(),
          const SizedBox(height: 16),
          _buildBalanceCard(),
          const SizedBox(height: 20),
          _buildTransactionHeader(),
          const SizedBox(height: 12),
          if (_loading)
            const Center(child: CircularProgressIndicator())
          else if (_filtered.isEmpty)
            _buildEmptyState()
          else
            ..._filtered.map(_buildTransactionTile),
        ],
      ),
    );
  }

  Widget _buildCalendarStrip() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2)),
        ],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(Icons.calendar_today, size: 14, color: Colors.blue.shade900),
                  const SizedBox(width: 6),
                  Text(
                    'Takvim Akisi',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: Colors.blue.shade900.withValues(alpha: 0.6),
                      letterSpacing: 1.2,
                    ),
                  ),
                ],
              ),
              Text(
                DateFormat('MMMM yyyy', 'tr_TR').format(DateTime.now()),
                style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
              ),
            ],
          ),
          const SizedBox(height: 10),
          SizedBox(
            height: 72,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _weekDays.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final day = _weekDays[index];
                final dateStr = DateFormat('yyyy-MM-dd').format(day);
                final isActive = _selectedDate == dateStr;
                return GestureDetector(
                  onTap: () {
                    setState(() => _selectedDate = dateStr);
                    _loadTransactions();
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    width: 56,
                    decoration: BoxDecoration(
                      color: isActive ? const Color(0xFF2563EB) : Colors.grey.shade50,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: isActive
                          ? [BoxShadow(color: Colors.blue.withValues(alpha: 0.3), blurRadius: 8, offset: const Offset(0, 3))]
                          : null,
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          DateFormat('EEE', 'tr_TR').format(day).toUpperCase(),
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: isActive ? Colors.blue.shade100 : Colors.grey.shade400,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          day.day.toString(),
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: isActive ? Colors.white : Colors.grey.shade700,
                          ),
                        ),
                        if (isActive)
                          Container(
                            margin: const EdgeInsets.only(top: 4),
                            width: 6,
                            height: 6,
                            decoration: BoxDecoration(
                              color: Colors.greenAccent.shade400,
                              shape: BoxShape.circle,
                            ),
                          ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBalanceCard() {
    final balance = _totalIncome - _totalExpense;
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1D4ED8), Color(0xFF1E3A8A), Color(0xFF312E81)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: const Color(0xFF1E3A8A).withValues(alpha: 0.3), blurRadius: 16, offset: const Offset(0, 6)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Secilen Gunun Net Dengesi',
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.blue.shade100.withValues(alpha: 0.8), letterSpacing: 1),
          ),
          const SizedBox(height: 6),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text('₺', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: Colors.blue.shade200)),
              const SizedBox(width: 4),
              Text(
                NumberFormat('#,##0.00', 'tr_TR').format(balance),
                style: const TextStyle(fontSize: 30, fontWeight: FontWeight.w800, color: Colors.white),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(height: 1, color: Colors.white.withValues(alpha: 0.1)),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildIncomeExpenseCol(
                'TOPLAM GELIR',
                _totalIncome,
                Colors.greenAccent.shade200,
                Icons.arrow_downward,
              ),
              _buildIncomeExpenseCol(
                'TOPLAM GIDER',
                _totalExpense,
                Colors.redAccent.shade100,
                Icons.arrow_upward,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildIncomeExpenseCol(String label, double amount, Color color, IconData icon) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 14, color: color),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Colors.blue.shade200.withValues(alpha: 0.8), letterSpacing: 0.8),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          '₺${NumberFormat('#,##0', 'tr_TR').format(amount)}',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: color),
        ),
      ],
    );
  }

  Widget _buildTransactionHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Text(
              'Islemler',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Colors.blue.shade900),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                '${_transactions.length} adet',
                style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
              ),
            ),
          ],
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8),
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border.all(color: Colors.grey.shade200),
            borderRadius: BorderRadius.circular(8),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: _filter,
              style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
              icon: Icon(Icons.keyboard_arrow_down, size: 18, color: Colors.grey.shade500),
              items: const [
                DropdownMenuItem(value: 'all', child: Text('Tum Kategoriler')),
                DropdownMenuItem(value: 'food', child: Text('Yemek')),
                DropdownMenuItem(value: 'shopping', child: Text('Alisveris')),
                DropdownMenuItem(value: 'transport', child: Text('Ulasim')),
                DropdownMenuItem(value: 'utilities', child: Text('Faturalar')),
                DropdownMenuItem(value: 'entertainment', child: Text('Eglence')),
                DropdownMenuItem(value: 'other', child: Text('Diger')),
              ],
              onChanged: (v) => setState(() => _filter = v ?? 'all'),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200, style: BorderStyle.solid),
      ),
      child: Column(
        children: [
          Text(
            'Bu tarih ($_selectedDate) icin islem bulunamadi.',
            style: TextStyle(fontSize: 13, color: Colors.grey.shade400),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 12),
          TextButton.icon(
            onPressed: widget.onNavigateToAdd,
            icon: const Icon(Icons.add, size: 16),
            label: const Text('Islem Ekle', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }

  Widget _buildTransactionTile(TransactionModel tx) {
    final isIncome = tx.type == 'income';
    return Dismissible(
      key: Key('tx-${tx.id}'),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: Colors.red.shade50,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Icon(Icons.delete_outline, color: Colors.red.shade400),
      ),
      onDismissed: (_) => _deleteTransaction(tx.id!),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        child: Row(
          children: [
            // Timeline dot
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: isIncome ? Colors.green.shade50 : Colors.red.shade50,
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 3),
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 4),
                ],
              ),
              child: Icon(
                isIncome ? Icons.arrow_downward : Icons.arrow_upward,
                size: 18,
                color: isIncome ? Colors.green.shade600 : Colors.red.shade600,
              ),
            ),
            const SizedBox(width: 12),
            // Content
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 6, offset: const Offset(0, 2)),
                  ],
                  border: Border.all(color: Colors.grey.shade100),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            tx.title,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: Colors.blue.shade900,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: Colors.grey.shade50,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  tx.categoryName,
                                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.w500, color: Colors.blue.shade900.withValues(alpha: 0.4)),
                                ),
                              ),
                              const SizedBox(width: 6),
                              Text('•', style: TextStyle(color: Colors.grey.shade300)),
                              const SizedBox(width: 6),
                              Text(tx.time, style: TextStyle(fontSize: 11, color: Colors.grey.shade400)),
                            ],
                          ),
                        ],
                      ),
                    ),
                    Text(
                      '${isIncome ? '+' : '-'} ₺${NumberFormat('#,##0.00', 'tr_TR').format(tx.amount)}',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: isIncome ? Colors.green.shade600 : Colors.grey.shade800,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
