export type AdminMenuId =
  | 'overview'
  | 'users'
  | 'places'
  | 'cafes'
  | 'products'
  | 'points'
  | 'qr'
  | 'rewards'
  | 'fieldDrops'
  | 'ismarliyor'
  | 'homeContent'
  | 'campaigns'
  | 'events'
  | 'notifications'
  | 'reports'
  | 'roles'
  | 'audit'
  | 'settings';

export const STAFF_MENU_IDS: AdminMenuId[] = [
  'overview',
  'users',
  'cafes',
  'products',
  'qr',
  'fieldDrops',
  'ismarliyor'
];

export const ADMIN_PATHS: { id: AdminMenuId; path: string; label: string; section: string; description: string }[] = [
  { id: 'overview', path: '/admin', label: 'Genel Bakış', section: 'İşlem', description: 'Günlük özet, kritik kuyruk ve hızlı işlemler.' },
  { id: 'users', path: '/admin/vatandaslar', label: 'Vatandaşlar', section: 'İşlem', description: 'Arama, filtre ve GölPuan işlemleri.' },
  { id: 'places', path: '/admin/tesisler', label: 'Tesisler', section: 'İşlem', description: 'Belediye yerleri, konum ve çalışma saatleri.' },
  { id: 'cafes', path: '/admin/gol-kafeler', label: 'Göl Kafeler', section: 'İşlem', description: 'Menü ve Ismarlıyor operasyonu.' },
  { id: 'products', path: '/admin/menu', label: 'Menü ve Ürünler', section: 'İşlem', description: 'Kafe ürünleri, fiyat ve görünürlük.' },
  { id: 'points', path: '/admin/golpuan', label: 'GölPuan Defteri', section: 'Sadakat', description: 'Kazanç, harcama ve manuel işlem kayıtları.' },
  { id: 'qr', path: '/admin/qr', label: 'QR İşlemleri', section: 'Sadakat', description: 'Kasa: ziyaret, kupon ve GölPuan tahsilatı.' },
  { id: 'rewards', path: '/admin/oduller', label: 'Ödüller', section: 'Sadakat', description: 'Katalog fiyatı ve yayına alma.' },
  { id: 'fieldDrops', path: '/admin/saha-hediyeleri', label: 'Saha Hediyeleri', section: 'Sadakat', description: 'Konuma bırakılan GölPuan kutuları.' },
  { id: 'ismarliyor', path: '/admin/ismarliyor', label: 'Ismarlıyor', section: 'Sadakat', description: 'Bekliyor → Teslim akışı.' },
  { id: 'homeContent', path: '/admin/icerikler', label: 'Ana Sayfa İçerikleri', section: 'İletişim', description: 'Hero, duyuru ve başkan mesajı.' },
  { id: 'campaigns', path: '/admin/kampanyalar', label: 'Kampanya İçerikleri', section: 'İletişim', description: 'Uygulamada görünen duyurular. Otomatik indirim uygulamaz.' },
  { id: 'events', path: '/admin/etkinlikler', label: 'Etkinlikler', section: 'İletişim', description: 'Tarih, tesis ve katılım.' },
  { id: 'notifications', path: '/admin/bildirimler', label: 'Duyurular / Bildirimler', section: 'İletişim', description: 'Hedef kitle ve gönderim önizlemesi.' },
  { id: 'reports', path: '/admin/raporlar', label: 'Raporlar', section: 'Yönetim', description: 'Dönem özeti ve CSV indirme.' },
  { id: 'roles', path: '/admin/yetkilendirme', label: 'Yetkilendirme', section: 'Yönetim', description: 'Personel rolü ve hesap durumu.' },
  { id: 'audit', path: '/admin/denetim', label: 'Denetim', section: 'Yönetim', description: 'Kim, ne zaman, hangi işlemi yaptı.' },
  { id: 'settings', path: '/admin/ayarlar', label: 'Ayarlar', section: 'Yönetim', description: 'GölPuan ve kupon süreleri.' }
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
