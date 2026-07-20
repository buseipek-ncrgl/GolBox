# GölBox API Tasarım Dokümanı (API Design Bible)

Bu doküman, GölBox platformunun mobil uygulama, frontend web paneli ve üçüncü taraf entegrasyonlar (örn: POS kasaları) için sunacağı RESTful API uç noktalarını (endpoints), istek/cevap (Request/Response) modellerini (DTO), doğrulama kurallarını ve güvenlik standartlarını tanımlar.

---

## 1. Genel API Standartları

1. **Prefix ve Sürümleme:** Tüm API uç noktaları `/api/v1/` önekiyle başlayacaktır (örn: `/api/v1/auth/login`).
2. **Kasa (Case) Standardı:** 
   - Rotalar ve Query parametreleri **kebab-case** formatında olacaktır (örn: `/api/v1/user-rewards?page-size=20`).
   - JSON İstek ve Cevap gövdeleri (Payload) **camelCase** formatında olacaktır.
3. **Multi-Tenancy İletimi:**
   - **Yetkilendirilmiş İstekler:** JWT içindeki `org_id` claim'inden elde edilir.
   - **Anonim İstekler:** `X-Organization-Id` HTTP başlığı (header) ile gönderilmelidir.
4. **Ortak Cevap Zarfı (Response Envelope):**
   Tüm API cevapları aşağıdaki ortak yapıda dönecektir:

**Başarılı Cevap Şablonu (HTTP 200/201):**
```json
{
  "success": true,
  "message": "İşlem başarıyla tamamlandı.",
  "data": { ... }
}
```

**Hata Cevabı Şablonu (HTTP 400/422/500):**
```json
{
  "success": false,
  "message": "İşlem sırasında doğrulama hatası oluştu.",
  "errors": [
    "E-posta adresi geçerli formatta olmalıdır.",
    "Şifre en az 8 karakter olmalıdır."
  ]
}
```

---

## 2. HTTP Durum Kodları (Status Codes)

| Kod | Durum | Kullanım Alanı |
| :--- | :--- | :--- |
| **200** | OK | Başarılı okuma veya güncelleme işlemleri. |
| **201** | Created | Yeni bir kaynak başarıyla oluşturulduğunda (Örn: Sipariş oluşturma). |
| **204** | No Content | İşlem başarılı fakat cevap gövdesinde veri dönülmeyecekse. |
| **400** | Bad Request | Geçersiz istek parametreleri veya sözdizimi hatalarında. |
| **401** | Unauthorized | Token yoksa veya geçersizse. |
| **403** | Forbidden | Token geçerli ancak kullanıcının bu işlemi yapmaya yetkisi yoksa. |
| **404** | Not Found | İstenen kaynak veritabanında bulunamadığında. |
| **422** | Unprocessable Entity| İş kuralları veya validasyon ihlallerinde (FluentValidation çıktıları). |
| **429** | Too Many Requests | Rate limit aşıldığında. |
| **500** | Internal Error | Sunucu tarafında yakalanamayan beklenmedik hatalar. |

---

## 3. Uç Nokta Detayları ve DTO Şemaları

### 3.1. Kimlik Doğrulama (`/api/v1/auth`)

#### 3.1.1. Kayıt Ol (Register)
- **Metot / Yol:** `POST /api/v1/auth/register`
- **Rate Limit:** Sıkı (Dakikada en fazla 5 istek - IP bazlı)
- **Doğrulama (Validation):** 
  - `email` zorunlu, geçerli e-posta formatı.
  - `password` en az 8 karakter, 1 büyük harf, 1 küçük harf, 1 rakam içermeli.
  - `firstName` & `lastName` zorunlu (boş olamaz).
  - `phoneNumber` TR formatına uygun olmalı (`5XXXXXXXXX`).

