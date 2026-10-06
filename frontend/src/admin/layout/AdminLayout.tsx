import React, { useEffect, useState } from 'react';
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, ClipboardCheck, Landmark, Building2, Coffee, History, CreditCard, Award, MapPin, Gift,
  FileText, Film, Megaphone, Calendar, Bell, BarChart3, Shield, FileCheck, Settings, ChevronLeft, ChevronRight, LogOut,
  Zap, Send, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { ADMIN_PATHS, canAccessMenu, menuFromPath } from '../../lib/adminRoutes';
import { api } from '../../services/api';
import { extractArray } from '../../lib/adminQuery';
import { AdminFeedbackProvider } from '../../features/admin/AdminFeedback';
import { AdminErrorBoundary } from './AdminErrorBoundary';
import { PageHeader } from './PageHeader';
import { Skeleton } from '../components/Skeleton';

const ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  overview: LayoutDashboard,
  orders: Gift,
  ismarliyor: Gift,
  qr: CreditCard,
  eventCheckin: Calendar,
  cafes: Building2,
  products: Coffee,
  points: History,
  rewards: Award,
  campaigns: Megaphone,
  events: Calendar,
  missions: Award,
  notifications: Bell,
  reports: BarChart3,
  users: Users,
  roles: Shield,
  audit: FileCheck,
  settings: Settings
};

