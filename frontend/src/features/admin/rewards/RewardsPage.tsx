import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { pagedMeta } from '../../../lib/adminQuery';
import { MAX_REWARD_GP, rewardStatusLabel } from '../../../lib/adminLabels';
import { Button, EmptyState, ErrorState, FilterBar, Input, Modal, NumberInput, Pagination, Select, Textarea, UnsavedGuard } from '../../../admin/components';
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

  const load = async () => {
    try {
      const res = await api.getAdminRewards({ page, pageSize: 25, search: search || undefined, status: status || undefined });
      const meta = pagedMeta(res, page, 25);
      setItems(meta.items);
      setTotal(meta.totalCount);
      setFail(null);
    } catch (err: any) {
      setFail(err);
    }
  };
  useEffect(() => { void load(); }, [page, status]);

  const dirty = !!form && JSON.stringify(form) !== snapshot;
  const open = (next: any) => { setForm(next); setSnapshot(JSON.stringify(next)); };
  const close = () => {
    if (dirty) confirm({ title: 'Kaydedilmemiş değişiklikler', message: 'Ödül formundaki değişiklikler kaydedilmedi. Kapatılsın mı?', confirmLabel: 'Kapat', danger: true, onConfirm: () => setForm(null) });
    else setForm(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <UnsavedGuard dirty={dirty} />
      {isAdmin && <div style={{ display: 'flex', justifyContent: 'flex-end' }}><Button data-testid="reward-create" onClick={() => open({ title: '', description: '', requiredPoints: 50, imageUrl: '', minAge: '', requiredEducation: '' })}>+ Yeni ödül</Button></div>}
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
      {fail ? <ErrorState error={fail} retry={load} /> : null}
      {items.length === 0 ? <EmptyState title="Henüz ödül yok." description="Katalogda gösterilecek bir ödül ekleyin." actionLabel={isAdmin ? '+ Yeni ödül' : undefined} onAction={isAdmin ? () => open({ title: '', requiredPoints: 50 }) : undefined} /> : items.map((r) => (
        <div key={r.id} className="admin-card" style={{ display: 'flex', gap: 16, justifyContent: 'space-between' }} data-testid="reward-row">
          <div style={{ display: 'flex', gap: 12 }}>
            <SafeImg src={r.imageUrl} alt={r.title} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 12 }} />
            <div>
              <strong>{r.title}</strong>
              <div className="admin-gp" style={{ fontSize: 22 }}>{r.requiredPoints} GP</div>
              <div style={{ fontSize: 13 }}>{rewardStatusLabel(r.status)}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Kimler kullanabilir: tüm uygun vatandaşlar. Stok bu katalogda tanımlı değil.</div>
            </div>
          </div>
          {isAdmin && (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button size="sm" variant="secondary" data-testid="reward-edit" onClick={() => open(r)}>Düzenle</Button>
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
      ))}
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
            setSavingKey('reward');
            try {
              const payload = {
                title: form.title,
                description: form.description,
                requiredPoints: points,
                imageUrl: form.imageUrl,
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
