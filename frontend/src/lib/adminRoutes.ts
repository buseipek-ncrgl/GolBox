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

export const ADMIN_PATHS: { id: AdminMenuId; path: string; label: string; section: string }[] = [
  { id: 'overview', path: '/admin', label: 'Genel Bakış', section: 'İşlem' },
  { id: 'users', path: '/admin/vatandaslar', label: 'Vatandaşlar', section: 'İşlem' },
  { id: 'places', path: '/admin/tesisler', label: 'Tesisler', section: 'İşlem' },
  { id: 'cafes', path: '/admin/gol-kafeler', label: 'Göl Kafeler', section: 'İşlem' },
  { id: 'products', path: '/admin/menu', label: 'Menü ve Ürünler', section: 'İşlem' },
  { id: 'points', path: '/admin/golpuan', label: 'GölPuan Defteri', section: 'Sadakat' },
  { id: 'qr', path: '/admin/qr', label: 'QR İşlemleri', section: 'Sadakat' },
  { id: 'rewards', path: '/admin/oduller', label: 'Ödüller', section: 'Sadakat' },
  { id: 'fieldDrops', path: '/admin/saha-hediyeleri', label: 'Saha Hediyeleri', section: 'Sadakat' },
  { id: 'ismarliyor', path: '/admin/ismarliyor', label: 'Ismarlıyor', section: 'Sadakat' },
  { id: 'homeContent', path: '/admin/icerikler', label: 'Ana Sayfa İçerikleri', section: 'İletişim' },
  { id: 'campaigns', path: '/admin/kampanyalar', label: 'Kampanya İçerikleri', section: 'İletişim' },
  { id: 'events', path: '/admin/etkinlikler', label: 'Etkinlikler', section: 'İletişim' },
  { id: 'notifications', path: '/admin/bildirimler', label: 'Duyurular / Bildirimler', section: 'İletişim' },
  { id: 'reports', path: '/admin/raporlar', label: 'Raporlar', section: 'Yönetim' },
  { id: 'roles', path: '/admin/yetkilendirme', label: 'Yetkilendirme', section: 'Yönetim' },
  { id: 'audit', path: '/admin/denetim', label: 'Denetim', section: 'Yönetim' },
  { id: 'settings', path: '/admin/ayarlar', label: 'Ayarlar', section: 'Yönetim' }
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