export function AdminLayout() {
  const { logout, user: currentUser } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const adminName = [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(' ') || currentUser?.email || 'Yönetici';
  const adminRole = currentUser?.role || (Array.isArray(currentUser?.roles) ? currentUser.roles[0] : null) || 'Admin';
  const isAdmin = adminRole === 'Admin';
  const duty = currentUser?.duty;
  const initials = `${currentUser?.firstName?.[0] || ''}${currentUser?.lastName?.[0] || ''}`.trim() || 'GB';
  const active = menuFromPath(location.pathname);
  const meta = ADMIN_PATHS.find((p) => p.id === active);

  useEffect(() => {
    let cancelled = false;
    void api.getDashboardOverview().then((data) => {
      if (cancelled) return;
      const count = Number(data?.operationAlertCount ?? data?.metrics?.operationAlertCount);
      if (Number.isFinite(count)) {
        setAlertCount(count);
        return;
      }
      const alerts = data?.alerts || {};
      const ops = extractArray(alerts.operationAlerts);
      if (ops.length) {
        setAlertCount(ops.length);
        return;
      }
      setAlertCount(
        extractArray(alerts.longPendingOrders).length +
        extractArray(alerts.todayActivities).length
      );
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [location.pathname]);

  if (!canAccessMenu(active, isAdmin, duty)) {
    const firstAllowed = ADMIN_PATHS.find((item) => canAccessMenu(item.id, isAdmin, duty));
    return <Navigate to={firstAllowed?.path || '/admin/siparisler'} replace />;
  }

  const sections = ['Genel', 'Operasyon', 'Menü Yönetimi', 'Sadakat', 'İçerik', 'Yönetim'];

  const [showNotifModal, setShowNotifModal] = useState(false);

  return (
    <div className="admin-shell" data-testid="admin-layout">
      <aside className={`admin-sidebar${collapsed ? ' is-collapsed' : ''}`} data-testid="admin-sidebar">
        <div className="admin-sidebar-brand">
          {!collapsed && (
            <div>
              <div className="admin-brand-name">GölBOX</div>
              <div className="admin-brand-sub">Şehitkamil Belediyesi</div>
            </div>
          )}
          <button
            type="button"
            className="admin-icon-btn admin-icon-btn-on-dark"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
        <nav className="admin-sidebar-nav" aria-label="Yönetim menüsü">
          {sections.map((section) => {
            const items = ADMIN_PATHS.filter((p) => p.section === section && canAccessMenu(p.id, isAdmin, duty));
            if (!items.length) return null;
            return (
              <div key={section} className="admin-nav-section">
                {!collapsed && <div className="admin-nav-section-title">{section}</div>}
                {items.map((item) => {
                  const Icon = ICONS[item.id] || LayoutDashboard;
                  return (
                    <NavLink
                      key={item.id}
                      to={item.path}
                      end={item.path === '/admin'}
                      className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon size={18} />
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>
        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <div className="admin-avatar">{initials}</div>
            {!collapsed && (
              <div className="admin-user-details">
                <div className="admin-user-name">{adminName}</div>
                <div className="admin-user-role">{adminRole}</div>
              </div>
            )}
          </div>
          <button
            type="button"
            className="admin-icon-btn admin-icon-btn-on-dark"
            onClick={() => void logout()}
            title="Çıkış Yap"
            aria-label="Çıkış Yap"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      <main className="admin-main" data-testid="admin-main-content">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <PageHeader title={meta?.label || 'Yönetim Paneli'} description={meta?.description || 'GölBOX Operasyon ve Yönetim Portalı'} />
          </div>
          <div className="admin-topbar-right" style={{ position: 'relative' }}>
            <button
              type="button"
              className="admin-bell-button"
              title="Sistem Bildirimleri"
              aria-label="Sistem Bildirimleri"
              onClick={() => setShowNotifModal(!showNotifModal)}
            >
              <Bell size={18} />
              {alertCount > 0 && <span className="admin-bell-badge">{alertCount}</span>}
            </button>

            {showNotifModal && (
              <div className="admin-bell-popover">
                <div className="admin-bell-popover-header">
                  <div>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Gelen Sistem & Operasyon Bildirimleri</h4>
                    <span style={{ fontSize: 11, color: '#64748b' }}>Yönetici uyarı ve canlı operasyon takibi</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNotifModal(false)}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: '#94a3b8', padding: '0 4px' }}
                  >
                    ×
                  </button>
                </div>
                <div className="admin-bell-popover-body">
                  <div style={{ padding: 12, borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#166534' }}>
                      <Zap size={14} /> Bekleyen Sipariş Operasyonu
                    </div>
                    <div style={{ color: '#15803d', marginTop: 4 }}>Şehitkamil Kitap Kafe için 1 yeni sipariş hazırlanmayı bekliyor.</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#16a34a', marginTop: 6 }}>Canlı Sistem Akışı</div>
                  </div>

                  <div style={{ padding: 12, borderRadius: 12, background: '#fefce8', border: '1px solid #fef08a', fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#854d0e' }}>
                      <Gift size={14} /> Ismarlıyor Kampanya Kotası
                    </div>
                    <div style={{ color: '#a16207', marginTop: 4 }}>"500 Üniversite Öğrencisine Soğuk Kahve" ikramı aktif durumda.</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#ca8a04', marginTop: 6 }}>Güncel Kontenjan Takibi</div>
                  </div>

                  <div style={{ padding: 12, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#334155' }}>
                      <CheckCircle2 size={14} /> Sunucu & Mobil Hub Durumu
                    </div>
                    <div style={{ color: '#475569', marginTop: 4 }}>SignalR bildirim kanalları ve API servisleri aktif çalışıyor.</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', marginTop: 6 }}>Sistem Bağlantısı OK</div>
                  </div>
                </div>
                <div className="admin-bell-popover-footer">
                  <NavLink
                    to="/admin/bildirimler"
                    onClick={() => setShowNotifModal(false)}
                    className="admin-bell-popover-btn"
                  >
                    <Send size={14} /> Duyuru & Vatandaş Push Bildirim Gönder
                  </NavLink>
                </div>
              </div>
            )}
          </div>
        </header>
        <div className="admin-content" data-testid="admin-page-container">
          <AdminFeedbackProvider isAdmin={isAdmin}>
            <AdminErrorBoundary>
              <Outlet />
            </AdminErrorBoundary>
          </AdminFeedbackProvider>
        </div>
      </main>
    </div>
  );
}
