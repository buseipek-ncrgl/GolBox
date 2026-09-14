import React from 'react';
import { useAuth } from '../store/AuthContext';
import { LogOut, Award, Calendar, Compass, ShieldAlert, Sparkles } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  
  if (!user) return null;

  const isAdmin = user.email === 'admin@golbox.gov.tr';

  return (
    <nav className="nav-bar">
      <div className="nav-logo">
        <Sparkles size={24} color="#ff6600" />
        <span>Şehitkamil+</span>
      </div>

      <div className="nav-links">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`nav-link btn-link ${activeTab === 'dashboard' ? 'active' : ''}`}
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <Compass size={18} />
          <span>Keşfet</span>
        </button>

        <button
          onClick={() => setActiveTab('rewards')}
          className={`nav-link btn-link ${activeTab === 'rewards' ? 'active' : ''}`}
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <Award size={18} />
          <span>İkramlar</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`nav-link btn-link ${activeTab === 'tasks' ? 'active' : ''}`}
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <Calendar size={18} />
          <span>Görevler</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`nav-link btn-link ${activeTab === 'admin' ? 'active' : ''}`}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <ShieldAlert size={18} />
            <span>Yönetim</span>
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user.firstName} {user.lastName}</div>
          <div style={{ fontSize: '0.75rem', color: '#ff6600', fontWeight: 600 }}>{user.pointsBalance} GölPuan</div>
        </div>
        
        <button
          onClick={logout}
          className="btn btn-secondary"
          style={{ padding: '0.5rem 0.75rem', borderRadius: '8px' }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </nav>
  );
};
