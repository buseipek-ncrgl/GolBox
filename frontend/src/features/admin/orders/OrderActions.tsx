import React from 'react';
import { canonicalizeOrderStatus } from '../../../lib/adminLabels';
import { useAdminFeedback } from '../AdminFeedback';
import { api } from '../../../services/api';

export function OrderActions({ order, onChanged }: { order: any; onChanged: () => void }) {
  const { confirm, savingKey, setSavingKey, setError, setSuccess } = useAdminFeedback();
  const status = canonicalizeOrderStatus(order.status);
  const busy = savingKey === `order-${order.id}`;

  const run = async (next: string) => {
    setSavingKey(`order-${order.id}`);
    try {
      await api.updateOrderStatus(order.id, next);
      setSuccess('Sipariş durumu güncellendi.');
      onChanged();
    } catch (err: any) {
      setError(err.message || 'Sipariş güncellenemedi.');
    } finally {
      setSavingKey(null);
    }
  };

  const request = (next: string) => {
    if (next === 'Cancelled') {
      confirm({
        title: 'Siparişi iptal et',
        message: 'Bu sipariş iptal edilecek. Kullanılan GölPuan varsa iade işlemi uygulanacaktır. Devam edilsin mi?',
        confirmLabel: 'İptal Et',
        danger: true,
        onConfirm: () => run('Cancelled')
      });
      return;
    }
    if (next === 'Completed') {
      confirm({
        title: 'Teslim onayı',
        message: 'Bu siparişi teslim edilmiş olarak işaretlemek istiyor musunuz?',
        confirmLabel: 'Teslim Edildi',
        onConfirm: () => run('Completed')
      });
      return;
    }
    void run(next);
  };

  const btn = (label: string, next: string, danger = false) => (
    <button
      key={next}
      type="button"
      disabled={busy}
      onClick={() => request(next)}
      style={{ padding: '6px 12px', background: danger ? '#b91c1c' : '#1d5f60', border: 'none', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: busy ? 'not-allowed' : 'pointer' }}
    >
      {busy ? 'Kaydediliyor…' : label}
    </button>
  );

  if (status === 'Pending') return <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>{btn('Hazırlamaya Başla', 'Preparing')}{btn('İptal Et', 'Cancelled', true)}</div>;
  if (status === 'Preparing') return <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>{btn('Teslime Hazır', 'Ready')}{btn('İptal Et', 'Cancelled', true)}</div>;
  if (status === 'Ready') return <div style={{ display: 'flex', justifyContent: 'flex-end' }}>{btn('Teslim Edildi', 'Completed')}</div>;
  return null;
}
