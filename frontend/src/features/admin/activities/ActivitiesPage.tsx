import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { pagedMeta } from '../../../lib/adminQuery';
import { activityStatusLabel, MAX_ACTIVITY_REWARD_GP } from '../../../lib/adminLabels';
import { formatDateTime, toLocalInput } from '../../../lib/adminDate';
import { EmptyState, FilterBar, ListError, PaginationBar, TableWrap } from '../../../components/admin/FilterBar';
import { btnDanger, btnNeutral, btnPrimary, inputStyle } from '../../../components/admin/adminUi';
import { useAdminFeedback } from '../AdminFeedback';

export function ActivitiesPage() {
  const { isAdmin, confirm, setError, setSuccess, savingKey, setSavingKey } = useAdminFeedback();
  const [items, setItems] = useState<any[]>([]);
  const [places, setPlaces] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [fail, setFail] = useState<string | null>(null);
  const [form, setForm] = useState<any>(null);

  const load = async () => {
    try {
      const res = await api.getAdminActivities({ page, pageSize: 25, filter: filter || undefined, search: search || undefined });
      const meta = pagedMeta(res, page, 25);
      setItems(meta.items);
      setTotal(meta.totalCount);
      setFail(null);
    } catch (err: any) {
      setFail(err.message);
    }
  };
  useEffect(() => { void load(); }, [page, filter]);
  useEffect(() => { void api.getAdminPlaces({ pageSize: 100 }).then((r) => setPlaces(pagedMeta(r).items)).catch(() => undefined); }, []);

  const payload = (f: any) => ({
    title: f.title,
    description: f.description,
    pointsReward: Number(f.pointsReward || 0),
    capacity: Number(f.capacity || 0),
    startDate: new Date(`${f.startDate}T${f.startTime || '10:00'}`).toISOString(),
    endDate: new Date(`${f.endDate}T${f.endTime || '12:00'}`).toISOString(),
    placeId: f.placeId || null,
    location: f.placeId ? '' : f.location
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {isAdmin && <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button type="button" data-testid="activity-create" style={btnPrimary} onClick={() => setForm({ title: '', description: '', pointsReward: 50, capacity: 50, startDate: '', startTime: '10:00', endDate: '', endTime: '12:00', placeId: '', location: '' })}>+ Yeni etkinlik</button></div>}
      <FilterBar search={search} onSearch={setSearch} activeCount={[search, filter].filter(Boolean).length} onClear={() => { setSearch(''); setFilter(''); }} filters={
        <>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={inputStyle}>
            <option value="">Tümü</option>
            <option value="upcoming">Yaklaşan</option>
            <option value="ongoing">Devam eden</option>
            <option value="ended">Biten</option>
            <option value="draft">Taslak</option>
            <option value="published">Yayında</option>
          </select>
          <button type="button" style={btnPrimary} onClick={() => { setPage(1); void load(); }}>Filtrele</button>
        </>
      } />
      {fail && <ListError message={fail} onRetry={load} />}
      {items.length === 0 ? <EmptyState title="Henüz etkinlik yok." actionLabel={isAdmin ? '+ Yeni etkinlik' : undefined} onAction={isAdmin ? () => setForm({ title: '', startTime: '10:00', endTime: '12:00' }) : undefined} /> : (
        <TableWrap>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 960, fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                <th style={{ padding: 10 }}>Başlık</th>
                <th style={{ padding: 10 }}>Başlangıç</th>
                <th style={{ padding: 10 }}>Bitiş</th>
                <th style={{ padding: 10 }}>Tesis</th>
                <th style={{ padding: 10 }}>Kontenjan</th>
                <th style={{ padding: 10 }}>Katılım</th>
                <th style={{ padding: 10 }}>GP</th>
                <th style={{ padding: 10 }}>Durum</th>
                <th style={{ padding: 10 }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: 10 }}>{a.title}</td>
                  <td style={{ padding: 10 }}>{formatDateTime(a.startDate)}</td>
                  <td style={{ padding: 10 }}>{formatDateTime(a.endDate)}</td>
                  <td style={{ padding: 10 }}>{a.placeName || a.location || '—'}</td>
                  <td style={{ padding: 10 }}>{a.capacity ?? '—'}</td>
                  <td style={{ padding: 10 }}>{a.joinedCount ?? 0}</td>
                  <td style={{ padding: 10 }}>{a.pointsReward}</td>
                  <td style={{ padding: 10 }}>{activityStatusLabel(a.status, a.startDate, a.endDate)}</td>
                  <td style={{ padding: 10 }}>
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button type="button" style={btnNeutral} onClick={() => setForm({
                          ...a,
                          startDate: toLocalInput(a.startDate).slice(0, 10),
                          startTime: toLocalInput(a.startDate).slice(11, 16),
                          endDate: toLocalInput(a.endDate).slice(0, 10),
                          endTime: toLocalInput(a.endDate).slice(11, 16)
                        })}>Düzenle</button>
                        {a.status === 'Active' ? <button type="button" style={btnNeutral} onClick={async () => { await api.unpublishActivity(a.id); setSuccess('Etkinlik taslağa alındı.'); await load(); }}>Yayından al</button>
                          : <button type="button" style={btnPrimary} onClick={async () => { await api.publishActivity(a.id); setSuccess('Etkinlik yayına alındı.'); await load(); }}>Yayınla</button>}
                        <button type="button" style={btnDanger} onClick={() => confirm({ title: 'Arşivle', message: 'Etkinlik arşivlenecek. Devam edilsin mi?', danger: true, onConfirm: async () => { await api.archiveActivity(a.id); setSuccess('Etkinlik arşivlendi.'); await load(); } })}>Arşivle</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}
      <PaginationBar page={page} pageSize={25} totalCount={total} onPage={setPage} onPageSize={() => undefined} />
      {form && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)', display: 'grid', placeItems: 'center', zIndex: 80 }} onClick={() => setForm(null)}>
          <form style={{ background: '#fff', padding: 24, width: 460, borderRadius: 16, display: 'grid', gap: 8 }} onClick={(e) => e.stopPropagation()} onSubmit={async (e) => {
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
            <input required placeholder="Başlık" data-testid="activity-title" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} />
            <label>Belediye tesisi (opsiyonel)
              <select value={form.placeId || ''} onChange={(e) => setForm({ ...form, placeId: e.target.value })} style={inputStyle}>
                <option value="">Tesis seçilmedi — serbest konum yazın</option>
                {places.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
            {form.placeId ? <div style={{ fontSize: 12, color: '#1d5f60' }}>Tesis adresi ve konum bilgisi kullanılacak.</div> : <input placeholder="Serbest konum" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} style={inputStyle} />}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <label className="admin-label">Başlangıç tarihi
                <input required type="date" value={form.startDate || ''} onChange={(e) => setForm({ ...form, startDate: e.target.value })} style={inputStyle} />
              </label>
              <label className="admin-label">Başlangıç saati
                <input required type="time" value={form.startTime || '10:00'} onChange={(e) => setForm({ ...form, startTime: e.target.value })} style={inputStyle} />
              </label>
              <label className="admin-label">Bitiş tarihi
                <input required type="date" value={form.endDate || ''} onChange={(e) => setForm({ ...form, endDate: e.target.value })} style={inputStyle} />
              </label>
              <label className="admin-label">Bitiş saati
                <input required type="time" value={form.endTime || '12:00'} onChange={(e) => setForm({ ...form, endTime: e.target.value })} style={inputStyle} />
              </label>
            </div>
            <input type="number" min={0} placeholder="Kontenjan" value={form.capacity ?? 0} onChange={(e) => setForm({ ...form, capacity: e.target.value })} style={inputStyle} />
            <input type="number" min={0} placeholder="GP" value={form.pointsReward ?? 0} onChange={(e) => setForm({ ...form, pointsReward: e.target.value })} style={inputStyle} />
            <button type="submit" disabled={!!savingKey} style={btnPrimary}>{savingKey ? 'Kaydediliyor…' : 'Kaydet'}</button>
          </form>
        </div>
      )}
    </div>
  );
}
