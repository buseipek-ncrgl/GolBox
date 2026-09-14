import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/AuthContext';
import { Login } from './pages/Login';
import { AdminShell } from './features/admin/AdminShell';
import { DashboardPage } from './features/admin/dashboard/DashboardPage';
import { CitizensPage } from './features/admin/citizens/CitizensPage';
import { PlacesPage, HomeContentPage, SettingsPage } from './features/admin/wrappers';
import { CafesPage } from './features/admin/cafes/CafesPage';
import { MenuPage } from './features/admin/menu/MenuPage';
import { LedgerPage } from './features/admin/points/LedgerPage';
import { QrPage } from './features/admin/qr/QrPage';
import { RewardsPage } from './features/admin/rewards/RewardsPage';
import { FieldDropsPage } from './features/admin/fielddrops/FieldDropsPage';
import { OrdersPage } from './features/admin/orders/OrdersPage';
import { CampaignsPage } from './features/admin/campaigns/CampaignsPage';
import { ActivitiesPage } from './features/admin/activities/ActivitiesPage';
import { NotificationsPage } from './features/admin/notifications/NotificationsPage';
import { ReportsPage } from './features/admin/reports/ReportsPage';
import { RolesPage } from './features/admin/roles/RolesPage';
import { AuditPage } from './features/admin/audit/AuditPage';

const MainApp: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  const roles = [user?.role, ...(Array.isArray(user?.roles) ? user.roles : [])].filter(Boolean) as string[];
  const allowed = roles.some((role) => role === 'Admin' || role === 'Staff');
  if (!allowed) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'Manrope, system-ui, sans-serif' }}>
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'Fraunces, Georgia, serif' }}>Erişim yok</h1>
          <p>Vatandaş hesabı yönetim paneline giremez.</p>
          <button type="button" onClick={logout} style={{ marginTop: 16, padding: '10px 16px', background: '#1d5f60', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer' }}>
            Çıkış yap
          </button>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/admin" element={<AdminShell />}>
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
