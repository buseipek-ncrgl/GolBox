import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, Building2, Calendar, CreditCard, Gift, ShoppingBag, CheckCircle, DollarSign, Clock, MapPin, Users } from 'lucide-react';
import { api, httpErrorCode } from '../../../services/api';
import { extractArray } from '../../../lib/adminQuery';
import { CRITICAL_ORDER_MINUTES, formatCurrency, formatGp } from '../../../lib/adminDate';
import { ErrorState, Skeleton, StatusBadge } from '../../../admin/components';
import { useAdminFeedback } from '../AdminFeedback';
import { OrderActions } from '../orders/OrderActions';

export function DashboardPage() {
  const { setError } = useAdminFeedback();
  const [data, setData] = useState<any>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [dateRange, setDateRange] = useState<'today' | '7d' | '30d'>('today');
  const [loading, setLoading] = useState(true);
  const [fail, setFail] = useState<unknown>(null);

  const load = async () => {
    setLoading(true);
    setFail(null);
    try {
      const [overviewRes, reportRes] = await Promise.all([
        api.getDashboardOverview(),
        api.getReportsSummary({ preset: dateRange }),
      ]);
      setData(overviewRes);
      setReportData(reportRes);
    } catch (err: any) {
      setFail(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [dateRange]);

  if (loading) return <Skeleton variant="card" />;
  if (fail) return <ErrorState error={fail} code={httpErrorCode(fail)} retry={load} />;

  const metrics = data?.metrics || {};
  const alerts = data?.alerts || {};
  const critical = extractArray(alerts.longPendingOrders || alerts.criticalOrders);

  const totalOrders = reportData?.orderCount ?? 0;
  const completedOrders = reportData?.completedOrders ?? 0;
  const salesRevenue = reportData?.grossRevenue ?? 0;
  const topProducts = extractArray(reportData?.topProducts);
  const topCafes = extractArray(reportData?.branchPerformance);

  const primaryKpis = [
    { id: 'kpi-total-orders', label: 'Toplam Sipariş', value: totalOrders, icon: ShoppingBag, color: '#047857', to: '/admin/siparisler' },
    { id: 'kpi-completed-orders', label: 'Tamamlanan Sipariş', value: completedOrders, icon: CheckCircle, color: '#059669', to: '/admin/siparisler' },
    { id: 'kpi-active-orders', label: 'Aktif Sipariş', value: metrics.activeOrdersCount ?? 0, icon: Clock, color: '#b45309', to: '/admin/siparisler' },
    { id: 'kpi-active-ismarliyor', label: 'Aktif Ismarlıyor', value: metrics.activeIsmarliyorCount ?? metrics.activeOrdersCount ?? 0, icon: Gift, color: '#0284c7', to: '/admin/ismarliyor' },
    { id: 'kpi-recorded-sales', label: 'Tamamlanan Satış', value: formatCurrency(salesRevenue), icon: DollarSign, color: '#0d9488', to: '/admin/raporlar' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Date Range & Quick Actions Toolbar */}
      <div className="overview-hero">
        <div>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
            Sipariş, satış, şube ve sadakat verilerinin güncel özeti
          </p>
        </div>

        <div className="overview-range">
          {[
            { id: 'today', label: 'Bugün' },
            { id: '7d', label: 'Son 7 Gün' },
            { id: '30d', label: 'Son 30 Gün' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setDateRange(item.id as 'today' | '7d' | '30d')}
              className={`admin-btn ${dateRange === item.id ? 'admin-btn-primary' : 'admin-btn-secondary'} admin-btn-sm`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overview-secondary">
        <Link to="/admin/vatandaslar"><Users size={17} /><span><small>Kayıtlı vatandaş</small><strong>{metrics.registeredCitizensCount ?? 0}</strong></span></Link>
        <Link to="/admin/gol-kafeler"><Building2 size={17} /><span><small>Aktif şube</small><strong>{metrics.activeBranchesCount ?? 0}</strong></span></Link>
        <Link to="/admin/golpuan"><Activity size={17} /><span><small>Bugün kazanılan</small><strong>{formatGp(metrics.todayEarnedPoints ?? 0)}</strong></span></Link>
        <Link to="/admin/etkinlikler"><Calendar size={17} /><span><small>Bugünkü etkinlik</small><strong>{data?.todayActivitiesCount ?? 0}</strong></span></Link>
      </div>

      {/* 4 Primary Business KPIs */}
      <div className="admin-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {primaryKpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Link
              key={kpi.id}
              to={kpi.to}
              className="admin-kpi overview-kpi"
              style={{ textDecoration: 'none' }}
              data-testid={kpi.id}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="admin-kpi-label" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {kpi.label}
                </span>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: `${kpi.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.color }}>
                  <Icon size={18} />
                </div>
              </div>
              <div className="admin-kpi-value" style={{ fontSize: 24, fontWeight: 800, marginTop: 8, color: 'var(--text-primary)' }}>
                {kpi.value}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Top Products & Branch Performance */}
      <div className="admin-split" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: 16 }}>
        {/* En Çok Satılan Ürünler (Completed Order Items) */}
        <div className="admin-card" data-testid="top-products-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>En Çok Satılan Ürünler</h2>
            <Link to="/admin/raporlar" className="overview-link">Tüm raporlar <ArrowRight size={14} /></Link>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {topProducts.length === 0 ? <p className="admin-muted">Seçilen dönemde tamamlanan ürün satışı yok.</p> : topProducts.map((p: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--admin-border)', background: 'var(--admin-bg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--admin-primary)', minWidth: 20 }}>#{idx + 1}</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{p.name}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 13, fontWeight: 800, display: 'block' }}>{p.quantity} adet</span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{formatCurrency(p.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Şube Performansı & Hızlı İşlemler */}
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Şube Performansı & Hızlı Erişim</h2>
          <div style={{ display: 'grid', gap: 8 }}>
            {topCafes.length === 0 ? <p className="admin-muted">Seçilen dönemde şube siparişi yok.</p> : topCafes.slice(0, 5).map((c: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--admin-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MapPin size={16} style={{ color: 'var(--admin-primary)' }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{c.cafeName}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700 }}>{c.orderCount} sipariş · {formatCurrency(c.revenue)}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: 10, display: 'grid', gap: 8 }}>
            <Link to="/admin/siparisler" className="admin-btn admin-btn-primary admin-btn-sm" style={{ textDecoration: 'none', justifyContent: 'center' }}>
              <Gift size={16} /> Sipariş operasyonu
            </Link>
            <Link to="/admin/qr" className="admin-btn admin-btn-secondary admin-btn-sm" style={{ textDecoration: 'none', justifyContent: 'center' }}>
              <CreditCard size={16} /> QR ve kasa doğrulama
            </Link>
          </div>
        </div>
      </div>

      {/* SLA / Operation Alerts */}
      <div id="operation-alerts" data-testid="operation-alerts" className="admin-card">
        <div data-testid="critical-queue" className="overview-section-title"><div><h2>Müdahale gereken siparişler</h2><p>{CRITICAL_ORDER_MINUTES} dakikayı aşan aktif siparişler</p></div><Link to="/admin/siparisler" className="overview-link">Siparişlere git <ArrowRight size={14} /></Link></div>
        {critical.length === 0 ? (
          <p className="admin-muted" style={{ margin: 0, fontSize: 13 }}>SLA aşımı yok. Müdahale gereken kritik sipariş bulunmuyor.</p>
        ) : (
          critical.slice(0, 5).map((o: any) => (
            <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
              <div>
                <strong>{o.collectionCode}</strong> · {o.userFullName} · <StatusBadge status={o.status} />
              </div>
              <OrderActions order={o} onChanged={load} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
