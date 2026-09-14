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
    ManualAddition: 'Manuel ekleme',
    ManualDeduction: 'Manuel düşüm',
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

export const isCitizenRole = (role?: string) => {
  const value = String(role || '').toLowerCase();
  return value === 'user' || value === 'citizen';
};
