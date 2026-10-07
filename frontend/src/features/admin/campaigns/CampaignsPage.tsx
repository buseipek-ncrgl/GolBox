import React, { useEffect, useState } from 'react';
import { CalendarClock, CheckCircle2, Grid2X2, List, Megaphone, Plus, Target, Trash2 } from 'lucide-react';
import { api } from '../../../services/api';
import { pagedMeta } from '../../../lib/adminQuery';
import { campaignAudienceLabel } from '../../../lib/adminLabels';
import { formatDate, istanbulDateToIsoEnd, istanbulDateToIsoStart } from '../../../lib/adminDate';
import { BulkSelectionBar, Button, DateInput, EmptyState, ErrorState, FilterBar, Input, Modal, Pagination, Select, SelectionCheckbox, Textarea, UnsavedGuard } from '../../../admin/components';
import { SafeImg } from '../../../components/admin/adminUi';
import { useAdminFeedback } from '../AdminFeedback';

export function CampaignsPage() {
  const { isAdmin, confirm, setError, setSuccess, savingKey, setSavingKey } = useAdminFeedback();
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState('');
  const [state, setState] = useState('');
  const [view, setView] = useState<'card' | 'list'>(() => localStorage.getItem('campaigns-view') === 'list' ? 'list' : 'card');
  const [loading, setLoading] = useState(true);
  const [fail, setFail] = useState<unknown>(null);
  const [form, setForm] = useState<any>(null);
  const [snapshot, setSnapshot] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getCampaigns({ page, pageSize: 25, search: search || undefined, active: active === '' ? undefined : active === 'true', state: state || undefined });
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
  useEffect(() => { void load(); }, [page, active, state]);

  const dirty = !!form && JSON.stringify(form) !== snapshot;
  const open = (next: any) => { setForm(next); setSnapshot(JSON.stringify(next)); };
  const close = () => {
    if (dirty) confirm({ title: 'Kaydedilmemiş değişiklikler', message: 'Kampanya formundaki değişiklikler kaydedilmedi. Kapatılsın mı?', confirmLabel: 'Kapat', danger: true, onConfirm: () => setForm(null) });
    else setForm(null);
  };
  const changeView = (next: 'card' | 'list') => { setView(next); localStorage.setItem('campaigns-view', next); };
  const remove = (campaign: any) => confirm({
    title: 'Kampanyayı sil',
    message: `“${campaign.title}” mobil uygulama ve yönetim listesinden kaldırılacak.`,
    confirmLabel: 'Sil', danger: true,
    onConfirm: async () => { try { await api.deleteCampaign(campaign.id); setSuccess('Kampanya silindi.'); await load(); } catch (err: any) { setError(err.message); } }
  });
  const campaignState = (campaign: any) => {
    if (!campaign.isActive) return 'Taslak';
    if (new Date(campaign.startDate).getTime() > Date.now()) return 'Planlandı';
    if (new Date(campaign.endDate).getTime() < Date.now()) return 'Süresi doldu';
    return 'Yayında';
  };
  const toggle = (id: string, checked: boolean) => setSelected((current) => checked ? [...new Set([...current, id])] : current.filter((value) => value !== id));
  const removeSelected = () => confirm({ title: 'Seçili kampanyaları sil', message: `${selected.length} kampanya mobil uygulamadan kaldırılacak.`, confirmLabel: 'Seçilenleri sil', danger: true, onConfirm: async () => { await Promise.all(selected.map((id) => api.deleteCampaign(id))); setSelected([]); setSuccess('Seçili kampanyalar silindi.'); await load(); } });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <UnsavedGuard dirty={dirty} />
      <p className="admin-muted" style={{ margin: 0 }}>Bu alan uygulamada gösterilecek kampanya duyurularını yönetir. Otomatik indirim veya GölPuan kuralı uygulamaz.</p>
      <div className="activity-toolbar">
        <div className="activity-view-switch" aria-label="Görünüm seçimi">
          <button type="button" className={view === 'card' ? 'active' : ''} onClick={() => changeView('card')}><Grid2X2 size={16} /> Kart</button>
          <button type="button" className={view === 'list' ? 'active' : ''} onClick={() => changeView('list')}><List size={17} /> Liste</button>
        </div>
        {isAdmin && <Button data-testid="campaign-create" onClick={() => open({ title: '', description: '', startDate: '', endDate: '', targetUserGroup: 'All', imageUrl: '' })}><Plus size={17} /> Yeni kampanya</Button>}
      </div>
      <div className="catalog-summary">
        <div className="catalog-summary-item"><Megaphone size={18} /><span>Toplam kampanya</span><strong>{total}</strong></div>
        <div className="catalog-summary-item"><CheckCircle2 size={18} /><span>Yayında</span><strong>{items.filter((c) => campaignState(c) === 'Yayında').length}</strong></div>
        <div className="catalog-summary-item"><CalendarClock size={18} /><span>Planlanan</span><strong>{items.filter((c) => campaignState(c) === 'Planlandı').length}</strong></div>
        <div className="catalog-summary-item"><Target size={18} /><span>Hedefli</span><strong>{items.filter((c) => c.targetUserGroup !== 'All').length}</strong></div>
      </div>
      <FilterBar search={search} onSearch={setSearch} activeCount={[search, active, state].filter(Boolean).length} onClear={() => { setSearch(''); setActive(''); setState(''); setPage(1); }} onSubmit={() => { setPage(1); void load(); }} filters={<>
        <Select label="Yayın" value={active} onChange={(e) => setActive(e.target.value)}><option value="">Tümü</option><option value="true">Yayında</option><option value="false">Taslak</option></Select>
        <Select label="Tarih durumu" value={state} onChange={(e) => setState(e.target.value)}><option value="">Tümü</option><option value="upcoming">Planlanan</option><option value="ongoing">Devam eden</option><option value="ended">Süresi dolan</option></Select>
        <Button type="submit" size="sm">Filtrele</Button>
      </>} />
      <div className="collection-selection-row"><div className="collection-selection-head"><SelectionCheckbox label="Sayfadaki tüm kampanyaları seç" checked={items.length > 0 && items.every((item) => selected.includes(item.id))} onChange={(checked) => setSelected(checked ? items.map((item) => item.id) : [])} /><span>Sayfadakileri seç</span></div><BulkSelectionBar count={selected.length} onAction={removeSelected} onClear={() => setSelected([])} /></div>
      {fail ? <ErrorState error={fail} retry={load} /> : null}
      {!loading && items.length === 0 ? <EmptyState title="Kampanya bulunamadı." description="Filtreleri temizleyin veya yeni bir kampanya oluşturun." /> : null}
      {!loading && items.length > 0 && view === 'card' ? <div className="campaign-grid">{items.map((c) => (
        <div key={c.id} className="admin-card campaign-admin-card">
          <SelectionCheckbox label={`${c.title} seç`} checked={selected.includes(c.id)} onChange={(checked) => toggle(c.id, checked)} />
          <div style={{ display: 'flex', gap: 12 }}>
            <SafeImg src={c.imageUrl} alt={c.title} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 12 }} />
            <div>
              <strong>{c.title}</strong>
              <div className="campaign-card-state">{campaignState(c)}</div>
              <div style={{ fontSize: 13 }}>{formatDate(c.startDate)} – {formatDate(c.endDate)} · {campaignAudienceLabel(c.targetUserGroup)}</div>
              <p>{c.description || 'Açıklama girilmedi.'}</p>
            </div>
          </div>
          {isAdmin && (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button size="sm" variant="secondary" onClick={() => open({ ...c, shortDescription: c.shortDescription || '', startDate: String(c.startDate || '').slice(0, 10), endDate: String(c.endDate || '').slice(0, 10) })}>Düzenle</Button>
              {c.isActive
                ? <Button size="sm" variant="danger" onClick={() => confirm({ title: 'Yayından kaldır', message: 'Kampanya içeriği yayından kaldırılacak. Devam edilsin mi?', danger: true, onConfirm: async () => { await api.unpublishCampaign(c.id); setSuccess('Kampanya yayından kaldırıldı.'); await load(); } })}>Yayından al</Button>
                : <Button size="sm" onClick={async () => { await api.publishCampaign(c.id); setSuccess('Kampanya yayına alındı.'); await load(); }}>Yayınla</Button>}
              <button type="button" className="activity-delete" title="Sil" aria-label={`${c.title} kampanyasını sil`} onClick={() => remove(c)}><Trash2 size={17} /></button>
            </div>
          )}
        </div>
      ))}</div> : null}
      {!loading && items.length > 0 && view === 'list' ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Kampanya</th><th>Tarih</th><th>Hedef kitle</th><th>Durum</th><th></th></tr></thead><tbody>{items.map((c) => <tr key={c.id}><td><strong>{c.title}</strong><div className="admin-muted">{c.description || 'Açıklama girilmedi.'}</div></td><td>{formatDate(c.startDate)} – {formatDate(c.endDate)}</td><td>{campaignAudienceLabel(c.targetUserGroup)}</td><td>{campaignState(c)}</td><td><div className="campaign-actions"><Button size="sm" variant="secondary" onClick={() => open({ ...c, startDate: String(c.startDate || '').slice(0, 10), endDate: String(c.endDate || '').slice(0, 10) })}>Düzenle</Button><Button size="sm" variant={c.isActive ? 'secondary' : 'primary'} onClick={async () => { if (c.isActive) await api.unpublishCampaign(c.id); else await api.publishCampaign(c.id); await load(); }}>{c.isActive ? 'Yayından al' : 'Yayınla'}</Button><button type="button" className="activity-delete" title="Sil" aria-label={`${c.title} kampanyasını sil`} onClick={() => remove(c)}><Trash2 size={17} /></button></div></td></tr>)}</tbody></table></div> : null}
      <Pagination page={page} pageSize={25} totalCount={total} onPage={setPage} />
      <Modal open={!!form} title={form?.id ? 'Kampanya düzenle' : 'Yeni kampanya içeriği'} size="lg" onClose={close} footer={
        <>
          <Button variant="secondary" onClick={close}>Vazgeç</Button>
          <Button loading={!!savingKey} onClick={() => void (document.getElementById('campaign-form') as HTMLFormElement | null)?.requestSubmit()}>Kaydet</Button>
        </>
      }>
        {form && (
          <form id="campaign-form" style={{ display: 'grid', gap: 12 }} onSubmit={async (e) => {
            e.preventDefault();
            setSavingKey('camp');
            try {
              const payload = {
                title: form.title,
                description: form.description,
                startDate: istanbulDateToIsoStart(form.startDate),
                endDate: istanbulDateToIsoEnd(form.endDate),
                targetUserGroup: form.targetUserGroup,
                imageUrl: form.imageUrl
              };
              if (form.id) await api.updateCampaign(form.id, payload);
              else await api.createCampaign(payload);
              setSuccess(form.id ? 'Kampanya güncellendi.' : 'Kampanya içeriği oluşturuldu.');
              setForm(null);
              await load();
            } catch (err: any) {
              setError(err.message);
            } finally {
              setSavingKey(null);
            }
          }}>
            <p className="admin-helper">Kampanyalar mobil uygulamada yayımlanan bilgilendirme içerikleridir; otomatik ödül veya indirim kuralı uygulamaz.</p>
            <Input required label="Kampanya Başlığı" data-testid="campaign-title" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Textarea required label="Açıklama" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <DateInput required label="Başlangıç Tarihi" value={form.startDate || ''} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <DateInput required label="Bitiş Tarihi" value={form.endDate || ''} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            <Select label="Hedef Kitle" value={form.targetUserGroup || 'All'} onChange={(e) => setForm({ ...form, targetUserGroup: e.target.value })}>
              <option value="All">Tüm vatandaşlar</option>
              <option value="HighSchool">Lise</option>
              <option value="University">Üniversite</option>
            </Select>
            <Input label="Yönlendirme" helper="Tıklandığında açılacak sayfa veya URL" value={form.actionUrl || ''} onChange={(e) => setForm({ ...form, actionUrl: e.target.value })} />
            <Input label="Görsel" helper="Opsiyonel görsel URL" value={form.imageUrl || ''} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
          </form>
        )}
      </Modal>
    </div>
  );
}
