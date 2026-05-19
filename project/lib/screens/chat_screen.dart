import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import '../models/chat_message.dart';
import '../models/transaction_model.dart';
import '../services/gemini_service.dart';
import '../database/database_helper.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final GeminiService _gemini = GeminiService();
  final DatabaseHelper _db = DatabaseHelper();
  final TextEditingController _inputController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  List<ChatMessage> _messages = [];
  List<TransactionModel> _allTransactions = [];
  bool _isTyping = false;

  @override
  void initState() {
    super.initState();
    _messages = [
      ChatMessage(
        id: 'm-welcome',
        sender: 'assistant',
        text: 'Merhaba! Ben **Para Takip Asistaniyim** 🤖\n\nHarcamalariniz, butceniz veya tasarruf hedefleriniz hakkinda sorular sorabilirsiniz. Size yardimci olmak icin buradayim!',
      ),
    ];
    _loadTransactions();
  }

  Future<void> _loadTransactions() async {
    _allTransactions = await _db.getAllTransactions();
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage(String text) async {
    if (text.trim().isEmpty) return;
    _inputController.clear();

    setState(() {
      _messages.add(ChatMessage(
        id: 'm-user-${DateTime.now().millisecondsSinceEpoch}',
        sender: 'user',
        text: text,
      ));
      _isTyping = true;
    });
    _scrollToBottom();

    await _loadTransactions();

    if (!_gemini.isConfigured) {
      setState(() {
        _messages.add(ChatMessage(
          id: 'm-err-${DateTime.now().millisecondsSinceEpoch}',
          sender: 'assistant',
          text: '⚠️ Gemini API anahtari yapilandirilmamis.\n\nLutfen `project/.env` dosyasindaki `GEMINI_API_KEY` degerini gecerli bir API anahtari ile degistirin.\n\nAPI anahtari almak icin: [Google AI Studio](https://aistudio.google.com/apikey)',
        ));
        _isTyping = false;
      });
      _scrollToBottom();
      return;
    }

    final response = await _gemini.chat(
      message: text,
      transactions: _allTransactions,
      budget: 3500,
    );

    setState(() {
      _messages.add(ChatMessage(
        id: 'm-bot-${DateTime.now().millisecondsSinceEpoch}',
        sender: 'assistant',
        text: response,
      ));
      _isTyping = false;
    });
    _scrollToBottom();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Header
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border(bottom: BorderSide(color: Colors.grey.shade100)),
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: const Color(0xFF2563EB),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.auto_awesome, color: Colors.white, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Yapay Zeka Finans Asistani',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Colors.blue.shade900),
                    ),
                    const SizedBox(height: 2),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.blue.shade50,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        'Aktif Harcama Analizi devrede',
                        style: TextStyle(fontSize: 9, fontWeight: FontWeight.w600, color: Colors.blue.shade700),
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: () {
                  setState(() {
                    _messages = [
                      ChatMessage(
                        id: 'm-reset',
                        sender: 'assistant',
                        text: 'Sohbet temizlendi. Harcamalariniz hakkinda soru sormaya baslayabilirsiniz!',
                      ),
                    ];
                  });
                },
                icon: Icon(Icons.refresh, size: 18, color: Colors.grey.shade400),
              ),
            ],
          ),
        ),

        // Messages
        Expanded(
          child: ListView.builder(
            controller: _scrollController,
            padding: const EdgeInsets.all(16),
            itemCount: _messages.length + (_isTyping ? 1 : 0),
            itemBuilder: (context, index) {
              if (index == _messages.length && _isTyping) {
                return _buildTypingIndicator();
              }
              return _buildMessageBubble(_messages[index]);
            },
          ),
        ),

        // Suggestion chips
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: const Color(0xFFFAF9FF).withValues(alpha: 0.5),
            border: Border(top: BorderSide(color: Colors.grey.shade100)),
          ),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildChip('📊 Harcamalari Ozetle', 'Harcamalarimi ozetle ve tasarruf tavsiyesi ver.'),
                const SizedBox(width: 8),
                _buildChip('💳 Butcemi Analiz Et', 'Butcemin ne kadari kaldi? Asmaktan nasil kacinabilirim?'),
                const SizedBox(width: 8),
                _buildChip('🧾 Aboneliklerimi Goster', 'Fatura ve abonelik giderlerim nedir?'),
              ],
            ),
          ),
        ),

        // Input
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border(top: BorderSide(color: Colors.grey.shade100)),
          ),
          child: Row(
            children: [
              Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: TextField(
                    controller: _inputController,
                    enabled: !_isTyping,
                    decoration: const InputDecoration(
                      hintText: 'Para durumunuzla ilgili soru sorun...',
                      hintStyle: TextStyle(fontSize: 13, color: Colors.grey),
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    ),
                    style: const TextStyle(fontSize: 13),
                    onSubmitted: _sendMessage,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              GestureDetector(
                onTap: () => _sendMessage(_inputController.text),
                child: Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: const Color(0xFF2563EB),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.send, color: Colors.white, size: 18),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildChip(String label, String prompt) {
    return GestureDetector(
      onTap: () => _sendMessage(prompt),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.blue.shade100),
        ),
        child: Text(
          label,
          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.blue.shade700),
        ),
      ),
    );
  }

  Widget _buildMessageBubble(ChatMessage msg) {
    final isUser = msg.sender == 'user';
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isUser) ...[
            Container(
              width: 32,
              height: 32,
              margin: const EdgeInsets.only(top: 4),
              decoration: BoxDecoration(
                color: const Color(0xFF2563EB),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.explore, color: Colors.white, size: 16),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: isUser ? const Color(0xFF2563EB) : Colors.grey.shade50,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(isUser ? 16 : 4),
                  bottomRight: Radius.circular(isUser ? 4 : 16),
                ),
                border: isUser ? null : Border.all(color: Colors.grey.shade100),
                boxShadow: isUser
                    ? [BoxShadow(color: Colors.blue.withValues(alpha: 0.1), blurRadius: 6)]
                    : null,
              ),
              child: isUser
                  ? Text(msg.text, style: const TextStyle(fontSize: 13, color: Colors.white))
                  : MarkdownBody(
                      data: msg.text,
                      styleSheet: MarkdownStyleSheet(
                        p: TextStyle(fontSize: 13, color: Colors.grey.shade800, height: 1.5),
                        strong: TextStyle(fontWeight: FontWeight.w700, color: Colors.blue.shade900),
                        h3: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.blue.shade900),
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTypingIndicator() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: Colors.blue.shade100,
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.access_time, color: Colors.blue.shade600, size: 16),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(16),
                topRight: Radius.circular(16),
                bottomRight: Radius.circular(16),
                bottomLeft: Radius.circular(4),
              ),
              border: Border.all(color: Colors.grey.shade100),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('Para Asistani yaziyor...', style: TextStyle(fontSize: 11, color: Colors.grey.shade400)),
                const SizedBox(width: 8),
                SizedBox(
                  width: 24,
                  height: 10,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: List.generate(3, (i) {
                      return TweenAnimationBuilder<double>(
                        tween: Tween(begin: 0, end: 1),
                        duration: Duration(milliseconds: 600 + i * 200),
                        builder: (context, value, child) {
                          return Container(
                            width: 5,
                            height: 5,
                            decoration: BoxDecoration(
                              color: Colors.blue.shade500.withValues(alpha: 0.4 + value * 0.6),
                              shape: BoxShape.circle,
                            ),
                          );
                        },
                      );
                    }),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _inputController.dispose();
    _scrollController.dispose();
    super.dispose();
  }
}
