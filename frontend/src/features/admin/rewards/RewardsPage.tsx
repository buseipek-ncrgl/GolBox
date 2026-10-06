import React, { useEffect, useState } from 'react';
import { Award, Boxes, CheckCircle2, Gift, Grid2X2, List, Pencil, Plus, TicketCheck } from 'lucide-react';
import { api } from '../../../services/api';
import { pagedMeta } from '../../../lib/adminQuery';
import { MAX_REWARD_GP, rewardStatusLabel } from '../../../lib/adminLabels';
import { BulkSelectionBar, Button, EmptyState, ErrorState, FilterBar, Input, Modal, NumberInput, Pagination, Select, SelectionCheckbox, Skeleton, StatusBadge, Textarea, UnsavedGuard } from '../../../admin/components';
import { SafeImg } from '../../../components/admin/adminUi';
import { useAdminFeedback } from '../AdminFeedback';

export function RewardsPage() {
  const { isAdmin, confirm, setError, setSuccess, savingKey, setSavingKey } = useAdminFeedback();
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [fail, setFail] = useState<unknown>(null);
  const [form, setForm] = useState<any>(null);
  const [snapshot, setSnapshot] = useState('');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ total: 0, active: 0, limitedStock: 0, totalClaims: 0, totalRedemptions: 0 });
  const [view, setView] = useState<'card' | 'list'>(() => (localStorage.getItem('reward-view') === 'list' ? 'list' : 'card'));
  const [selected, setSelected] = useState<string[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminRewards({ page, pageSize: 25, search: search || undefined, status: status || undefined });
      const meta = pagedMeta(res, page, 25);
      setItems(meta.items);
      setTotal(meta.totalCount);
      setSummary(res?.summary || { total: 0, active: 0, limitedStock: 0, totalClaims: 0, totalRedemptions: 0 });
      setFail(null);
    } catch (err: any) {
      setFail(err);
    } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [page, status]);

  const dirty = !!form && JSON.stringify(form) !== snapshot;
  const open = (next: any) => { setForm(next); setSnapshot(JSON.stringify(next)); };
  const close = () => {
    if (dirty) confirm({ title: 'Kaydedilmemiş değişiklikler', message: 'Ödül formundaki değişiklikler kaydedilmedi. Kapatılsın mı?', confirmLabel: 'Kapat', danger: true, onConfirm: () => setForm(null) });
    else setForm(null);
  };
  const changeView = (next: 'card' | 'list') => { setView(next); localStorage.setItem('reward-view', next); };
  const toggle = (id: string, checked: boolean) => setSelected((current) => checked ? [...new Set([...current, id])] : current.filter((value) => value !== id));
  const removeSelected = () => confirm({ title: 'Seçili ödülleri sil', message: `${selected.length} ödül katalogdan kaldırılacak. Geçmiş kuponlar korunur.`, confirmLabel: 'Seçilenleri sil', danger: true, onConfirm: async () => { await Promise.all(selected.map((id) => api.deleteReward(id))); setSelected([]); setSuccess('Seçili ödüller silindi.'); await load(); } });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <UnsavedGuard dirty={dirty} />
      <div className="reward-toolbar"><div className="reward-toolbar-actions"><div className="catalog-view-switch" aria-label="Ödül görünümü"><button type="button" className={view === 'card' ? 'active' : ''} aria-pressed={view === 'card'} onClick={() => changeView('card')}><Grid2X2 size={15} /> Kart</button><button type="button" className={view === 'list' ? 'active' : ''} aria-pressed={view === 'list'} onClick={() => changeView('list')}><List size={15} /> Liste</button></div>{isAdmin && <Button data-testid="reward-create" onClick={() => open({ title: '', description: '', requiredPoints: 50, imageUrl: '', totalStock: '', perUserLimit: 1, minAge: '', requiredEducation: '' })}><Plus size={16} /> Yeni ödül</Button>}</div></div>
      <div className="catalog-summary reward-summary" aria-label="Ödül kataloğu özeti">
        <div className="catalog-summary-item"><Gift size={18} /><span>Toplam ödül</span><strong>{summary.total}</strong></div>
        <div className="catalog-summary-item"><CheckCircle2 size={18} /><span>Yayında</span><strong>{summary.active}</strong></div>
        <div className="catalog-summary-item"><Boxes size={18} /><span>Kontenjanlı</span><strong>{summary.limitedStock}</strong></div>
        <div className="catalog-summary-item"><TicketCheck size={18} /><span>Alınan kupon</span><strong>{summary.totalClaims}</strong></div>
        <div className="catalog-summary-item"><Award size={18} /><span>Kullanılan</span><strong>{summary.totalRedemptions}</strong></div>
      </div>
      <FilterBar search={search} onSearch={setSearch} activeCount={[search, status].filter(Boolean).length} onClear={() => { setSearch(''); setStatus(''); setPage(1); void load(); }} onSubmit={() => { setPage(1); void load(); }} filters={
        <>
          <Select label="Durum" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Tümü</option>
            <option value="Active">Aktif</option>
            <option value="Passive">Pasif</option>
          </Select>
          <Button type="submit" size="sm">Filtrele</Button>
        </>
      } />
      <div className="collection-selection-row"><div className="collection-selection-head"><SelectionCheckbox label="Sayfadaki tüm ödülleri seç" checked={items.length > 0 && items.every((item) => selected.includes(item.id))} onChange={(checked) => setSelected(checked ? items.map((item) => item.id) : [])} /><span>Sayfadakileri seç</span></div><BulkSelectionBar count={selected.length} onAction={removeSelected} onClear={() => setSelected([])} /></div>
      {fail ? <ErrorState error={fail} retry={load} /> : null}
      {loading ? <Skeleton variant={view === 'card' ? 'card' : 'table'} /> : items.length === 0 ? <EmptyState title="Henüz ödül yok." description="Katalogda gösterilecek bir ödül ekleyin." actionLabel={isAdmin ? '+ Yeni ödül' : undefined} onAction={isAdmin ? () => open({ title: '', requiredPoints: 50, perUserLimit: 1 }) : undefined} /> : <div className={`reward-admin-list is-${view}`}>{items.map((r) => (
        <div key={r.id} className="reward-admin-row" data-testid="reward-row">
          <SelectionCheckbox label={`${r.title} seç`} checked={selected.includes(r.id)} onChange={(checked) => toggle(r.id, checked)} />
          <div className="reward-admin-visual">{r.imageUrl ? <SafeImg src={r.imageUrl} alt={r.title} /> : <Gift size={24} />}</div>
          <div className="reward-admin-main"><div><strong>{r.title}</strong><StatusBadge status={r.status} label={rewardStatusLabel(r.status)} /></div><p>{r.description || 'Açıklama girilmemiş.'}</p><div className="reward-admin-meta"><span><Award size={14} /> {r.requiredPoints} GP</span><span><Boxes size={14} /> {r.totalStock == null ? 'Sınırsız kontenjan' : `${r.remainingStock} / ${r.totalStock} kaldı`}</span><span><TicketCheck size={14} /> {r.claimedCount} alınan</span><span><CheckCircle2 size={14} /> {r.redeemedCount} kullanılan</span></div></div>
          {isAdmin && (
            <div className="reward-admin-actions">
              <Button size="sm" variant="secondary" data-testid="reward-edit" onClick={() => open(r)}><Pencil size={14} /> Düzenle</Button>
              {r.status === 'Active' ? (
                <Button size="sm" variant="danger" data-testid="reward-passive" onClick={() => confirm({
                  title: 'Pasife al',
                  message: 'Bu ödül vatandaş kataloğundan kaldırılacak. Devam edilsin mi?',
                  danger: true,
                  confirmLabel: 'Pasife al',
                  onConfirm: async () => { await api.deactivateReward(r.id); setSuccess('Ödül pasife alındı.'); await load(); }
                })}>Pasife Al</Button>
              ) : (
                <Button size="sm" onClick={async () => { await api.activateReward(r.id); setSuccess('Ödül yayına alındı.'); await load(); }}>Yayına Al</Button>
              )}
            </div>
          )}
        </div>
      ))}</div>}
      <Pagination page={page} pageSize={25} totalCount={total} onPage={setPage} />
      <Modal open={!!form} title={form?.id ? 'Ödül düzenle' : 'Yeni ödül'} onClose={close} footer={
        <>
          <Button variant="secondary" onClick={close}>Vazgeç</Button>
          <Button loading={!!savingKey} onClick={() => void (document.getElementById('reward-form') as HTMLFormElement | null)?.requestSubmit()}>Kaydet</Button>
        </>
      }>
        {form && (
          <form id="reward-form" style={{ display: 'grid', gap: 12 }} onSubmit={async (e) => {
            e.preventDefault();
            const points = Number(form.requiredPoints);
            if (points < 1 || points > MAX_REWARD_GP) { setError(`GP 1 ile ${MAX_REWARD_GP} arasında olmalıdır.`); return; }
            const totalStock = form.totalStock === '' || form.totalStock == null ? null : Number(form.totalStock);
            const perUserLimit = Number(form.perUserLimit || 1);
            if (totalStock != null && totalStock < 1) { setError('Toplam kontenjan en az 1 olmalıdır.'); return; }
            if (perUserLimit < 1 || perUserLimit > 20) { setError('Kişi başı limit 1 ile 20 arasında olmalıdır.'); return; }
            if (totalStock != null && perUserLimit > totalStock) { setError('Kişi başı limit toplam kontenjandan büyük olamaz.'); return; }
            setSavingKey('reward');
            try {
              const payload = {
                title: form.title,
                description: form.description,
                requiredPoints: points,
                imageUrl: form.imageUrl,
                totalStock,
                perUserLimit,
                minAge: form.minAge ? Number(form.minAge) : null,
                requiredEducation: form.requiredEducation || null
              };
              if (form.id) await api.updateReward(form.id, payload);
              else await api.createReward(payload);
              setSuccess(form.id ? 'Ödül güncellendi.' : 'Ödül oluşturuldu.');
              setForm(null);
              await load();
            } catch (err: any) {
              setError(err.message);
            } finally {
              setSavingKey(null);
            }
          }}>
            <Input required label="Ödül Başlığı" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Textarea label="Açıklama" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <NumberInput required min={1} max={MAX_REWARD_GP} label="GölPuan Bedeli" helper="Vatandaşın bu ödül için harcayacağı GölPuan." value={form.requiredPoints} onChange={(e) => setForm({ ...form, requiredPoints: e.target.value })} />
            <div className="reward-form-grid"><NumberInput min={1} label="Toplam Kontenjan" helper="Boş bırakılırsa sınırsızdır." value={form.totalStock ?? ''} onChange={(e) => setForm({ ...form, totalStock: e.target.value })} /><NumberInput required min={1} max={20} label="Kişi Başı Limit" helper="Bir vatandaşın alabileceği toplam adet." value={form.perUserLimit || 1} onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })} /></div>
            <NumberInput label="Minimum Yaş" helper="Opsiyonel uygunluk kuralı" value={form.minAge || ''} onChange={(e) => setForm({ ...form, minAge: e.target.value })} />
            <Select label="Öğrenim Durumu" helper="Opsiyonel uygunluk kuralı" value={form.requiredEducation || ''} onChange={(e) => setForm({ ...form, requiredEducation: e.target.value })}>
              <option value="">Şart yok</option>
              <option value="Lise">Lise</option>
              <option value="Üniversite">Üniversite</option>
            </Select>
            <Input label="Görsel" helper="Opsiyonel görsel URL" value={form.imageUrl || ''} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
          </form>
        )}
      </Modal>
    </div>
  );
}
