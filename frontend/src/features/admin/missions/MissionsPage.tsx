import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { pagedMeta } from '../../../lib/adminQuery';
import { formatDate } from '../../../lib/adminDate';
import { Button, DateInput, EmptyState, ErrorState, FilterBar, Input, Modal, NumberInput, Pagination, Select, StatusBadge, Textarea, UnsavedGuard } from '../../../admin/components';
import { useAdminFeedback } from '../AdminFeedback';

export interface AdminMission {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription?: string;
  category: 'Keşif' | 'Etkinlik' | 'Şube' | 'GölBOX' | 'Topluluk';
  missionType: 'ORDER_COMPLETED' | 'EVENT_ATTENDED' | 'DISTINCT_BRANCH' | 'DISTINCT_CATEGORY' | 'FIRST_ORDER';
  targetProgress: number;
  pointsGranted: number;
  startDate: string;
  endDate: string;
  status: 'Draft' | 'Published' | 'Active' | 'Ended' | 'Cancelled';
  targetAudience: 'All' | 'Youth' | 'Student';
  howToCompleteSteps?: string[];
  joinedCount?: number;
  completedCount?: number;
}

const DEFAULT_DEMO_MISSIONS: AdminMission[] = [
  {
    id: 'ms-1',
    title: 'Şehirde Aktif Ol',
    shortDescription: 'Bu ay 2 farklı belediye etkinliğine katıl.',
    fullDescription: 'Şehitkamil Belediyesi gençlik ve kültür etkinliklerine katıl, QR ile katılımını doğrula.',
    category: 'Etkinlik',
    missionType: 'EVENT_ATTENDED',
    targetProgress: 2,
    pointsGranted: 200,
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    status: 'Active',
    targetAudience: 'All',
    joinedCount: 1420,
    completedCount: 520,
  },
  {
    id: 'ms-2',
    title: 'GölBOX Kaşifi',
    shortDescription: '2 farklı GölBOX şubesini ziyaret et.',
    category: 'Şube',
    missionType: 'DISTINCT_BRANCH',
    targetProgress: 2,
    pointsGranted: 100,
    startDate: '2026-10-01',
    endDate: '2026-10-25',
    status: 'Active',
    targetAudience: 'All',
    joinedCount: 890,
    completedCount: 310,
  },
  {
    id: 'ms-3',
    title: 'Yeni Tatlar',
    shortDescription: '2 farklı içecek kategorisinden ürün dene.',
    category: 'Keşif',
    missionType: 'DISTINCT_CATEGORY',
    targetProgress: 2,
    pointsGranted: 75,
    startDate: '2026-10-01',
    endDate: '2026-10-30',
    status: 'Active',
    targetAudience: 'All',
    joinedCount: 650,
    completedCount: 180,
  },
  {
    id: 'ms-4',
    title: 'Haftalık Kahve Molası',
    shortDescription: 'Bu hafta 3 farklı günde GölBOX siparişi ver.',
    category: 'GölBOX',
    missionType: 'ORDER_COMPLETED',
    targetProgress: 3,
    pointsGranted: 150,
    startDate: '2026-10-06',
    endDate: '2026-10-12',
    status: 'Active',
    targetAudience: 'All',
    joinedCount: 2100,
    completedCount: 940,
  },
];

