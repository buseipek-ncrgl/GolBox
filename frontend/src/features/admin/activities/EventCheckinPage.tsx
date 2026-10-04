import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { pagedMeta } from '../../../lib/adminQuery';
import { formatDateTime } from '../../../lib/adminDate';
import { Button, DataTable, EmptyState, ErrorState, Input, Select, StatusBadge } from '../../../admin/components';
import { useAdminFeedback } from '../AdminFeedback';

export function EventCheckinPage() {
  const { setError, setSuccess, savingKey, setSavingKey } = useAdminFeedback();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [qrToken, setQrToken] = useState('');
  const [notes, setNotes] = useState('');
  const [recentCheckins, setRecentCheckins] = useState<any[]>([]);
  const [lastResult, setLastResult] = useState<{ status: 'success' | 'warning' | 'error'; message: string; user?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [fail, setFail] = useState<string | null>(null);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminActivities({ pageSize: 50 });
      const meta = pagedMeta(res);
      const activeList = meta.items.filter((e: any) => e.status === 'Published' || e.status === 'Active' || e.status === 'Ongoing');
      setEvents(activeList.length > 0 ? activeList : meta.items);
      if (activeList.length > 0 && !selectedEventId) {
        setSelectedEventId(activeList[0].id);
      } else if (meta.items.length > 0 && !selectedEventId) {
        setSelectedEventId(meta.items[0].id);
      }
      setFail(null);
    } catch (err: any) {
      setFail(err.message || 'Etkinlikler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEvents();
  }, []);

  const activeEvent = events.find((e) => e.id === selectedEventId);

  const handleCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) {
      setError('Lütfen bir etkinlik seçin.');
      return;
    }
    if (!qrToken.trim()) {
      setError('Vatandaş QR kodunu girin.');
      return;
    }

    setSavingKey('checkin');
    setLastResult(null);

    try {
      const res = await api.checkInEventParticipant({
        eventId: selectedEventId,
        qrToken: qrToken.trim(),
        notes: notes.trim() || undefined,
      });

      const citizenName = res.userFullName || res.userName || 'Vatandaş';
      setLastResult({
        status: 'success',
        message: `Check-in Başarılı: ${citizenName} katılımı doğrulandı.`,
        user: citizenName,
      });
      setSuccess(`Check-in Başarılı: ${citizenName}`);
      setRecentCheckins((prev) => [
        {
          id: res.id || Date.now().toString(),
          userFullName: citizenName,
          checkInTime: new Date().toISOString(),
          status: 'CHECKED_IN',
          notes: notes.trim(),
        },
        ...prev.slice(0, 19),
      ]);
      setQrToken('');
      setNotes('');
      void loadEvents();
    } catch (err: any) {
      const msg = err.message || 'Check-in işlemi başarısız.';
      if (msg.includes('zaten') || msg.includes('ALREADY')) {
        setLastResult({ status: 'warning', message: 'Mükerrer Check-in: Bu QR kod ile katılım zaten önceden doğrulanmış.' });
      } else {
        setLastResult({ status: 'error', message: msg });
        setError(msg);
      }
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700 }}>Etkinlik Saha Check-in Terminali</h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>
          Personel kapı kontrolü: Etkinlik günü GölBOX QR kodu tarayarak doğrulanmış katılım oluşturun.
        </p>
      </div>

      {fail && <ErrorState description={fail} retry={loadEvents} />}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Left Form */}
        <form onSubmit={handleCheckin} className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>1. Etkinlik ve QR Doğrulama</h2>

          <Select
            label="Aktif Etkinlik Seçin"
            required
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              setRecentCheckins([]);
              setLastResult(null);
            }}
          >
            <option value="">-- Etkinlik Seçin --</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} ({ev.placeName || ev.location || 'Fiziksel Konum'}) — {formatDateTime(ev.startDate)}
              </option>
            ))}
          </Select>

          {activeEvent && (
            <div
              style={{
                background: 'var(--bg-subtle, #f8fafc)',
                padding: '12px 16px',
                borderRadius: 8,
                fontSize: 13,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
              }}
            >
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Kontenjan:</span>{' '}
                <strong>{activeEvent.capacity || 'Sınırsız'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Kayıtlı:</span>{' '}
                <strong>{activeEvent.joinedCount ?? 0} kişi</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>GölPuan Katılım Ödülü:</span>{' '}
                <strong>{activeEvent.pointsReward} GP</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Durum:</span>{' '}
                <StatusBadge status={activeEvent.status} label={activeEvent.status} />
              </div>
            </div>
          )}

          <Input
            label="Vatandaş GölBOX QR Kodu"
            helper="QR tarayıcı ile okutun veya token değerini yapıştırın."
            required
            placeholder="GB-QR-XXXXXX"
            value={qrToken}
            onChange={(e) => setQrToken(e.target.value)}
            autoComplete="off"
            data-testid="event-qr-input"
          />

          <Input
            label="Personel Notu (Opsiyonel)"
            placeholder="Örn: Manuel kimlik teyidi yapıldı"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <Button type="submit" loading={!!savingKey} data-testid="event-checkin-submit">
            ✓ Check-in Yap & Katılımı Doğrula
          </Button>

          {lastResult && (
            <div
              style={{
                padding: 12,
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                background:
                  lastResult.status === 'success'
                    ? 'var(--success-bg, #ecfdf5)'
                    : lastResult.status === 'warning'
                    ? 'var(--warning-bg, #fffbeb)'
                    : 'var(--danger-bg, #fef2f2)',
                color:
                  lastResult.status === 'success'
                    ? 'var(--success-text, #047857)'
                    : lastResult.status === 'warning'
                    ? 'var(--warning-text, #b45309)'
                    : 'var(--danger-text, #b91c1c)',
                border: `1px solid ${
                  lastResult.status === 'success'
                    ? '#a7f3d0'
                    : lastResult.status === 'warning'
                    ? '#fde68a'
                    : '#fecaca'
                }`,
              }}
            >
              {lastResult.message}
            </div>
          )}
        </form>

        {/* Right Table */}
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>2. Bu Etkinlikteki Son Check-in Kayıtları</h2>
          {recentCheckins.length === 0 ? (
            <EmptyState
              title="Henüz check-in kaydı bulunmuyor."
              description="Sol taraftaki form üzerinden QR okutarak katılım doğrulaması gerçekleştirebilirsiniz."
            />
          ) : (
            <DataTable
              caption="Anlık Check-in Listesi"
              rows={recentCheckins}
              getRowId={(r) => r.id}
              columns={[
                { key: 'time', header: 'Saat', render: (r) => formatDateTime(r.checkInTime) },
                { key: 'user', header: 'Vatandaş', render: (r) => r.userFullName },
                { key: 'status', header: 'Durum', render: (r) => <StatusBadge status={r.status} label="Katıldı (Doğrulandı)" /> },
                { key: 'notes', header: 'Not', render: (r) => r.notes || '—' },
              ]}
            />
          )}
        </div>
      </div>
    </div>
  );
}
