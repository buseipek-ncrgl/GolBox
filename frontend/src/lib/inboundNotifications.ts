export interface InboundNotification {
  id: string;
  title: string;
  message: string;
  category: 'Sipariş' | 'Stok & İkram' | 'Onay Talepleri' | 'Sistem';
  time: string;
  isRead: boolean;
}

const STORAGE_KEY = 'golbox_admin_inbound_notifs';

export const INITIAL_INBOUND_NOTIFICATIONS: InboundNotification[] = [
  {
    id: 'inbound-1',
    title: 'Bekleyen Sipariş Operasyonu',
    message: 'Şehitkamil Kitap Kafe için 1 yeni sipariş hazırlanmayı bekliyor.',
    category: 'Sipariş',
    time: '10 dk önce',
    isRead: false,
  },
  {
    id: 'inbound-2',
    title: 'Ismarlıyor Kampanya Kotası',
    message: '"500 Üniversite Öğrencisine Soğuk Kahve" ikramında stok %85 doluluğa ulaştı (425/500).',
    category: 'Stok & İkram',
    time: '35 dk önce',
    isRead: false,
  },
  {
    id: 'inbound-3',
    title: 'Onay Bekleyen GölPuan Talebi',
    message: 'Ahmet Yılmaz kullanıcısı için 250 GölPuan manuel yükleme talebi onay bekliyor.',
    category: 'Onay Talepleri',
    time: '2 saat önce',
    isRead: true,
  },
  {
    id: 'inbound-4',
    title: 'SignalR & Mobil Hub Durumu',
    message: 'Tüm mobil bildirim soketleri ve API servisleri aktif çalışıyor.',
    category: 'Sistem',
    time: 'Bugün 08:30',
    isRead: true,
  },
];

export function getInboundNotifications(): InboundNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_INBOUND_NOTIFICATIONS));
      return INITIAL_INBOUND_NOTIFICATIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_INBOUND_NOTIFICATIONS;
  }
}

export function saveInboundNotifications(list: InboundNotification[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function markInboundAsRead(id: string): InboundNotification[] {
  const current = getInboundNotifications();
  const updated = current.map((item) => (item.id === id ? { ...item, isRead: true } : item));
  saveInboundNotifications(updated);
  return updated;
}

export function deleteInboundNotification(id: string): InboundNotification[] {
  const current = getInboundNotifications();
  const updated = current.filter((item) => item.id !== id);
  saveInboundNotifications(updated);
  return updated;
}

export function markAllInboundAsRead(): InboundNotification[] {
  const current = getInboundNotifications();
  const updated = current.map((item) => ({ ...item, isRead: true }));
  saveInboundNotifications(updated);
  return updated;
}
