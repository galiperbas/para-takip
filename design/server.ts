import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize GoogleGenAI securely on the server
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Middlewares
app.use(express.json({ limit: "25mb" }));

// API: AI Finance Chat Assistant
app.post("/api/chat", async (req, res) => {
  try {
    const { message, transactions, budget, systemContext } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Mesaj belirtilmedi." });
    }

    // Embed current financial context directly into the prompt to make the AI genuinely intelligent!
    const txContext = transactions && transactions.length > 0
      ? `Kullanıcının güncel harcama geçmişi:\n` + JSON.stringify(transactions, null, 2)
      : "Henüz kaydedilmiş harcama yok.";

    const budgetContext = `Kullanıcının aylık bütçesi: ${budget || 3500} TL.`;

    const systemInstruction = `Sen "Para Takip Asistanı" olarak adlandırılan akıllı bir finansal yapay zeka asistanısın. 
Görevin, kullanıcının bütçesini analiz etmek, harcamaları hakkında Türkçe soruları yanıtlamak, tasarruf ipuçları vermek ve finansal durumlarını iyileştirmelerine yardımcı olmaktır.
Dosyalanan harcama ve bütçe verilerine bakarak son derece isabetli yaklaşımlar sergile. 
Türkçe konuş, samimi, profesyonel, yapıcı ve teşvik edici ol. 
Yanıtlarını Markdown biçiminde biçimlendir. Kısa ve öz bento tarzı yapıları severiz.`;

    const instructions = `${txContext}\n\n${budgetContext}\n\nTamamlayıcı bağlam: ${systemContext || ""}\n\nKullanıcı sorusu: ${message}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: instructions,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("AI Chat Hatası:", error);
    res.status(500).json({ error: error?.message || "Yapay zeka asistanı yanıt veremedi." });
  }
});

// API: Gemini Vision Smart Receipt Scanner
app.post("/api/scan-receipt", async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64 || !mimeType) {
      return res.status(400).json({ error: "Görüntü verisi veya MIME tipi eksik." });
    }

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: imageBase64,
      },
    };

    const textPart = {
      text: `Bu alışveriş fişini veya faturasını analiz et. Aşağıdaki bilgileri Türkçe olarak çıkartıp sadece JSON formatında döndür:
      - title (Market, Mağaza veya Hizmet veren adı)
      - amount (Toplam harcama tutarı, sadece sayısal değer örn: 145.50)
      - category (Şu kategorilerden biri olmalı: 'food', 'transport', 'utilities', 'entertainment', 'shopping', 'other')
      - date (Fişin üstündeki tarih, format YYYY-MM-DD olarak. Bulamazsan bugünün tarihini yaz: ${new Date().toISOString().split('T')[0]})
      Lütfen isabetli tahminler yap.`,
    };

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "The business or store name, e.g., Starbucks Coffee or Carrefour",
            },
            amount: {
              type: Type.NUMBER,
              description: "Total invoice amount as decimal value, e.g., 250.00",
            },
            category: {
              type: Type.STRING,
              description: "One of standard categories: 'food', 'transport', 'utilities', 'entertainment', 'shopping', 'other'",
            },
            date: {
              type: Type.STRING,
              description: "Transaction date in YYYY-MM-DD format",
            },
          },
          required: ["title", "amount", "category", "date"],
        },
      },
    });

    const resultText = response.text || "{}";
    const data = JSON.parse(resultText);
    res.json(data);
  } catch (error: any) {
    console.error("Fatura Tarama Hatası:", error);
    res.status(500).json({ error: error?.message || "Fiş işlenirken bir hata oluştu." });
  }
});

// Vite Server Setup for Development Mode
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Para Takip server running on port ${PORT}`);
  });
}

startServer();
