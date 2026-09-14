import React, { useState } from 'react';
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Landmark, Building2, Coffee, History, CreditCard, Award, MapPin, Gift,
  FileText, Megaphone, Calendar, Bell, BarChart3, Shield, FileCheck, Settings, ChevronLeft, ChevronRight, LogOut
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { ADMIN_PATHS, canAccessMenu, menuFromPath } from '../../lib/adminRoutes';
import { AdminFeedbackProvider } from './AdminFeedback';
import { AdminSkeletonTable } from '../../components/admin/AdminSkeleton';

const ICONS: Record<string, any> = {
  overview: LayoutDashboard,
  users: Users,
  places: Landmark,
  cafes: Building2,
  products: Coffee,
  points: History,
  qr: CreditCard,
  rewards: Award,
  fieldDrops: MapPin,
  ismarliyor: Gift,
  homeContent: FileText,
  campaigns: Megaphone,
  events: Calendar,
  notifications: Bell,
  reports: BarChart3,
  roles: Shield,
  audit: FileCheck,
  settings: Settings
};

export function AdminShell() {
  const { logout, user: currentUser } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const adminName = [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(' ') || currentUser?.email || 'Yönetici';
  const adminRole = currentUser?.role || (Array.isArray(currentUser?.roles) ? currentUser.roles[0] : null) || 'Admin';
  const isAdmin = adminRole === 'Admin';
  const initials = `${currentUser?.firstName?.[0] || ''}${currentUser?.lastName?.[0] || ''}`.trim() || 'GB';
  const active = menuFromPath(location.pathname);
  const title = ADMIN_PATHS.find((p) => p.id === active)?.label || 'Yönetim';

  if (!canAccessMenu(active, isAdmin)) {
    return <Navigate to="/admin" replace />;
  }

  const sections = ['İşlem', 'Sadakat', 'İletişim', 'Yönetim'];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f7f5', color: '#1c2e2e', fontFamily: 'Manrope, system-ui, sans-serif' }}>
      <aside style={{ width: collapsed ? 76 : 270, maxWidth: '38vw', background: '#1d5f60', color: '#f4f7f5', display: 'flex', flexDirection: 'column', flexShrink: 0, zIndex: 50 }}>
        <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', padding: '0 1.15rem' }}>
          {!collapsed && (
            <div>
              <div style={{ fontWeight: 700, fontFamily: 'Fraunces, Georgia, serif' }}>Şehitkamil+</div>
              <div style={{ fontSize: 11, opacity: 0.75 }}>Şehitkamil Belediyesi</div>
            </div>
          )}
          <button type="button" onClick={() => setCollapsed(!collapsed)} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', padding: 6, borderRadius: 10, cursor: 'pointer' }}>
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
        <div style={{ flexGrow: 1, overflowY: 'auto', padding: '0.5rem 0.6rem' }}>
          {sections.map((section) => {
            const items = ADMIN_PATHS.filter((p) => p.section === section && canAccessMenu(p.id, isAdmin));
            if (!items.length) return null;
            return (
              <div key={section} style={{ marginBottom: '1.1rem' }}>
                {!collapsed && <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.55, padding: '0 0.75rem 0.4rem', letterSpacing: '0.08em' }}>{section.toUpperCase()}</div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {items.map((item) => {
                    const Icon = ICONS[item.id];
                    const end = item.path === '/admin';
                    return (
                      <NavLink
                        key={item.id}
                        to={item.path}
                        end={end}
                        title={collapsed ? item.label : undefined}
                        style={({ isActive }) => ({
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          justifyContent: collapsed ? 'center' : 'flex-start',
                          padding: '0.65rem 0.85rem',
                          borderRadius: 14,
                          background: isActive ? '#fff' : 'transparent',
                          color: isActive ? '#1d5f60' : 'rgba(255,255,255,0.82)',
                          textDecoration: 'none',
                          fontWeight: isActive ? 700 : 500,
                          fontSize: 14
                        })}
                      >
                        <Icon size={18} />
                        {!collapsed && <span>{item.label}</span>}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ padding: collapsed ? '0.75rem 0.5rem' : '0.9rem 1rem', borderTop: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 14, background: '#fff', color: '#1d5f60', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{initials}</div>
          {!collapsed && (
            <div style={{ flexGrow: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{adminName}</div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>{adminRole === 'Admin' ? 'Yönetici' : 'Personel'}</div>
            </div>
          )}
          {!collapsed && (
            <button type="button" onClick={logout} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><LogOut size={18} /></button>
          )}
        </div>
      </aside>
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem' }}>
          <div>
            <div style={{ fontSize: 12, color: '#5b6f6e', fontWeight: 600 }}>Şehitkamil Belediyesi</div>
            <h1 style={{ margin: 0, fontSize: '1.45rem', fontFamily: 'Fraunces, Georgia, serif' }}>{title}</h1>
          </div>
          <NavLink to="/admin" title="Operasyon uyarıları" style={{ background: '#fff', border: '1px solid #d7e3e0', padding: 8, borderRadius: 14, display: 'flex', color: '#1d5f60' }}>
            <Bell size={18} />
          </NavLink>
        </header>
        <AdminFeedbackProvider isAdmin={isAdmin}>
          <main style={{ flexGrow: 1, padding: '1.5rem 2rem 2rem', overflowY: 'auto' }}>
            <React.Suspense fallback={<AdminSkeletonTable />}>
              <Outlet />
            </React.Suspense>
          </main>
        </AdminFeedbackProvider>
      </div>
    </div>
  );
}

export const Admin = AdminShell;