**İstek Gövdesi (Request DTO):**
```json
{
  "organizationId": "5f98db5c-b2f7-4f96-ae11-4f2db9c2c6aa",
  "email": "ogrenci@golbox.edu.tr",
  "password": "Password123*",
  "firstName": "Ömer",
  "lastName": "Yılmaz",
  "phoneNumber": "5551234567"
}
```

**Cevap Gövdesi (Response DTO):**
```json
{
  "success": true,
  "message": "Kayıt işlemi başarılı. Lütfen e-posta adresinizi doğrulayın.",
  "data": {
    "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "email": "ogrenci@golbox.edu.tr"
  }
}
```

#### 3.1.2. Giriş Yap (Login)
- **Metot / Yol:** `POST /api/v1/auth/login`
- **Rate Limit:** Çok Sıkı (Dakikada en fazla 5 istek - IP + E-posta bazlı)

**İstek Gövdesi (Request DTO):**
```json
{
  "email": "ogrenci@golbox.edu.tr",
  "password": "Password123*"
}
```

**Cevap Gövdesi (Response DTO):**
```json
{
  "success": true,
  "message": "Giriş başarılı.",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "expiresIn": 900,
    "refreshToken": "rf_7f98db5c...",
    "user": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "firstName": "Ömer",
      "lastName": "Yılmaz",
      "email": "ogrenci@golbox.edu.tr",
      "pointsBalance": 150,
      "roles": ["User"]
    }
  }
}
```

#### 3.1.3. Token Yenileme (Refresh Token)
- **Metot / Yol:** `POST /api/v1/auth/refresh`
- **Rate Limit:** Sıkı

**İstek Gövdesi (Request DTO):**
```json
{
  "refreshToken": "rf_7f98db5c..."
}
```

**Cevap Gövdesi (Response DTO):**
```json
{
  "success": true,
  "message": "Token yenilendi.",
  "data": {
    "accessToken": "eyJhbGciOiNew...",
    "expiresIn": 900,
    "refreshToken": "rf_new7f98db..."
  }
}
```

---

### 3.2. Kullanıcı Modülü (`/api/v1/users`)
*Tüm isteklerde `Authorization: Bearer <token>` zorunludur.*

#### 3.2.1. Profil Getir
- **Metot / Yol:** `GET /api/v1/users/me`

**Cevap Gövdesi (Response DTO):**
```json
{
  "success": true,
  "message": "Profil bilgileri getirildi.",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "email": "ogrenci@golbox.edu.tr",
    "phoneNumber": "5551234567",
    "firstName": "Ömer",
    "lastName": "Yılmaz",
    "profileImageUrl": "https://cdn.golbox.com/profiles/avatar.png",
    "pointsBalance": 150,
    "organization": {
      "id": "5f98db5c-b2f7-4f96-ae11-4f2db9c2c6aa",
      "name": "Şehitkamil Belediyesi",
      "themeColor": "#FF6600"
    }
  }
}
```

#### 3.2.2. Profil Güncelle
- **Metot / Yol:** `PUT /api/v1/users/me`

**İstek Gövdesi (Request DTO):**
```json
{
  "firstName": "Ömer Asaf",
  "lastName": "Yılmaz",
  "profileImageUrl": "https://cdn.golbox.com/profiles/avatar_new.png"
}
```

---

### 3.3. Puan ve Görevler (`/api/v1/points`, `/api/v1/tasks`)

#### 3.3.1. Puan Hareketleri Geçmişi
- **Metot / Yol:** `GET /api/v1/points`
- **Parametreler (Query):** `page=1`, `page-size=20`

**Cevap Gövdesi (Response DTO):**
```json
{
  "success": true,
  "message": "Puan geçmişi listelendi.",
  "data": {
    "items": [
      {
        "id": "b3fc-2c963f66afa6-3fa85f64-5717",
        "amount": 15,
        "type": "Earn",
        "description": "Günlük QR Okuma Görevi Tamamlandı",
        "createdDate": "2026-07-19T11:00:00Z"
      },
      {
        "id": "c963f66afa6-3fa85f64-5717-b3fc",
        "amount": -50,
        "type": "Spend",
        "description": "Filtre Kahve Ödülü Alındı",
        "createdDate": "2026-07-18T15:30:00Z"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "totalCount": 2,
    "totalPages": 1
  }
}
```

