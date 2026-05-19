# Google Gemini API Baglanti Rehberi

Bu rehber, Para Takip uygulamasinin yapay zeka ozelliklerini (chatbot ve fis tarama) calistirmak icin gerekli olan Google Gemini API yapilandirmasini adim adim aciklar.

---

## 1. Google AI Studio'dan API Anahtari Alma

1. Tarayicinizda su adrese gidin: **https://aistudio.google.com/apikey**
2. Google hesabinizla giris yapin
3. **"Create API Key"** butonuna tiklayin
4. Yeni bir proje secin veya mevcut bir projeyi kullanin
5. Olusturulan API anahtarini kopyalayin (ornek: `AIzaSyB...xyz`)

> **Onemli:** API anahtarinizi kimseyle paylasmayiniz ve GitHub'a push etmeyiniz.

---

## 2. API Anahtarini Uygulamaya Tanimlama

`project/.env` dosyasini acin ve API anahtarinizi yazin:

```
GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxx
```

> `.env` dosyasi `.gitignore`'a eklenmelidir. GitHub'a yuklerken dikkatli olun.

---

## 3. Kullanilan Gemini Modelleri

| Ozellik | Model | Aciklama |
|---------|-------|----------|
| Chatbot (Finansal Asistan) | `gemini-2.0-flash` | Harcama analizi, butce tavsiyeleri, Turkce sohbet |
| Fis Tarama (Vision) | `gemini-2.0-flash` | Gorsel analiz ile fis/faturadan tutar, magaza, kategori cikarma |

---

## 4. API Kullanim Limitleri (Ucretsiz Katman)

Google AI Studio ucretsiz katmani su limitleri saglar:
- **Gemini 2.0 Flash:** Dakikada 15 istek, gunluk 1500 istek
- **Gorsel analiz:** Ayni limitler dahilinde

Bu limitler bir hackathon demosu icin fazlasiyla yeterlidir.

---

## 5. Uygulamayi Calistirma

```bash
cd project
flutter pub get
flutter run
```

### Windows Desktop icin:
```bash
flutter run -d windows
```

### Android Emulator icin:
```bash
flutter run -d emulator-5554
```

### Chrome (Web) icin:
```bash
flutter run -d chrome
```

---

## 6. Sorun Giderme

| Sorun | Cozum |
|-------|-------|
| "API anahtari yapilandirilmamis" | `.env` dosyasindaki `GEMINI_API_KEY` degerini kontrol edin |
| "403 Forbidden" | API anahtarinizin aktif oldugundan emin olun, AI Studio'dan kontrol edin |
| "Quota exceeded" | Ucretsiz limit asimi. Birkac dakika bekleyin veya yeni anahtar olusturun |
| Fis tarama calismadi | Goruntunun net ve okunabilir oldugunden emin olun |

---

## 7. Guvenlik Notlari

- API anahtarini **asla** kaynak kodun icine yazmayiniz
- `.env` dosyasini `.gitignore`'a ekleyiniz
- Production'da API anahtarini backend uzerinden proxy'leyiniz
- Uygulamayi yayinlarken API anahtarini environment variable olarak yonetin
