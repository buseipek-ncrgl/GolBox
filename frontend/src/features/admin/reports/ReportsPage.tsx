import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { formatDate, formatGp } from '../../../lib/adminDate';
import { Button, DateInput, ErrorState, Skeleton } from '../../../admin/components';
import { useAdminFeedback } from '../AdminFeedback';

export function ReportsPage() {
  const { setError } = useAdminFeedback();
  const [preset, setPreset] = useState('today');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fail, setFail] = useState<unknown>(null);

  const params = () => preset === 'custom' ? { preset: 'custom', from, to } : { preset };

  const load = async () => {
    setLoading(true);
    try {
      setData(await api.getReportsSummary(params()));
      setFail(null);
    } catch (err: any) {
      setFail(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { if (preset !== 'custom') void load(); }, [preset]);

  const cards = data ? [
    ['Yeni vatandaş', data.newCitizens],
    ['Kazanılan GP', formatGp(data.earnedPoints)],
    ['Harcanan GP', formatGp(data.spentPoints)],
    ['Sipariş sayısı', data.orderCount],
    ['Tamamlanan sipariş', data.completedOrders],
    ['İptal edilen sipariş', data.cancelledOrders],
    ['Kullanılan kupon', data.usedCoupons],
    ['GölBox toplama', data.fieldCaptures],
    ['Etkinlik katılımı', data.activityJoins],
    ['Aktif ödül', data.activeRewards]
  ] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'end' }}>
        {[['today', 'Bugün'], ['7d', 'Son 7 gün'], ['30d', 'Son 30 gün'], ['custom', 'Özel aralık']].map(([id, label]) => (
          <Button key={id} type="button" variant={preset === id ? 'primary' : 'secondary'} size="sm" onClick={() => setPreset(id)}>{label}</Button>
        ))}
        {preset === 'custom' && (
          <>
            <DateInput required label="Başlangıç Tarihi" value={from} onChange={(e) => setFrom(e.target.value)} />
            <DateInput required label="Bitiş Tarihi" value={to} onChange={(e) => setTo(e.target.value)} />
            <Button type="button" onClick={load}>Uygula</Button>
          </>
        )}
        <Button type="button" variant="secondary" onClick={async () => {
          const blob = await api.exportReport('orders', params());
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'golbox-rapor.csv';
          a.click();
        }}>CSV indir</Button>
      </div>
      {fail ? <ErrorState error={fail} retry={load} /> : null}
      {loading ? <Skeleton variant="card" /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
          {cards.map(([label, value]) => (
            <div key={String(label)} className="admin-card">
              <div className="admin-kpi-label">{label}</div>
              <div className="admin-kpi-value" style={{ fontSize: 26 }}>{value ?? 0}</div>
            </div>
          ))}
        </div>
      )}
      {data && <div className="admin-muted" style={{ fontSize: 13 }}>Aralık (Europe/Istanbul): {formatDate(data.from)} – {formatDate(data.to)}</div>}
    </div>
  );
}
