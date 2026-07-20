import React, { useState } from 'react';
import { useAuth } from '../store/AuthContext';
import { api } from '../services/api';
import { LogIn, Sparkles, UserPlus, AlertCircle } from 'lucide-react';

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
        const registerResponse = await api.register({
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
      setError(err.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
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
      background: 'radial-gradient(circle at 50% 50%, #1a1528 0%, #0a0b10 100%)',
      padding: '1.5rem'
    }}>
      <div className="glass-card animate-fade-in" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '2.5rem',
        textAlign: 'center',
        background: 'rgba(18, 19, 28, 0.7)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        
        <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '20px', background: 'rgba(255, 102, 0, 0.1)', marginBottom: '1.5rem' }}>
          <Sparkles size={36} color="#ff6600" />
        </div>

        <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem', letterSpacing: '-0.03em' }}>
          {isRegister ? 'GölBox Hesabı Oluştur' : 'GölBox\'a Giriş Yap'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem' }}>
          {isRegister ? 'Gölbaşı sadakat ekosistemine katılın.' : 'Kazanmaya devam etmek için giriş yapın.'}
        </p>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '0.85rem 1rem',
            color: '#ef4444',
            fontSize: '0.9rem',
            textAlign: 'left',
            marginBottom: '1.5rem'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
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
              <div className="form-group">
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

          <div className="form-group">
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

          <div className="form-group">
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
            <div className="form-group">
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
            style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', marginTop: '1rem' }}
          >
            {loading ? (
              <span>Yükleniyor...</span>
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

        <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#ff6600',
              fontWeight: 500,
              fontSize: '0.9rem',
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