export function MissionsPage() {
  const { isAdmin, confirm, setError, setSuccess, savingKey, setSavingKey } = useAdminFeedback();
  const [items, setItems] = useState<AdminMission[]>(DEFAULT_DEMO_MISSIONS);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(DEFAULT_DEMO_MISSIONS.length);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fail, setFail] = useState<unknown>(null);
  const [form, setForm] = useState<any>(null);
  const [snapshot, setSnapshot] = useState('');

  const load = async () => {
    try {
      const res = await api.getMissions?.({ page, pageSize: 25, search, status: statusFilter });
      if (res && res.items) {
        setItems(res.items);
        setTotal(res.totalCount);
      }
    } catch {
      // Fallback to local catalog
      setItems(DEFAULT_DEMO_MISSIONS);
    }
  };

  useEffect(() => { void load(); }, [page, statusFilter]);

  const blank = () => ({
    title: '',
    shortDescription: '',
    fullDescription: '',
    category: 'GölBOX',
    missionType: 'ORDER_COMPLETED',
    targetProgress: 2,
    pointsGranted: 100,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    targetAudience: 'All',
    status: 'Draft',
  });

  const dirty = !!form && JSON.stringify(form) !== snapshot;
  const open = (next: any) => { setForm(next); setSnapshot(JSON.stringify(next)); };
  const close = () => {
    if (dirty) confirm({ title: 'Kaydedilmemiş Değişiklikler', message: 'Görev formundaki değişiklikler kaydedilmedi. Kapatılsın mı?', confirmLabel: 'Kapat', danger: true, onConfirm: () => setForm(null) });
    else setForm(null);
  };

  const filteredItems = items.filter((m) => {
    if (statusFilter && m.status !== statusFilter) return false;
    if (search && !m.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <UnsavedGuard dirty={dirty} />
      <p className="admin-muted" style={{ margin: 0 }}>
        Vatandaşların GölBOX ekosistemindeki katılım, şube ziyareti ve etkinlik hedeflerini yönetin. Puan hak edişleri otomatik olarak Loyalty Service üzerinden işlenir.
      </p>

      {isAdmin && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button data-testid="mission-create" onClick={() => open(blank())}>
            + Yeni Görev Tanımla
          </Button>
        </div>
      )}

      <FilterBar
        search={search}
        onSearch={setSearch}
        activeCount={[search, statusFilter].filter(Boolean).length}
        onClear={() => { setSearch(''); setStatusFilter(''); setPage(1); }}
        onSubmit={() => setPage(1)}
        filters={
          <>
            <Select label="Durum" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">Tüm Durumlar</option>
              <option value="Active">Aktif</option>
              <option value="Published">Yayında</option>
              <option value="Draft">Taslak</option>
              <option value="Ended">Sona Eren</option>
            </Select>
            <Button type="submit" size="sm">Filtrele</Button>
          </>
        }
      />

      {filteredItems.length === 0 ? (
        <EmptyState title="Henüz görev bulunmuyor." description="Yeni bir katılım görevi oluşturun." actionLabel={isAdmin ? '+ Yeni Görev' : undefined} onAction={isAdmin ? () => open(blank()) : undefined} />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Görev Adı</th>
                <th>Kategori</th>
                <th>Tür (Trigger)</th>
                <th>Hedef</th>
                <th>Ödül</th>
                <th>Tarih Aralığı</th>
                <th>Tamamlanma</th>
                <th>Durum</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((m) => (
                <tr key={m.id}>
                  <td>
                    <strong>{m.title}</strong>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{m.shortDescription}</div>
                  </td>
                  <td><span className="admin-badge admin-badge-neutral">{m.category}</span></td>
                  <td style={{ fontSize: 12, fontWeight: 700 }}>{m.missionType}</td>
                  <td style={{ fontWeight: 800 }}>{m.targetProgress} Adım</td>
                  <td><span className="admin-gp">+{m.pointsGranted} GP</span></td>
                  <td style={{ fontSize: 12 }}>{formatDate(m.startDate)} – {formatDate(m.endDate)}</td>
                  <td style={{ fontSize: 12 }}>{m.completedCount ?? 0} / {m.joinedCount ?? 0} (%{m.joinedCount ? Math.round(((m.completedCount || 0) / m.joinedCount) * 100) : 0})</td>
                  <td><StatusBadge status={m.status} label={m.status === 'Active' ? 'Aktif' : m.status === 'Draft' ? 'Taslak' : m.status} /></td>
                  <td>
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Button size="sm" variant="secondary" onClick={() => open(m)}>Düzenle</Button>
                        {m.status === 'Active' ? (
                          <Button size="sm" variant="danger" onClick={() => confirm({ title: 'Görev Sona Erdirilsin mi?', message: 'Aktif görev sonlandırılacak. Kazanılan ödüller etkilenmez.', danger: true, confirmLabel: 'Sonlandır', onConfirm: () => {
                            setItems((prev) => prev.map((x) => x.id === m.id ? { ...x, status: 'Ended' } : x));
                            setSuccess('Görev sonlandırıldı.');
                          } })}>Sonlandır</Button>
                        ) : (
                          <Button size="sm" onClick={() => {
                            setItems((prev) => prev.map((x) => x.id === m.id ? { ...x, status: 'Active' } : x));
                            setSuccess('Görev aktifleştirildi.');
                          }}>Yayınla</Button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} pageSize={25} totalCount={total} onPage={setPage} />

      <Modal
        open={!!form}
        title={form?.id ? 'Görev Düzenle' : 'Yeni Görev Oluştur'}
        size="lg"
        onClose={close}
        footer={
          <>
            <Button variant="secondary" onClick={close}>Vazgeç</Button>
            <Button loading={!!savingKey} onClick={() => void (document.getElementById('mission-form') as HTMLFormElement | null)?.requestSubmit()}>Kaydet</Button>
          </>
        }
      >
        {form && (
          <form
            id="mission-form"
            style={{ display: 'grid', gap: 12 }}
            onSubmit={async (e) => {
              e.preventDefault();
              if (Number(form.targetProgress) <= 0) { setError('Hedef adım 0 dan büyük olmalıdır.'); return; }
              setSavingKey('mission');
              try {
                if (form.id) {
                  setItems((prev) => prev.map((x) => x.id === form.id ? { ...form } : x));
                } else {
                  const newM: AdminMission = { ...form, id: `ms-${Date.now()}`, status: 'Active', joinedCount: 0, completedCount: 0 };
                  setItems((prev) => [newM, ...prev]);
                }
                setSuccess('Görev kaydedildi.');
                setForm(null);
              } catch (err: any) {
                setError(err.message || 'Görev kaydedilemedi.');
              } finally {
                setSavingKey(null);
              }
            }}
          >
            <Input required label="Görev Başlığı" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input required label="Kısa Açıklama" value={form.shortDescription || ''} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} />
            <Textarea label="Detaylı Görev Açıklaması" value={form.fullDescription || ''} onChange={(e) => setForm({ ...form, fullDescription: e.target.value })} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Select label="Kategori" value={form.category || 'GölBOX'} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="Keşif">Keşif Görevi</option>
                <option value="Etkinlik">Etkinlik Görevi</option>
                <option value="Şube">Şube Ziyareti</option>
                <option value="GölBOX">GölBOX Genel</option>
                <option value="Topluluk">Topluluk Katılımı</option>
              </Select>

              <Select label="Tetikleyici Türü (Trigger)" value={form.missionType || 'ORDER_COMPLETED'} onChange={(e) => setForm({ ...form, missionType: e.target.value })}>
                <option value="ORDER_COMPLETED">Sipariş Tamamlama (Distinct Day)</option>
                <option value="EVENT_ATTENDED">Doğrulanmış Etkinlik Katılımı</option>
                <option value="DISTINCT_BRANCH">Farklı Şube Ziyareti</option>
                <option value="DISTINCT_CATEGORY">Farklı İçecek Kategorisi</option>
                <option value="FIRST_ORDER">İlk Alışveriş</option>
              </Select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <NumberInput required min={1} label="Hedef Adım Sayısı (Target)" helper="Örn: 2 Ziyaret veya 3 Sipariş" value={form.targetProgress} onChange={(e) => setForm({ ...form, targetProgress: Number(e.target.value) })} />
              <NumberInput required min={1} label="Ödül Miktarı (GölPuan)" helper="Tamamlandığında hak edilecek GP" value={form.pointsGranted} onChange={(e) => setForm({ ...form, pointsGranted: Number(e.target.value) })} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <DateInput required label="Başlangıç Tarihi" value={form.startDate || ''} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              <DateInput required label="Bitiş Tarihi" value={form.endDate || ''} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>

            <Select label="Hedef Kitle" value={form.targetAudience || 'All'} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}>
              <option value="All">Tüm Vatandaşlar</option>
              <option value="Youth">Gençler</option>
              <option value="Student">Öğrenciler</option>
            </Select>
          </form>
        )}
      </Modal>
    </div>
  );
}
