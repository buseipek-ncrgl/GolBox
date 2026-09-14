import React from 'react';
import { canonicalizeOrderStatus } from '../../../lib/adminLabels';
import { useAdminFeedback } from '../AdminFeedback';
import { api } from '../../../services/api';
import { Button } from '../../../admin/components';

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

  const next = (label: string, statusNext: string) => (
    <Button key={statusNext} size="sm" data-testid="order-next-action" loading={busy} onClick={() => request(statusNext)}>{label}</Button>
  );
  const cancel = (
    <Button key="cancel" size="sm" variant="danger" data-testid="order-cancel-action" loading={busy} onClick={() => request('Cancelled')}>İptal Et</Button>
  );

  if (status === 'Pending') return <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>{next('Hazırlamaya Başla', 'Preparing')}{cancel}</div>;
  if (status === 'Preparing') return <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>{next('Teslime Hazır', 'Ready')}{cancel}</div>;
  if (status === 'Ready') return <div style={{ display: 'flex', justifyContent: 'flex-end' }}>{next('Teslim Edildi', 'Completed')}</div>;
  return null;
}
