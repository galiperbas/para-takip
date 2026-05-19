class ChatMessage {
  final String id;
  final String sender; // "user" | "assistant"
  final String text;

  ChatMessage({
    required this.id,
    required this.sender,
    required this.text,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'sender': sender,
      'text': text,
    };
  }

  factory ChatMessage.fromMap(Map<String, dynamic> map) {
    return ChatMessage(
      id: map['id'] as String,
      sender: map['sender'] as String,
      text: map['text'] as String,
    );
  }
}
