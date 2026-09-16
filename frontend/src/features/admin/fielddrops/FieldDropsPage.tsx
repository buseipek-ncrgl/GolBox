import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { pagedMeta } from '../../../lib/adminQuery';
import { fieldDropStatusLabel } from '../../../lib/adminLabels';
import { formatDateTime, toLocalInput } from '../../../lib/adminDate';
import { EmptyState, FilterBar, ListError, PaginationBar } from '../../../components/admin/FilterBar';
import { btnDanger, btnNeutral, btnPrimary, inputStyle } from '../../../components/admin/adminUi';
import { AdminMapPicker } from '../../../components/admin/AdminMapPicker';
import { useAdminFeedback } from '../AdminFeedback';

export function FieldDropsPage() {
  const { confirm, setError, setSuccess, savingKey, setSavingKey } = useAdminFeedback();
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [fail, setFail] = useState<string | null>(null);
  const [form, setForm] = useState<any>(null);
  const [advanced, setAdvanced] = useState(false);

  const load = async () => {
    try {
      const res = await api.getFieldDrops({ page, pageSize: 25, filter: filter || undefined, search: search || undefined });
      const meta = pagedMeta(res, page, 25);
      setItems(meta.items);
      setTotal(meta.totalCount);
      setFail(null);
    } catch (err: any) {
      setFail(err.message);
    }
  };
  useEffect(() => { void load(); }, [page, filter]);

  const empty = () => ({
    title: '', description: '', latitude: 37.0662, longitude: 37.3781, radiusMeters: 40, pointsGranted: 25,
    totalStock: 100, perUserLimit: 1, isActive: true, startsAt: toLocalInput(new Date().toISOString()), endsAt: toLocalInput(new Date(Date.now() + 30 * 86400000).toISOString()),
    imageUrl: '', modelGlbUrl: ''
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button type="button" style={btnPrimary} onClick={() => setForm(empty())}>+ Konuma hediye bırak</button></div>
      <FilterBar search={search} onSearch={setSearch} activeCount={[search, filter].filter(Boolean).length} onClear={() => { setSearch(''); setFilter(''); setPage(1); void load(); }} filters={
        <>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={inputStyle}>
            <option value="">Tümü</option>
            <option value="active">Aktif</option>
            <option value="stopped">Durduruldu</option>
            <option value="expired">Süresi doldu</option>
          </select>
          <button type="button" style={btnPrimary} onClick={() => { setPage(1); void load(); }}>Filtrele</button>
        </>
      } />
      {fail && <ListError message={fail} onRetry={load} />}
      {items.length === 0 ? <EmptyState title="Henüz saha hediyesi yok." actionLabel="+ Konuma hediye bırak" onAction={() => setForm(empty())} /> : items.map((drop) => (
        <div key={drop.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <strong>{drop.title}</strong>
              <div style={{ fontSize: 13, color: '#64748b' }}>{fieldDropStatusLabel(drop)} · {drop.radiusMeters} m · +{drop.pointsGranted} GP</div>
              <div style={{ fontSize: 13 }}>Stok {drop.remainingStock ?? drop.totalStock ?? '∞'} · Kalan {drop.remainingStock ?? '—'} · Toplanan {drop.capturedCount || 0} · {formatDateTime(drop.startsAt)} – {formatDateTime(drop.endsAt)}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" style={btnNeutral} onClick={() => setForm({ ...drop, startsAt: toLocalInput(drop.startsAt), endsAt: toLocalInput(drop.endsAt) })}>Düzenle</button>
              <button type="button" style={btnDanger} onClick={() => confirm({ title: 'Kaldır', message: 'Bu saha hediyesi kaldırılacak. Devam edilsin mi?', danger: true, confirmLabel: 'Kaldır', onConfirm: async () => { await api.deleteFieldDrop(drop.id); setSuccess('Saha hediyesi kaldırıldı.'); await load(); } })}>Kaldır</button>
            </div>
          </div>
        </div>
      ))}
      <PaginationBar page={page} pageSize={25} totalCount={total} onPage={setPage} onPageSize={() => undefined} />
      {form && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)', zIndex: 80, overflowY: 'auto', padding: 24 }} onClick={() => setForm(null)}>
          <form style={{ background: '#fff', maxWidth: 640, margin: '0 auto', borderRadius: 16, padding: 24, display: 'grid', gap: 10 }} onClick={(e) => e.stopPropagation()} onSubmit={async (e) => {
            e.preventDefault();
            setSavingKey('fd');
            try {
              const payload = {
                title: form.title, description: form.description, latitude: Number(form.latitude), longitude: Number(form.longitude),
                radiusMeters: Number(form.radiusMeters), pointsGranted: Number(form.pointsGranted), totalStock: form.totalStock === '' ? null : Number(form.totalStock),
                perUserLimit: Number(form.perUserLimit || 1), isActive: form.isActive !== false,
                startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
                endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
                imageUrl: form.imageUrl, modelGlbUrl: form.modelGlbUrl
              };
              if (form.id) await api.updateFieldDrop(form.id, payload);
              else await api.createFieldDrop(payload);
              setSuccess(form.id ? 'Saha hediyesi güncellendi.' : 'Saha hediyesi oluşturuldu.');
              setForm(null);
              await load();
            } catch (err: any) {
              setError(err.message);
            } finally {
              setSavingKey(null);
            }
          }}>
            <h3>{form.id ? 'Saha hediyesi düzenle' : 'Konuma hediye bırak'}</h3>
            <input required placeholder="Başlık" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} />
            <textarea placeholder="Açıklama" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} style={inputStyle} />
            <div style={{ minHeight: 280 }}>
            <AdminMapPicker latitude={Number(form.latitude)} longitude={Number(form.longitude)} radiusMeters={Number(form.radiusMeters)} onChange={(lat, lng) => setForm({ ...form, latitude: lat, longitude: lng })} />
            </div>
            <label>Yarıçap (m)<input type="number" value={form.radiusMeters} onChange={(e) => setForm({ ...form, radiusMeters: e.target.value })} style={inputStyle} /></label>
            <label>GP<input type="number" value={form.pointsGranted} onChange={(e) => setForm({ ...form, pointsGranted: e.target.value })} style={inputStyle} /></label>
            <label>Stok<input type="number" value={form.totalStock ?? ''} onChange={(e) => setForm({ ...form, totalStock: e.target.value })} style={inputStyle} /></label>
            <button type="button" onClick={() => setAdvanced(!advanced)} style={btnNeutral}>{advanced ? 'Gelişmiş seçenekleri gizle' : 'Gelişmiş seçenekler'}</button>
            {advanced && (
              <>
                <label>Enlem<input value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} style={inputStyle} /></label>
                <label>Boylam<input value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} style={inputStyle} /></label>
                <label>3D / GLB URL<input value={form.modelGlbUrl || ''} onChange={(e) => setForm({ ...form, modelGlbUrl: e.target.value })} style={inputStyle} /></label>
              </>
            )}
            <button type="submit" disabled={!!savingKey} style={btnPrimary}>{savingKey ? 'Kaydediliyor…' : 'Kaydet'}</button>
          </form>
        </div>
      )}
    </div>
  );
}
