import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { pagedMeta } from '../../../lib/adminQuery';
import { MAX_REWARD_GP, rewardStatusLabel } from '../../../lib/adminLabels';
import { EmptyState, FilterBar, ListError, PaginationBar } from '../../../components/admin/FilterBar';
import { btnDanger, btnNeutral, btnPrimary, inputStyle, SafeImg } from '../../../components/admin/adminUi';
import { useAdminFeedback } from '../AdminFeedback';

export function RewardsPage() {
  const { isAdmin, confirm, setError, setSuccess, savingKey, setSavingKey } = useAdminFeedback();
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [fail, setFail] = useState<string | null>(null);
  const [form, setForm] = useState<any>(null);

  const load = async () => {
    try {
      const res = await api.getAdminRewards({ page, pageSize: 25, search: search || undefined, status: status || undefined });
      const meta = pagedMeta(res, page, 25);
      setItems(meta.items);
      setTotal(meta.totalCount);
      setFail(null);
    } catch (err: any) {
      setFail(err.message);
    }
  };
  useEffect(() => { void load(); }, [page, status]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {isAdmin && <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button type="button" style={btnPrimary} onClick={() => setForm({ title: '', description: '', requiredPoints: 50, imageUrl: '' })}>+ Yeni ödül</button></div>}
      <FilterBar search={search} onSearch={setSearch} activeCount={[search, status].filter(Boolean).length} onClear={() => { setSearch(''); setStatus(''); setPage(1); void load(); }} filters={
        <>
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
            <option value="">Durum</option>
            <option value="Active">Aktif</option>
            <option value="Passive">Pasif</option>
          </select>
          <button type="button" style={btnPrimary} onClick={() => { setPage(1); void load(); }}>Filtrele</button>
        </>
      } />
      {fail && <ListError message={fail} onRetry={load} />}
      {items.length === 0 ? <EmptyState title="Henüz ödül yok." actionLabel={isAdmin ? '+ Yeni ödül' : undefined} onAction={isAdmin ? () => setForm({ title: '', requiredPoints: 50 }) : undefined} /> : items.map((r) => (
        <div key={r.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16, display: 'flex', gap: 16, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            {r.imageUrl && <SafeImg src={r.imageUrl} alt={r.title} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 12 }} />}
            <div>
              <strong>{r.title}</strong>
              <div>{r.requiredPoints} GP · {rewardStatusLabel(r.status)}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Stok alanı bu katalogda tanımlı değil.</div>
            </div>
          </div>
          {isAdmin && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" style={btnNeutral} onClick={() => setForm(r)}>Düzenle</button>
              {r.status === 'Active' ? (
                <button type="button" style={btnDanger} onClick={() => confirm({
                  title: 'Pasife al',
                  message: 'Bu ödül vatandaş kataloğundan kaldırılacak. Devam edilsin mi?',
                  danger: true,
                  confirmLabel: 'Pasife al',
                  onConfirm: async () => { await api.deactivateReward(r.id); setSuccess('Ödül pasife alındı.'); await load(); }
                })}>Pasife Al</button>
              ) : (
                <button type="button" style={btnPrimary} onClick={async () => { await api.activateReward(r.id); setSuccess('Ödül yayına alındı.'); await load(); }}>Yayına Al</button>
              )}
            </div>
          )}
        </div>
      ))}
      <PaginationBar page={page} pageSize={25} totalCount={total} onPage={setPage} onPageSize={() => undefined} />
      {form && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)', display: 'grid', placeItems: 'center', zIndex: 80 }} onClick={() => setForm(null)}>
          <form style={{ background: '#fff', padding: 24, width: 420, borderRadius: 16, display: 'grid', gap: 8 }} onClick={(e) => e.stopPropagation()} onSubmit={async (e) => {
            e.preventDefault();
            const points = Number(form.requiredPoints);
            if (points < 1 || points > MAX_REWARD_GP) { setError(`GP 1 ile ${MAX_REWARD_GP} arasında olmalıdır.`); return; }
            setSavingKey('reward');
            try {
              const payload = { title: form.title, description: form.description, requiredPoints: points, imageUrl: form.imageUrl };
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
            <input required placeholder="Başlık" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} />
            <textarea placeholder="Açıklama" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} style={inputStyle} />
            <input required type="number" min={1} max={MAX_REWARD_GP} value={form.requiredPoints} onChange={(e) => setForm({ ...form, requiredPoints: e.target.value })} style={inputStyle} />
            <input placeholder="Görsel" value={form.imageUrl || ''} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} style={inputStyle} />
            <button type="submit" disabled={!!savingKey} style={btnPrimary}>{savingKey ? 'Kaydediliyor…' : 'Kaydet'}</button>
          </form>
        </div>
      )}
    </div>
  );
}
