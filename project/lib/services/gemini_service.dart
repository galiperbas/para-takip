import 'dart:convert';
import 'dart:typed_data';
import 'package:google_generative_ai/google_generative_ai.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import '../models/transaction_model.dart';

class GeminiService {
  static final GeminiService _instance = GeminiService._internal();
  factory GeminiService() => _instance;
  GeminiService._internal();

  GenerativeModel? _chatModel;
  GenerativeModel? _visionModel;

  String get _apiKey => dotenv.env['GEMINI_API_KEY'] ?? '';

  bool get isConfigured => _apiKey.isNotEmpty && _apiKey != 'BURAYA_GEMINI_API_ANAHTARINIZI_YAZIN';

  void _ensureModels() {
    _chatModel ??= GenerativeModel(
      model: 'gemini-2.0-flash',
      apiKey: _apiKey,
      systemInstruction: Content.text(
        '''Sen "Para Takip Asistani" olarak adlandirilan akilli bir finansal yapay zeka asistanisin.
Gorevin, kullanicinin butcesini analiz etmek, harcamalari hakkinda Turkce sorulari yanitlamak, tasarruf ipuclari vermek ve finansal durumlarini iyilestirmelerine yardimci olmaktir.
Dosyalanan harcama ve butce verilerine bakarak son derece isabetli yaklasimlar sergile.
Turkce konus, samimi, profesyonel, yapici ve tesvik edici ol.
Yanitlarini Markdown biciminde bicimlendir. Kisa ve oz bento tarzi yapilari severiz.''',
      ),
    );

    _visionModel ??= GenerativeModel(
      model: 'gemini-2.0-flash',
      apiKey: _apiKey,
    );
  }

  Future<String> chat({
    required String message,
    required List<TransactionModel> transactions,
    required double budget,
  }) async {
    _ensureModels();

    final txJson = transactions.map((tx) {
      return {
        'title': tx.title,
        'amount': tx.amount,
        'type': tx.type,
        'category': tx.categoryName,
        'date': tx.date,
      };
    }).toList();

    final prompt = '''
Kullanicinin guncel harcama gecmisi:
${jsonEncode(txJson)}

Kullanicinin aylik butcesi: $budget TL.

Kullanici sorusu: $message
''';

    try {
      final response = await _chatModel!.generateContent([Content.text(prompt)]);
      return response.text ?? 'Yanit alinamadi.';
    } catch (e) {
      return 'Hata olustu: $e';
    }
  }

  Future<Map<String, dynamic>?> scanReceipt(Uint8List imageBytes, String mimeType) async {
    _ensureModels();

    final prompt = '''Bu alisveris fisini veya faturasini analiz et. Asagidaki bilgileri Turkce olarak cikarip sadece JSON formatinda dondur:
- title (Market, Magaza veya Hizmet veren adi)
- amount (Toplam harcama tutari, sadece sayisal deger orn: 145.50)
- category (Su kategorilerden biri olmali: 'food', 'transport', 'utilities', 'entertainment', 'shopping', 'other')
- date (Fisin ustundeki tarih, format YYYY-MM-DD olarak. Bulamazsan bugunun tarihini yaz: ${DateTime.now().toIso8601String().split('T')[0]})
Lutfen isabetli tahminler yap. Sadece JSON dondur, baska bir sey yazma.''';

    try {
      final response = await _visionModel!.generateContent([
        Content.multi([
          DataPart(mimeType, imageBytes),
          TextPart(prompt),
        ]),
      ]);

      final text = response.text ?? '{}';
      // Extract JSON from potential markdown code blocks
      String jsonStr = text;
      if (text.contains('```')) {
        final match = RegExp(r'```(?:json)?\s*([\s\S]*?)```').firstMatch(text);
        if (match != null) {
          jsonStr = match.group(1)!.trim();
        }
      }
      return jsonDecode(jsonStr) as Map<String, dynamic>;
    } catch (e) {
      return null;
    }
  }
}
