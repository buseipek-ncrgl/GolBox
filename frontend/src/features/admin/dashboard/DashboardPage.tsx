import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Calendar, CreditCard, Gift, MapPin } from 'lucide-react';
import { api } from '../../../services/api';
import { extractArray } from '../../../lib/adminQuery';
import { canonicalizeOrderStatus, orderStatusLabel } from '../../../lib/adminLabels';
import { formatDateTime } from '../../../lib/adminDate';
import { AdminSkeletonCard } from '../../../components/admin/AdminSkeleton';
import { ListError } from '../../../components/admin/FilterBar';
import { useAdminFeedback } from '../AdminFeedback';
import { OrderActions } from '../orders/OrderActions';

export function DashboardPage() {
  const { isAdmin, setError } = useAdminFeedback();
  const [data, setData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fail, setFail] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setFail(null);
    try {
      const [overview, pending] = await Promise.all([
        api.getDashboardOverview(),
        api.getOrders({ status: 'Pending', page: 1, pageSize: 8 }).catch(() => ({ items: [] }))
      ]);
      setData(overview);
      setOrders(extractArray(pending));
    } catch (err: any) {
      setFail(err.message || 'Özet yüklenemedi.');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  if (loading) {
    return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>{[1, 2, 3, 4].map((n) => <AdminSkeletonCard key={n} />)}</div>;
  }
  if (fail) return <ListError message={fail} onRetry={load} />;

  const metrics = data?.metrics || {};
  const alerts = data?.alerts || {};
  const kpis = [
    { label: 'Vatandaş', value: data?.totalUsers ?? metrics.registeredCitizensCount ?? 0, to: '/admin/vatandaslar' },
    { label: 'Bugün kazanılan GP', value: `${data?.todayEarnedPoints ?? metrics.todayEarnedPoints ?? 0} GP`, to: isAdmin ? '/admin/golpuan' : '/admin/qr' },
    { label: 'Bugün harcanan GP', value: `${data?.todaySpentPoints ?? metrics.todaySpentPoints ?? 0} GP`, to: isAdmin ? '/admin/golpuan' : '/admin/qr' },
    { label: 'Bekleyen Ismarlıyor', value: data?.pendingOrders ?? metrics.pendingOrdersCount ?? 0, to: '/admin/ismarliyor' },
    { label: 'Bugünkü işlem', value: data?.todayOrders ?? metrics.todayOrdersCount ?? 0, to: '/admin/ismarliyor' },
    { label: 'Aktif saha hediyesi', value: data?.activeFieldDropsCount ?? 0, to: '/admin/saha-hediyeleri' }
  ];

  const longPending = extractArray(alerts.longPendingOrders);
  const todayActivities = extractArray(alerts.todayActivities);
  const lowStock = extractArray(alerts.lowStockFieldDrops);
  const activeDrops = extractArray(alerts.activeFieldDrops);
  const opAlerts = [
    ...extractArray(alerts.criticalApprovals).map((a: any) => ({ id: a.id, text: `Onay: ${a.requestType || a.reason}`, to: '/admin' })),
    ...extractArray(alerts.highValuePointTransactions).map((t: any) => ({ id: t.id, text: `Yüksek GP: ${t.userFullName} ${t.amount} GP`, to: isAdmin ? '/admin/golpuan' : '/admin/qr' })),
    ...longPending.map((o: any) => ({ id: o.id, text: `Uzun bekleyen sipariş ${o.collectionCode}`, to: '/admin/ismarliyor' })),
    ...lowStock.map((d: any) => ({ id: d.id, text: `Kritik stok: ${d.title}`, to: '/admin/saha-hediyeleri' }))
  ];
  const pendingRows = orders.filter((o) => ['Pending', 'Preparing', 'Ready'].includes(canonicalizeOrderStatus(o.status)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        {kpis.map((kpi) => (
          <Link key={kpi.label} to={kpi.to} style={{ textDecoration: 'none', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.25rem', color: 'inherit' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#1d5f60', textTransform: 'uppercase' }}>{kpi.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>{kpi.value}</div>
          </Link>
        ))}
      </div>

      <div className="admin-split" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(240px,1fr)', gap: 16 }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20 }}>
          <h3 style={{ margin: '0 0 12px' }}>Bekleyen Ismarlıyor</h3>
          {pendingRows.length === 0 ? <p style={{ color: '#64748b' }}>Bekleyen kayıt yok.</p> : pendingRows.slice(0, 6).map((o) => (
            <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: 14 }}>
              <div>
                <strong>{o.collectionCode}</strong> · {o.userFullName} · {orderStatusLabel(o.status)}
              </div>
              <OrderActions order={o} onChanged={load} />
            </div>
          ))}
        </div>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ margin: 0 }}>Kısayollar</h3>
          <Link to="/admin/ismarliyor" style={{ ...shortcut }}><Gift size={18} /> Yeni Ismarlıyor</Link>
          <Link to="/admin/qr" style={{ ...shortcut, background: '#fff', color: '#0f172a', border: '1px solid #cbd5e1' }}><CreditCard size={18} /> QR işlemleri</Link>
          <Link to="/admin/saha-hediyeleri" style={{ ...shortcut, background: '#fff', color: '#0f172a', border: '1px solid #cbd5e1' }}><MapPin size={18} /> Saha hediyeleri</Link>
          {isAdmin && <Link to="/admin/oduller" style={{ ...shortcut, background: '#fff', color: '#0f172a', border: '1px solid #cbd5e1' }}><Award size={18} /> Ödüller</Link>}
          {isAdmin && <Link to="/admin/icerikler" style={{ ...shortcut, background: '#fff', color: '#0f172a', border: '1px solid #cbd5e1' }}><Calendar size={18} /> CMS / içerikler</Link>}
          {isAdmin && <Link to="/admin/raporlar" style={{ ...shortcut, background: '#fff', color: '#0f172a', border: '1px solid #cbd5e1' }}><Award size={18} /> Raporlar</Link>}
          {isAdmin && <Link to="/admin/ayarlar" style={{ ...shortcut, background: '#fff', color: '#0f172a', border: '1px solid #cbd5e1' }}>Ayarlar</Link>}
        </div>
      </div>

      <div className="admin-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20 }}>
          <h3 style={{ margin: '0 0 8px' }}>Uzun süredir bekleyen sipariş</h3>
          {longPending.length === 0 ? <p style={{ color: '#64748b' }}>Kritik bekleyen sipariş yok.</p> : longPending.map((o: any) => (
            <Link key={o.id} to="/admin/ismarliyor" style={{ display: 'block', fontSize: 14, padding: '6px 0', color: 'inherit' }}>{o.collectionCode} · {o.userFullName} · {formatDateTime(o.createdDate)}</Link>
          ))}
        </div>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20 }}>
          <h3 style={{ margin: '0 0 8px' }}>Bugünkü etkinlik</h3>
          {todayActivities.length === 0 ? <p style={{ color: '#64748b' }}>Bugün etkinlik yok.</p> : todayActivities.map((a: any) => (
            <Link key={a.id} to={isAdmin ? '/admin/etkinlikler' : '/admin'} style={{ display: 'block', fontSize: 14, padding: '6px 0', color: 'inherit' }}>{a.title} · {formatDateTime(a.startDate)}</Link>
          ))}
        </div>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20 }}>
          <h3 style={{ margin: '0 0 8px' }}>Aktif saha hediyesi</h3>
          {activeDrops.length === 0 ? <p style={{ color: '#64748b' }}>Aktif saha hediyesi yok.</p> : activeDrops.map((d: any) => (
            <Link key={d.id} to="/admin/saha-hediyeleri" style={{ display: 'block', fontSize: 14, padding: '6px 0', color: 'inherit' }}>{d.title} · kalan {d.remainingStock ?? '—'}</Link>
          ))}
        </div>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20 }}>
          <h3 style={{ margin: '0 0 8px' }}>Operasyon uyarıları</h3>
          {opAlerts.length === 0 ? <p style={{ color: '#64748b' }}>Okunacak operasyon uyarısı yok.</p> : opAlerts.slice(0, 8).map((a) => (
            <Link key={a.id} to={a.to} style={{ display: 'block', fontSize: 14, padding: '6px 0', color: 'inherit' }}>{a.text}</Link>
          ))}
        </div>
      </div>
    </div>
  );
}

const shortcut: React.CSSProperties = {
  padding: '0.75rem',
  background: '#1d5f60',
  color: '#fff',
  borderRadius: 10,
  fontWeight: 700,
  textDecoration: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: 8
};
