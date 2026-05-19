# 💸 Para Takip: Akıllı Kişisel Finans Asistanı

## 📌 Proje Özeti (Overview)
**Para Takip**, kullanıcıların harcamalarını sıkıcı listeler ve karmaşık grafikler yerine, Google Haritalar tarzı kaydırılabilir bir "Takvim Arayüzü" üzerinde gün gün görmesini sağlayan, yapay zeka destekli bir kişisel finans uygulamasıdır. Flutter ile geliştirilmiş bu MVP, **Google Gemini API** gücünü kullanarak fiş/fatura okuma ve finansal asistan (chatbot) hizmeti sunar.

---

## 🎯 Problem ve Çözüm (Kullanıcı Değeri)
**Problem:** Geleneksel finans uygulamaları, verileri girmenin zorluğu ve karmaşık arayüzleri nedeniyle düzenli kullanılamamaktadır. İnsanlar "18 Mayıs'ta berbere ne kadar verdim?" sorusunun cevabını kolayca bulamamaktadır.
**Çözüm:** 1. Harcamaların takvim üzerinde doğrudan günlere işlenmesi.
2. Fatura ve fişlerin fotoğrafının çekilerek AI tarafından otomatik analiz edilip sisteme girilmesi (Manuel veri girişine son).
3. "Bu ay düzenli ödemelerim ne kadar?" gibi sorulara cevap veren "Agentic" bir sohbet botu.

---

## 🚀 Temel Özellikler (MVP)

### 1. Takvim Odaklı Finansal Görünüm (UI/UX)
- Ana ekran, sağa sola kaydırılabilen geniş bir takvim/zaman çizelgesi şeklindedir.
- Kullanıcı 18 Mayıs'ı seçip "Berber - 400 TL" bilgisini saniyeler içinde girebilir.
- Yaklaşan büyük ödemeler ve düzenli abonelikler takvimde görsel olarak vurgulanır.

### 2. Üretken Yapay Zeka ile Otomatik Veri Çıkarımı
- **Kullanım Senaryosu:** Kullanıcı 19 Mayıs günü aldığı güneş kreminin faturasının fotoğrafını sisteme yükler.
- **Teknoloji:** Google Gemini (Multimodal Vision yetenekleri) faturayı analiz eder; tutarı, tarihi ve kategoriyi (Örn: Kozmetik/Sağlık) saniyeler içinde çıkararak harcamayı sisteme kaydeder.

### 3. Agentic Finansal Asistan (Chatbot)
- Uygulama içinde yer alan akıllı asistan, sadece genel geçer cevaplar veren bir LLM değil, kullanıcının finansal veritabanına erişebilen **Agentic** bir yapıdır.
- **Örnek Soru:** "Bu ay aboneliklere toplam ne kadar harcadım?"
- **Agentic İşlem:** AI asistanı, yerel veritabanını sorgular, abonelik kalemlerini toplar ve kullanıcıya net bir bütçe analizi sunar.

---

## 🛠 Teknik Mimari ve Kullanılan Araçlar (Tech Stack)
- **Frontend (Mobil Uygulama):** Flutter (Hızlı prototipleme ve akıcı UI için).
- **Yapay Zeka (GenAI):** Google Gemini API.
  - *Gemini Vision:* Görselden metin ve yapılandırılmış veri (JSON) çıkarma (Fatura analizi).
  - *Gemini Text:* Doğal dil işleme ve chatbot altyapısı.
- **Veri Saklama (MVP):** LocalStorage / SQLite (Prototip aşamasında bulut maliyetlerini ve limitleri optimize etmek, uygulamanın hızlı çalışmasını sağlamak için veriler lokalde tutulmuştur).

---

## 📊 Yarışma Kriterlerine Göre Değerlendirme

* **Yenilikçilik ve Özgünlük:** Finans verilerini klasik "pie chart" (pasta grafik) yerine, günlük hayatın akışına uygun bir "Takvim Akışı" üzerinde sunması.
* **Performans ve Doğruluk:** Gemini modelleri ile fişlerden sıfır hataya yakın veri çekimi yapılması.
* **Agentic Yapılar:** Chatbot'un sadece sohbet etmekle kalmayıp, kullanıcının harcama verilerine (context) ulaşarak eyleme dökülebilir (actionable) içgörüler sunması.
* **Kullanıcı Dostu Çalışma:** Hiç finans bilgisi olmayan birinin bile fotoğraf çekerek veya takvime tıklayarak bütçesini yönetebilmesi.

---

## 🔮 Gelecek Vizyonu (Future Scope)
- Açık Bankacılık (Open Banking) API'leri ile banka hesaplarının doğrudan takvime entegrasyonu.
- Aile/Ortak bütçe yönetimi için çoklu kullanıcı desteği.
- Bulut tabanlı senkronizasyon.
