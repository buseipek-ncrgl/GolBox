import React, { useEffect, useState } from 'react';
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, ClipboardCheck, Landmark, Building2, Coffee, History, CreditCard, Award, MapPin, Gift,
  FileText, Film, Megaphone, Calendar, Bell, BarChart3, Shield, FileCheck, Settings, ChevronLeft, ChevronRight, LogOut,
  Zap, Send, CheckCircle2, Check, Trash2
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { ADMIN_PATHS, canAccessMenu, menuFromPath } from '../../lib/adminRoutes';
import { api } from '../../services/api';
import { extractArray } from '../../lib/adminQuery';
import { AdminFeedbackProvider } from '../../features/admin/AdminFeedback';
import { AdminErrorBoundary } from './AdminErrorBoundary';
import { PageHeader } from './PageHeader';
import { Skeleton } from '../components/Skeleton';
import {
  getInboundNotifications,
  markInboundAsRead,
  deleteInboundNotification,
  InboundNotification
} from '../../lib/inboundNotifications';

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
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [inboundList, setInboundList] = useState<InboundNotification[]>([]);

  const adminName = [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(' ') || currentUser?.email || 'Yönetici';
  const adminRole = currentUser?.role || (Array.isArray(currentUser?.roles) ? currentUser.roles[0] : null) || 'Admin';
  const isAdmin = adminRole === 'Admin';
  const duty = currentUser?.duty;
  const initials = `${currentUser?.firstName?.[0] || ''}${currentUser?.lastName?.[0] || ''}`.trim() || 'GB';
  const active = menuFromPath(location.pathname);
  const meta = ADMIN_PATHS.find((p) => p.id === active);

  useEffect(() => {
    setInboundList(getInboundNotifications());
  }, [showNotifModal]);

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

  const handleMarkRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = markInboundAsRead(id);
    setInboundList(updated);
  };

  const handleDeleteNotif = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteInboundNotification(id);
    setInboundList(updated);
  };

  if (!canAccessMenu(active, isAdmin, duty)) {
    const firstAllowed = ADMIN_PATHS.find((item) => canAccessMenu(item.id, isAdmin, duty));
    return <Navigate to={firstAllowed?.path || '/admin/siparisler'} replace />;
  }

  const sections = ['Genel', 'Operasyon', 'Menü Yönetimi', 'Sadakat', 'İçerik', 'Yönetim'];
  const unreadCount = inboundList.filter((n) => !n.isRead).length;
  const displayBadgeCount = unreadCount > 0 ? unreadCount : alertCount;

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
                      aria-label={item.id === 'users' ? 'Vatandaşlar' : item.label}
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
              {displayBadgeCount > 0 && <span className="admin-bell-badge">{displayBadgeCount}</span>}
            </button>

            {showNotifModal && (
              <div className="admin-bell-popover" style={{ width: 360, right: 0 }}>
                <div className="admin-bell-popover-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Gelen Sistem Bildirimleri</h4>
                    <span style={{ fontSize: 11, color: '#64748b' }}>Canlı operasyon & sistem durum takibi</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNotifModal(false)}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: '#94a3b8', padding: '0 4px' }}
                  >
                    ×
                  </button>
                </div>

                <div className="admin-bell-popover-body" style={{ maxHeight: 340, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {inboundList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 12px', color: '#94a3b8', fontSize: 13 }}>
                      Gelen bildirim bulunmuyor.
                    </div>
                  ) : (
                    inboundList.map((n) => (
                      <div
                        key={n.id}
                        style={{
                          padding: 12,
                          borderRadius: 10,
                          background: n.isRead ? '#f8fafc' : '#ffffff',
                          border: `1px solid ${n.isRead ? '#e2e8f0' : '#cbd5e1'}`,
                          fontSize: 12,
                          boxShadow: n.isRead ? 'none' : '0 1px 3px rgba(0,0,0,0.05)',
                          position: 'relative'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {!n.isRead && (
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', flexShrink: 0 }} />
                            )}
                            <strong style={{ fontSize: 12, color: n.isRead ? '#475569' : '#0f172a' }}>{n.title}</strong>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {!n.isRead && (
                              <button
                                type="button"
                                onClick={(e) => handleMarkRead(n.id, e)}
                                title="Okundu işaretle"
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#059669', padding: 2 }}
                              >
                                <Check size={14} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => handleDeleteNotif(n.id, e)}
                              title="Sil"
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', padding: 2 }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <div style={{ color: n.isRead ? '#64748b' : '#334155', marginTop: 4, lineHeight: 1.4 }}>
                          {n.message}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: 10, color: '#94a3b8' }}>
                          <span style={{ fontWeight: 600, color: '#64748b' }}>{n.category}</span>
                          <span>{n.time}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="admin-bell-popover-footer" style={{ padding: '10px 12px', borderTop: '1px solid #f1f5f9', background: '#fafafa' }}>
                  <NavLink
                    to="/admin/bildirimler?tab=inbound"
                    onClick={() => setShowNotifModal(false)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: '#047857',
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: 12,
                      textAlign: 'center',
                      textDecoration: 'none'
                    }}
                  >
                    Tüm Bildirimleri Gör
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
