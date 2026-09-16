import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../../services/api';
import { pagedMeta } from '../../../lib/adminQuery';
import { Button, Checkbox, EmptyState, ErrorState, FilterBar, Input, Modal, Pagination, Select, UnsavedGuard } from '../../../admin/components';
import { SafeImg } from '../../../components/admin/adminUi';
import { useAdminFeedback } from '../AdminFeedback';

export function CafesPage() {
  const { confirm, setError, setSuccess, savingKey, setSavingKey } = useAdminFeedback();
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState('');
  const [loading, setLoading] = useState(true);
  const [fail, setFail] = useState<unknown>(null);
  const [editing, setEditing] = useState<any>(null);
  const [snapshot, setSnapshot] = useState('');
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
      setFail(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void load(); }, [page, active]);
  useEffect(() => { void api.getAdminPlaces({ pageSize: 100 }).then((r) => setPlaces(pagedMeta(r).items)).catch(() => undefined); }, []);

  const dirty = !!editing && JSON.stringify(editing) !== snapshot;
  const open = (next: any) => { setEditing(next); setSnapshot(JSON.stringify(next)); };
  const close = () => {
    if (dirty) confirm({ title: 'Kaydedilmemiş değişiklikler', message: 'Kafe formundaki değişiklikler kaydedilmedi. Kapatılsın mı?', confirmLabel: 'Kapat', danger: true, onConfirm: () => setEditing(null) });
    else setEditing(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <UnsavedGuard dirty={dirty} />
      <p className="admin-muted" style={{ margin: 0 }}>Fiziksel adres, konum ve çalışma saatleri Tesisler bölümünden yönetilir. Menü ve Ismarlıyor işlemleri bu bölümden yönetilir.</p>
      <FilterBar search={search} onSearch={setSearch} activeCount={[search, active].filter(Boolean).length} onClear={() => { setSearch(''); setActive(''); setPage(1); void load(); }} onSubmit={() => { setPage(1); void load(); }} filters={
        <>
          <Select label="Aktiflik" value={active} onChange={(e) => setActive(e.target.value)}>
            <option value="">Tümü</option>
            <option value="true">Aktif</option>
            <option value="false">Pasif</option>
          </Select>
          <Button type="submit" size="sm">Filtrele</Button>
        </>
      } />
      {fail ? <ErrorState error={fail} retry={load} /> : null}
      {loading ? null : items.length === 0 ? <EmptyState title="Henüz kafe yok." description="Tesis kaydı olan Göl Kafeler burada listelenir." /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
          {items.map((c) => (
            <div key={c.id} className="admin-card" style={{ overflow: 'hidden', padding: 0 }} data-testid="cafe-row">
              <SafeImg src={c.imageUrl} alt={c.name} style={{ width: '100%', height: 120, objectFit: 'cover' }} />
              <div style={{ padding: 16, display: 'grid', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{c.name}</strong>
                  <span className={`admin-badge ${c.isActive === false ? 'admin-badge-neutral' : 'admin-badge-success'}`}>{c.isActive === false ? 'Pasif' : 'Aktif'}</span>
                </div>
                <div style={{ fontSize: 13, color: '#64748b' }}>Bağlı tesis: {c.placeName || 'Atanmamış'}</div>
                <div style={{ fontSize: 13 }}>Menü: {c.menuCount ?? 0} · Aktif Ismarlıyor: {c.pendingOrders ?? 0}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Button size="sm" data-testid="cafe-edit" onClick={() => open(c)}>Düzenle</Button>
                  <Link to={`/admin/menu?cafeId=${c.id}`} className="admin-btn admin-btn-secondary admin-btn-sm" style={{ textDecoration: 'none' }}>Menüyü Yönet</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={page} pageSize={25} totalCount={total} onPage={setPage} />
      <Modal open={!!editing} title="Kafe düzenle" onClose={close} footer={
        <>
          <Button variant="secondary" onClick={close}>Vazgeç</Button>
          <Button loading={savingKey === 'cafe'} onClick={() => void (document.getElementById('cafe-form') as HTMLFormElement | null)?.requestSubmit()}>Kaydet</Button>
        </>
      }>
        {editing && (
          <form id="cafe-form" style={{ display: 'grid', gap: 12 }} onSubmit={async (e) => {
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
            <Input required label="Ad" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            <Input label="Adres" value={editing.address || ''} onChange={(e) => setEditing({ ...editing, address: e.target.value })} />
            <Input label="Görsel" helper="Opsiyonel görsel URL" value={editing.imageUrl || ''} onChange={(e) => setEditing({ ...editing, imageUrl: e.target.value })} />
            <Checkbox label="Aktif" helper="Pasif kafeler Ismarlıyor’da yeni sipariş almaz." checked={editing.isActive !== false} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} />
            <Select label="Bağlı Belediye Tesisi" value={editing.placeId || ''} onChange={(e) => setEditing({ ...editing, placeId: e.target.value })}>
              <option value="">Seçilmedi</option>
              {places.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </form>
        )}
      </Modal>
    </div>
  );
}
