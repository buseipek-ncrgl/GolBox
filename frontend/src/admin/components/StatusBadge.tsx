import React from 'react';

const MAP: Record<string, { label: string; tone: string }> = {
  Pending: { label: 'Bekliyor', tone: 'warning' },
  Preparing: { label: 'Hazırlanıyor', tone: 'info' },
  Ready: { label: 'Teslime Hazır', tone: 'info' },
  Completed: { label: 'Tamamlandı', tone: 'success' },
  Cancelled: { label: 'İptal Edildi', tone: 'danger' },
  Active: { label: 'Aktif', tone: 'success' },
  Inactive: { label: 'Pasif', tone: 'neutral' },
  Passive: { label: 'Pasif', tone: 'neutral' },
  Published: { label: 'Yayında', tone: 'success' },
  Draft: { label: 'Taslak', tone: 'neutral' },
  Archived: { label: 'Arşivlendi', tone: 'neutral' },
  Admin: { label: 'Yönetici', tone: 'info' },
  Staff: { label: 'Personel', tone: 'neutral' }
};

export function StatusBadge({ status, label }: { status?: string; label?: string }) {
  const mapped = MAP[String(status || '')] || { label: label || status || '—', tone: 'neutral' };
  return <span className={`admin-badge admin-badge-${mapped.tone}`}>{label || mapped.label}</span>;
}
