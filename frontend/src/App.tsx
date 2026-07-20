import React, { useState } from 'react';
import { AuthProvider, useAuth } from './store/AuthContext';
import { Login } from './pages/Login';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Rewards } from './pages/Rewards';
import { Tasks } from './pages/Tasks';
import { Admin } from './pages/Admin';

const MainApp: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!isAuthenticated) {
    return <Login />;
  }

  // Admin user gets a completely dedicated layout
  if (user?.email === 'admin@golbox.gov.tr') {
    return <Admin />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main style={{ flexGrow: 1, background: 'var(--bg-primary)' }}>
        {activeTab === 'dashboard' && <Home />}
        {activeTab === 'rewards' && <Rewards />}
        {activeTab === 'tasks' && <Tasks />}
      </main>

      <footer style={{
        padding: '1.5rem',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)'
      }}>
        © 2026 Gölbaşı Belediyesi GölBox Ekosistemi. Tüm Hakları Saklıdır.
      </footer>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
