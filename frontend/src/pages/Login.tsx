import React, { useState } from 'react';
import { useAuth } from '../store/AuthContext';
import { api } from '../services/api';
import { ShieldCheck, LogIn, AlertCircle, Eye, EyeOff, Lock, Mail, Building2, KeyRound, Sparkles } from 'lucide-react';

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
      login(loginResponse.accessToken, loginResponse.refreshToken, loginResponse.user);
    } catch (err: any) {
      setError(err.message || 'Giriş işlemi başarısız. Lütfen yetkili e-posta ve şifrenizi doğrulayın.');
    } finally {
      setLoading(false);
    }
  };

  // Fast Demo Fill for Testing Admin & Staff Roles
  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 20%, #132a36 0%, #0b141a 60%, #050a0e 100%)',
      padding: '1.5rem',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Ambient Radial Background Glows */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(29, 95, 96, 0.25) 0%, rgba(0, 0, 0, 0) 70%)',
        pointerEvents: 'none',
        filter: 'blur(40px)'
      }} />

      <div style={{
        position: 'absolute',
        bottom: '-10%',
        right: '10%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, rgba(0, 0, 0, 0) 70%)',
        pointerEvents: 'none',
        filter: 'blur(50px)'
      }} />

      {/* Main Admin Card */}
      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: 'rgba(15, 25, 34, 0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        padding: '2.75rem 2.25rem',
        boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.5), 0 18px 36px -18px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        color: '#f8fafc',
        position: 'relative',
        zIndex: 10
      }}>

        {/* Municipality & System Emblem Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(29, 95, 96, 0.25)',
            border: '1px solid rgba(45, 140, 142, 0.4)',
            padding: '0.35rem 0.9rem',
            borderRadius: '100px',
            color: '#5eead4',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            marginBottom: '1.25rem'
          }}>
            <ShieldCheck size={14} />
            <span>Yalnızca Yetkili Personel Girişi</span>
          </div>

          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 1.25rem auto',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #1d5f60 0%, #0e7490 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 12px 24px -6px rgba(29, 95, 96, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
          }}>
            <Building2 size={32} />
          </div>

          <h1 style={{
            fontSize: '1.65rem',
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-0.02em',
            margin: 0,
            lineHeight: 1.2
          }}>
            GölBox Yönetim Portalı
          </h1>
          <p style={{
            color: '#94a3b8',
            fontSize: '0.85rem',
            marginTop: '0.5rem',
            lineHeight: 1.4
          }}>
            Gölbaşı Belediyesi Yönetim, Saha & Kasa İşletme Sistemi
          </p>
        </div>

        {/* Quick Demo Fill Pills for Testing */}
        <div style={{
          marginBottom: '1.75rem',
          background: 'rgba(9, 16, 23, 0.7)',
          padding: '0.85rem',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: '#5eead4',
            letterSpacing: '0.06em',
            marginBottom: '0.6rem',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem'
          }}>
            <Sparkles size={12} />
            <span>Hızlı Giriş Seçimi</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => handleQuickFill('admin@golbox.gov.tr', 'Admin123!')}
              style={{
                background: email === 'admin@golbox.gov.tr' ? 'linear-gradient(135deg, #1d5f60, #0f766e)' : 'rgba(255, 255, 255, 0.04)',
                color: '#ffffff',
                border: email === 'admin@golbox.gov.tr' ? '1px solid #5eead4' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '0.55rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s ease'
              }}
            >
              👑 Süper Admin
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('staff@golbox.gov.tr', 'Staff123!')}
              style={{
                background: email === 'staff@golbox.gov.tr' ? 'linear-gradient(135deg, #1d5f60, #0f766e)' : 'rgba(255, 255, 255, 0.04)',
                color: '#ffffff',
                border: email === 'staff@golbox.gov.tr' ? '1px solid #5eead4' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '0.55rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s ease'
              }}
            >
              ☕ Kasa Personeli
            </button>
          </div>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '0.85rem 1rem',
            color: '#fca5a5',
            fontSize: '0.825rem',
            marginBottom: '1.5rem',
            lineHeight: 1.4
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#f87171' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{
              fontSize: '0.775rem',
              fontWeight: 600,
              color: '#cbd5e1',
              display: 'block',
              marginBottom: '0.4rem'
            }}>
              Kurumsal E-Posta / Sicil Kullanıcı Adı
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b'
              }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@golbox.gov.tr"
                style={{
                  width: '100%',
                  padding: '0.75rem 0.85rem 0.75rem 2.6rem',
                  background: 'rgba(9, 16, 23, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s ease'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{
              fontSize: '0.775rem',
              fontWeight: 600,
              color: '#cbd5e1',
              display: 'block',
              marginBottom: '0.4rem'
            }}>
              Parola
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b'
              }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '0.75rem 2.6rem 0.75rem 2.6rem',
                  background: 'rgba(9, 16, 23, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s ease'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.5rem',
              height: '48px',
              background: 'linear-gradient(135deg, #1d5f60 0%, #0e7490 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 6px 20px rgba(29, 95, 96, 0.4)',
              transition: 'transform 0.15s ease, opacity 0.2s ease',
              opacity: loading ? 0.8 : 1
            }}
          >
            {loading ? (
              <span>Oturum Doğrulanıyor...</span>
            ) : (
              <>
                <LogIn size={18} />
                <span>Yönetim Paneline Giriş Yap</span>
              </>
            )}
          </button>
        </form>

        {/* Security & Copyright Footer */}
        <div style={{
          marginTop: '2rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: '0.725rem',
            color: '#64748b',
            margin: 0,
            lineHeight: 1.5
          }}>
            T.C. Gölbaşı Belediyesi Bilgi İşlem Dairesi Başkanlığı<br />
            Güvenli SSL 256-Bit Şifreli Yönetim Portalı
          </p>
        </div>

      </div>
    </div>
  );
};
