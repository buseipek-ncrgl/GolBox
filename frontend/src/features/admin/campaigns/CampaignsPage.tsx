import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { pagedMeta } from '../../../lib/adminQuery';
import { campaignAudienceLabel } from '../../../lib/adminLabels';
import { formatDate, istanbulDateToIsoEnd, istanbulDateToIsoStart } from '../../../lib/adminDate';
import { Button, DateInput, EmptyState, ErrorState, FilterBar, Input, Modal, Select, Textarea, UnsavedGuard } from '../../../admin/components';
import { SafeImg } from '../../../components/admin/adminUi';
import { useAdminFeedback } from '../AdminFeedback';

export function CampaignsPage() {
  const { isAdmin, confirm, setError, setSuccess, savingKey, setSavingKey } = useAdminFeedback();
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [fail, setFail] = useState<unknown>(null);
  const [form, setForm] = useState<any>(null);
  const [snapshot, setSnapshot] = useState('');

  const load = async () => {
    try {
      const res = await api.getCampaigns({ page, pageSize: 25, search: search || undefined });
      const meta = pagedMeta(res, page, 25);
      setItems(meta.items);
      setTotal(meta.totalCount);
      setFail(null);
    } catch (err: any) {
      setFail(err);
    }
  };
  useEffect(() => { void load(); }, [page]);

  const dirty = !!form && JSON.stringify(form) !== snapshot;
  const open = (next: any) => { setForm(next); setSnapshot(JSON.stringify(next)); };
  const close = () => {
    if (dirty) confirm({ title: 'Kaydedilmemiş değişiklikler', message: 'Kampanya formundaki değişiklikler kaydedilmedi. Kapatılsın mı?', confirmLabel: 'Kapat', danger: true, onConfirm: () => setForm(null) });
    else setForm(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <UnsavedGuard dirty={dirty} />
      <p className="admin-muted" style={{ margin: 0 }}>Bu alan uygulamada gösterilecek kampanya duyurularını yönetir. Otomatik indirim veya GölPuan kuralı uygulamaz.</p>
      {isAdmin && <div style={{ display: 'flex', justifyContent: 'flex-end' }}><Button data-testid="campaign-create" onClick={() => open({ title: '', shortDescription: '', description: '', startDate: '', endDate: '', targetUserGroup: 'All', imageUrl: '', ctaLabel: '' })}>+ Yeni kampanya içeriği</Button></div>}
      <FilterBar search={search} onSearch={setSearch} activeCount={search ? 1 : 0} onClear={() => setSearch('')} onSubmit={() => { setPage(1); void load(); }} filters={<Button type="submit" size="sm">Filtrele</Button>} />
      {fail ? <ErrorState error={fail} retry={load} /> : null}
      {items.length === 0 ? <EmptyState title="Henüz kampanya içeriği yok." description="Vatandaş uygulamasında görünecek duyuru içeriği oluşturun." /> : items.map((c) => (
        <div key={c.id} className="admin-card" style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <SafeImg src={c.imageUrl} alt={c.title} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 12 }} />
            <div>
              <strong>{c.title}</strong>
              <div style={{ fontSize: 13 }}>{formatDate(c.startDate)} – {formatDate(c.endDate)} · {campaignAudienceLabel(c.targetUserGroup)} · {c.isActive ? 'Yayında' : 'Taslak'}</div>
            </div>
          </div>
          {isAdmin && (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button size="sm" variant="secondary" onClick={() => open({ ...c, shortDescription: c.shortDescription || '', startDate: String(c.startDate || '').slice(0, 10), endDate: String(c.endDate || '').slice(0, 10) })}>Düzenle</Button>
              {c.isActive
                ? <Button size="sm" variant="danger" onClick={() => confirm({ title: 'Yayından kaldır', message: 'Kampanya içeriği yayından kaldırılacak. Devam edilsin mi?', danger: true, onConfirm: async () => { await api.unpublishCampaign(c.id); setSuccess('Kampanya yayından kaldırıldı.'); await load(); } })}>Yayından al</Button>
                : <Button size="sm" onClick={async () => { await api.publishCampaign(c.id); setSuccess('Kampanya yayına alındı.'); await load(); }}>Yayınla</Button>}
            </div>
          )}
        </div>
      ))}
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
                shortDescription: form.shortDescription,
                description: form.description,
                startDate: istanbulDateToIsoStart(form.startDate),
                endDate: istanbulDateToIsoEnd(form.endDate),
                targetUserGroup: form.targetUserGroup,
                imageUrl: form.imageUrl,
                ctaLabel: form.ctaLabel
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
            <p className="admin-helper">Kampanyalar bilgilendirme içeriğidir; otomatik ödül veya indirim kuralı uygulamaz.</p>
            <Input required label="Kampanya Başlığı" data-testid="campaign-title" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input label="Kısa Açıklama" value={form.shortDescription || ''} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} />
            <Textarea label="Detay" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <DateInput required label="Başlangıç Tarihi" value={form.startDate || ''} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <DateInput required label="Bitiş Tarihi" value={form.endDate || ''} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            <Select label="Hedef Kitle" value={form.targetUserGroup || 'All'} onChange={(e) => setForm({ ...form, targetUserGroup: e.target.value })}>
              <option value="All">Tüm vatandaşlar</option>
              <option value="HighSchool">Lise</option>
              <option value="University">Üniversite</option>
            </Select>
            <Input label="Görsel" helper="Opsiyonel görsel URL" value={form.imageUrl || ''} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
            <Input label="Yönlendirme" helper="Opsiyonel CTA metni" value={form.ctaLabel || ''} onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })} />
          </form>
        )}
      </Modal>
    </div>
  );
}
