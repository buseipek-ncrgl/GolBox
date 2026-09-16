import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/AuthContext';
import { Login } from './pages/Login';
import { AdminLayout } from './admin/layout/AdminLayout';
import { Skeleton } from './admin/components/Skeleton';

const DashboardPage = lazy(() => import('./features/admin/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const CitizensPage = lazy(() => import('./features/admin/citizens/CitizensPage').then((m) => ({ default: m.CitizensPage })));
const PlacesPage = lazy(() => import('./features/admin/wrappers').then((m) => ({ default: m.PlacesPage })));
const HomeContentPage = lazy(() => import('./features/admin/wrappers').then((m) => ({ default: m.HomeContentPage })));
const SettingsPage = lazy(() => import('./features/admin/wrappers').then((m) => ({ default: m.SettingsPage })));
const CafesPage = lazy(() => import('./features/admin/cafes/CafesPage').then((m) => ({ default: m.CafesPage })));
const MenuPage = lazy(() => import('./features/admin/menu/MenuPage').then((m) => ({ default: m.MenuPage })));
const LedgerPage = lazy(() => import('./features/admin/points/LedgerPage').then((m) => ({ default: m.LedgerPage })));
const QrPage = lazy(() => import('./features/admin/qr/QrPage').then((m) => ({ default: m.QrPage })));
const RewardsPage = lazy(() => import('./features/admin/rewards/RewardsPage').then((m) => ({ default: m.RewardsPage })));
const FieldDropsPage = lazy(() => import('./features/admin/fielddrops/FieldDropsPage').then((m) => ({ default: m.FieldDropsPage })));
const OrdersPage = lazy(() => import('./features/admin/orders/OrdersPage').then((m) => ({ default: m.OrdersPage })));
const CampaignsPage = lazy(() => import('./features/admin/campaigns/CampaignsPage').then((m) => ({ default: m.CampaignsPage })));
const ActivitiesPage = lazy(() => import('./features/admin/activities/ActivitiesPage').then((m) => ({ default: m.ActivitiesPage })));
const NotificationsPage = lazy(() => import('./features/admin/notifications/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const ReportsPage = lazy(() => import('./features/admin/reports/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const RolesPage = lazy(() => import('./features/admin/roles/RolesPage').then((m) => ({ default: m.RolesPage })));
const AuditPage = lazy(() => import('./features/admin/audit/AuditPage').then((m) => ({ default: m.AuditPage })));

const MainApp = () => {
  const { isAuthenticated, user, logout } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  const roles = [user?.role, ...(Array.isArray(user?.roles) ? user.roles : [])].filter(Boolean) as string[];
  const allowed = roles.some((role) => role === 'Admin' || role === 'Staff');
  if (!allowed) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <h1>Erişim yok</h1>
          <p>Vatandaş hesabı yönetim paneline giremez.</p>
          <button type="button" onClick={logout} className="admin-btn admin-btn-primary admin-btn-md" style={{ marginTop: 16 }}>
            Çıkış yap
          </button>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<Skeleton variant="table" />}>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="vatandaslar" element={<CitizensPage />} />
          <Route path="vatandaslar/:userId" element={<CitizensPage />} />
          <Route path="tesisler" element={<PlacesPage />} />
          <Route path="gol-kafeler" element={<CafesPage />} />
          <Route path="menu" element={<MenuPage />} />
          <Route path="golpuan" element={<LedgerPage />} />
          <Route path="qr" element={<QrPage />} />
          <Route path="oduller" element={<RewardsPage />} />
          <Route path="saha-hediyeleri" element={<FieldDropsPage />} />
          <Route path="ismarliyor" element={<OrdersPage />} />
          <Route path="icerikler" element={<HomeContentPage />} />
          <Route path="etkinlikler" element={<ActivitiesPage />} />
          <Route path="kampanyalar" element={<CampaignsPage />} />
          <Route path="bildirimler" element={<NotificationsPage />} />
          <Route path="raporlar" element={<ReportsPage />} />
          <Route path="yetkilendirme" element={<RolesPage />} />
          <Route path="denetim" element={<AuditPage />} />
          <Route path="ayarlar" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <MainApp />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
