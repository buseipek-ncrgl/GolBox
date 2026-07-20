import React, { useEffect, useState } from 'react';
import { useAuth } from '../store/AuthContext';
import { api } from '../services/api';
import type { Reward, ClaimedReward } from '../types';
import { Award, ShoppingBag, QrCode, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export const Rewards: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [claimedRewards, setClaimedRewards] = useState<ClaimedReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      await refreshUser();
      const catalogueResponse = await api.getRewards(1, 10);
      setRewards(catalogueResponse.items);
      const claimedResponse = await api.getMyClaimedRewards();
      setClaimedRewards(claimedResponse);
    } catch (e) {
      console.error('Failed to fetch rewards data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleClaim = async (rewardId: string) => {
    setError(null);
    setSuccess(null);
    try {
      const claimResult = await api.claimReward(rewardId);
      setSuccess(`İkram başarıyla alındı! Kodunuz: ${claimResult.redeemCode}`);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Satın alma işlemi başarısız.');
    }
  };

  if (!user) return null;

  return (
    <div className="animate-fade-in" style={{ padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Messages */}
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          padding: '1rem',
          color: '#ef4444',
          marginBottom: '1.5rem',
          textAlign: 'left'
        }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          padding: '1rem',
          color: 'var(--success)',
          marginBottom: '1.5rem',
          textAlign: 'left'
        }}>
          <CheckCircle size={20} />
          <span>{success}</span>
        </div>
      )}

      {/* Grid: Left - Catalogue, Right - Claimed */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }} className="dashboard-grid">
        
        {/* Left Column: Catalogue */}
        <div>
          <h2 style={{ textAlign: 'left', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag size={24} color="#ff6600" />
            <span>İkram Kataloğu</span>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
            {rewards.length === 0 ? (
              <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Şu anda aktif ikram bulunmuyor.
              </div>
            ) : (
              rewards.map((r) => {
                const canAfford = user.pointsBalance >= r.requiredPoints;
                return (
                  <div key={r.id} className="glass-card" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', padding: '1.25rem', textAlign: 'left' }}>
                    
                    {/* Coffee icon or thumbnail */}
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '16px',
                      background: 'var(--accent-gradient)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '1.8rem',
                      fontWeight: 700,
                      flexShrink: 0
                    }}>
                      ☕
                    </div>

                    <div style={{ flexGrow: 1 }}>
                      <h4 style={{ margin: 0, fontSize: '1.15rem' }}>{r.title}</h4>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        {r.description}
                      </p>
                      <div style={{ display: 'inline-block', fontSize: '0.8rem', fontWeight: 600, color: '#ff6600', background: 'rgba(255, 102, 0, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '6px', marginTop: '0.5rem' }}>
                        {r.requiredPoints} GölPuan
                      </div>
                    </div>

                    <button
                      disabled={!canAfford}
                      onClick={() => handleClaim(r.id)}
                      className={`btn ${canAfford ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem', borderRadius: '10px' }}
                    >
                      {canAfford ? 'Talep Et' : 'Yetersiz Puan'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Claimed Rewards (Kuponlar) */}
        <div>
          <h2 style={{ textAlign: 'left', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={24} color="#ff6600" />
            <span>Kazanılan İkramlarım</span>
          </h2>

          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {claimedRewards.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Henüz kazanılmış bir ikramınız bulunmuyor.
              </div>
            ) : (
              claimedRewards.map((c) => {
                const isClaimed = c.status === 'Claimed';
                const isRedeemed = c.status === 'Redeemed';
                return (
                  <div key={c.claimId} style={{
                    padding: '1rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    background: isRedeemed ? 'rgba(255,255,255,0.02)' : 'rgba(25, 27, 41, 0.4)',
                    textAlign: 'left'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '1rem' }}>{c.rewardTitle}</span>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '0.25rem 0.5rem',
                        borderRadius: '6px',
                        background: isRedeemed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 102, 0, 0.1)',
                        color: isRedeemed ? 'var(--success)' : 'var(--accent-orange)'
                      }}>
                        {isRedeemed ? 'Kullanıldı' : 'Aktif Kupon'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-color)', paddingTop: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                        <QrCode size={16} />
                        <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.9rem', color: isRedeemed ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                          {c.redeemCode}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <Clock size={12} />
                        <span>
                          {isRedeemed 
                            ? `Kullanım: ${new Date(c.redeemedAt!).toLocaleDateString('tr-TR')}`
                            : `Son Tarih: ${new Date(c.expiresAt).toLocaleDateString('tr-TR')}`
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
