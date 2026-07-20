import React, { useState } from 'react';
import { useAuth } from '../store/AuthContext';
import { api } from '../services/api';
import { LogIn, ShieldCheck, UserPlus, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [organizationId, setOrganizationId] = useState('11111111-1111-1111-1111-111111111111'); // default to Gölbaşı
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        // Register flow
        await api.register({
          email,
          password,
          firstName,
          lastName,
          organizationId,
        });
        
        // Auto login on successful register
        const loginResponse = await api.login({ email, password });
        login(loginResponse.accessToken, loginResponse.refreshToken, loginResponse.user);
      } else {
        // Login flow
        const loginResponse = await api.login({ email, password });
        login(loginResponse.accessToken, loginResponse.refreshToken, loginResponse.user);
      }
    } catch (err: any) {
      setError(err.message || 'Giriş işlemi başarısız. Bilgilerinizi kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: '1.5rem'
    }}>
      <div className="glass-card animate-fade-in" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '2.5rem',
        textAlign: 'center',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-md)'
      }}>
        
        {/* Top Header Logo */}
        <div style={{ 
          display: 'inline-flex', 
          padding: '0.85rem', 
          borderRadius: '50%', 
          background: 'rgba(37, 99, 235, 0.08)', 
          marginBottom: '1.25rem',
          color: 'var(--accent-primary)'
        }}>
          <ShieldCheck size={32} />
        </div>

        <h1 style={{ fontSize: '1.65rem', margin: '0 0 0.4rem', letterSpacing: '-0.02em', color: 'var(--text-primary)', fontWeight: 700 }}>
          {isRegister ? 'GölBox Hesabı Oluştur' : 'GölBox Platformu'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '2rem' }}>
          {isRegister ? 'Belediye sadakat programına katılmak için kaydolun.' : 'Gölbaşı Belediyesi sadakat ve ön sipariş sistemi.'}
        </p>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            color: '#ef4444',
            fontSize: '0.85rem',
            textAlign: 'left',
            marginBottom: '1.5rem'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {isRegister && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Ad</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ahmet"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Soyad</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Yılmaz"
                />
              </div>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">E-Posta Adresi</label>
            <input
              type="email"
              required
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@golbox.com"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Şifre</label>
            <input
              type="password"
              required
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {isRegister && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Organizasyon (Belediye)</label>
              <select
                className="form-input"
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
                style={{ appearance: 'none', cursor: 'pointer' }}
              >
                <option value="11111111-1111-1111-1111-111111111111">Gölbaşı Belediyesi</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', marginTop: '0.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}
          >
            {loading ? (
              <span>İşlem Yapılıyor...</span>
            ) : isRegister ? (
              <>
                <UserPlus size={18} />
                <span>Kayıt Ol</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>Giriş Yap</span>
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '1.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-primary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            {isRegister ? 'Zaten hesabınız var mı? Giriş Yapın' : 'Hesabınız yok mu? Yeni Hesap Oluşturun'}
          </button>
        </div>

      </div>
    </div>
  );
};
