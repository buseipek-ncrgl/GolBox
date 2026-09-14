import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { pagedMeta } from '../../../lib/adminQuery';
import { campaignAudienceLabel } from '../../../lib/adminLabels';
import { formatDate } from '../../../lib/adminDate';
import { EmptyState, FilterBar, ListError, PaginationBar } from '../../../components/admin/FilterBar';
import { btnDanger, btnNeutral, btnPrimary, inputStyle, SafeImg } from '../../../components/admin/adminUi';
import { useAdminFeedback } from '../AdminFeedback';

export function CampaignsPage() {
  const { isAdmin, confirm, setError, setSuccess, savingKey, setSavingKey } = useAdminFeedback();
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [fail, setFail] = useState<string | null>(null);
  const [form, setForm] = useState<any>(null);

  const load = async () => {
    try {
      const res = await api.getCampaigns({ page, pageSize: 25, search: search || undefined });
      const meta = pagedMeta(res, page, 25);
      setItems(meta.items);
      setTotal(meta.totalCount);
      setFail(null);
    } catch (err: any) {
      setFail(err.message);
    }
  };
  useEffect(() => { void load(); }, [page]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ color: '#64748b', margin: 0 }}>Bu alan uygulamada gösterilecek kampanya duyurularını yönetir. Otomatik indirim veya GölPuan kuralı uygulamaz.</p>
      {isAdmin && <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button type="button" style={btnPrimary} onClick={() => setForm({ title: '', description: '', startDate: '', endDate: '', targetUserGroup: 'All', imageUrl: '' })}>+ Yeni kampanya içeriği</button></div>}
      <FilterBar search={search} onSearch={setSearch} activeCount={search ? 1 : 0} onClear={() => setSearch('')} filters={<button type="button" style={btnPrimary} onClick={() => { setPage(1); void load(); }}>Filtrele</button>} />
      {fail && <ListError message={fail} onRetry={load} />}
      {items.length === 0 ? <EmptyState title="Henüz kampanya içeriği yok." /> : items.map((c) => (
        <div key={c.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            {c.imageUrl && <SafeImg src={c.imageUrl} alt={c.title} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 12 }} />}
            <div>
              <strong>{c.title}</strong>
              <div style={{ fontSize: 13 }}>{formatDate(c.startDate)} – {formatDate(c.endDate)} · {campaignAudienceLabel(c.targetUserGroup)} · {c.isActive ? 'Yayında' : 'Taslak'}</div>
            </div>
          </div>
          {isAdmin && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" style={btnNeutral} onClick={() => setForm({ ...c, startDate: String(c.startDate).slice(0, 10), endDate: String(c.endDate).slice(0, 10) })}>Düzenle</button>
              {c.isActive
                ? <button type="button" style={btnDanger} onClick={() => confirm({ title: 'Yayından kaldır', message: 'Kampanya içeriği yayından kaldırılacak. Devam edilsin mi?', danger: true, onConfirm: async () => { await api.unpublishCampaign(c.id); setSuccess('Kampanya yayından kaldırıldı.'); await load(); } })}>Yayından al</button>
                : <button type="button" style={btnPrimary} onClick={async () => { await api.publishCampaign(c.id); setSuccess('Kampanya yayına alındı.'); await load(); }}>Yayınla</button>}
            </div>
          )}
        </div>
      ))}
      <PaginationBar page={page} pageSize={25} totalCount={total} onPage={setPage} onPageSize={() => undefined} />
      {form && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)', display: 'grid', placeItems: 'center', zIndex: 80 }} onClick={() => setForm(null)}>
          <form style={{ background: '#fff', padding: 24, width: 440, borderRadius: 16, display: 'grid', gap: 8 }} onClick={(e) => e.stopPropagation()} onSubmit={async (e) => {
            e.preventDefault();
            setSavingKey('camp');
            try {
              const payload = { title: form.title, description: form.description, startDate: new Date(form.startDate).toISOString(), endDate: new Date(form.endDate).toISOString(), targetUserGroup: form.targetUserGroup, imageUrl: form.imageUrl };
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
            <input required placeholder="Kampanya başlığı" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} />
            <textarea placeholder="Detay" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} style={inputStyle} />
            <input required type="date" value={form.startDate || ''} onChange={(e) => setForm({ ...form, startDate: e.target.value })} style={inputStyle} />
            <input required type="date" value={form.endDate || ''} onChange={(e) => setForm({ ...form, endDate: e.target.value })} style={inputStyle} />
            <select value={form.targetUserGroup || 'All'} onChange={(e) => setForm({ ...form, targetUserGroup: e.target.value })} style={inputStyle}>
              <option value="All">Tüm vatandaşlar</option>
              <option value="HighSchool">Lise</option>
              <option value="University">Üniversite</option>
            </select>
            <input placeholder="Görsel" value={form.imageUrl || ''} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} style={inputStyle} />
            <button type="submit" disabled={!!savingKey} style={btnPrimary}>{savingKey ? 'Kaydediliyor…' : 'Kaydet'}</button>
          </form>
        </div>
      )}
    </div>
  );
}
