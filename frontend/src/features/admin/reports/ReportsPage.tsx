import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { formatDate } from '../../../lib/adminDate';
import { ListError } from '../../../components/admin/FilterBar';
import { AdminSkeletonCard } from '../../../components/admin/AdminSkeleton';
import { btnPrimary, inputStyle } from '../../../components/admin/adminUi';
import { useAdminFeedback } from '../AdminFeedback';

export function ReportsPage() {
  const { setError } = useAdminFeedback();
  const [preset, setPreset] = useState('today');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fail, setFail] = useState<string | null>(null);

  const params = () => preset === 'custom' ? { preset: 'custom', from, to } : { preset };

  const load = async () => {
    setLoading(true);
    try {
      setData(await api.getReportsSummary(params()));
      setFail(null);
    } catch (err: any) {
      setFail(err.message || 'Rapor yüklenemedi.');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { if (preset !== 'custom') void load(); }, [preset]);

  const cards = data ? [
    ['Yeni vatandaş', data.newCitizens],
    ['Kazanılan GP', data.earnedPoints],
    ['Harcanan GP', data.spentPoints],
    ['Sipariş sayısı', data.orderCount],
    ['Tamamlanan sipariş', data.completedOrders],
    ['İptal edilen sipariş', data.cancelledOrders],
    ['Kullanılan kupon', data.usedCoupons],
    ['GölBox capture', data.fieldCaptures],
    ['Etkinlik katılımı', data.activityJoins],
    ['Aktif ödül', data.activeRewards]
  ] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['today', 'Bugün'], ['7d', 'Son 7 gün'], ['30d', 'Son 30 gün'], ['custom', 'Özel aralık']].map(([id, label]) => (
          <button key={id} type="button" onClick={() => setPreset(id)} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: preset === id ? '#1d5f60' : '#fff', color: preset === id ? '#fff' : '#334155', fontWeight: 700 }}>{label}</button>
        ))}
        {preset === 'custom' && (
          <>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={inputStyle} />
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={inputStyle} />
            <button type="button" style={btnPrimary} onClick={load}>Uygula</button>
          </>
        )}
        <button type="button" style={btnPrimary} onClick={async () => {
          const blob = await api.exportReport('orders', params());
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'golbox-rapor.csv';
          a.click();
        }}>CSV indir</button>
      </div>
      {fail && <ListError message={fail} onRetry={load} />}
      {loading ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>{[1,2,3,4].map((n) => <AdminSkeletonCard key={n} />)}</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
          {cards.map(([label, value]) => (
            <div key={String(label)} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16 }}>
              <div style={{ fontSize: 12, color: '#1d5f60', fontWeight: 800 }}>{label}</div>
              <div style={{ fontSize: 26, fontWeight: 800 }}>{value ?? 0}</div>
            </div>
          ))}
        </div>
      )}
      {data && <div style={{ color: '#64748b', fontSize: 13 }}>Aralık: {formatDate(data.from)} – {formatDate(data.to)}</div>}
    </div>
  );
}
