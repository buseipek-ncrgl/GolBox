export const MAX_MANUAL_GP = 10000;
export const MAX_REWARD_GP = 100000;
export const MAX_ACTIVITY_REWARD_GP = 10000;
export const MIN_MANUAL_REASON = 3;

export const orderStatusLabel = (status?: string): string => {
  const key = String(status || '').trim().toLowerCase();
  const map: Record<string, string> = {
    pending: 'Bekliyor',
    submitted: 'Bekliyor',
    created: 'Bekliyor',
    preparing: 'Hazırlanıyor',
    approved: 'Hazırlanıyor',
    ready: 'Teslime Hazır',
    live: 'Teslime Hazır',
    completed: 'Tamamlandı',
    delivered: 'Tamamlandı',
    cancelled: 'İptal Edildi',
    canceled: 'İptal Edildi',
    rejected: 'İptal Edildi'
  };
  return map[key] || status || '—';
};

export const canonicalizeOrderStatus = (status?: string): string => {
  const key = String(status || '').trim().toLowerCase();
  if (['pending', 'submitted', 'created'].includes(key)) return 'Pending';
  if (['preparing', 'approved'].includes(key)) return 'Preparing';
  if (['ready', 'live'].includes(key)) return 'Ready';
  if (['completed', 'delivered'].includes(key)) return 'Completed';
  if (['cancelled', 'canceled', 'rejected'].includes(key)) return 'Cancelled';
  return status || 'Pending';
};

export const pointTypeLabel = (type?: string): string => {
  const map: Record<string, string> = {
    Earn: 'Kazanç',
    Spend: 'Harcama',
    ManualAddition: 'Manuel ekleme',
    ManualDeduction: 'Manuel düşüm',
    Visit: 'Ziyaret',
    Activity: 'Etkinlik',
    Redemption: 'Harcama',
    Refund: 'İade',
    Reversal: 'Ters kayıt',
    Reward: 'Ödül'
  };
  return (type && map[type]) || type || '—';
};

export const campaignAudienceLabel = (group?: string): string => {
  const map: Record<string, string> = {
    All: 'Tüm vatandaşlar',
    HighSchool: 'Lise',
    University: 'Üniversite',
    AgeGroup: 'Yaş grubu',
    AgeRange: 'Belirli yaş grubu',
    Students: 'Öğrenciler',
    Youth: 'Gençler',
    Seniors: 'Emekliler',
    EducationLevel: 'Öğrenim durumuna göre',
    SingleUser: 'Belirli vatandaş',
    Percentage: 'Duyuru',
    Announcement: 'Duyuru',
    Content: 'Duyuru'
  };
  return (group && map[group]) || group || 'Duyuru';
};

export const notificationGroupLabel = (group?: string): string => {
  const map: Record<string, string> = {
    All: 'Herkese',
    AgeRange: 'Belirli yaş grubu',
    AgeGroup: 'Belirli yaş grubu',
    EducationLevel: 'Öğrenim durumuna göre',
    HighSchool: 'Lise',
    University: 'Üniversite',
    SingleUser: 'Belirli vatandaş'
  };
  return (group && map[group]) || group || '—';
};

export const educationLabel = (value?: string | null): string => {
  if (!value) return '';
  if (value === 'HighSchool') return 'Lise';
  if (value === 'University' || value === 'Universite') return 'Üniversite';
  return value;
};

export const rewardStatusLabel = (status?: string): string => {
  if (!status) return 'Kayıtlı';
  if (status === 'Active') return 'Yayında';
  if (status === 'Passive' || status === 'Inactive') return 'Pasif';
  return status;
};

export const qrResultLabel = (result: any): string => {
  const earned = Number(result?.pointsEarned ?? 0);
  const deducted = Number(result?.pointsDeducted ?? 0);
  const op = String(result?.operation || '').toLowerCase();
  if (op.includes('cash') || op.includes('earn')) {
    return earned > 0
      ? `İşlem başarılı. Vatandaşa ${earned} GP kazandırıldı.`
      : 'İşlem başarılı. Harcama kaydı oluşturuldu.';
  }
  if (result?.couponTitle || result?.couponCode || op.includes('coupon') || op.includes('redeem')) {
    return 'Kupon başarıyla kullanıldı.';
  }
  if (deducted > 0) {
    return `İşlem başarılı. ${deducted} GP düşüldü.`;
  }
  if (String(result?.status || '').toLowerCase() === 'completed') {
    return 'İşlem başarıyla tamamlandı.';
  }
  return 'İşlem tamamlandı.';
};

