import { AuthProvider, useAuth } from './store/AuthContext';
import { Login } from './pages/Login';
import { Admin } from './pages/Admin';

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

  return <Admin />;
};

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
