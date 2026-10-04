export type AdminMenuId =
  | 'overview'
  | 'orders'
  | 'cafes'
  | 'products'
  | 'points'
  | 'qr'
  | 'rewards'
  | 'campaigns'
  | 'events'
  | 'eventCheckin'
  | 'missions'
  | 'notifications'
  | 'reports'
  | 'users'
  | 'roles'
  | 'audit'
  | 'settings';

export const STAFF_MENU_IDS: AdminMenuId[] = [
  'orders',
  'qr',
  'eventCheckin',
  'products',
  'cafes'
];

export const ADMIN_PATHS: { id: AdminMenuId; path: string; label: string; section: string; description: string }[] = [
  // ADMIN DASHBOARD
  { id: 'overview', path: '/admin', label: 'Dashboard', section: 'Genel', description: 'GölBOX genel durum, aktif siparişler ve operasyon metrikleri.' },

  // OPERASYON (STAFF & ADMIN)
  { id: 'orders', path: '/admin/siparisler', label: 'Sipariş Operasyonu', section: 'Operasyon', description: 'Canlı sipariş kuyruğu: Kabul, Hazırlanıyor, Hazır ve Teslim.' },
  { id: 'qr', path: '/admin/qr', label: 'QR İle Kasa Doğrulama', section: 'Operasyon', description: 'Kasada müşteri QR tarama, sipariş doğrulama ve puan kullanımı.' },
  { id: 'eventCheckin', path: '/admin/etkinlik-checkin', label: 'Etkinlik Check-in', section: 'Operasyon', description: 'Etkinlik günü katılımcı QR kodlarını tarama ve doğrulanmış katılım.' },
  { id: 'cafes', path: '/admin/gol-kafeler', label: 'Şubeler & Gel-Al Durumu', section: 'Operasyon', description: 'Şube bilgileri ve Gel-Al geçici duraklatma/açma yönetimi.' },

  // MENÜ YÖNETİMİ
  { id: 'products', path: '/admin/menu', label: 'Menü ve Ürünler', section: 'Menü Yönetimi', description: 'Katalog ürünleri, kategoriler, fiyatlar ve stok durumları.' },

  // SADAKAT
  { id: 'points', path: '/admin/golpuan', label: 'GölPuan Defteri', section: 'Sadakat', description: 'Kazanç, harcama ve yetkili manuel puan düzeltmeleri.' },
  { id: 'rewards', path: '/admin/oduller', label: 'Ödül Kataloğu', section: 'Sadakat', description: 'GölPuan ile alınabilen katalog ödülleri ve kuponlar.' },

  // İÇERİK
  { id: 'campaigns', path: '/admin/kampanyalar', label: 'Kampanyalar', section: 'İçerik', description: 'Öne çıkan kampanya ve fırsat duyuruları.' },
  { id: 'events', path: '/admin/etkinlikler', label: 'Etkinlikler & Atölyeler', section: 'İçerik', description: 'Belediye etkinlik kayıtları, kontenjan ve zaman yönetimi.' },
  { id: 'missions', path: '/admin/gorevler', label: 'Görevler (Missions)', section: 'İçerik', description: 'Davranış hedefleri, görev kuralları ve ödül tanımları.' },
  { id: 'notifications', path: '/admin/bildirimler', label: 'Duyurular / Bildirimler', section: 'İçerik', description: 'Toplu push ve uygulama içi duyuru gönderimi.' },

  // YÖNETİM
  { id: 'reports', path: '/admin/raporlar', label: 'Raporlar', section: 'Yönetim', description: 'Şube performansı, tamamlanan siparişler ve sadakat raporları.' },
  { id: 'users', path: '/admin/vatandaslar', label: 'Vatandaş Hesabı Arama', section: 'Yönetim', description: 'Kullanıcı hesabı arama ve yetkili işlem kayıtları.' },
  { id: 'roles', path: '/admin/yetkilendirme', label: 'Personel Yetkilendirme', section: 'Yönetim', description: 'Şube personeli hesapları ve şube atamaları.' },
  { id: 'audit', path: '/admin/denetim', label: 'Denetim Kayıtları', section: 'Yönetim', description: 'Kritik sistem değişiklikleri ve yetkili işlem logları.' },
  { id: 'settings', path: '/admin/ayarlar', label: 'Sistem Ayarları', section: 'Yönetim', description: 'No-show kuralları ve varsayılan sistem parametreleri.' }
];

export const pathForMenu = (id: AdminMenuId) =>
  ADMIN_PATHS.find((p) => p.id === id)?.path || '/admin';

export const menuFromPath = (pathname: string): AdminMenuId => {
  const cleaned = pathname.replace(/\/$/, '') || '/admin';
  if (cleaned === '/admin') return 'overview';
  const match = ADMIN_PATHS
    .filter((p) => p.path !== '/admin')
    .sort((a, b) => b.path.length - a.path.length)
    .find((p) => cleaned === p.path || cleaned.startsWith(`${p.path}/`));
  return match?.id || 'overview';
};

export const canAccessMenu = (id: AdminMenuId, isAdmin: boolean) =>
  isAdmin || STAFF_MENU_IDS.includes(id);
