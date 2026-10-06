import React, { useState } from 'react';
import { canonicalizeOrderStatus } from '../../../lib/adminLabels';
import { useAdminFeedback } from '../AdminFeedback';
import { api } from '../../../services/api';
import { Button, Modal, Textarea } from '../../../admin/components';

export function OrderActions({ order, onChanged }: { order: any; onChanged: () => void }) {
  const { confirm, savingKey, setSavingKey, setError, setSuccess } = useAdminFeedback();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const status = canonicalizeOrderStatus(order.status);
  const busy = savingKey === `order-${order.id}`;

  const run = async (next: string, reason?: string) => {
    setSavingKey(`order-${order.id}`);
    try {
      await api.updateOrderStatus(order.id, next, reason);
      setSuccess('Sipariş durumu güncellendi.');
      setCancelOpen(false);
      setCancelReason('');
      onChanged();
    } catch (err: any) {
      setError(err.message || 'Sipariş güncellenemedi.');
    } finally {
      setSavingKey(null);
    }
  };

  const request = (next: string) => {
    if (next === 'Cancelled') {
      setCancelOpen(true);
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

  const dialog = <Modal open={cancelOpen} title="Siparişi iptal et" size="sm" onClose={() => setCancelOpen(false)} footer={<><Button variant="secondary" onClick={() => setCancelOpen(false)}>Vazgeç</Button><Button variant="danger" loading={busy} disabled={!cancelReason.trim()} onClick={() => void run('Cancelled', cancelReason)}>Siparişi İptal Et</Button></>}>
    <div style={{ display: 'grid', gap: 12 }}><p className="admin-muted" style={{ margin: 0 }}>İptal nedeni operasyon kaydında saklanır. GölPuan ile ödenmişse kullanılan puan otomatik iade edilir.</p><Textarea label="İptal nedeni" required value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} placeholder="Örn. ürün mevcut değil" /></div>
  </Modal>;

  if (status === 'Pending') return <><div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>{next('Hazırlamaya Başla', 'Preparing')}{cancel}</div>{dialog}</>;
  if (status === 'Preparing') return <><div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>{next('Teslime Hazır', 'Ready')}{cancel}</div>{dialog}</>;
  if (status === 'Ready') return <><div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>{next('Teslim Edildi', 'Completed')}{cancel}</div>{dialog}</>;
  return null;
}
