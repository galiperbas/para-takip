import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import '../database/database_helper.dart';
import '../models/transaction_model.dart';
import '../services/gemini_service.dart';

class AddScreen extends StatefulWidget {
  final VoidCallback onSaved;
  const AddScreen({super.key, required this.onSaved});

  @override
  State<AddScreen> createState() => _AddScreenState();
}

class _AddScreenState extends State<AddScreen> {
  final _formKey = GlobalKey<FormState>();
  final DatabaseHelper _db = DatabaseHelper();
  final GeminiService _gemini = GeminiService();
  final ImagePicker _picker = ImagePicker();

  final _amountController = TextEditingController();
  final _titleController = TextEditingController();

  String _type = 'expense';
  String _category = 'food';
  String _date = DateFormat('yyyy-MM-dd').format(DateTime.now());

  bool _isScanning = false;
  String _scanStatus = '';
  String _scannedFileName = '';
  Uint8List? _scannedImageBytes;

  final List<_ScanRecord> _recentScans = [
    _ScanRecord(name: "Luigi's Aksam Yemegi Fisi", status: 'Analyzed', date: 'Demo kayit'),
  ];

  Future<void> _pickAndScanImage(ImageSource source) async {
    final XFile? image = await _picker.pickImage(source: source, maxWidth: 1200, imageQuality: 85);
    if (image == null) return;

    setState(() {
      _isScanning = true;
      _scannedFileName = image.name;
      _scanStatus = 'Dosya okunuyor...';
    });

    final bytes = await image.readAsBytes();
    setState(() {
      _scannedImageBytes = bytes;
      _scanStatus = 'Gemini faturayi inceliyor...';
    });

    _recentScans.insert(0, _ScanRecord(name: image.name, status: 'Processing', date: 'Yukleniyor...'));

    if (!_gemini.isConfigured) {
      setState(() {
        _scanStatus = 'API anahtari yapilandirilmamis. Lutfen .env dosyasini kontrol edin.';
        _recentScans[0] = _ScanRecord(name: image.name, status: 'Failed', date: 'API hatasi');
        _isScanning = false;
      });
      return;
    }

    final mimeType = image.name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    final result = await _gemini.scanReceipt(bytes, mimeType);

    if (result != null) {
      setState(() {
        if (result['amount'] != null) _amountController.text = result['amount'].toString();
        if (result['title'] != null) _titleController.text = result['title'].toString();
        if (result['category'] != null) _category = result['category'].toString();
        if (result['date'] != null) _date = result['date'].toString();
        _scanStatus = 'Basarili! Veriler forma aktarildi.';
        _recentScans[0] = _ScanRecord(name: image.name, status: 'Analyzed', date: 'Az once analiz edildi');
      });
    } else {
      setState(() {
        _scanStatus = 'Fatura tarama basarisiz. Lutfen bilgileri manuel girin.';
        _recentScans[0] = _ScanRecord(name: image.name, status: 'Failed', date: 'Okunamadi');
      });
    }

    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => _isScanning = false);
    });
  }

  void _simulateDemoScan(String title, double amount, String category) {
    setState(() {
      _amountController.text = amount.toString();
      _titleController.text = title;
      _category = category;
      _type = 'expense';
      _recentScans.insert(0, _ScanRecord(name: '$title Fisi (Demo)', status: 'Analyzed', date: 'Demo tarama'));
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$title verileri forma aktarildi!'),
        backgroundColor: Colors.green.shade600,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }

  Future<void> _saveTransaction() async {
    if (!_formKey.currentState!.validate()) return;

    final tx = TransactionModel(
      title: _titleController.text.trim(),
      amount: double.parse(_amountController.text),
      type: _type,
      category: _category,
      date: _date,
      time: DateFormat('HH:mm').format(DateTime.now()),
    );

    await _db.insertTransaction(tx);

    _amountController.clear();
    _titleController.clear();
    setState(() {
      _category = 'food';
      _scannedImageBytes = null;
    });

    widget.onSaved();

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Islem basariyla kaydedildi!'),
          backgroundColor: Colors.blue.shade600,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Scanner section
        _buildScannerCard(),
        const SizedBox(height: 16),
        // Manual form
        _buildFormCard(),
      ],
    );
  }

  Widget _buildScannerCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(Icons.auto_awesome, size: 20, color: Colors.blue.shade600),
                  const SizedBox(width: 8),
                  Text('Akilli Fis Tarama', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.blue.shade900)),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.blue.shade100,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text('Gemini Vision', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: Colors.blue.shade700, letterSpacing: 0.5)),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Alisveris fisinizin fotografini yukleyin. Yapay zeka tutari, magaza adini ve kategoriyi otomatik forma aktaracaktir.',
            style: TextStyle(fontSize: 12, color: Colors.grey.shade500, height: 1.4),
          ),
          const SizedBox(height: 16),

          // Upload area
          GestureDetector(
            onTap: _isScanning ? null : () => _showImageSourceDialog(),
            child: Container(
              width: double.infinity,
              height: 180,
              decoration: BoxDecoration(
                color: _isScanning ? Colors.blue.shade50.withValues(alpha: 0.3) : Colors.grey.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: _isScanning ? Colors.blue.shade400 : Colors.grey.shade200,
                  width: 2,
                  strokeAlign: BorderSide.strokeAlignInside,
                ),
              ),
              child: _scannedImageBytes != null && !_isScanning
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: Image.memory(_scannedImageBytes!, fit: BoxFit.cover, width: double.infinity),
                    )
                  : Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        if (_isScanning) ...[
                          Icon(Icons.camera_alt, size: 40, color: Colors.blue.shade600),
                          const SizedBox(height: 8),
                          Text(_scanStatus, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.blue.shade700)),
                          const SizedBox(height: 4),
                          Text(_scannedFileName, style: TextStyle(fontSize: 10, color: Colors.grey.shade400, fontStyle: FontStyle.italic)),
                          const SizedBox(height: 8),
                          SizedBox(width: 120, child: LinearProgressIndicator(color: Colors.blue.shade600, backgroundColor: Colors.blue.shade100)),
                        ] else ...[
                          Icon(Icons.upload_file, size: 40, color: Colors.grey.shade400),
                          const SizedBox(height: 8),
                          Text('Bir Fis Fotografi Yukle', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.grey.shade700)),
                          const SizedBox(height: 4),
                          Text('PNG, JPG desteklenir', style: TextStyle(fontSize: 10, color: Colors.grey.shade400)),
                        ],
                      ],
                    ),
            ),
          ),
          const SizedBox(height: 16),

          // Demo scan buttons
          Text(
            'HIZLI DEMO FIS SIMULASYONU',
            style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: Colors.grey.shade400, letterSpacing: 1.2),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(child: _buildDemoButton('🍕', "Luigi's Italian", 235, 'food')),
              const SizedBox(width: 8),
              Expanded(child: _buildDemoButton('☕', 'Starbucks', 85, 'food')),
              const SizedBox(width: 8),
              Expanded(child: _buildDemoButton('🛒', 'Migros', 410.50, 'shopping')),
            ],
          ),
          const SizedBox(height: 16),

          // Recent scans
          Text(
            'GECMIS TARAMALAR',
            style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: Colors.grey.shade400, letterSpacing: 1.2),
          ),
          const SizedBox(height: 8),
          ..._recentScans.take(3).map(_buildScanRecord),
        ],
      ),
    );
  }

  void _showImageSourceDialog() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Fis Fotografi', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.blue.shade900)),
            const SizedBox(height: 16),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(10)),
                child: Icon(Icons.camera_alt, color: Colors.blue.shade600),
              ),
              title: const Text('Kamera ile Cek'),
              subtitle: const Text('Fisi simdi fotografla'),
              onTap: () {
                Navigator.pop(ctx);
                _pickAndScanImage(ImageSource.camera);
              },
            ),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(10)),
                child: Icon(Icons.photo_library, color: Colors.green.shade600),
              ),
              title: const Text('Galeriden Sec'),
              subtitle: const Text('Kayitli fotografi yukle'),
              onTap: () {
                Navigator.pop(ctx);
                _pickAndScanImage(ImageSource.gallery);
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDemoButton(String emoji, String title, double amount, String category) {
    return GestureDetector(
      onTap: () => _simulateDemoScan(title, amount, category),
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: const Color(0xFFFAF9FF),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade100),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('$emoji $title', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.grey.shade800), maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 6),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(category == 'food' ? 'Yemek' : 'Alisveris', style: TextStyle(fontSize: 9, color: Colors.grey.shade400)),
                Text('${amount.toStringAsFixed(0)} ₺', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: Colors.blue.shade700)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildScanRecord(_ScanRecord record) {
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Row(
        children: [
          const Text('🧾', style: TextStyle(fontSize: 16)),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(record.name, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.grey.shade700), maxLines: 1, overflow: TextOverflow.ellipsis),
                Text(record.date, style: TextStyle(fontSize: 9, color: Colors.grey.shade400)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: record.status == 'Analyzed'
                  ? Colors.green.shade100
                  : record.status == 'Failed'
                      ? Colors.red.shade100
                      : Colors.amber.shade100,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              record.status == 'Analyzed'
                  ? 'Tamamlandi'
                  : record.status == 'Failed'
                      ? 'Hata'
                      : 'Taraniyor',
              style: TextStyle(
                fontSize: 9,
                fontWeight: FontWeight.w700,
                color: record.status == 'Analyzed'
                    ? Colors.green.shade800
                    : record.status == 'Failed'
                        ? Colors.red.shade800
                        : Colors.amber.shade800,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFormCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2)),
        ],
      ),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Manuel Islem Girisi', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.blue.shade900)),
                // Income/Expense toggle
                Container(
                  padding: const EdgeInsets.all(2),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      _buildTypeToggle('Gider', 'expense', Colors.red.shade500),
                      _buildTypeToggle('Gelir', 'income', Colors.green.shade500),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Amount
            TextFormField(
              controller: _amountController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              validator: (v) {
                if (v == null || v.isEmpty) return 'Tutar gerekli';
                if (double.tryParse(v) == null || double.parse(v) <= 0) return 'Gecerli tutar girin';
                return null;
              },
              decoration: InputDecoration(
                labelText: 'Tutar (TL)',
                labelStyle: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.blue.shade600, letterSpacing: 0.5),
                prefixText: '₺ ',
                prefixStyle: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: Colors.grey.shade400),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.blue.shade500, width: 2)),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.blue.shade500, width: 2)),
                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.blue.shade700, width: 2)),
              ),
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Colors.blue.shade900),
            ),
            const SizedBox(height: 16),

            // Title
            TextFormField(
              controller: _titleController,
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Aciklama gerekli' : null,
              decoration: InputDecoration(
                labelText: 'Aciklama / Magaza Adi',
                labelStyle: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.grey.shade400, letterSpacing: 0.5),
                hintText: 'Orn: Carrefour, Starbucks, Maas Odemesi',
                hintStyle: TextStyle(fontSize: 13, color: Colors.grey.shade300),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade200)),
              ),
              style: TextStyle(fontSize: 14, color: Colors.blue.shade900),
            ),
            const SizedBox(height: 16),

            // Category
            DropdownButtonFormField<String>(
              initialValue: _category,
              decoration: InputDecoration(
                labelText: 'Kategori',
                labelStyle: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.grey.shade400, letterSpacing: 0.5),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade200)),
              ),
              items: const [
                DropdownMenuItem(value: 'food', child: Text('🍱 Yemek & Restoran')),
                DropdownMenuItem(value: 'shopping', child: Text('🛒 Alisveris & Market')),
                DropdownMenuItem(value: 'transport', child: Text('🚗 Ulasim & Seyahat')),
                DropdownMenuItem(value: 'utilities', child: Text('🏢 Kira & Faturalar')),
                DropdownMenuItem(value: 'entertainment', child: Text('🎬 Eglence & Sosyal')),
                DropdownMenuItem(value: 'other', child: Text('💵 Diger Islemler')),
              ],
              onChanged: (v) => setState(() => _category = v ?? 'food'),
            ),
            const SizedBox(height: 16),

            // Date
            GestureDetector(
              onTap: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: DateTime.tryParse(_date) ?? DateTime.now(),
                  firstDate: DateTime(2024),
                  lastDate: DateTime(2030),
                );
                if (picked != null) {
                  setState(() => _date = DateFormat('yyyy-MM-dd').format(picked));
                }
              },
              child: AbsorbPointer(
                child: TextFormField(
                  decoration: InputDecoration(
                    labelText: 'Tarih',
                    labelStyle: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.grey.shade400, letterSpacing: 0.5),
                    suffixIcon: Icon(Icons.calendar_today, size: 18, color: Colors.grey.shade400),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade200)),
                  ),
                  controller: TextEditingController(text: _date),
                  style: TextStyle(fontSize: 14, color: Colors.blue.shade900),
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      _amountController.clear();
                      _titleController.clear();
                      setState(() {
                        _category = 'food';
                        _scannedImageBytes = null;
                      });
                    },
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      side: BorderSide(color: Colors.grey.shade200),
                    ),
                    child: Text('Temizle', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.grey.shade500)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _saveTransaction,
                    icon: const Icon(Icons.check_circle, size: 18),
                    label: const Text('Kaydet', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _type == 'income' ? Colors.green.shade600 : const Color(0xFF2563EB),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 4,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTypeToggle(String label, String value, Color activeColor) {
    final isActive = _type == value;
    return GestureDetector(
      onTap: () => setState(() => _type = value),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: isActive ? activeColor : Colors.transparent,
          borderRadius: BorderRadius.circular(6),
          boxShadow: isActive ? [BoxShadow(color: activeColor.withValues(alpha: 0.3), blurRadius: 4)] : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: isActive ? Colors.white : Colors.grey.shade500,
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _amountController.dispose();
    _titleController.dispose();
    super.dispose();
  }
}

class _ScanRecord {
  final String name;
  final String status;
  final String date;
  _ScanRecord({required this.name, required this.status, required this.date});
}
