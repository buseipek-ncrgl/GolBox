import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Award, CalendarCheck2, Clock3, Gauge, QrCode, RefreshCw, ShieldCheck, UserCheck, Users } from 'lucide-react';
import { api } from '../../../services/api';
import { pagedMeta } from '../../../lib/adminQuery';
import { formatDateTime, formatGp } from '../../../lib/adminDate';
import { Button, EmptyState, ErrorState, Input, Select, StatusBadge } from '../../../admin/components';
import { useAdminFeedback } from '../AdminFeedback';

export function EventCheckinOperationsPage() {
  const { setError, setSuccess, savingKey, setSavingKey } = useAdminFeedback();
  const [events, setEvents] = useState<any[]>([]);
  const [eventId, setEventId] = useState('');
  const [summary, setSummary] = useState<any | null>(null);
  const [token, setToken] = useState('');
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [failure, setFailure] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadEvents = useCallback(async () => {
    setLoading(true); setFailure(null);
    try {
      const response = await api.getAdminActivities({ page: 1, pageSize: 100 });
      const list = pagedMeta(response).items.filter((event: any) => event.status === 'Active');
      setEvents(list);
      setEventId((current) => current || list[0]?.id || '');
    } catch (cause: any) { setFailure(cause.message || 'Etkinlikler yüklenemedi.'); }
    finally { setLoading(false); }
  }, []);
  const loadCheckins = useCallback(async () => {
    if (!eventId) { setSummary(null); return; }
    try { setSummary(await api.getEventCheckins(eventId)); }
    catch (cause: any) { setFailure(cause.message || 'Katılım kayıtları yüklenemedi.'); }
  }, [eventId]);

  useEffect(() => { void loadEvents(); }, [loadEvents]);
  useEffect(() => { setResult(null); setToken(''); void loadCheckins(); }, [loadCheckins]);
  const event = events.find((item) => item.id === eventId);
  const checkedIn = summary?.checkedInCount ?? event?.checkedInCount ?? 0;
  const registered = summary?.registeredCount ?? event?.joinedCount ?? 0;
  const capacity = event?.capacity ?? null;
  const remaining = capacity == null ? null : Math.max(0, capacity - registered);
  const attendance = registered ? Math.round((checkedIn / registered) * 100) : 0;
  const recent = useMemo(() => (summary?.items || []).filter((item: any) => item.checkedInAt).slice(0, 12), [summary]);

  const submit = async (formEvent: React.FormEvent) => {
    formEvent.preventDefault();
    if (!eventId || !token.trim()) return;
    setSavingKey('event-checkin'); setResult(null);
    try {
      const response = await api.checkInEventParticipant({ eventId, qrToken: token.trim(), notes: notes.trim() || undefined });
      setResult(response); setSuccess(`${response.userFullName} katılımı doğrulandı. ${response.pointsEarned} GölPuan eklendi.`);
      setToken(''); setNotes(''); await loadCheckins(); await loadEvents(); inputRef.current?.focus();
    } catch (cause: any) { setError(cause.message || 'Check-in tamamlanamadı.'); }
    finally { setSavingKey(null); }
  };

  return <div className="event-checkin-page">
    <div className="event-checkin-toolbar"><Select label="Aktif etkinlik" value={eventId} onChange={(e) => setEventId(e.target.value)}><option value="">Etkinlik seçin</option>{events.map((item) => <option key={item.id} value={item.id}>{item.title} · {formatDateTime(item.startDate)}</option>)}</Select><Button size="sm" variant="secondary" loading={loading} onClick={() => { void loadEvents(); void loadCheckins(); }}><RefreshCw size={14} /> Yenile</Button></div>
    {failure ? <ErrorState description={failure} retry={loadEvents} /> : null}
    <div className="catalog-summary event-checkin-summary"><div className="catalog-summary-item"><Users size={18} /><span>Kayıtlı</span><strong>{registered}</strong></div><div className="catalog-summary-item"><UserCheck size={18} /><span>Giriş yapan</span><strong>{checkedIn}</strong></div><div className="catalog-summary-item"><CalendarCheck2 size={18} /><span>Kalan kontenjan</span><strong>{remaining ?? '—'}</strong></div><div className="catalog-summary-item"><Gauge size={18} /><span>Katılım oranı</span><strong>%{attendance}</strong></div><div className="catalog-summary-item"><Award size={18} /><span>Katılım ödülü</span><strong>{formatGp(event?.pointsReward ?? 0)}</strong></div></div>
    <div className="event-checkin-layout"><section className="event-terminal admin-card"><header><span><QrCode size={23} /></span><div><h2>Katılım doğrulama</h2><p>Vatandaşın mobil GölBOX QR kodunu okutun.</p></div></header>
      {event ? <div className="event-context"><div><CalendarCheck2 size={18} /><span><strong>{event.title}</strong><small>{event.placeName || event.location}</small></span></div><StatusBadge status={event.status} label="Check-in açık" /></div> : null}
      <form onSubmit={submit} className="event-scan-form"><label><span>GölBOX QR kodu</span><div><QrCode size={20} /><input ref={inputRef} required autoFocus autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} placeholder="QR kodunu okutun" /><Button type="submit" loading={savingKey === 'event-checkin'}>Katılımı Doğrula</Button></div><small>Dinamik mobil QR kodu kısa süre geçerlidir ve tekrar kullanılamaz.</small></label><Input label="Personel notu" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="İsteğe bağlı operasyon notu" /></form>
      {result ? <div className="event-checkin-result"><span><UserCheck size={24} /></span><div><strong>Katılım doğrulandı</strong><b>{result.userFullName}</b><small>{result.activityTitle}</small></div><div><strong>+{result.pointsEarned} GP</strong><small>Yeni bakiye: {result.newPointsBalance} GP</small></div></div> : <div className="event-checkin-idle"><ShieldCheck size={28} /><strong>QR doğrulaması bekleniyor</strong><span>Yalnızca etkinliğe kayıtlı vatandaşlar kabul edilir.</span></div>}
    </section><aside className="event-recent admin-card"><header><div><h2>Son girişler</h2><p>Seçili etkinliğin doğrulanmış katılımları</p></div><Clock3 size={18} /></header>{recent.length ? <div className="event-recent-list">{recent.map((item: any) => <div key={item.id}><span><UserCheck size={15} /></span><div><strong>{item.userFullName}</strong><small>{item.email}</small></div><div><b>+{item.pointsEarned} GP</b><small>{formatDateTime(item.checkedInAt)}</small></div></div>)}</div> : <EmptyState title="Henüz giriş yapılmadı." description="Doğrulanan katılımlar burada görüntülenir." />}</aside></div>
  </div>;
}
