import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../../services/api';
import { extractArray, pagedMeta } from '../../../lib/adminQuery';
import { educationLabel } from '../../../lib/adminLabels';
import { Button, Checkbox, EmptyState, ErrorState, FilterBar, Input, Modal, NumberInput, Pagination, Select, Textarea, UnsavedGuard } from '../../../admin/components';
import { SafeImg } from '../../../components/admin/adminUi';
import { useAdminFeedback } from '../AdminFeedback';
import { StaffProductAvailability } from './StaffProductAvailability';
import { ProductEditorDrawer } from './ProductEditorDrawer';

export function MenuPage() {
  const { isAdmin, confirm, setError, setSuccess, savingKey, setSavingKey } = useAdminFeedback();
  const [params] = useSearchParams();
  const [viewMode, setViewMode] = useState<'catalog' | 'availability'>(isAdmin ? 'catalog' : 'availability');

  const [items, setItems] = useState<any[]>([]);
  const [cafes, setCafes] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [cafeId, setCafeId] = useState(params.get('cafeId') || '');
  const [active, setActive] = useState('');
  const [loading, setLoading] = useState(true);
  const [fail, setFail] = useState<unknown>(null);
  const [form, setForm] = useState<any>(null);
  const [snapshot, setSnapshot] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminMenuItems({ page, pageSize: 25, search: search || undefined, cafeId: cafeId || undefined, active: active === '' ? undefined : active === 'true' });
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

  useEffect(() => { void load(); }, [page, cafeId, active]);
  useEffect(() => { void api.getCafes().then((c) => setCafes(Array.isArray(c) ? c : extractArray(c))); }, []);

  const dirty = !!form && JSON.stringify(form) !== snapshot;
  const open = (next: any) => { setForm(next); setSnapshot(JSON.stringify(next)); };
  const close = () => {
    if (dirty) confirm({ title: 'Kaydedilmemiş değişiklikler', message: 'Menü formundaki değişiklikler kaydedilmedi. Kapatılsın mı?', confirmLabel: 'Kapat', danger: true, onConfirm: () => setForm(null) });
    else setForm(null);
  };

  // Staff users use the branch product availability view
  if (!isAdmin || viewMode === 'availability') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {isAdmin && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button size="sm" variant="secondary" onClick={() => setViewMode('catalog')}>
              📋 Katalog Görünümüne Geç (Admin Kataloğu)
            </Button>
          </div>
        )}
        <StaffProductAvailability />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <UnsavedGuard dirty={dirty} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button size="sm" variant="secondary" onClick={() => setViewMode('availability')}>
          ☕ Şube Ürün Durumu Görünümü (Personel)
        </Button>
        <Button data-testid="menu-create" onClick={() => open({ cafeId, name: '', description: '', price: 45, imageUrl: '', minAge: '', requiredEducation: '', isActive: true })}>+ Yeni ürün</Button>
      </div>
      <FilterBar search={search} onSearch={setSearch} activeCount={[search, cafeId, active].filter(Boolean).length} onClear={() => { setSearch(''); setCafeId(''); setActive(''); setPage(1); void load(); }} onSubmit={() => { setPage(1); void load(); }} filters={
        <>
          <Select label="Göl Kafe" value={cafeId} onChange={(e) => { setCafeId(e.target.value); setPage(1); }}>
            <option value="">Tümü</option>
            {cafes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select label="Aktiflik" value={active} onChange={(e) => setActive(e.target.value)}>
            <option value="">Tümü</option>
            <option value="true">Aktif</option>
            <option value="false">Pasif</option>
          </Select>
          <Button type="submit" size="sm">Filtrele</Button>
        </>
      } />
      {fail ? <ErrorState error={fail} retry={load} /> : null}
      {loading ? null : items.length === 0 ? <EmptyState title="Henüz ürün yok." description="Bir Göl Kafe için menü ürünü ekleyin." actionLabel="+ Yeni ürün" onAction={() => open({ cafeId, name: '', price: 45, isActive: true })} /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
          {items.map((item) => (
            <div key={item.id} className="admin-card" style={{ overflow: 'hidden', padding: 0 }} data-testid="menu-row">
              <SafeImg src={item.imageUrl} alt={item.name} style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover' }} />
              <div style={{ padding: 14, display: 'grid', gap: 6 }}>
                <strong>{item.name}</strong>
                <div>{item.price} TL · {item.cafeName}</div>
                <div style={{ fontSize: 12 }}>{item.isActive === false ? 'Pasif' : 'Aktif'} {item.minAge ? `· Min yaş ${item.minAge}` : ''} {item.requiredEducation ? `· ${educationLabel(item.requiredEducation)}` : ''}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button size="sm" variant="secondary" data-testid="menu-edit" onClick={() => open(item)}>Düzenle</Button>
                  <Button size="sm" variant="secondary" onClick={async () => {
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
                  }}>{item.isActive === false ? 'Aktif et' : 'Pasife al'}</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={page} pageSize={25} totalCount={total} onPage={setPage} />
      <ProductEditorDrawer
        open={!!form}
        data={form}
        cafes={cafes}
        allProducts={items}
        onClose={close}
        loading={!!savingKey}
        onSave={async (formData) => {
          setSavingKey('menu-save');
          try {
            if (formData.id) await api.updateMenuItem(formData.cafeId, formData.id, formData);
            else await api.createMenuItem(formData.cafeId, formData);
            setSuccess('Ürün kataloğu başarıyla güncellendi.');
            setForm(null);
            await load();
          } catch (err: any) {
            setError(err.message || 'Ürün kaydedilemedi.');
          } finally {
            setSavingKey(null);
          }
        }}
      />
    </div>
  );
}
