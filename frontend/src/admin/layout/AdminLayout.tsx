import React, { useEffect, useState } from 'react';
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, ClipboardCheck, Landmark, Building2, Coffee, History, CreditCard, Award, MapPin, Gift,
  FileText, Film, Megaphone, Calendar, Bell, BarChart3, Shield, FileCheck, Settings, ChevronLeft, ChevronRight, LogOut
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

  if (!canAccessMenu(active, isAdmin)) {
    return <Navigate to={isAdmin ? '/admin' : '/admin/siparisler'} replace />;
  }

  const sections = ['Genel', 'Operasyon', 'Menü Yönetimi', 'Sadakat', 'İçerik', 'Yönetim'];

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
            const items = ADMIN_PATHS.filter((p) => p.section === section && canAccessMenu(p.id, isAdmin));
            if (!items.length) return null;
            return (
              <div key={section} className="admin-nav-section">
                {!collapsed && <div className="admin-nav-label">{section}</div>}
                {items.map((item) => {
                  const Icon = ICONS[item.id];
                  return (
                    <NavLink
                      key={item.id}
                      to={item.path}
                      end={item.path === '/admin'}
                      title={collapsed ? item.label : undefined}
                      className={({ isActive }) => `admin-nav-link${isActive ? ' is-active' : ''}`}
                    >
                      {Icon ? <Icon size={18} /> : null}
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>
        <div className="admin-sidebar-user">
          <div className="admin-avatar" aria-hidden="true">{initials}</div>
          {!collapsed && (
            <div className="admin-sidebar-user-meta">
              <div className="admin-ellipsis">{adminName}</div>
              <div className="admin-brand-sub">{adminRole === 'Admin' ? 'Yönetici' : 'Personel'}</div>
            </div>
          )}
          <button type="button" className="admin-icon-btn admin-icon-btn-on-dark" onClick={logout} aria-label="Çıkış yap">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <div className="admin-topbar">
          <div className="admin-crumbs">Şehitkamil Belediyesi</div>
          <NavLink to="/admin#operation-alerts" data-testid="admin-bell" className="admin-icon-btn admin-bell" aria-label={alertCount ? `${alertCount} operasyon uyarısı` : 'Operasyon uyarıları'}>
            <Bell size={18} />
            {alertCount > 0 ? <span className="admin-bell-count">{alertCount > 9 ? '9+' : alertCount}</span> : null}
          </NavLink>
        </div>
        <AdminFeedbackProvider isAdmin={isAdmin}>
          <main className="admin-content">
            <div className="admin-content-inner">
              <PageHeader title={meta?.label || 'Yönetim'} description={meta?.description} />
              <AdminErrorBoundary>
                <React.Suspense fallback={<Skeleton variant="table" />}>
                  <Outlet />
                </React.Suspense>
              </AdminErrorBoundary>
            </div>
          </main>
        </AdminFeedbackProvider>
      </div>
    </div>
  );
}