export const NAV_TARGETS: { id: string; label: string; targetType: string; targetId: string }[] = [
  { id: 'none', label: 'Yönlendirme yok', targetType: 'None', targetId: '' },
  { id: 'home', label: 'Ana Sayfa', targetType: 'Route', targetId: 'home' },
  { id: 'activity', label: 'Etkinlik', targetType: 'Route', targetId: 'earn' },
  { id: 'place', label: 'Tesis', targetType: 'Route', targetId: 'places' },
  { id: 'cafe', label: 'Göl Kafe', targetType: 'Route', targetId: 'cafes' },
  { id: 'coupons', label: 'Kuponlarım', targetType: 'Route', targetId: 'coupons' },
  { id: 'map', label: 'GölBox Harita', targetType: 'Route', targetId: 'map' },
  { id: 'profile', label: 'Profil', targetType: 'Route', targetId: 'profile' }
];

export const qrOperationLabel = (op?: string): string => {
  const key = String(op || '').toLowerCase();
  if (key.includes('coupon') || key.includes('redeem')) return 'Kupon kullan';
  if (key.includes('points') || key.includes('payment')) return 'GölPuan ile ödeme';
  if (key.includes('visit')) return 'Ziyaret kaydı';
  if (key.includes('cash') || key.includes('earn')) return 'Nakit harcamadan GölPuan kazan';
  return op || 'Kasa işlemi';
};

export const auditActionLabel = (action?: string): string => {
  const map: Record<string, string> = {
    Point_Add: 'GölPuan eklendi',
    Point_Deduct: 'GölPuan düşüldü',
    Points_Grant: 'GölPuan tanımlandı',
    Reward_Create: 'Ödül oluşturuldu',
    Reward_Update: 'Ödül güncellendi',
    Reward_Deactivate: 'Ödül pasife alındı',
    Reward_Activate: 'Ödül yayına alındı',
    Reward_Delete: 'Ödül silindi',
    Qr_CashEarn: 'QR ile GölPuan kazanımı',
    Qr_PointsPayment: 'QR ile GölPuan ödemesi',
    Coupon_Redeem: 'Kupon kullanıldı',
    Order_Status: 'Sipariş durumu güncellendi',
    Campaign_Create: 'Kampanya içeriği oluşturuldu',
    Campaign_Update: 'Kampanya içeriği güncellendi',
    Campaign_Publish: 'Kampanya yayına alındı',
    Campaign_Unpublish: 'Kampanya yayından kaldırıldı',
    Cafe_Create: 'Kafe oluşturuldu',
    Cafe_Update: 'Kafe güncellendi',
    Activity_Create: 'Etkinlik oluşturuldu',
    Activity_Update: 'Etkinlik güncellendi',
    Activity_Publish: 'Etkinlik yayına alındı',
    Activity_Unpublish: 'Etkinlik taslağa alındı',
    Activity_Archive: 'Etkinlik arşivlendi',
    Menu_Create: 'Menü ürünü eklendi',
    Menu_Update: 'Menü ürünü güncellendi',
    Staff_Assigned: 'Personel atandı',
    Staff_RoleChange: 'Personel rolü değişti',
    Staff_Activate: 'Personel aktif edildi',
    Staff_Deactivate: 'Personel pasife alındı',
    Notification_Send: 'Bildirim gönderildi'
  };
  return (action && map[action]) || action || '—';
};

export const activityStatusLabel = (status?: string, start?: string, end?: string): string => {
  if (status === 'Draft') return 'Taslak';
  if (status === 'Archived' || status === 'Cancelled') return 'Arşiv';
  const now = Date.now();
  const s = start ? new Date(start).getTime() : 0;
  const e = end ? new Date(end).getTime() : 0;
  if (e && e < now) return 'Bitti';
  if (s && s > now) return 'Yaklaşan';
  if (s && e && s <= now && e >= now) return 'Devam ediyor';
  if (status === 'Active') return 'Yayında';
  return status || '—';
};

export const fieldDropStatusLabel = (drop: any): string => {
  const now = Date.now();
  const end = drop?.endsAt ? new Date(drop.endsAt).getTime() : 0;
  if (end && end < now) return 'Süresi doldu';
  if (drop?.isActive === false) return 'Durduruldu';
  return 'Aktif';
};

export const isCitizenRole = (role?: string) => {
  const value = String(role || '').toLowerCase();
  return value === 'user' || value === 'citizen';
};
