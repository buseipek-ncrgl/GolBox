import React, { useState } from 'react';
import { useAuth } from '../store/AuthContext';
import { api } from '../services/api';
import { LogIn, AlertCircle, Eye, EyeOff, Lock, Mail } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const loginResponse = await api.login({ email, password });
      const roles = [
        loginResponse.user?.role,
        ...(Array.isArray(loginResponse.user?.roles) ? loginResponse.user.roles : []),
      ].filter(Boolean) as string[];
      const allowed = roles.some((role) => role === 'Admin' || role === 'Staff');
      if (!allowed) {
        setError('Bu panele yalnızca personel ve yöneticiler girebilir.');
        return;
      }
      login(loginResponse.accessToken, loginResponse.refreshToken, loginResponse.user);
    } catch (err: any) {
      setError(err.message || 'Giriş işlemi başarısız. E-posta ve şifrenizi kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 0.9rem 0.75rem 2.6rem',
    background: '#fff',
    border: '1px solid #d7e3e0',
    borderRadius: '16px',
    color: '#1c2e2e',
    fontSize: '0.9rem',
    fontFamily: 'Manrope, system-ui, sans-serif',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f4f7f5',
        padding: '1.5rem',
        fontFamily: 'Manrope, system-ui, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: '#ffffff',
          border: '1px solid #d7e3e0',
          borderRadius: '28px',
          padding: '2.25rem 1.75rem',
          boxShadow: '0 24px 60px -40px rgba(29, 95, 96, 0.55)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              margin: '0 auto 1rem',
              borderRadius: '18px',
              background: '#1d5f60',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Fraunces, Georgia, serif',
              fontSize: '1.35rem',
              fontWeight: 700,
            }}
          >
            ŞB
          </div>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#5b6f6e', letterSpacing: '0.04em', margin: 0 }}>
            Gaziantep Şehitkamil Belediyesi
          </p>
          <h1
            style={{
              fontFamily: 'Fraunces, Georgia, serif',
              fontSize: '1.7rem',
              fontWeight: 700,
              color: '#1c2e2e',
              margin: '0.35rem 0 0',
            }}
          >
            Şehitkamil+ Yönetim
          </h1>
          <p style={{ color: '#5b6f6e', fontSize: '0.875rem', marginTop: '0.4rem' }}>
            Personel girişi. Vatandaş uygulaması ayrıdır.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <button
            type="button"
            onClick={() => handleQuickFill('admin@golbox.gov.tr', 'Admin123!')}
            style={{
              background: email === 'admin@golbox.gov.tr' ? '#1d5f60' : '#e8f2f2',
              color: email === 'admin@golbox.gov.tr' ? '#fff' : '#1d5f60',
              border: 'none',
              borderRadius: '999px',
              padding: '0.55rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Yönetici
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill('staff@golbox.gov.tr', 'Staff123!')}
            style={{
              background: email === 'staff@golbox.gov.tr' ? '#1d5f60' : '#e8f2f2',
              color: email === 'staff@golbox.gov.tr' ? '#fff' : '#1d5f60',
              border: 'none',
              borderRadius: '999px',
              padding: '0.55rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Personel
          </button>
        </div>

        {error && (
          <div
            style={{
              display: 'flex',
              gap: '0.6rem',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '16px',
              padding: '0.75rem 0.9rem',
              color: '#991b1b',
              fontSize: '0.8rem',
              marginBottom: '1rem',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#5b6f6e', display: 'block', marginBottom: 6 }}>
              E-posta
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#5b6f6e' }} />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@golbox.gov.tr" style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#5b6f6e', display: 'block', marginBottom: 6 }}>
              Şifre
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#5b6f6e' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ ...inputStyle, paddingRight: '2.6rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#5b6f6e', cursor: 'pointer' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.25rem',
              height: '48px',
              background: '#1d5f60',
              color: '#fff',
              border: 'none',
              borderRadius: '999px',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              opacity: loading ? 0.8 : 1,
            }}
          >
            <LogIn size={16} />
            {loading ? 'Giriş yapılıyor' : 'Giriş yap'}
          </button>
        </form>
      </div>
    </div>
  );
};
