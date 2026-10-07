# GölBOX geliştirme ve test hesapları

> [!WARNING]
> Bu hesaplar yalnızca yerel geliştirme ve test ortamları içindir. Üretim ortamında kullanılmamalı, gerçek kullanıcı bilgileri veya üretim şifreleri bu dosyaya eklenmemelidir.

Hesaplar geliştirme ortamında `DbInitializer` tarafından oluşturulur. GölPuan değerleri başlangıç (seed) bakiyeleridir; test işlemleri yapıldıkça yerel veritabanındaki güncel bakiye değişebilir.

## Uygulama adresleri

- Yönetim portalı: <http://127.0.0.1:5173/admin>
- Vatandaş uygulaması: <http://127.0.0.1:3000>

## Yönetim ve personel hesapları

| Kullanıcı | E-posta | Şifre | Ana rol | Kullanım amacı |
|---|---|---|---|---|
| Sistem yöneticisi | `admin@golbox.gov.tr` | `Admin123!` | Admin | Yönetim panelinin tamamı |
| Genel operasyon personeli | `staff@golbox.gov.tr` | `Staff123!` | Staff | Sipariş, ikram ve operasyon testleri |
| Şube 1 personeli | `staff.branch1@golbox.gov.tr` | `Staff123!` | Staff | Şubeye bağlı personel senaryoları |
| Şube 1 yöneticisi | `manager.branch1@golbox.gov.tr` | `Manager123!` | Staff | Şube yöneticisi senaryoları |

> `kasa@golbox.gov.tr / Kasa123!` hesabı mevcut `DbInitializer` içinde tanımlı değildir. Kasa yetkisi test edilecekse yönetim panelinden personele `Cashier` görev rolü atanmalıdır.

## Vatandaş hesapları

| Kullanıcı | E-posta | Şifre | Başlangıç bakiyesi | Test senaryosu |
|---|---|---|---:|---|
| Ahmet Yılmaz | `ahmet.yilmaz@sehitkamil.bel.tr` | `123456` | 340 GP | Ana vatandaş hesabı ve ikram hakları |
| TEST Customer Clean | `customer.clean@golbox.com` | `Clean123!` | 0 GP | Sıfır bakiye |
| TEST Customer Loyalty | `customer.loyalty@golbox.com` | `Loyal123!` | 340 GP | Sadakat ve puan kullanımı |
| TEST Customer Mission | `customer.mission@golbox.com` | `Mission123!` | 150 GP | Görev ilerlemesi ve ikram |
| TEST Customer LowPoints | `customer.low@golbox.com` | `Low123!` | 39 GP | Yetersiz bakiye sınırı |
| TEST Customer ExactPoints | `customer.exact@golbox.com` | `Exact123!` | 40 GP | Tam bakiye sınırı |
| TEST Customer ActiveOrder | `customer.active@golbox.com` | `Active123!` | 100 GP | Canlı sipariş durum geçişleri |
| TEST Customer EventUser | `customer.event@golbox.com` | `Event123!` | 50 GP | Etkinlik kayıt ve check-in işlemleri |

## Hızlı mobil giriş

- Ana hesap: `ahmet.yilmaz@sehitkamil.bel.tr` / `123456`
- Sıfır puan hesabı: `customer.clean@golbox.com` / `Clean123!`

## Kaynak ve güvenlik notları

- Kaynak: `backend/GolBox.Persistence/Context/DbInitializer.cs`
- Üretim başlangıcı bu demo hesapları oluşturmaz.
- Üretim yöneticisi `BootstrapAdmin__Email` ve `BootstrapAdmin__Password` ortam değişkenleriyle bir kez oluşturulmalı; ilk girişten sonra şifre değiştirilmeli ve değişkenler kaldırılmalıdır.
- Bu dosyaya gerçek vatandaş, personel veya üretim ortamı parolaları eklenmemelidir.