#### 3.3.2. Görevleri Listele
- **Metot / Yol:** `GET /api/v1/tasks`
- **Açıklama:** Kullanıcının aktif görevlerini ve tamamlanma durumlarını gösterir.

**Cevap Gövdesi (Response DTO):**
```json
{
  "success": true,
  "message": "Görev listesi getirildi.",
  "data": {
    "items": [
      {
        "id": "7fa85f64-5717-4562-b3fc-2c963f66afa6",
        "title": "İlk Kahve Siparişi",
        "description": "Ismarlıyor üzerinden ilk kahveni sipariş et, bonus puan kazan.",
        "points": 50,
        "repeatInterval": "None",
        "isCompletedToday": true
      },
      {
        "id": "8fa85f64-5717-4562-b3fc-2c963f66afa6",
        "title": "Günde Bir Kafe Ziyareti",
        "description": "Herhangi bir Göl Kafe'de QR okut.",
        "points": 15,
        "repeatInterval": "Daily",
        "isCompletedToday": false
      }
    ]
  }
}
```

---

### 3.4. Ödül Kataloğu (`/api/v1/rewards`)

#### 3.4.1. Ödülleri Listele
- **Metot / Yol:** `GET /api/v1/rewards`
- **Parametreler (Query):** `page=1`, `page-size=20`, `search=kahve`

**Cevap Gövdesi (Response DTO):**
```json
{
  "success": true,
  "message": "Aktif ödül kataloğu listelendi.",
  "data": {
    "items": [
      {
        "id": "9fa85f64-5717-4562-b3fc-2c963f66afa6",
        "title": "Filtre Kahve",
        "description": "Tüm Göl Kafelerde geçerli 1 adet küçük boy filtre kahve ikramı.",
        "requiredPoints": 50,
        "imageUrl": "https://cdn.golbox.com/rewards/filter-coffee.png"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "totalCount": 1,
    "totalPages": 1
  }
}
```

#### 3.4.2. Ödül Talep Et (Claim Reward)
- **Metot / Yol:** `POST /api/v1/rewards/{id}/claim`
- **Açıklama:** Kullanıcı puanı karşılığında ödülü satın alır. Puanı anında düşer.

**Cevap Gövdesi (Response DTO):**
```json
{
  "success": true,
  "message": "Ödül başarıyla tanımlandı. Kodunuz oluşturuldu.",
  "data": {
    "claimId": "a1a85f64-5717-4562-b3fc-2c963f66afa6",
    "redeemCode": "GB-F-KAHVE-98A7",
    "claimedAt": "2026-07-19T11:51:00Z",
    "remainingPoints": 100
  }
}
```

---

### 3.5. QR Ödeme ve Siparişler (`/api/v1/qr`, `/api/v1/ismarliyor`)

#### 3.5.1. QR Tarama/İşleme (QR Scan)
- **Metot / Yol:** `POST /api/v1/qr/scan`
- **Açıklama:** Kasa POS'unun veya mobil uygulamanın ürettiği QR'ı sisteme gönderip ödeme başlatır/puan kazanır.

**İstek Gövdesi (Request DTO):**
```json
{
  "qrToken": "qr_payment_token_abc123xyz...",
  "paidWithPoints": true
}
```

**Cevap Gövdesi (Response DTO):**
```json
{
  "success": true,
  "message": "QR ödeme işlemi başarıyla tamamlandı.",
  "data": {
    "paymentId": "d5a85f64-5717-4562-b3fc-2c963f66afa6",
    "amount": 45.00,
    "pointsDeducted": 45,
    "newPointsBalance": 55,
    "status": "Completed"
  }
}
```

