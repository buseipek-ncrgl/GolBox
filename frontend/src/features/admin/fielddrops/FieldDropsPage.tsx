import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { pagedMeta } from '../../../lib/adminQuery';
import { fieldDropStatusLabel } from '../../../lib/adminLabels';
import { formatDateTime, formatGp, istanbulDateTimeToIso, splitIstanbulDateTime } from '../../../lib/adminDate';
import {
  Button, DateInput, Drawer, EmptyState, ErrorState, FilterBar, Input, Modal, NumberInput,
  Pagination, Select, StatusBadge, Textarea, TimeInput, UnsavedGuard
} from '../../../admin/components';
import { AdminMapPicker } from '../../../components/admin/AdminMapPicker';
import { useAdminFeedback } from '../AdminFeedback';

const emptyForm = () => ({
  title: '',
  description: '',
  latitude: 37.0662,
  longitude: 37.3781,
  radiusMeters: 40,
  pointsGranted: 25,
  totalStock: 100,
  perUserLimit: 1,
  isActive: true,
  startDate: '',
  startTime: '09:00',
  endDate: '',
  endTime: '18:00',
  imageUrl: '',
  modelGlbUrl: ''
});

export function FieldDropsPage() {
  const { confirm, setError, setSuccess, savingKey, setSavingKey } = useAdminFeedback();
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [fail, setFail] = useState<unknown>(null);
  const [form, setForm] = useState<any>(null);
  const [snapshot, setSnapshot] = useState('');
  const [advanced, setAdvanced] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [collectors, setCollectors] = useState<any>(null);

  const load = async () => {
    try {
      const res = await api.getFieldDrops({ page, pageSize: 25, filter: filter || undefined, search: search || undefined });
      const meta = pagedMeta(res, page, 25);
      setItems(meta.items);
      setTotal(meta.totalCount);
      setFail(null);
    } catch (err: any) {
      setFail(err);
    }
  };
  useEffect(() => { void load(); }, [page, filter]);

  const dirty = !!form && JSON.stringify(form) !== snapshot;
  const openCreate = () => {
    const next = emptyForm();
    setForm(next);
    setSnapshot(JSON.stringify(next));
    setAdvanced(false);
    setFormError(null);
  };
  const openEdit = (drop: any) => {
    const start = splitIstanbulDateTime(drop.startsAt);
    const end = splitIstanbulDateTime(drop.endsAt);
    const next = {
      ...drop,
      startDate: start.date,
      startTime: start.time || '09:00',
      endDate: end.date,
      endTime: end.time || '18:00'
    };
    setForm(next);
    setSnapshot(JSON.stringify(next));
    setAdvanced(false);
    setFormError(null);
  };

  const closeForm = () => {
    if (dirty) {
      confirm({
        title: 'Kaydedilmemiş değişiklikler',
        message: 'Saha hediyesi formundaki değişiklikler kaydedilmedi. Kapatılsın mı?',
        confirmLabel: 'Kapat',
        danger: true,
        onConfirm: () => setForm(null)
      });
      return;
    }
    setForm(null);
  };

  const validate = () => {
    if (!form.startDate || !form.startTime || !form.endDate || !form.endTime) return 'Başlangıç ve bitiş tarihi zorunludur.';
    const start = new Date(istanbulDateTimeToIso(form.startDate, form.startTime)).getTime();
    const end = new Date(istanbulDateTimeToIso(form.endDate, form.endTime)).getTime();
    if (!(start < end)) return 'Bitiş tarihi başlangıçtan sonra olmalıdır.';
    if (!form.id && start < Date.now() - 5 * 60 * 1000) return 'Başlangıç tarihi geçmiş bir tarih olamaz.';
    if (Number(form.perUserLimit || 0) < 1) return 'Kişi başı toplama limiti en az 1 olmalıdır.';
    return null;
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const invalid = validate();
    if (invalid) {
      setFormError(invalid);
      return;
    }
    setSavingKey('fd');
    try {
      const payload = {
        title: form.title,
        description: form.description,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        radiusMeters: Number(form.radiusMeters),
        pointsGranted: Number(form.pointsGranted),
        totalStock: form.totalStock === '' || form.totalStock == null ? null : Number(form.totalStock),
        perUserLimit: Number(form.perUserLimit || 1),
        isActive: form.isActive !== false,
        startsAt: istanbulDateTimeToIso(form.startDate, form.startTime),
        endsAt: istanbulDateTimeToIso(form.endDate, form.endTime),
        imageUrl: form.imageUrl,
        modelGlbUrl: form.modelGlbUrl
      };
      if (form.id) await api.updateFieldDrop(form.id, payload);
      else await api.createFieldDrop(payload);
      setSuccess(form.id ? 'Saha hediyesi güncellendi.' : 'Saha hediyesi oluşturuldu.');
      setForm(null);
      await load();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSavingKey(null);
    }
  };

  const openCollectors = async (drop: any) => {
    try {
      const res = await api.getFieldDropCaptures(drop.id, { page: 1, pageSize: 25 });
      const meta = pagedMeta(res, 1, 25);
      setCollectors({ drop, ...meta, page: 1 });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const loadCollectorsPage = async (nextPage: number) => {
    if (!collectors?.drop) return;
    const res = await api.getFieldDropCaptures(collectors.drop.id, { page: nextPage, pageSize: 25 });
    const meta = pagedMeta(res, nextPage, 25);
    setCollectors({ drop: collectors.drop, ...meta, page: nextPage });
  };

  const stopDrop = (drop: any) => {
    confirm({
      title: 'Saha hediyesini durdur',
      message: `"${drop.title}" durdurulacak. Vatandaşlar bu hediyeyi toplayamayacak. Devam edilsin mi?`,
      confirmLabel: 'Durdur',
      danger: true,
      onConfirm: async () => {
        const start = splitIstanbulDateTime(drop.startsAt);
        const end = splitIstanbulDateTime(drop.endsAt);
        await api.updateFieldDrop(drop.id, {
          ...drop,
          isActive: false,
          startsAt: istanbulDateTimeToIso(start.date, start.time),
          endsAt: istanbulDateTimeToIso(end.date, end.time)
        });
        setSuccess('Saha hediyesi durduruldu.');
        await load();
      }
    });
  };

  const republish = async (drop: any) => {
    const start = splitIstanbulDateTime(drop.startsAt);
    const end = splitIstanbulDateTime(drop.endsAt);
    await api.updateFieldDrop(drop.id, {
      ...drop,
      isActive: true,
      startsAt: istanbulDateTimeToIso(start.date, start.time),
      endsAt: istanbulDateTimeToIso(end.date, end.time)
    });
    setSuccess('Saha hediyesi yeniden yayınlandı.');
    await load();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <UnsavedGuard dirty={dirty} />
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button data-testid="fielddrop-create" onClick={openCreate}>+ Konuma hediye bırak</Button>
      </div>
      <FilterBar
        search={search}
        onSearch={setSearch}
        activeCount={[search, filter].filter(Boolean).length}
        onClear={() => { setSearch(''); setFilter(''); setPage(1); void load(); }}
        onSubmit={() => { setPage(1); void load(); }}
        filters={
          <>
            <Select label="Durum" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">Tümü</option>
              <option value="active">Aktif</option>
              <option value="stopped">Durduruldu</option>
              <option value="expired">Süresi doldu</option>
            </Select>
            <Button type="submit" size="sm">Filtrele</Button>
          </>
        }
      />
      {fail ? <ErrorState error={fail} retry={load} /> : null}
      {items.length === 0 ? (
        <EmptyState title="Henüz saha hediyesi yok." description="Konuma bir hediye bırakarak vatandaşların GölBox toplamasını başlatın." actionLabel="+ Konuma hediye bırak" onAction={openCreate} />
      ) : items.map((drop) => {
        const stopped = drop.isActive === false;
        const expired = drop.endsAt && new Date(drop.endsAt).getTime() < Date.now();
        return (
          <div key={drop.id} className="admin-card" data-testid="fielddrop-row">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <strong>{drop.title}</strong>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                  <StatusBadge status={stopped ? 'Inactive' : expired ? 'Archived' : 'Active'} label={fieldDropStatusLabel(drop)} />
                  <span className="admin-muted">{drop.radiusMeters} m · +{formatGp(drop.pointsGranted)}</span>
                </div>
                <div style={{ fontSize: 13, marginTop: 6 }}>Stok {drop.remainingStock ?? drop.totalStock ?? '∞'} · Toplanan {drop.capturedCount || 0} · Limit {drop.perUserLimit || 1} · {formatDateTime(drop.startsAt)} – {formatDateTime(drop.endsAt)}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <Button size="sm" variant="secondary" data-testid="fielddrop-collectors" onClick={() => void openCollectors(drop)}>Toplayanlar</Button>
                {!stopped && !expired ? <Button size="sm" variant="secondary" data-testid="fielddrop-stop" onClick={() => stopDrop(drop)}>Durdur</Button> : null}
                {stopped ? <Button size="sm" variant="secondary" onClick={() => void republish(drop)}>Yeniden Yayınla</Button> : null}
                <Button size="sm" variant="secondary" onClick={() => openEdit(drop)}>Düzenle</Button>
                <Button size="sm" variant="danger" onClick={() => confirm({
                  title: 'Kaldır',
                  message: 'Bu saha hediyesi kaldırılacak (arşivlenecek). Devam edilsin mi?',
                  danger: true,
                  confirmLabel: 'Kaldır',
                  onConfirm: async () => { await api.deleteFieldDrop(drop.id); setSuccess('Saha hediyesi kaldırıldı.'); await load(); }
                })}>Kaldır</Button>
              </div>
            </div>
          </div>
        );
      })}
      <Pagination page={page} pageSize={25} totalCount={total} onPage={setPage} />

      <Modal open={!!form} title={form?.id ? 'Saha hediyesi düzenle' : 'Konuma hediye bırak'} size="lg" onClose={closeForm} footer={
        <>
          <Button variant="secondary" onClick={closeForm}>Vazgeç</Button>
          <Button data-testid="fielddrop-save" loading={savingKey === 'fd'} onClick={() => void (document.getElementById('fielddrop-form') as HTMLFormElement | null)?.requestSubmit()}>
            {savingKey === 'fd' ? 'Kaydediliyor…' : 'Kaydet'}
          </Button>
        </>
      }>
        {form && (
          <form id="fielddrop-form" onSubmit={save} style={{ display: 'grid', gap: 12 }}>
            {formError ? <p className="admin-field-error" role="alert">{formError}</p> : null}
            <Input required label="Başlık" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Textarea label="Açıklama" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <AdminMapPicker latitude={Number(form.latitude)} longitude={Number(form.longitude)} radiusMeters={Number(form.radiusMeters)} onChange={(lat, lng) => setForm({ ...form, latitude: lat, longitude: lng })} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <DateInput required label="Başlangıç Tarihi" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              <TimeInput required label="Başlangıç Saati" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
              <DateInput required label="Bitiş Tarihi" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              <TimeInput required label="Bitiş Saati" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            </div>
            <NumberInput required label="Yarıçap (m)" value={form.radiusMeters} onChange={(e) => setForm({ ...form, radiusMeters: e.target.value })} />
            <NumberInput required label="GölPuan Ödülü" value={form.pointsGranted} onChange={(e) => setForm({ ...form, pointsGranted: e.target.value })} />
            <NumberInput label="Stok" helper="Boş bırakılırsa sınırsız" value={form.totalStock ?? ''} onChange={(e) => setForm({ ...form, totalStock: e.target.value })} />
            <NumberInput
              required
              min={1}
              label="Kişi başı toplama limiti"
              helper="Bir vatandaş bu saha hediyesini en fazla kaç kez toplayabilir?"
              value={form.perUserLimit}
              onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })}
            />
            <Button type="button" variant="secondary" onClick={() => setAdvanced(!advanced)}>{advanced ? 'Gelişmiş seçenekleri gizle' : 'Gelişmiş seçenekler'}</Button>
            {advanced && (
              <>
                <NumberInput label="Enlem" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
                <NumberInput label="Boylam" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
                <Input label="3D / GLB URL" helper="Opsiyonel" value={form.modelGlbUrl || ''} onChange={(e) => setForm({ ...form, modelGlbUrl: e.target.value })} />
              </>
            )}
          </form>
        )}
      </Modal>

      <Drawer open={!!collectors} title={collectors ? `${collectors.drop.title} — Toplayanlar` : 'Toplayanlar'} onClose={() => setCollectors(null)}>
        {collectors && (
          <>
            {collectors.items.length === 0 ? (
              <EmptyState title="Henüz toplayan yok." description="Bu saha hediyesini toplayan vatandaş burada görünür." />
            ) : collectors.items.map((c: any) => (
              <div key={c.id} style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: 14 }}>
                <strong>{c.userFullName}</strong>
                <div className="admin-muted">{formatDateTime(c.createdDate)} · {formatGp(c.pointsGranted)} · {c.status || 'Toplandı'}</div>
              </div>
            ))}
            <Pagination page={collectors.page} pageSize={25} totalCount={collectors.totalCount} onPage={(p) => void loadCollectorsPage(p)} />
          </>
        )}
      </Drawer>
    </div>
  );
}
