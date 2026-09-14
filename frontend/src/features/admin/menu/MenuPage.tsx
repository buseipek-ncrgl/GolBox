import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../../services/api';
import { extractArray, pagedMeta } from '../../../lib/adminQuery';
import { educationLabel } from '../../../lib/adminLabels';
import { EmptyState, FilterBar, ListError, PaginationBar } from '../../../components/admin/FilterBar';
import { AdminSkeletonCard } from '../../../components/admin/AdminSkeleton';
import { btnNeutral, btnPrimary, inputStyle, SafeImg } from '../../../components/admin/adminUi';
import { useAdminFeedback } from '../AdminFeedback';

export function MenuPage() {
  const { setError, setSuccess, savingKey, setSavingKey } = useAdminFeedback();
  const [params] = useSearchParams();
  const [items, setItems] = useState<any[]>([]);
  const [cafes, setCafes] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [cafeId, setCafeId] = useState(params.get('cafeId') || '');
  const [active, setActive] = useState('');
  const [loading, setLoading] = useState(true);
  const [fail, setFail] = useState<string | null>(null);
  const [form, setForm] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminMenuItems({ page, pageSize: 25, search: search || undefined, cafeId: cafeId || undefined, active: active === '' ? undefined : active === 'true' });
      const meta = pagedMeta(res, page, 25);
      setItems(meta.items);
      setTotal(meta.totalCount);
      setFail(null);
    } catch (err: any) {
      setFail(err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void load(); }, [page, cafeId, active]);
  useEffect(() => { void api.getCafes().then((c) => setCafes(Array.isArray(c) ? c : extractArray(c))); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cafeId) { setError('Kafe seçilmelidir.'); return; }
    if (!form.price || Number(form.price) <= 0) { setError('Fiyat 0\'dan büyük olmalıdır.'); return; }
    setSavingKey('menu');
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        imageUrl: form.imageUrl,
        minAge: form.minAge ? Number(form.minAge) : null,
        requiredEducation: form.requiredEducation || null,
        isActive: form.isActive !== false
      };
      if (form.id) await api.updateMenuItem(form.cafeId, form.id, payload);
      else await api.createMenuItem(form.cafeId, payload);
      setSuccess(form.id ? 'Ürün güncellendi.' : 'Ürün eklendi.');
      setForm(null);
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" style={btnPrimary} onClick={() => setForm({ cafeId, name: '', description: '', price: 45, imageUrl: '', minAge: '', requiredEducation: '', isActive: true })}>+ Yeni ürün</button>
      </div>
      <FilterBar search={search} onSearch={setSearch} activeCount={[search, cafeId, active].filter(Boolean).length} onClear={() => { setSearch(''); setCafeId(''); setActive(''); setPage(1); void load(); }} filters={
        <>
          <select value={cafeId} onChange={(e) => { setCafeId(e.target.value); setPage(1); }} style={inputStyle}>
            <option value="">Kafe</option>
            {cafes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={active} onChange={(e) => setActive(e.target.value)} style={inputStyle}>
            <option value="">Aktif/pasif</option>
            <option value="true">Aktif</option>
            <option value="false">Pasif</option>
          </select>
          <button type="button" style={btnPrimary} onClick={() => { setPage(1); void load(); }}>Filtrele</button>
        </>
      } />
      {fail && <ListError message={fail} onRetry={load} />}
      {loading ? <AdminSkeletonCard /> : items.length === 0 ? <EmptyState title="Henüz ürün yok." actionLabel="+ Yeni ürün" onAction={() => setForm({ cafeId, name: '', price: 45, isActive: true })} /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
          {items.map((item) => (
            <div key={item.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
              {item.imageUrl && <SafeImg src={item.imageUrl} alt={item.name} style={{ width: '100%', height: 120, objectFit: 'cover' }} />}
              <div style={{ padding: 14, display: 'grid', gap: 6 }}>
                <strong>{item.name}</strong>
                <div>{item.price} TL · {item.cafeName}</div>
                <div style={{ fontSize: 12 }}>{item.isActive === false ? 'Pasif' : 'Aktif'} {item.minAge ? `· Min yaş ${item.minAge}` : ''} {item.requiredEducation ? `· ${educationLabel(item.requiredEducation)}` : ''}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" style={btnNeutral} onClick={() => setForm(item)}>Düzenle</button>
                  <button type="button" style={item.isActive === false ? btnPrimary : btnNeutral} onClick={async () => {
                    setSavingKey(item.id);
                    try {
                      await api.updateMenuItem(item.cafeId, item.id, { name: item.name, description: item.description, price: item.price, imageUrl: item.imageUrl, minAge: item.minAge, requiredEducation: item.requiredEducation, isActive: item.isActive === false });
                      setSuccess(item.isActive === false ? 'Ürün aktif edildi.' : 'Ürün pasife alındı.');
                      await load();
                    } catch (err: any) {
                      setError(err.message);
                    } finally {
                      setSavingKey(null);
                    }
                  }}>{item.isActive === false ? 'Aktif et' : 'Pasife al'}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <PaginationBar page={page} pageSize={25} totalCount={total} onPage={setPage} onPageSize={() => undefined} />
      {form && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)', display: 'grid', placeItems: 'center', zIndex: 80 }} onClick={() => setForm(null)}>
          <form onSubmit={save} style={{ background: '#fff', padding: 24, width: 420, borderRadius: 16, display: 'grid', gap: 8 }} onClick={(e) => e.stopPropagation()}>
            <h3>{form.id ? 'Ürünü düzenle' : 'Yeni ürün'}</h3>
            <select required value={form.cafeId} onChange={(e) => setForm({ ...form, cafeId: e.target.value })} style={inputStyle}>
              <option value="">Kafe seçin</option>
              {cafes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input required placeholder="Ad" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
            <textarea placeholder="Açıklama" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} style={inputStyle} />
            <input required type="number" min={1} placeholder="Fiyat" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} style={inputStyle} />
            <input placeholder="Görsel URL" value={form.imageUrl || ''} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} style={inputStyle} />
            <input placeholder="Minimum yaş" value={form.minAge || ''} onChange={(e) => setForm({ ...form, minAge: e.target.value })} style={inputStyle} />
            <select value={form.requiredEducation || ''} onChange={(e) => setForm({ ...form, requiredEducation: e.target.value })} style={inputStyle}>
              <option value="">Öğrenim şartı yok</option>
              <option value="Lise">Lise</option>
              <option value="Üniversite">Üniversite</option>
            </select>
            <label><input type="checkbox" checked={form.isActive !== false} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Aktif</label>
            <button type="submit" disabled={!!savingKey} style={btnPrimary}>{savingKey ? 'Kaydediliyor…' : 'Kaydet'}</button>
          </form>
        </div>
      )}
    </div>
  );
}
