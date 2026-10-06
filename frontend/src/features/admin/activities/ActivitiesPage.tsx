import React, { useEffect, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock3, Grid2X2, List, MapPin, Plus, Trash2, Users } from 'lucide-react';
import { api } from '../../../services/api';
import { pagedMeta } from '../../../lib/adminQuery';
import { activityStatusLabel, MAX_ACTIVITY_REWARD_GP } from '../../../lib/adminLabels';
import { formatDateTime, istanbulDateTimeToIso, splitIstanbulDateTime } from '../../../lib/adminDate';
import {
  BulkSelectionBar, Button, DateInput, EmptyState, ErrorState, FilterBar, Input, Modal, NumberInput, Pagination,
  Select, SelectionCheckbox, StatusBadge, Textarea, TimeInput, UnsavedGuard
} from '../../../admin/components';
import { useAdminFeedback } from '../AdminFeedback';

export function ActivitiesPage() {
  const { isAdmin, confirm, setError, setSuccess, savingKey, setSavingKey } = useAdminFeedback();
  const [items, setItems] = useState<any[]>([]);
  const [places, setPlaces] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [fail, setFail] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'card' | 'list'>(() => localStorage.getItem('activities-view') === 'list' ? 'list' : 'card');
  const [form, setForm] = useState<any>(null);
  const [snapshot, setSnapshot] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminActivities({ page, pageSize: 25, filter: filter || undefined, search: search || undefined });
      const meta = pagedMeta(res, page, 25);
      setItems(meta.items);
      setTotal(meta.totalCount);
      setFail(null);
    } catch (err: any) {
      setFail(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void load(); }, [page, filter]);
  useEffect(() => { void api.getAdminPlaces({ pageSize: 100 }).then((r) => setPlaces(pagedMeta(r).items)).catch(() => undefined); }, []);

  const blank = () => ({ title: '', description: '', pointsReward: 50, capacity: 50, startDate: '', startTime: '10:00', endDate: '', endTime: '12:00', placeId: '', location: '' });
  const dirty = !!form && JSON.stringify(form) !== snapshot;
  const open = (next: any) => { setForm(next); setSnapshot(JSON.stringify(next)); };
  const close = () => {
    if (dirty) confirm({ title: 'Kaydedilmemiş değişiklikler', message: 'Etkinlik formundaki değişiklikler kaydedilmedi. Kapatılsın mı?', confirmLabel: 'Kapat', danger: true, onConfirm: () => setForm(null) });
    else setForm(null);
  };

  const payload = (f: any) => ({
    title: f.title,
    description: f.description,
    pointsReward: Number(f.pointsReward || 0),
    capacity: Number(f.capacity || 0),
    startDate: istanbulDateTimeToIso(f.startDate, f.startTime || '10:00'),
    endDate: istanbulDateTimeToIso(f.endDate, f.endTime || '12:00'),
    placeId: f.placeId || null,
    location: f.placeId ? '' : f.location
  });

  const changeView = (next: 'card' | 'list') => {
    setView(next);
    localStorage.setItem('activities-view', next);
  };

  const openEdit = (activity: any) => {
    const start = splitIstanbulDateTime(activity.startDate);
    const end = splitIstanbulDateTime(activity.endDate);
    open({ ...activity, startDate: start.date, startTime: start.time, endDate: end.date, endTime: end.time });
  };

  const remove = (activity: any) => confirm({
    title: 'Etkinliği sil',
    message: `“${activity.title}” kalıcı olarak yönetim listesinden kaldırılacak. Katılım kaydı bulunan etkinlikler silinemez; arşivlenmelidir.`,
    danger: true,
    confirmLabel: 'Etkinliği sil',
    onConfirm: async () => {
      try {
        await api.deleteActivity(activity.id);
        setSuccess('Etkinlik silindi.');
        await load();
      } catch (err: any) {
        setError(err.message);
      }
    }
  });
  const toggle = (id: string, checked: boolean) => setSelected((current) => checked ? [...new Set([...current, id])] : current.filter((value) => value !== id));
  const removeSelected = () => confirm({ title: 'Seçili etkinlikleri sil', message: `${selected.length} etkinlik kaldırılacak. Katılım kaydı bulunan etkinlikler API tarafından korunur.`, confirmLabel: 'Seçilenleri sil', danger: true, onConfirm: async () => { await Promise.all(selected.map((id) => api.deleteActivity(id))); setSelected([]); setSuccess('Seçili etkinlikler silindi.'); await load(); } });

  const actions = (activity: any) => isAdmin ? (
    <div className="activity-actions">
      <Button size="sm" variant="secondary" onClick={() => openEdit(activity)}>Düzenle</Button>
      {activity.status === 'Active'
        ? <Button size="sm" variant="secondary" onClick={async () => { await api.unpublishActivity(activity.id); setSuccess('Etkinlik taslağa alındı.'); await load(); }}>Yayından al</Button>
        : activity.status !== 'Archived' && <Button size="sm" onClick={async () => { await api.publishActivity(activity.id); setSuccess('Etkinlik yayına alındı.'); await load(); }}>Yayınla</Button>}
      {activity.status !== 'Archived' && <Button size="sm" variant="secondary" onClick={() => confirm({ title: 'Etkinliği arşivle', message: 'Etkinlik yayından kaldırılıp arşivlenecek.', danger: true, confirmLabel: 'Arşivle', onConfirm: async () => { await api.archiveActivity(activity.id); setSuccess('Etkinlik arşivlendi.'); await load(); } })}>Arşivle</Button>}
      <button className="activity-delete" type="button" aria-label={`${activity.title} etkinliğini sil`} title="Sil" onClick={() => remove(activity)}><Trash2 size={17} /></button>
    </div>
  ) : null;

  const now = Date.now();
  const upcoming = items.filter((a) => new Date(a.startDate).getTime() > now && a.status === 'Active').length;
  const ongoing = items.filter((a) => new Date(a.startDate).getTime() <= now && new Date(a.endDate).getTime() >= now && a.status === 'Active').length;
  const totalJoined = items.reduce((sum, a) => sum + Number(a.joinedCount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <UnsavedGuard dirty={dirty} />
      <div className="activity-toolbar">
        <div className="activity-view-switch" aria-label="Görünüm seçimi">
          <button type="button" className={view === 'card' ? 'active' : ''} onClick={() => changeView('card')}><Grid2X2 size={16} /> Kart</button>
          <button type="button" className={view === 'list' ? 'active' : ''} onClick={() => changeView('list')}><List size={17} /> Liste</button>
        </div>
        {isAdmin && <Button data-testid="activity-create" onClick={() => open(blank())}><Plus size={17} /> Yeni etkinlik</Button>}
      </div>
      <div className="catalog-summary">
        <div className="catalog-summary-item"><CalendarDays size={18} /><span>Toplam etkinlik</span><strong>{total}</strong></div>
        <div className="catalog-summary-item"><Clock3 size={18} /><span>Yaklaşan</span><strong>{upcoming}</strong></div>
        <div className="catalog-summary-item"><CheckCircle2 size={18} /><span>Devam eden</span><strong>{ongoing}</strong></div>
        <div className="catalog-summary-item"><Users size={18} /><span>Toplam katılım</span><strong>{totalJoined}</strong></div>
      </div>
      <FilterBar search={search} onSearch={setSearch} activeCount={[search, filter].filter(Boolean).length} onClear={() => { setSearch(''); setFilter(''); }} onSubmit={() => { setPage(1); void load(); }} filters={
        <>
          <Select label="Durum" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">Tümü</option>
            <option value="upcoming">Yaklaşan</option>
            <option value="ongoing">Devam eden</option>
            <option value="ended">Biten</option>
            <option value="draft">Taslak</option>
            <option value="published">Yayında</option>
          </Select>
          <Button type="submit" size="sm">Filtrele</Button>
        </>
      } />
      <div className="collection-selection-row"><div className="collection-selection-head"><SelectionCheckbox label="Sayfadaki tüm etkinlikleri seç" checked={items.length > 0 && items.every((item) => selected.includes(item.id))} onChange={(checked) => setSelected(checked ? items.map((item) => item.id) : [])} /><span>Sayfadakileri seç</span></div><BulkSelectionBar count={selected.length} onAction={removeSelected} onClear={() => setSelected([])} /></div>
      {fail ? <ErrorState error={fail} retry={load} /> : null}
      {!loading && items.length === 0 ? <EmptyState title="Henüz etkinlik yok." description="Yeni bir etkinlik oluşturarak vatandaşlara duyurun." actionLabel={isAdmin ? 'Yeni etkinlik' : undefined} onAction={isAdmin ? () => open(blank()) : undefined} /> : !loading && view === 'card' ? (
        <div className="activity-grid">
          {items.map((a) => {
            const capacity = Number(a.capacity || 0);
            const joined = Number(a.joinedCount || 0);
            const occupancy = capacity > 0 ? Math.min(100, Math.round(joined / capacity * 100)) : 0;
            return <article className="activity-card" key={a.id}><SelectionCheckbox label={`${a.title} seç`} checked={selected.includes(a.id)} onChange={(checked) => toggle(a.id, checked)} />
              <header>
                <div className="activity-date"><strong>{new Intl.DateTimeFormat('tr-TR', { day: '2-digit' }).format(new Date(a.startDate))}</strong><span>{new Intl.DateTimeFormat('tr-TR', { month: 'short' }).format(new Date(a.startDate))}</span></div>
                <div><StatusBadge status={a.status} label={activityStatusLabel(a.status, a.startDate, a.endDate)} /><h3>{a.title}</h3></div>
              </header>
              <div className="activity-card-meta">
                <span><Clock3 size={16} />{formatDateTime(a.startDate)} – {formatDateTime(a.endDate)}</span>
                <span><MapPin size={16} />{a.placeName || a.location || 'Konum belirtilmedi'}</span>
              </div>
              <div className="activity-capacity">
                <div><span>Katılım</span><strong>{joined}{capacity > 0 ? ` / ${capacity}` : ''}</strong></div>
                <div className="activity-progress"><i style={{ width: `${occupancy}%` }} /></div>
              </div>
              <footer><span className="activity-points">{a.pointsReward} GP</span>{actions(a)}</footer>
            </article>;
          })}
        </div>
      ) : !loading ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Başlık</th><th>Başlangıç</th><th>Bitiş</th><th>Tesis</th><th>Kontenjan</th><th>Katılım</th><th>GP</th><th>Durum</th><th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id}>
                  <td>{a.title}</td>
                  <td>{formatDateTime(a.startDate)}</td>
                  <td>{formatDateTime(a.endDate)}</td>
                  <td>{a.placeName || a.location || '—'}</td>
                  <td>{a.capacity ?? '—'}</td>
                  <td>{a.joinedCount ?? 0}</td>
                  <td>{a.pointsReward}</td>
                  <td><StatusBadge status={a.status} label={activityStatusLabel(a.status, a.startDate, a.endDate)} /></td>
                  <td>
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        {actions(a)}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <Pagination page={page} pageSize={25} totalCount={total} onPage={setPage} />
      <Modal open={!!form} title={form?.id ? 'Etkinlik düzenle' : 'Yeni etkinlik'} size="lg" onClose={close} footer={
        <>
          <Button variant="secondary" onClick={close}>Vazgeç</Button>
          <Button loading={!!savingKey} onClick={() => void (document.getElementById('activity-form') as HTMLFormElement | null)?.requestSubmit()}>Kaydet</Button>
        </>
      }>
        {form && (
          <form id="activity-form" style={{ display: 'grid', gap: 12 }} onSubmit={async (e) => {
            e.preventDefault();
            if (Number(form.pointsReward) > MAX_ACTIVITY_REWARD_GP) { setError('GP üst limiti aşıldı.'); return; }
            setSavingKey('event');
            try {
              if (form.id) await api.updateActivity(form.id, payload(form));
              else await api.createActivity(payload(form));
              setSuccess(form.id ? 'Etkinlik güncellendi.' : 'Etkinlik oluşturuldu.');
              setForm(null);
              await load();
            } catch (err: any) {
              setError(err.message);
            } finally {
              setSavingKey(null);
            }
          }}>
            <Input required label="Etkinlik Başlığı" data-testid="activity-title" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Textarea label="Açıklama" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Select label="Belediye Tesisi" helper="Opsiyonel" value={form.placeId || ''} onChange={(e) => setForm({ ...form, placeId: e.target.value })}>
              <option value="">Tesis seçilmedi — serbest konum yazın</option>
              {places.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
            {form.placeId
              ? <p className="admin-helper">Tesis adresi ve konum bilgisi kullanılacak.</p>
              : <Input label="Serbest Konum" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} />}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <DateInput required label="Başlangıç Tarihi" value={form.startDate || ''} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              <TimeInput required label="Başlangıç Saati" value={form.startTime || '10:00'} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
              <DateInput required label="Bitiş Tarihi" value={form.endDate || ''} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              <TimeInput required label="Bitiş Saati" value={form.endTime || '12:00'} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            </div>
            <NumberInput required min={0} label="GölPuan Ödülü" value={form.pointsReward ?? 0} onChange={(e) => setForm({ ...form, pointsReward: e.target.value })} />
            <NumberInput required min={0} label="Kontenjan" value={form.capacity ?? 0} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
          </form>
        )}
      </Modal>
    </div>
  );
}
