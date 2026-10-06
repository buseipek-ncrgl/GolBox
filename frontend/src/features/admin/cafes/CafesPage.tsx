import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, CircleCheck, CirclePause, Clock, Grid2X2, List, MapPin, Menu, Phone, Plus, ShoppingBag, Trash2, Utensils } from 'lucide-react';
import { api } from '../../../services/api';
import { pagedMeta } from '../../../lib/adminQuery';
import { BulkSelectionBar, Button, Checkbox, EmptyState, ErrorState, FilterBar, Input, Modal, Pagination, Select, SelectionCheckbox, UnsavedGuard } from '../../../admin/components';
import { SafeImg } from '../../../components/admin/adminUi';
import { useAdminFeedback } from '../AdminFeedback';

export function CafesPage() {
  const { isAdmin, confirm, setError, setSuccess, savingKey, setSavingKey } = useAdminFeedback();
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState('');
  const [loading, setLoading] = useState(true);
  const [fail, setFail] = useState<unknown>(null);
  const [editing, setEditing] = useState<any>(null);
  const [modalTab, setModalTab] = useState<'basic' | 'location' | 'hours' | 'menu'>('basic');
  const [snapshot, setSnapshot] = useState('');
  const [places, setPlaces] = useState<any[]>([]);
  const [allMenuItems, setAllMenuItems] = useState<any[]>([]);
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([]);
  const [view, setView] = useState<'card' | 'list'>(() => localStorage.getItem('cafes-view') === 'list' ? 'list' : 'card');
  const [selected, setSelected] = useState<string[]>([]);

  // Working hours slots helper state
  const [weekdayHours, setWeekdayHours] = useState('07:30 - 23:00');
  const [weekendHours, setWeekendHours] = useState('08:00 - 00:00');

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
  useEffect(() => {
    if (isAdmin) {
      void api.getAdminPlaces({ pageSize: 100 }).then((r) => setPlaces(pagedMeta(r).items)).catch(() => undefined);
      void api.getAllMenuItems().then((m) => setAllMenuItems(Array.isArray(m) ? m : [])).catch(() => undefined);
    }
  }, [isAdmin]);

  const dirty = !!editing && JSON.stringify(editing) !== snapshot;
  const open = (next: any) => {
    setModalTab('basic');
    setEditing(next);
    setSelectedMenuIds(next.menuItems ? next.menuItems.map((m: any) => m.id) : allMenuItems.map((m) => m.id));
    if (next.workingHours && next.workingHours.includes('|')) {
      const parts = next.workingHours.split('|');
      setWeekdayHours(parts[0]?.trim() || '07:30 - 23:00');
      setWeekendHours(parts[1]?.trim() || '08:00 - 00:00');
    } else {
      setWeekdayHours(next.workingHours || '07:30 - 23:00');
      setWeekendHours('08:00 - 00:00');
    }
    setSnapshot(JSON.stringify(next));
  };
  const blank = () => ({ name: '', address: '', workingHours: 'Hafta İçi: 07:30 - 23:00 | Hafta Sonu: 08:00 - 00:00', phoneNumber: '+90 342 320 00 00', description: '', imageUrl: '', isActive: true, placeId: '' });
  const changeView = (next: 'card' | 'list') => { setView(next); localStorage.setItem('cafes-view', next); };
  const remove = (cafe: any) => confirm({
    title: 'Şubeyi sil',
    message: `“${cafe.name}” şubesi operasyondan kaldırılacak ve vatandaş uygulamasında gösterilmeyecek. Bağlı tesis kaydı korunur.`,
    confirmLabel: 'Şubeyi sil',
    danger: true,
    onConfirm: async () => {
      try { await api.deleteCafe(cafe.id); setSuccess('Şube silindi.'); await load(); }
      catch (err: any) { setError(err.message); }
    }
  });
  const toggleSelected = (id: string) => setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const removeSelected = () => confirm({ title: 'Seçili şubeleri sil', message: `${selected.length} şube operasyondan kaldırılacak. Bağlı tesis kayıtları korunur.`, confirmLabel: `${selected.length} şubeyi sil`, danger: true, onConfirm: async () => { try { await Promise.all(selected.map((id) => api.deleteCafe(id))); setSelected([]); setSuccess('Seçili şubeler silindi.'); await load(); } catch (err: any) { setError(err.message); } } });
  const close = () => {
    if (dirty) confirm({ title: 'Kaydedilmemiş değişiklikler', message: 'Kafe formundaki değişiklikler kaydedilmedi. Kapatılsın mı?', confirmLabel: 'Kapat', danger: true, onConfirm: () => setEditing(null) });
    else setEditing(null);
  };

  const toggleMenuItem = (id: string) => {
    setSelectedMenuIds((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <UnsavedGuard dirty={dirty} />
      <p className="admin-muted" style={{ margin: 0 }}>Şube bilgileri, adres, konum, günlere göre çalışma saatleri ve satılan menü ürünlerini bu alandan yönetebilirsiniz.</p>
      <div className="activity-toolbar">
        <div className="activity-view-switch" aria-label="Şube görünümü">
          <button type="button" className={view === 'card' ? 'active' : ''} aria-pressed={view === 'card'} onClick={() => changeView('card')}><Grid2X2 size={16} /> Kart</button>
          <button type="button" className={view === 'list' ? 'active' : ''} aria-pressed={view === 'list'} onClick={() => changeView('list')}><List size={17} /> Liste</button>
        </div>
        {isAdmin && <Button data-testid="cafe-create" onClick={() => open(blank())}><Plus size={17} /> Yeni şube</Button>}
      </div>
      <div className="catalog-summary branch-summary-grid" aria-label="Şube özeti">
        <div className="catalog-summary-item"><Building2 size={18} /><span>Toplam şube</span><strong>{total}</strong></div>
        <div className="catalog-summary-item"><CircleCheck size={18} /><span>Aktif</span><strong>{items.filter((c) => c.isActive !== false).length}</strong></div>
        <div className="catalog-summary-item"><CirclePause size={18} /><span>Pasif</span><strong>{items.filter((c) => c.isActive === false).length}</strong></div>
        <div className="catalog-summary-item"><Menu size={18} /><span>Menü ürünü</span><strong>{items.reduce((sum, c) => sum + Number(c.menuCount || 0), 0)}</strong></div>
        <div className="catalog-summary-item"><ShoppingBag size={18} /><span>Aktif sipariş</span><strong>{items.reduce((sum, c) => sum + Number(c.pendingOrders || 0), 0)}</strong></div>
      </div>
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
      {isAdmin && <div className="collection-selection-row"><div className="collection-selection-head"><SelectionCheckbox label="Sayfadaki tüm şubeleri seç" checked={items.length > 0 && items.every((item) => selected.includes(item.id))} onChange={(checked) => setSelected(checked ? items.map((item) => item.id) : [])} /><span>Sayfadakileri seç</span></div><BulkSelectionBar count={selected.length} onAction={removeSelected} onClear={() => setSelected([])} /></div>}
      {fail ? <ErrorState error={fail} retry={load} /> : null}
      {loading ? null : items.length === 0 ? <EmptyState title="Henüz şube yok." description="İlk şubeyi oluşturarak menü ve Gel-Al operasyonunu başlatın." actionLabel="Yeni şube" onAction={() => open(blank())} /> : view === 'card' ? (
        <div className="branch-collection branch-collection-cards">
          {items.map((c) => (
            <div key={c.id} className="admin-card" style={{ overflow: 'hidden', padding: 0 }} data-testid="cafe-row">
              {isAdmin && <SelectionCheckbox label={`${c.name} seç`} checked={selected.includes(c.id)} onChange={() => toggleSelected(c.id)} />}
              <SafeImg src={c.imageUrl} alt={c.name} style={{ width: '100%', height: 120, objectFit: 'cover' }} />
              <div style={{ padding: 16, display: 'grid', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{c.name}</strong>
                  <span className={`admin-badge ${c.isActive === false ? 'admin-badge-neutral' : 'admin-badge-success'}`}>{c.isActive === false ? 'Pasif' : 'Aktif'}</span>
                </div>
                <div style={{ fontSize: 13, color: '#64748b' }}>Saatler: {c.workingHours || '07:30 - 23:00'}</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>Harita Tesis Kaydı: {c.placeName || 'Atanmamış'}</div>
                <div style={{ fontSize: 13 }}>Menü: {c.menuCount ?? 0} · Aktif Ismarlıyor: {c.pendingOrders ?? 0}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {isAdmin && <Button size="sm" data-testid="cafe-edit" onClick={() => open(c)}>Düzenle</Button>}
                  <Link to={`/admin/menu?cafeId=${c.id}`} className="admin-btn admin-btn-secondary admin-btn-sm" style={{ textDecoration: 'none' }}>Menüyü Yönet</Link>
                  <Link to="/admin/orders" className="admin-btn admin-btn-secondary admin-btn-sm" style={{ textDecoration: 'none' }}>Ismarlıyor Siparişleri</Link>
                  {isAdmin && <button type="button" className="activity-delete" title="Sil" aria-label={`${c.name} şubesini sil`} onClick={() => remove(c)}><Trash2 size={17} /></button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr>{isAdmin && <th>Seç</th>}<th>Şube</th><th>Harita Tesis Kaydı</th><th>Saatler</th><th>Menü</th><th>Aktif sipariş</th><th>Durum</th><th></th></tr></thead><tbody>{items.map((c) => <tr key={c.id} data-testid="cafe-row">{isAdmin && <td><input aria-label={`${c.name} seç`} type="checkbox" checked={selected.includes(c.id)} onChange={() => toggleSelected(c.id)} /></td>}<td><strong>{c.name}</strong><div className="admin-muted">{c.address || 'Adres belirtilmedi'}</div></td><td>{c.placeName || 'Atanmamış'}</td><td>{c.workingHours || '07:30 - 23:00'}</td><td>{c.menuCount ?? 0} ürün</td><td>{c.pendingOrders ?? 0}</td><td><span className={`admin-badge ${c.isActive === false ? 'admin-badge-neutral' : 'admin-badge-success'}`}>{c.isActive === false ? 'Pasif' : 'Aktif'}</span></td><td><div className="activity-actions">{isAdmin && <Button size="sm" variant="secondary" onClick={() => open(c)}>Düzenle</Button>}<Link to={`/admin/menu?cafeId=${c.id}`} className="admin-btn admin-btn-secondary admin-btn-sm" style={{ textDecoration: 'none' }}>Stok durumunu yönet</Link>{isAdmin && <button type="button" className="activity-delete" title="Sil" aria-label={`${c.name} şubesini sil`} onClick={() => remove(c)}><Trash2 size={17} /></button>}</div></td></tr>)}</tbody></table></div>
      )}
      <Pagination page={page} pageSize={25} totalCount={total} onPage={setPage} />

      {/* Şube Düzenleme / Ekleme Modalı (Sekmeli Görünüm) */}
      <Modal open={!!editing} title={editing?.id ? `Şube Düzenle: ${editing.name || ''}` : 'Yeni Şube Ekle'} onClose={close} footer={
        <>
          <Button variant="secondary" onClick={close}>Vazgeç</Button>
          <Button loading={savingKey === 'cafe'} onClick={() => void (document.getElementById('cafe-form') as HTMLFormElement | null)?.requestSubmit()}>Kaydet</Button>
        </>
      }>
        {editing && (
          <div>
            {/* Modal Sekme Navigasyonu */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`admin-btn admin-btn-sm ${modalTab === 'basic' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                onClick={() => setModalTab('basic')}
              >
                <Building2 size={14} /> Temel Bilgiler
              </button>
              <button
                type="button"
                className={`admin-btn admin-btn-sm ${modalTab === 'location' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                onClick={() => setModalTab('location')}
              >
                <MapPin size={14} /> Adres & Konum
              </button>
              <button
                type="button"
                className={`admin-btn admin-btn-sm ${modalTab === 'hours' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                onClick={() => setModalTab('hours')}
              >
                <Clock size={14} /> Saatler & İletişim
              </button>
              <button
                type="button"
                className={`admin-btn admin-btn-sm ${modalTab === 'menu' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                onClick={() => setModalTab('menu')}
              >
                <Utensils size={14} /> Şube Menüsü ({selectedMenuIds.length})
              </button>
            </div>

            <form id="cafe-form" style={{ display: 'grid', gap: 12 }} onSubmit={async (e) => {
              e.preventDefault();
              setSavingKey('cafe');
              try {
                const combinedHours = `Hafta İçi: ${weekdayHours} | Hafta Sonu: ${weekendHours}`;
                const payload = {
                  name: editing.name,
                  address: editing.address,
                  workingHours: combinedHours,
                  phoneNumber: editing.phoneNumber || '+90 342 320 00 00',
                  description: editing.description || '',
                  imageUrl: editing.imageUrl,
                  isActive: editing.isActive !== false,
                  placeId: editing.placeId || null
                };
                if (editing.id) await api.updateCafe(editing.id, payload);
                else await api.createCafe(payload);
                setSuccess(editing.id ? 'Şube güncellendi.' : 'Şube oluşturuldu.');
                setEditing(null);
                await load();
              } catch (err: any) {
                setError(err.message);
              } finally {
                setSavingKey(null);
              }
            }}>
              {modalTab === 'basic' && (
                <>
                  <Input required label="Şube adı *" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                  <Input label="Şube Görsel URL" helper="Mobil uygulamadaki kafe kapak resmi bağlantısı" value={editing.imageUrl || ''} onChange={(e) => setEditing({ ...editing, imageUrl: e.target.value })} />
                  <Checkbox label="Şube Aktif Durumda" helper="Pasif şubeler Gel-Al ve Ismarlıyor siparişi kabul etmez." checked={editing.isActive !== false} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} />
                </>
              )}

              {modalTab === 'location' && (
                <>
                  <Input label="Açık Adres" placeholder="Mahalle, Cadde, Sokak No..." value={editing.address || ''} onChange={(e) => setEditing({ ...editing, address: e.target.value })} />
                  <Select label="Harita & Konum Bağlantısı (Belediye Tesis Kaydı)" value={editing.placeId || ''} onChange={(e) => setEditing({ ...editing, placeId: e.target.value })}>
                    <option value="">Otomatik Tesis Kaydı / Seçilmedi</option>
                    {places.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </Select>
                  <p className="admin-helper" style={{ fontSize: 12, color: '#64748b' }}>Tesis kaydı seçildiğinde şubenin GPS konum koordinatları Şehitkamil kent haritası servisleriyle otomatik eşleşir.</p>
                </>
              )}

              {modalTab === 'hours' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <Select label="Hafta İçi Çalışma Slotu (Pzt - Cum)" value={weekdayHours} onChange={(e) => setWeekdayHours(e.target.value)}>
                        <option value="07:30 - 23:00">07:30 - 23:00 (Standart)</option>
                        <option value="08:00 - 22:00">08:00 - 22:00 (Erken Kapanış)</option>
                        <option value="07:00 - 00:00">07:00 - 00:00 (Uzun Vardiya)</option>
                        <option value="24 Saat Açık">24 Saat Açık</option>
                      </Select>
                      <Input style={{ marginTop: 6 }} label="Veya Özel Saat Girin" value={weekdayHours} onChange={(e) => setWeekdayHours(e.target.value)} />
                    </div>
                    <div>
                      <Select label="Hafta Sonu Çalışma Slotu (Cmt - Pzr)" value={weekendHours} onChange={(e) => setWeekendHours(e.target.value)}>
                        <option value="08:00 - 00:00">08:00 - 00:00 (Hafta Sonu Standart)</option>
                        <option value="07:30 - 23:00">07:30 - 23:00 (Aynı Saatler)</option>
                        <option value="09:00 - 22:00">09:00 - 22:00 (Kısa Hafta Sonu)</option>
                        <option value="24 Saat Açık">24 Saat Açık</option>
                      </Select>
                      <Input style={{ marginTop: 6 }} label="Veya Özel Saat Girin" value={weekendHours} onChange={(e) => setWeekendHours(e.target.value)} />
                    </div>
                  </div>
                  <Input label="Şube Telefon Numarası" placeholder="+90 342 320 00 00" value={editing.phoneNumber || ''} onChange={(e) => setEditing({ ...editing, phoneNumber: e.target.value })} />
                  <Input label="Şube Açıklaması / Hakkında" placeholder="Kitap Kafe konsepti, çalışma masaları ve Gel-Al hızlı servis noktası." value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
                </>
              )}

              {modalTab === 'menu' && (
                <div style={{ display: 'grid', gap: 10, maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Bu şubede satışa sunulan katalog ürünlerini doğrudan işaretleyin:</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        setSelectedMenuIds(
                          selectedMenuIds.length === allMenuItems.length
                            ? []
                            : allMenuItems.map((m) => m.id)
                        )
                      }
                    >
                      {selectedMenuIds.length === allMenuItems.length ? 'Tümünü Kaldır' : 'Tümünü Seç'}
                    </Button>
                  </div>
                  {allMenuItems.length ? (
                    allMenuItems.map((item) => {
                      const checked = selectedMenuIds.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            background: checked ? '#ecfdf5' : '#f8fafc',
                            border: `1px solid ${checked ? '#a7f3d0' : '#e2e8f0'}`,
                            borderRadius: 10,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <SafeImg src={item.imageUrl} alt={item.name} style={{ width: 38, height: 38, objectFit: 'cover', borderRadius: 8 }} />
                            <div>
                              <strong style={{ fontSize: 13 }}>{item.name}</strong>
                              <div style={{ fontSize: 11, color: '#64748b' }}>
                                {item.categoryName || 'Genel'} · ₺{item.price}
                              </div>
                            </div>
                          </div>
                          <Checkbox
                            label={checked ? 'Satışta' : 'Kapalı'}
                            checked={checked}
                            onChange={() => toggleMenuItem(item.id)}
                          />
                        </div>
                      );
                    })
                  ) : (
                    <p style={{ fontSize: 13, color: '#94a3b8' }}>Katalog ürünü bulunamadı.</p>
                  )}
                </div>
              )}
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}
