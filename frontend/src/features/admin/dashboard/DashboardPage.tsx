import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Calendar, CreditCard, Gift, MapPin } from 'lucide-react';
import { api } from '../../../services/api';
import { extractArray } from '../../../lib/adminQuery';
import { canonicalizeOrderStatus, orderStatusLabel } from '../../../lib/adminLabels';
import { formatDateTime, formatGp } from '../../../lib/adminDate';
import { ErrorState, Skeleton } from '../../../admin/components';
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

  if (loading) return <Skeleton variant="card" />;
  if (fail) return <ErrorState description={fail} retry={load} />;

  const metrics = data?.metrics || {};
  const alerts = data?.alerts || {};
  const kpis = [
    { label: 'Vatandaş', value: data?.totalUsers ?? metrics.registeredCitizensCount ?? 0, to: '/admin/vatandaslar' },
    { label: 'Bugün kazanılan', value: formatGp(data?.todayEarnedPoints ?? metrics.todayEarnedPoints ?? 0), to: isAdmin ? '/admin/golpuan' : '/admin/qr' },
    { label: 'Bugün harcanan', value: formatGp(data?.todaySpentPoints ?? metrics.todaySpentPoints ?? 0), to: isAdmin ? '/admin/golpuan' : '/admin/qr' },
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
    ...extractArray(alerts.highValuePointTransactions).map((t: any) => ({ id: t.id, text: `Yüksek GP: ${t.userFullName} ${formatGp(t.amount)}`, to: isAdmin ? '/admin/golpuan' : '/admin/qr' })),
    ...longPending.map((o: any) => ({ id: o.id, text: `Uzun bekleyen sipariş ${o.collectionCode}`, to: '/admin/ismarliyor' })),
    ...lowStock.map((d: any) => ({ id: d.id, text: `Kritik stok: ${d.title}`, to: '/admin/saha-hediyeleri' }))
  ];
  const pendingRows = orders.filter((o) => ['Pending', 'Preparing', 'Ready'].includes(canonicalizeOrderStatus(o.status)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="admin-kpi-grid">
        {kpis.map((kpi) => (
          <Link key={kpi.label} to={kpi.to} className="admin-kpi">
            <div className="admin-kpi-label">{kpi.label}</div>
            <div className="admin-kpi-value">{kpi.value}</div>
          </Link>
        ))}
      </div>

      <div className="admin-split" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(240px,1fr)', gap: 16 }}>
        <div className="admin-card">
          <h2 style={{ margin: '0 0 12px', fontSize: 18 }}>Kritik kuyruk</h2>
          {pendingRows.length === 0 ? <p className="admin-muted">Bekleyen kayıt yok.</p> : pendingRows.slice(0, 6).map((o) => (
            <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: 14 }}>
              <div>
                <strong>{o.collectionCode}</strong> · {o.userFullName} · {orderStatusLabel(o.status)}
              </div>
              <OrderActions order={o} onChanged={load} />
            </div>
          ))}
        </div>
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Hızlı işlemler</h2>
          <Link to="/admin/ismarliyor" className="admin-btn admin-btn-primary admin-btn-md" style={{ textDecoration: 'none' }}><Gift size={18} /> Ismarlıyor</Link>
          <Link to="/admin/qr" className="admin-btn admin-btn-secondary admin-btn-md" style={{ textDecoration: 'none' }}><CreditCard size={18} /> QR işlemleri</Link>
          <Link to="/admin/saha-hediyeleri" className="admin-btn admin-btn-secondary admin-btn-md" style={{ textDecoration: 'none' }}><MapPin size={18} /> Saha hediyeleri</Link>
          {isAdmin && <Link to="/admin/oduller" className="admin-btn admin-btn-secondary admin-btn-md" style={{ textDecoration: 'none' }}><Award size={18} /> Ödüller</Link>}
          {isAdmin && <Link to="/admin/icerikler" className="admin-btn admin-btn-secondary admin-btn-md" style={{ textDecoration: 'none' }}><Calendar size={18} /> İçerikler</Link>}
          {isAdmin && <Link to="/admin/raporlar" className="admin-btn admin-btn-secondary admin-btn-md" style={{ textDecoration: 'none' }}>Raporlar</Link>}
        </div>
      </div>

      <div className="admin-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Block title="Uzun süredir bekleyen sipariş" empty="Kritik bekleyen sipariş yok." items={longPending.map((o: any) => ({ id: o.id, to: '/admin/ismarliyor', text: `${o.collectionCode} · ${o.userFullName} · ${formatDateTime(o.createdDate)}` }))} />
        <Block title="Bugünkü etkinlik" empty="Bugün etkinlik yok." items={todayActivities.map((a: any) => ({ id: a.id, to: isAdmin ? '/admin/etkinlikler' : '/admin', text: `${a.title} · ${formatDateTime(a.startDate)}` }))} />
        <Block title="Aktif saha hediyesi" empty="Aktif saha hediyesi yok." items={activeDrops.map((d: any) => ({ id: d.id, to: '/admin/saha-hediyeleri', text: `${d.title} · kalan ${d.remainingStock ?? '—'}` }))} />
        <Block title="Operasyon uyarıları" empty="Okunacak operasyon uyarısı yok." items={opAlerts.slice(0, 8)} />
      </div>
    </div>
  );
}

function Block({ title, empty, items }: { title: string; empty: string; items: { id: string; to: string; text: string }[] }) {
  return (
    <div className="admin-card">
      <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>{title}</h2>
      {items.length === 0 ? <p className="admin-muted">{empty}</p> : items.map((a) => (
        <Link key={a.id} to={a.to} style={{ display: 'block', fontSize: 14, padding: '6px 0', color: 'inherit' }}>{a.text}</Link>
      ))}
    </div>
  );
}