#### 3.5.2. Ön Sipariş Oluştur (Ismarlıyor Order)
- **Metot / Yol:** `POST /api/v1/ismarliyor/orders`
- **Açıklama:** Sepetteki ürünlerle ön sipariş oluşturur.

**İstek Gövdesi (Request DTO):**
```json
{
  "cafeId": "c1a85f64-5717-4562-b3fc-2c963f66afa6",
  "paidWithPoints": false,
  "items": [
    {
      "menuItemId": "m1a85f64-5717-4562-b3fc-2c963f66afa6",
      "quantity": 2
    },
    {
      "menuItemId": "m2a85f64-5717-4562-b3fc-2c963f66afa6",
      "quantity": 1
    }
  ]
}
```

**Cevap Gövdesi (Response DTO):**
```json
{
  "success": true,
  "message": "Siparişiniz alındı ve hazırlanmaya başlandı.",
  "data": {
    "orderId": "o1a85f64-5717-4562-b3fc-2c963f66afa6",
    "collectionCode": "GB-3902",
    "totalAmount": 120.00,
    "status": "Preparing",
    "createdAt": "2026-07-19T11:51:30Z"
  }
}
```

---

### 3.6. Kafeler ve Menüler (`/api/v1/cafes`)

#### 3.6.1. Kafeleri Listele (Yakındaki Kafeler)
- **Metot / Yol:** `GET /api/v1/cafes`
- **Parametreler (Query):** `latitude=37.0662`, `longitude=37.3781`, `category-id=c123...` (Opsiyonel)

**Cevap Gövdesi (Response DTO):**
```json
{
  "success": true,
  "message": "Kafeler listelendi.",
  "data": {
    "items": [
      {
        "id": "c1a85f64-5717-4562-b3fc-2c963f66afa6",
        "name": "Şehitkamil Kitap Kafe",
        "address": "Atatürk Mah. No:15 Gaziantep",
        "latitude": 37.0662,
        "longitude": 37.3781,
        "distanceMeters": 120,
        "isActive": true
      }
    ]
  }
}
```

#### 3.6.2. Kafe Menüsünü Getir
- **Metot / Yol:** `GET /api/v1/cafes/{id}/menu`

**Cevap Gövdesi (Response DTO):**
```json
{
  "success": true,
  "message": "Menü getirildi.",
  "data": {
    "categories": [
      {
        "categoryId": "mc1a85f64-5717-4562-b3fc-2c963f66afa6",
        "categoryName": "Kahveler",
        "displayOrder": 1,
        "items": [
          {
            "id": "m1a85f64-5717-4562-b3fc-2c963f66afa6",
            "name": "Filtre Kahve",
            "description": "Taze çekilmiş çekirdeklerden.",
            "price": 35.00,
            "imageUrl": "https://cdn.golbox.com/menu/filter.png",
            "isActive": true
          }
        ]
      }
    ]
  }
}
```

---

## 4. Güvenlik ve Hız Sınırı (Rate Limiting) Politikaları

Aşağıdaki rotalarda, API'yi kötüye kullanımlara (abuse / brute force) karşı korumak için ASP.NET Core yerleşik Rate Limiter bileşenleri ile sınırlandırmalar uygulanacaktır:

1. **Giriş ve Parola Sıfırlama (`/api/v1/auth/login`, `/api/v1/auth/forgot-password`):**
   - **Politika:** IP + E-posta tabanlı Fixed Window.
   - **Limit:** 1 dakikalık pencerede en fazla **5 istek**. Aşımında `HTTP 429 Too Many Requests` döner.
2. **Genel Veri Okuma (`GET /api/v1/cafes`, `GET /api/v1/rewards`):**
   - **Politika:** IP tabanlı Sliding Window.
   - **Limit:** 1 dakikalık pencerede en fazla **60 istek**.
3. **Dosya Yükleme (`POST /api/v1/files/upload`):**
   - **Politika:** Kullanıcı ID tabanlı Token Bucket.
   - **Limit:** 10 dakikada en fazla **10 dosya**.
