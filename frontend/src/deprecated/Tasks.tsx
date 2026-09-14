import React, { useEffect, useState } from 'react';
import { useAuth } from '../store/AuthContext';
import { api } from '../services/api';
import type { ActiveTask, Activity } from '../types';
import { CheckSquare, Calendar, Award, MapPin, Compass, AlertCircle, CheckCircle } from 'lucide-react';

export const Tasks: React.FC = () => {
  const { refreshUser } = useAuth();
  const [tasks, setTasks] = useState<ActiveTask[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const tasksResponse = await api.getActiveTasks();
      setTasks(tasksResponse);
      const activitiesResponse = await api.getActivities();
      setActivities(activitiesResponse);
    } catch (e) {
      console.error('Failed to fetch tasks/activities data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCompleteTask = async (taskId: string) => {
    setError(null);
    setSuccess(null);
    try {
      await api.completeTask(taskId);
      setSuccess('Görev başarıyla tamamlandı! Puanınız eklendi.');
      await refreshUser();
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Görev tamamlama işlemi başarısız.');
    }
  };

  const handleJoinActivity = async (activityId: string) => {
    setError(null);
    setSuccess(null);
    try {
      await api.joinActivity(activityId);
      setSuccess('Etkinliğe katılımınız onaylandı! Puanınız eklendi.');
      await refreshUser();
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Etkinliğe katılım işlemi başarısız.');
    }
  };

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

      <div className="dashboard-grid">
        
        {/* Left Column: Tasks List */}
        <div>
          <h2 style={{ textAlign: 'left', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckSquare size={24} color="#ff6600" />
            <span>Aktif Görevler</span>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {tasks.length === 0 ? (
              <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Şu anda yapabileceğiniz aktif görev bulunmuyor.
              </div>
            ) : (
              tasks.map((t) => (
                <div key={t.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', textAlign: 'left' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{t.title}</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      {t.description}
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: '#ff6600', fontWeight: 600, background: 'rgba(255,102,0,0.1)', padding: '0.25rem 0.5rem', borderRadius: '6px' }}>
                        +{t.pointsReward} GölPuan
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Tamamlanma: {t.completedCount} / {t.maxCompletions}
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={t.isCompleted}
                    onClick={() => handleCompleteTask(t.id)}
                    className={`btn ${t.isCompleted ? 'btn-secondary' : 'btn-primary'}`}
                    style={{ padding: '0.6rem 1.2rem', borderRadius: '10px', fontSize: '0.85rem' }}
                  >
                    {t.isCompleted ? 'Tamamlandı' : 'Tamamla'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Activities List */}
        <div>
          <h2 style={{ textAlign: 'left', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={24} color="#ff6600" />
            <span>Yaklaşan Etkinlikler</span>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activities.length === 0 ? (
              <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Planlanan güncel etkinlik bulunmuyor.
              </div>
            ) : (
              activities.map((a) => (
                <div key={a.id} className="glass-card" style={{ padding: '1.25rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{a.title}</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      {a.description}
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <MapPin size={14} color="#ff6600" />
                      <span>{a.location}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Compass size={14} color="#ff6600" />
                      <span>{new Date(a.startDate).toLocaleString('tr-TR')}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: 600, background: 'rgba(139,92,246,0.1)', padding: '0.25rem 0.5rem', borderRadius: '6px' }}>
                      +{a.pointsReward} GölPuan
                    </div>

                    <button
                      disabled={a.isJoined}
                      onClick={() => handleJoinActivity(a.id)}
                      className={`btn ${a.isJoined ? 'btn-secondary' : 'btn-primary'}`}
                      style={{ padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.8rem' }}
                    >
                      {a.isJoined ? 'Katıldınız' : 'Katıl / Check-in'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
