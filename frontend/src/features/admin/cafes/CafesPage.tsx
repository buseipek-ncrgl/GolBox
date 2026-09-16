import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../../services/api';
import { pagedMeta } from '../../../lib/adminQuery';
import { EmptyState, FilterBar, ListError, PaginationBar } from '../../../components/admin/FilterBar';
import { AdminSkeletonCard } from '../../../components/admin/AdminSkeleton';
import { btnPrimary, inputStyle, SafeImg } from '../../../components/admin/adminUi';
import { useAdminFeedback } from '../AdminFeedback';

export function CafesPage() {
  const { setError, setSuccess, savingKey, setSavingKey } = useAdminFeedback();
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState('');
  const [loading, setLoading] = useState(true);
  const [fail, setFail] = useState<string | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [places, setPlaces] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminCafes({ page, pageSize: 25, search: search || undefined, active: active === '' ? undefined : active === 'true' });
      const meta = pagedMeta(res, page, 25);
      setItems(meta.items);
      setTotal(meta.totalCount);
      setFail(null);
    } catch (err: any) {
      setFail(err.message || 'Kafeler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void load(); }, [page, active]);
  useEffect(() => { void api.getAdminPlaces({ pageSize: 100 }).then((r) => setPlaces(pagedMeta(r).items)).catch(() => undefined); }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ color: '#64748b', margin: 0 }}>Fiziksel adres, konum ve çalışma saatleri Tesisler bölümünden yönetilir. Menü ve Ismarlıyor işlemleri bu bölümden yönetilir.</p>
      <FilterBar search={search} onSearch={setSearch} activeCount={[search, active].filter(Boolean).length} onClear={() => { setSearch(''); setActive(''); setPage(1); void load(); }} filters={
        <>
          <select value={active} onChange={(e) => setActive(e.target.value)} style={inputStyle}>
            <option value="">Aktiflik</option>
            <option value="true">Aktif</option>
            <option value="false">Pasif</option>
          </select>
          <button type="button" style={btnPrimary} onClick={() => { setPage(1); void load(); }}>Filtrele</button>
        </>
      } />
      {fail && <ListError message={fail} onRetry={load} />}
      {loading ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 12 }}><AdminSkeletonCard /><AdminSkeletonCard /></div> : items.length === 0 ? <EmptyState title="Henüz kafe yok." /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
          {items.map((c) => (
            <div key={c.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
              {c.imageUrl ? <SafeImg src={c.imageUrl} alt={c.name} style={{ width: '100%', height: 120, objectFit: 'cover' }} /> : <div style={{ height: 80, background: '#1d5f60' }} />}
              <div style={{ padding: 16, display: 'grid', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{c.name}</strong>
                  <span className={`admin-badge ${c.isActive === false ? 'admin-badge-neutral' : 'admin-badge-success'}`}>{c.isActive === false ? 'Pasif' : 'Aktif'}</span>
                </div>
                <div style={{ fontSize: 13, color: '#64748b' }}>Bağlı tesis: {c.placeName || 'Atanmamış'}</div>
                <div style={{ fontSize: 13 }}>Menü: {c.menuCount ?? 0} · Bekleyen Ismarlıyor: {c.pendingOrders ?? 0}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" style={btnPrimary} onClick={() => setEditing(c)}>Düzenle</button>
                  <Link to={`/admin/menu?cafeId=${c.id}`} style={{ ...btnPrimary, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Menüyü Yönet</Link>
                  {c.placeId && <Link to="/admin/tesisler" style={{ fontSize: 13 }}>Tesis bilgilerini düzenle</Link>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <PaginationBar page={page} pageSize={25} totalCount={total} onPage={setPage} onPageSize={() => undefined} />
      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)', display: 'grid', placeItems: 'center', zIndex: 80 }} onClick={() => setEditing(null)}>
          <form style={{ background: '#fff', padding: 24, borderRadius: 16, width: 420, display: 'grid', gap: 8 }} onClick={(e) => e.stopPropagation()} onSubmit={async (e) => {
            e.preventDefault();
            setSavingKey('cafe');
            try {
              await api.updateCafe(editing.id, { name: editing.name, address: editing.address, imageUrl: editing.imageUrl, isActive: editing.isActive, placeId: editing.placeId || null });
              setSuccess('Kafe güncellendi.');
              setEditing(null);
              await load();
            } catch (err: any) {
              setError(err.message);
            } finally {
              setSavingKey(null);
            }
          }}>
            <h3>Kafe düzenle</h3>
            <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} style={inputStyle} />
            <input value={editing.address || ''} onChange={(e) => setEditing({ ...editing, address: e.target.value })} style={inputStyle} />
            <input value={editing.imageUrl || ''} onChange={(e) => setEditing({ ...editing, imageUrl: e.target.value })} style={inputStyle} />
            <label><input type="checkbox" checked={editing.isActive !== false} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} /> Aktif</label>
            <label>Bağlı Belediye Tesisi
              <select value={editing.placeId || ''} onChange={(e) => setEditing({ ...editing, placeId: e.target.value })} style={inputStyle}>
                <option value="">Seçilmedi</option>
                {places.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
            <button type="submit" disabled={!!savingKey} style={btnPrimary}>{savingKey ? 'Kaydediliyor…' : 'Kaydet'}</button>
          </form>
        </div>
      )}
    </div>
  );
}
