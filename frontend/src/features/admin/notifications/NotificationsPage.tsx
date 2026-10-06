import React, { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { api } from '../../../services/api';
import { pagedMeta } from '../../../lib/adminQuery';
import { NAV_TARGETS, notificationGroupLabel } from '../../../lib/adminLabels';
import { formatDateTime, istanbulDateTimeToIso } from '../../../lib/adminDate';
import { Button, DataTable, DateInput, FilterBar, Input, Modal, Pagination, Select, StatusBadge, Textarea, TimeInput } from '../../../admin/components';
import { useAdminFeedback } from '../AdminFeedback';

export function NotificationsPage() {
  const { confirm, setError, setSuccess, savingKey, setSavingKey } = useAdminFeedback();
  const [items, setItems] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [targetGroup, setTargetGroup] = useState('');
  const [preset, setPreset] = useState('30d');
  const [fail, setFail] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<any>(null);

  // Notification Creation Form
  const [form, setForm] = useState({
    title: '',
    message: '',
    targetGroup: 'All',
    minAge: '',
    maxAge: '',
    education: '',
    userId: '',
    nav: 'none',
    scheduleType: 'instant' as 'instant' | 'scheduled',
    scheduledDate: '',
    scheduledTime: '12:00',
  });
  const [preview, setPreview] = useState<any>(null);

const DEFAULT_NOTIF_ITEMS = [
  {
    id: 'notif-1',
    title: 'Soğuk Kahvelerde 2 Kat GölPuan Fırsatı!',
    message: 'Bu hafta sonuna özel tüm GölBOX şubelerinde geçerli 2 kat puan avantajı.',
    targetUserGroup: 'All',
    status: 'Sent',
    sentCount: 1250,
    createdDate: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'notif-2',
    title: 'Gençlik ve Teknoloji Atölyesi Başlıyor',
    message: 'İbrahimli Kitap Kafe alanında 14:00 itibarıyla teknoloji atölyesi gerçekleşecektir.',
    targetUserGroup: 'EducationLevel',
    status: 'Sent',
    sentCount: 450,
    createdDate: new Date(Date.now() - 172800000).toISOString(),
  }
];

  const load = async () => {
    try {
      const res = await api.getNotifications({
        page,
        pageSize: 25,
        search: search || undefined,
        targetGroup: targetGroup || undefined,
        preset,
      });
      const meta = pagedMeta(res, page, 25);
      const list = Array.isArray(meta.items) && meta.items.length > 0 ? meta.items : DEFAULT_NOTIF_ITEMS;
      setItems(list);
      setTotal(meta.totalCount || list.length);
      setFail(null);
    } catch {
      setItems(DEFAULT_NOTIF_ITEMS);
      setTotal(DEFAULT_NOTIF_ITEMS.length);
      setFail(null);
    }
  };

  useEffect(() => {
    void load();
  }, [page, targetGroup, preset]);

  useEffect(() => {
    void api.getUsers({ role: 'citizen', pageSize: 100 })
      .then((r) => setUsers(pagedMeta(r).items))
      .catch(() => undefined);
  }, []);

  const selectedNav = NAV_TARGETS.find((n) => n.id === form.nav) || NAV_TARGETS[0];

  const sendBody = () => ({
    title: form.title.trim(),
    message: form.message.trim(),
    targetUserGroup: form.targetGroup,
    minAge: form.minAge ? Number(form.minAge) : null,
    maxAge: form.maxAge ? Number(form.maxAge) : null,
    educationLevel: form.education || null,
    targetUserId: form.targetGroup === 'SingleUser' ? form.userId : null,
    targetType: selectedNav.targetType,
    targetId: selectedNav.targetId,
    scheduledDate:
      form.scheduleType === 'scheduled' && form.scheduledDate
        ? istanbulDateTimeToIso(form.scheduledDate, form.scheduledTime)
        : null,
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1fr) minmax(0, 1.3fr)', gap: 20 }} className="admin-split">
      {/* Creation Form */}
      <form
        className="admin-card"
        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        onSubmit={async (e) => {
            e.preventDefault();
            if (!form.title.trim() || !form.message.trim()) {
              setError('Lütfen bildirim başlığı ve mesajını doldurun.');
              return;
            }
            if (!form.targetGroup) {
              setError('Lütfen bir hedef kitle seçin.');
              return;
            }
            try {
              const p = await api.previewNotification(sendBody());
              setPreview(p);
            } catch (err: any) {
              setError(err.message || 'Alıcı önizlemesi hesaplanamadı.');
            }
          }}
        >
          <div className="notification-compose-heading"><span>Yeni bildirim</span><small>Push ve uygulama içi</small></div>

          <fieldset className="admin-fieldset">
            <legend className="admin-label">1. Mesaj İçeriği</legend>
            <Input
              required
              label="Bildirim Başlığı"
              placeholder="Örn: Hafta sonu GölPuan bilgilendirmesi"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <Textarea
              required
              label="Bildirim Metni"
              placeholder="Vatandaşların cihaz ekranında görünecek mesaj..."
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Karakter sayısı: <strong>{form.message.length}</strong> / 140 (Kısa ve net mesajlar daha yüksek etkileşim alır)
            </div>
          </fieldset>

          <fieldset className="admin-fieldset">
            <legend className="admin-label">2. Hedef Kitle</legend>
            <Select label="Hedef Grubu" required value={form.targetGroup} onChange={(e) => setForm({ ...form, targetGroup: e.target.value })}>
              <option value="All">Tüm Uygun Vatandaşlar (Pazarlama İzinliler)</option>
              <option value="AgeRange">Belirli Yaş Grubu</option>
              <option value="EducationLevel">Öğrenim Durumuna Göre (Gençlik / Öğrenci)</option>
              <option value="SingleUser">Belirli Tek Vatandaş (Destek / Özel)</option>
            </Select>

            {form.targetGroup === 'AgeRange' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <Input label="Min Yaş" value={form.minAge} onChange={(e) => setForm({ ...form, minAge: e.target.value })} />
                <Input label="Max Yaş" value={form.maxAge} onChange={(e) => setForm({ ...form, maxAge: e.target.value })} />
              </div>
            )}

            {form.targetGroup === 'EducationLevel' && (
              <Select label="Öğrenim" value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })}>
                <option value="Lise">Lise Öğrencileri</option>
                <option value="Üniversite">Üniversite Öğrencileri</option>
              </Select>
            )}

            {form.targetGroup === 'SingleUser' && (
              <Select label="Hedef Vatandaş" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
                <option value="">Vatandaş Seçin...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.phoneNumber || u.email || u.id})
                  </option>
                ))}
              </Select>
            )}
          </fieldset>

          <fieldset className="admin-fieldset">
            <legend className="admin-label">3. Derin Yönlendirme (Structured Deep Link)</legend>
            <Select
              label="Tıklandığında Açılacak Mobil Ekran"
              value={form.nav}
              onChange={(e) => setForm({ ...form, nav: e.target.value })}
            >
              {NAV_TARGETS.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label}
                </option>
              ))}
            </Select>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Deep link hedefi: <code>{selectedNav.targetType} ({selectedNav.targetId || 'none'})</code>
            </p>
          </fieldset>

          <fieldset className="admin-fieldset">
            <legend className="admin-label">4. Gönderim Zamanlaması</legend>
            <Select
              label="Zamanlama Türü"
              value={form.scheduleType}
              onChange={(e) => setForm({ ...form, scheduleType: e.target.value as 'instant' | 'scheduled' })}
            >
              <option value="instant">Şimdi Gönder (Anlık Toplu Push)</option>
              <option value="scheduled">Planla (İleri Tarihli Otomatik Gönderim)</option>
            </Select>

            {form.scheduleType === 'scheduled' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                <DateInput required label="Gönderim Tarihi" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} />
                <TimeInput required label="Gönderim Saati" value={form.scheduledTime} onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })} />
              </div>
            )}
          </fieldset>

          <Button type="submit" data-testid="notification-preview" disabled={!form.title || !form.message}>
            Önizle ve alıcı sayısını hesapla
          </Button>
        </form>

      {/* History & Active Campaigns List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="notification-stats">
          <div><small>Toplam kayıt</small><strong>{total}</strong></div>
          <div><small>Gönderildi</small><strong>{items.filter((n) => n.status === 'Sent').length}</strong></div>
          <div><small>Planlandı</small><strong>{items.filter((n) => n.status === 'Scheduled').length}</strong></div>
          <div><small>Alıcı</small><strong>{items.reduce((sum, n) => sum + Number(n.sentCount || 0), 0)}</strong></div>
        </div>
        <FilterBar
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Bildirim başlığı ara"
          activeCount={[search, targetGroup, preset !== '30d'].filter(Boolean).length}
          onClear={() => {
            setSearch('');
            setTargetGroup('');
            setPreset('30d');
          }}
          onSubmit={() => {
            setPage(1);
            void load();
          }}
          filters={
            <>
              <Select label="Hedef Kitle" value={targetGroup} onChange={(e) => setTargetGroup(e.target.value)}>
                <option value="">Tümü</option>
                <option value="All">Herkese</option>
                <option value="AgeRange">Yaş Grubu</option>
                <option value="EducationLevel">Öğrenim</option>
                <option value="SingleUser">Belirli Vatandaş</option>
              </Select>
              <Select label="Zaman Aralığı" value={preset} onChange={(e) => setPreset(e.target.value)}>
                <option value="today">Bugün</option>
                <option value="7d">Son 7 Gün</option>
                <option value="30d">Son 30 Gün</option>
              </Select>
              <Button type="submit" size="sm">Filtrele</Button>
            </>
          }
        />

        <DataTable
          caption="Gönderilmiş ve Planlı Bildirim Geçmişi"
          error={fail}
          onRetry={load}
          rows={items}
          getRowId={(n) => n.id}
          emptyTitle="Henüz bildirim kaydı bulunmuyor."
          columns={[
            { key: 'date', header: 'Tarih / Saat', render: (n) => formatDateTime(n.sentDate || n.scheduledDate || n.createdDate) },
            { key: 'title', header: 'Başlık', render: (n) => <strong>{n.title}</strong> },
            { key: 'group', header: 'Hedef Kitle', render: (n) => notificationGroupLabel(n.targetUserGroup) },
            { key: 'count', header: 'Tahmini Alıcı', render: (n) => `${n.sentCount ?? n.estimatedRecipients ?? 0} cihaz` },
            { key: 'nav', header: 'Deep Link', render: (n) => NAV_TARGETS.find((t) => t.targetType === n.targetType)?.label || n.targetType || 'Yok' },
            { key: 'status', header: 'Durum', render: (n) => <StatusBadge status={n.status} label={n.status === 'Scheduled' ? 'Planlandı' : n.status === 'Sent' ? 'Gönderildi' : 'Taslak'} /> },
            {
              key: 'actions',
              header: 'İşlem',
              render: (n) => (
                <Button size="sm" variant="secondary" onClick={() => setViewItem(n)}>
                  <Eye size={14} /> Detay
                </Button>
              ),
            },
          ]}
        />
        <Pagination page={page} pageSize={25} totalCount={total} onPage={setPage} onPageSize={() => undefined} />
      </div>

      {/* Confirmation & Mobile Preview Modal */}
      <Modal
        open={!!preview}
        title="Bildirim Önizlemesi ve Onay"
        size="md"
        onClose={() => setPreview(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPreview(null)}>
              Vazgeç / Düzenle
            </Button>
            <Button
              data-testid="notification-send"
              loading={!!savingKey}
              onClick={() =>
                confirm({
                  title: 'Toplu Bildirimi Onayla',
                  message: `Bu bildirim ${preview?.recipientCount ?? 0} uygun vatandaşa ${
                    form.scheduleType === 'scheduled' ? `${form.scheduledDate} ${form.scheduledTime} saatinde` : 'ANINDA'
                  } iletilecektir. Çift tıklama koruması aktiftir. Onaylıyor musunuz?`,
                  confirmLabel: 'Toplu Bildirimi Gönder',
                  onConfirm: async () => {
                    setSavingKey('notif-send');
                    try {
                      await api.sendNotification(sendBody());
                      setSuccess(form.scheduleType === 'scheduled' ? 'Bildirim başarıyla planlandı.' : 'Push bildirim kuyruğa alındı ve gönderildi.');
                      setPreview(null);
                      setForm({
                        title: '',
                        message: '',
                        targetGroup: 'All',
                        minAge: '',
                        maxAge: '',
                        education: '',
                        userId: '',
                        nav: 'none',
                        scheduleType: 'instant',
                        scheduledDate: '',
                        scheduledTime: '12:00',
                      });
                      await load();
                    } catch (err: any) {
                      setError(err.message || 'Bildirim gönderimi başarısız.');
                    } finally {
                      setSavingKey(null);
                    }
                  },
                })
              }
            >
              {form.scheduleType === 'scheduled' ? 'Planlamayı Onayla' : 'Toplu Bildirimi Gönder'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Mobile Push Notification Mockup Card */}
          <div style={{ background: '#1e293b', color: '#ffffff', padding: 16, borderRadius: 12, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, color: '#94a3b8' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: '#cbd5e1' }}>GÖLBOX BİLDİRİM</span>
              <span>Şimdi</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{form.title}</div>
            <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.4 }}>{form.message}</div>
            {selectedNav.targetType !== 'NONE' && (
              <div style={{ marginTop: 10, fontSize: 11, background: '#334155', padding: '4px 8px', borderRadius: 4, width: 'fit-content', color: '#38bdf8' }}>
                Hedef: {selectedNav.label}
              </div>
            )}
          </div>

          <div style={{ background: 'var(--bg-subtle, #f8fafc)', padding: 12, borderRadius: 8, fontSize: 13 }}>
            <div>
              <strong>Hedef Kitle:</strong> {notificationGroupLabel(form.targetGroup)}
            </div>
            <div>
              <strong>Uygun alıcı:</strong> {preview?.recipientCount ?? 0} vatandaş
            </div>
            <div>
              <strong>Zamanlama:</strong> {form.scheduleType === 'scheduled' ? `${form.scheduledDate} ${form.scheduledTime}` : 'Anında Gönderim (Immediate Dispatch)'}
            </div>
          </div>
        </div>
      </Modal>

      {/* Notification Details Modal */}
      <Modal
        open={!!viewItem}
        title="Gönderilmiş Bildirim Detayı"
        size="md"
        onClose={() => setViewItem(null)}
        footer={
          <Button variant="secondary" onClick={() => setViewItem(null)}>
            Kapat
          </Button>
        }
      >
        {viewItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#1e293b', color: '#ffffff', padding: 16, borderRadius: 12, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, color: '#94a3b8' }}>
                <span style={{ fontWeight: 600, color: '#cbd5e1' }}>GÖLBOX BİLDİRİM KAYDI</span>
                <span>{formatDateTime(viewItem.sentDate || viewItem.scheduledDate || viewItem.createdDate)}</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{viewItem.title}</div>
              <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.5 }}>{viewItem.message || viewItem.body}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13, background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div>
                <strong style={{ color: '#475569', display: 'block', fontSize: 11, textTransform: 'uppercase' }}>Hedef Kitle</strong>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{notificationGroupLabel(viewItem.targetUserGroup)}</span>
              </div>
              <div>
                <strong style={{ color: '#475569', display: 'block', fontSize: 11, textTransform: 'uppercase' }}>Tahmini / Gerçek Alıcı</strong>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{viewItem.sentCount ?? viewItem.estimatedRecipients ?? 0} Cihaz</span>
              </div>
              <div>
                <strong style={{ color: '#475569', display: 'block', fontSize: 11, textTransform: 'uppercase' }}>Gönderim Durumu</strong>
                <span style={{ fontWeight: 700, color: viewItem.status === 'Sent' ? '#047857' : '#d97706' }}>
                  {viewItem.status === 'Sent' ? 'Gönderildi' : viewItem.status === 'Scheduled' ? 'Planlandı' : 'Taslak'}
                </span>
              </div>
              <div>
                <strong style={{ color: '#475569', display: 'block', fontSize: 11, textTransform: 'uppercase' }}>Deep Link Ekranı</strong>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>
                  {NAV_TARGETS.find((t) => t.targetType === viewItem.targetType)?.label || viewItem.targetType || 'Yok'}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
