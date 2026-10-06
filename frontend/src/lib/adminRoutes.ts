export type AdminMenuId =
  | 'overview'
  | 'orders'
  | 'ismarliyor'
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
  'ismarliyor',
  'qr',
  'eventCheckin',
  'products',
  'cafes'
];

const DUTY_MENU_IDS: Record<string, AdminMenuId[]> = {
  BranchManager: ['orders', 'ismarliyor', 'qr', 'eventCheckin', 'products', 'cafes'],
  BranchStaff: ['orders', 'ismarliyor', 'qr', 'products', 'cafes'],
  Cashier: ['qr', 'cafes'],
  OrderPreparer: ['orders', 'ismarliyor', 'products', 'cafes'],
  EventCoordinator: ['eventCheckin', 'cafes'],
  ReportingUser: ['cafes'],
};

export const ADMIN_PATHS: { id: AdminMenuId; path: string; label: string; section: string; description: string }[] = [
  // ADMIN DASHBOARD
  { id: 'overview', path: '/admin', label: 'Genel Bakış', section: 'Genel', description: 'GölBOX genel durum, aktif siparişler ve operasyon metrikleri.' },

  // OPERASYON (STAFF & ADMIN)
  { id: 'orders', path: '/admin/siparisler', label: 'Sipariş Operasyonu', section: 'Operasyon', description: 'Canlı sipariş kuyruğu: Kabul, Hazırlanıyor, Hazır ve Teslim.' },
  { id: 'ismarliyor', path: '/admin/ismarliyor', label: 'Ismarlıyor (İkram Yönetimi)', section: 'Operasyon', description: 'Sponsorlu ikram kampanyaları, stok kontenjanı ve sipariş takibi.' },
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
  { id: 'missions', path: '/admin/gorevler', label: 'Görevler', section: 'İçerik', description: 'Davranış hedefleri, görev kuralları ve ödül tanımları.' },
  { id: 'notifications', path: '/admin/bildirimler', label: 'Duyurular / Bildirimler', section: 'İçerik', description: 'Toplu push ve uygulama içi duyuru gönderimi.' },

  // YÖNETİM
  { id: 'reports', path: '/admin/raporlar', label: 'Operasyon Raporları', section: 'Yönetim', description: 'Satış, şube performansı, puan ve vatandaş kullanım analizleri.' },
  { id: 'users', path: '/admin/vatandaslar', label: 'Vatandaşlar', section: 'Yönetim', description: 'Kayıtlı vatandaşlar, profil bilgileri ve durumları.' },
  { id: 'roles', path: '/admin/yetkilendirme', label: 'Sistem Yetkileri', section: 'Yönetim', description: 'Rol matrisi ve personel yetki sınırları.' },
  { id: 'audit', path: '/admin/denetim', label: 'Denetim İzi (Audit Log)', section: 'Yönetim', description: 'Kritik sistem eylemleri ve yetkili müdahale kayıtları.' },
  { id: 'settings', path: '/admin/ayarlar', label: 'Sistem Ayarları', section: 'Yönetim', description: 'GölPuan parametreleri, süreler ve genel yapılandırma.' },
];

export function menuFromPath(pathname: string): AdminMenuId {
  const match = ADMIN_PATHS.find((p) => p.path === pathname || (p.path !== '/admin' && pathname.startsWith(p.path)));
  return match?.id || 'overview';
}

export function canAccessMenu(id: AdminMenuId, isAdmin: boolean, duty?: string | null): boolean {
  if (isAdmin) return true;
  if (duty && DUTY_MENU_IDS[duty]?.includes(id)) return true;
  return STAFF_MENU_IDS.includes(id);
}
