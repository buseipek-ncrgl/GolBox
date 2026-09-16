import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { pagedMeta } from '../../../lib/adminQuery';
import { activityStatusLabel, MAX_ACTIVITY_REWARD_GP } from '../../../lib/adminLabels';
import { formatDateTime, istanbulDateTimeToIso, splitIstanbulDateTime } from '../../../lib/adminDate';
import {
  Button, DateInput, EmptyState, ErrorState, FilterBar, Input, Modal, NumberInput, Pagination,
  Select, StatusBadge, Textarea, TimeInput, UnsavedGuard
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
  const [form, setForm] = useState<any>(null);
  const [snapshot, setSnapshot] = useState('');

  const load = async () => {
    try {
      const res = await api.getAdminActivities({ page, pageSize: 25, filter: filter || undefined, search: search || undefined });
      const meta = pagedMeta(res, page, 25);
      setItems(meta.items);
      setTotal(meta.totalCount);
      setFail(null);
    } catch (err: any) {
      setFail(err);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <UnsavedGuard dirty={dirty} />
      {isAdmin && <div style={{ display: 'flex', justifyContent: 'flex-end' }}><Button data-testid="activity-create" onClick={() => open(blank())}>+ Yeni etkinlik</Button></div>}
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
      {fail ? <ErrorState error={fail} retry={load} /> : null}
      {items.length === 0 ? <EmptyState title="Henüz etkinlik yok." description="Yeni bir etkinlik oluşturarak vatandaşlara duyurun." actionLabel={isAdmin ? '+ Yeni etkinlik' : undefined} onAction={isAdmin ? () => open(blank()) : undefined} /> : (
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
                        <Button size="sm" variant="secondary" onClick={() => {
                          const start = splitIstanbulDateTime(a.startDate);
                          const end = splitIstanbulDateTime(a.endDate);
                          open({ ...a, startDate: start.date, startTime: start.time, endDate: end.date, endTime: end.time });
                        }}>Düzenle</Button>
                        {a.status === 'Active'
                          ? <Button size="sm" variant="secondary" onClick={async () => { await api.unpublishActivity(a.id); setSuccess('Etkinlik taslağa alındı.'); await load(); }}>Yayından al</Button>
                          : <Button size="sm" onClick={async () => { await api.publishActivity(a.id); setSuccess('Etkinlik yayına alındı.'); await load(); }}>Yayınla</Button>}
                        <Button size="sm" variant="danger" onClick={() => confirm({ title: 'Arşivle', message: 'Etkinlik arşivlenecek. Devam edilsin mi?', danger: true, confirmLabel: 'Arşivle', onConfirm: async () => { await api.archiveActivity(a.id); setSuccess('Etkinlik arşivlendi.'); await load(); } })}>Arşivle</Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
