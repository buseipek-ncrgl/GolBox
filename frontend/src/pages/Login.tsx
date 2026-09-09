import React, { useState } from 'react';
import { useAuth } from '../store/AuthContext';
import { api } from '../services/api';
import { ShieldCheck, LogIn, AlertCircle, Eye, EyeOff, Lock, Mail, Building2, Sparkles, Shield } from 'lucide-react';

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
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      padding: '1.5rem',
      fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Subtle Ambient Radial Lighting */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(29, 95, 96, 0.2) 0%, rgba(0, 0, 0, 0) 70%)',
        pointerEvents: 'none',
        filter: 'blur(50px)'
      }} />

      {/* Main Glassmorphic Login Card */}
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        padding: '2.5rem 2rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        color: '#f8fafc',
        position: 'relative',
        zIndex: 10
      }}>

        {/* Municipality Emblem Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(29, 95, 96, 0.2)',
            border: '1px solid rgba(29, 95, 96, 0.4)',
            padding: '0.35rem 0.85rem',
            borderRadius: '100px',
            color: '#38bdf8',
            fontSize: '0.725rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: '1.25rem'
          }}>
            <Shield size={14} />
            <span>Gaziantep Şehitkamil Belediyesi</span>
          </div>

          <div style={{
            width: '56px',
            height: '56px',
            margin: '0 auto 1rem auto',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #1d5f60 0%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 900,
            fontSize: '1.25rem',
            boxShadow: '0 10px 20px -5px rgba(29, 95, 96, 0.4)'
          }}>
            ŠB
          </div>

          <h1 style={{
            fontSize: '1.5rem',
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
            fontSize: '0.825rem',
            marginTop: '0.4rem',
            lineHeight: 1.4
          }}>
            Akıllı Şehir & Sadakat Ekosistemi Yetkili Girişi
          </p>
        </div>

        {/* Quick Demo Fill Pills */}
        <div style={{
          marginBottom: '1.5rem',
          background: 'rgba(30, 41, 59, 0.6)',
          padding: '0.75rem',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{
            fontSize: '0.675rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: '#38bdf8',
            letterSpacing: '0.06em',
            marginBottom: '0.5rem',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem'
          }}>
            <Sparkles size={12} />
            <span>Hızlı Giriş Seçeneği</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => handleQuickFill('admin@golbox.gov.tr', 'Admin123!')}
              style={{
                background: email === 'admin@golbox.gov.tr' ? '#1d5f60' : 'rgba(255, 255, 255, 0.04)',
                color: '#ffffff',
                border: email === 'admin@golbox.gov.tr' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '0.5rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              👑 Süper Admin
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('staff@golbox.gov.tr', 'Staff123!')}
              style={{
                background: email === 'staff@golbox.gov.tr' ? '#1d5f60' : 'rgba(255, 255, 255, 0.04)',
                color: '#ffffff',
                border: email === 'staff@golbox.gov.tr' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '0.5rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              ☕ Kasa Personeli
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.65rem',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            padding: '0.75rem 0.85rem',
            color: '#fca5a5',
            fontSize: '0.8rem',
            marginBottom: '1.25rem',
            lineHeight: 1.4
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#f87171' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div>
            <label style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#94a3b8',
              display: 'block',
              marginBottom: '0.35rem'
            }}>
              E-Posta Adresi
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{
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
                  padding: '0.7rem 0.85rem 0.7rem 2.5rem',
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#94a3b8',
              display: 'block',
              marginBottom: '0.35rem'
            }}>
              Şifre
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{
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
                  padding: '0.7rem 2.5rem 0.7rem 2.5rem',
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box'
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
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.4rem',
              height: '44px',
              background: 'linear-gradient(135deg, #1d5f60 0%, #0284c7 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(29, 95, 96, 0.35)',
              opacity: loading ? 0.8 : 1
            }}
          >
            {loading ? (
              <span>Giriş Yapılıyor...</span>
            ) : (
              <>
                <LogIn size={16} />
                <span>Sisteme Giriş Yap</span>
              </>
            )}
          </button>
        </form>

        {/* Security Footer */}
        <div style={{
          marginTop: '1.75rem',
          paddingTop: '1rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: '0.7rem',
            color: '#64748b',
            margin: 0,
            lineHeight: 1.4
          }}>
            Gaziantep Şehitkamil Belediyesi Bilgi İşlem ve Akıllı Şehir Hizmetleri Portalı
          </p>
        </div>

      </div>
    </div>
  );
};
