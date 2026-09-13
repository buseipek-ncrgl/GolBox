import React, { useEffect, useState } from 'react';
import { useAuth } from '../store/AuthContext';
import { api } from '../services/api';
import type { PointTransaction, UserAnalytics } from '../types';
import { QrCode, TrendingUp, HelpCircle, RefreshCw, Trophy, Target } from 'lucide-react';

export const Home: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrTimeLeft, setQrTimeLeft] = useState(60);

  const fetchData = async () => {
    try {
      setLoading(true);
      await refreshUser();
      const historyResponse = await api.getPointsHistory(1, 5);
      setTransactions(historyResponse.items);
      const analyticsResponse = await api.getUserAnalytics();
      setAnalytics(analyticsResponse);
    } catch (e) {
      console.error('Failed to fetch dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // QR Code timer countdown simulation
    const interval = setInterval(() => {
      setQrTimeLeft((prev) => (prev <= 1 ? 60 : prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!user) return null;

  // Calculate gauge parameters
  const targetPoints = 200;
  const currentPoints = user.pointsBalance;
  const percentage = Math.min(100, Math.max(0, (currentPoints / targetPoints) * 100));
  const strokeDashoffset = 440 - (440 * percentage) / 100;

  return (
    <div className="dashboard-grid animate-fade-in" style={{ padding: '2rem 1.5rem' }}>
      
      {/* Left Column: Stats & QR Code */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Quick welcome panel */}
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--accent-gradient)' }}>
          <div style={{ textAlign: 'left' }}>
            <h1 style={{ fontSize: '1.8rem', margin: 0, fontWeight: 700, color: '#fff' }}>
              Merhaba, {user.firstName}!
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
              Şehitkamil Belediyesi sadakat ekosistemine hoş geldiniz.
            </p>
          </div>
          <div style={{ padding: '1rem', borderRadius: '15px', background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
            <Trophy size={28} />
          </div>
        </div>

        {/* Analytics Distribution section */}
        {analytics && (
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ textAlign: 'left', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={20} color="#ff6600" />
              <span>GölPuan Dağılımınız</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Görevlerden Kazanılan</span>
                  <span style={{ fontWeight: 600 }}>{analytics.pointsDistribution.pointsFromTasks} Puan</span>
                </div>
                <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#ff6600', width: `${Math.min(100, (analytics.pointsDistribution.pointsFromTasks / (analytics.totalPointsEarned || 1)) * 100)}%` }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Etkinliklerden Kazanılan</span>
                  <span style={{ fontWeight: 600 }}>{analytics.pointsDistribution.pointsFromActivities} Puan</span>
                </div>
                <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#8b5cf6', width: `${Math.min(100, (analytics.pointsDistribution.pointsFromActivities / (analytics.totalPointsEarned || 1)) * 100)}%` }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Ziyaret ve Alışverişten</span>
                  <span style={{ fontWeight: 600 }}>{analytics.pointsDistribution.pointsFromShopping} Puan</span>
                </div>
                <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#10b981', width: `${Math.min(100, (analytics.pointsDistribution.pointsFromShopping / (analytics.totalPointsEarned || 1)) * 100)}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Points History */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Trophy size={20} color="#ff6600" />
              <span>Son Puan Hareketleriniz</span>
            </h3>
            <button onClick={fetchData} className="btn-link" style={{ background: 'none', border: 'none', color: '#ff6600', cursor: 'pointer' }}>
              <RefreshCw size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {transactions.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Henüz bir puan hareketiniz bulunmuyor.
              </div>
            ) : (
              transactions.map((t) => (
                <div key={t.id} className="action-item">
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{t.description}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(t.createdDate).toLocaleDateString('tr-TR')}</div>
                  </div>
                  <div style={{
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: t.amount >= 0 ? 'var(--success)' : 'var(--error)'
                  }}>
                    {t.amount >= 0 ? `+${t.amount}` : t.amount} GP
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Right Column: Points Progress & Digital QR */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Points Gauge */}
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Target size={18} color="#ff6600" />
            <span>Puan Seviyeniz</span>
          </h3>

          <div className="points-gauge">
            <svg width="180" height="180" className="points-gauge-circle">
              <circle
                cx="90"
                cy="90"
                r="70"
                stroke="var(--bg-tertiary)"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="90"
                cy="90"
                r="70"
                stroke="url(#points-grad)"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray="440"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
              <defs>
                <linearGradient id="points-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ff6600" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="points-gauge-text">
              <div className="points-gauge-value">{user.pointsBalance}</div>
              <div className="points-gauge-label">GölPuan</div>
            </div>
          </div>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0.5rem 0' }}>
            {percentage >= 100 
              ? 'Mükemmel! Bir ikram satın almak için yeterli puana sahipsiniz.'
              : `${targetPoints - currentPoints} puan sonra ücretsiz kahve seni bekliyor!`
            }
          </p>
        </div>

        {/* Digital QR Token Identity Generator */}
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--bg-tertiary)' }}>
            <div style={{ height: '100%', background: 'var(--accent-orange)', width: `${(qrTimeLeft / 60) * 100}%`, transition: 'width 1s linear' }}></div>
          </div>

          <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <QrCode size={18} color="#ff6600" />
            <span>GölBox Dijital Kimliğiniz</span>
          </h3>

          <div style={{
            width: '200px',
            height: '200px',
            background: '#fff',
            borderRadius: '16px',
            margin: '0 auto 1.5rem',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            overflow: 'hidden'
          }}>
            {/* Simulated premium scanner lines */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: '#ff6600',
              boxShadow: '0 0 10px #ff6600',
              animation: 'spinSlow 4s linear infinite',
              display: 'none' // will be simulated using animation
            }}></div>

            {/* Premium QR placeholder container */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: '#111' }}>
              <QrCode size={140} color="#111" />
            </div>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Bu kod dijital kimliğinizdir. Kasada okutarak ödeme yapabilir, puan toplayabilir veya ikram alabilirsiniz.
          </div>
          <div style={{ fontSize: '0.8rem', color: '#ff6600', fontWeight: 600, marginTop: '0.5rem' }}>
            Kodun yenilenmesine: {qrTimeLeft} saniye
          </div>
        </div>

      </div>

    </div>
  );
};
