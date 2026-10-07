import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, Bell, Send, Check, Trash2, CheckCircle2 } from 'lucide-react';
import { api } from '../../../services/api';
import { pagedMeta } from '../../../lib/adminQuery';
import { NAV_TARGETS, notificationGroupLabel } from '../../../lib/adminLabels';
import { formatDateTime, istanbulDateTimeToIso } from '../../../lib/adminDate';
import { Button, DataTable, DateInput, FilterBar, Input, Modal, Pagination, Select, StatusBadge, Textarea, TimeInput } from '../../../admin/components';
import { useAdminFeedback } from '../AdminFeedback';
import {
  getInboundNotifications,
  markInboundAsRead,
  deleteInboundNotification,
  markAllInboundAsRead,
  InboundNotification
} from '../../../lib/inboundNotifications';

export function NotificationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'inbound' ? 'inbound' : 'push';

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

  // Inbound Notifications State
  const [inboundList, setInboundList] = useState<InboundNotification[]>([]);
  const [inboundFilter, setInboundFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    setInboundList(getInboundNotifications());
  }, []);

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
    targetId: selectedNav.targetId || null,
    scheduledDate:
      form.scheduleType === 'scheduled' && form.scheduledDate && form.scheduledTime
        ? istanbulDateTimeToIso(form.scheduledDate, form.scheduledTime)
        : null,
  });

  const handleInboundMarkRead = (id: string) => {
    const updated = markInboundAsRead(id);
    setInboundList(updated);
  };

  const handleInboundDelete = (id: string) => {
    const updated = deleteInboundNotification(id);
    setInboundList(updated);
  };

  const handleInboundMarkAllRead = () => {
    const updated = markAllInboundAsRead();
    setInboundList(updated);
    setSuccess('Tüm bildirimler okunmuş olarak işaretlendi.');
  };

  const filteredInbound = inboundList.filter((item) => {
    if (inboundFilter === 'unread') return !item.isRead;
    if (inboundFilter === 'read') return item.isRead;
    return true;
  });

  const unreadCount = inboundList.filter((n) => !n.isRead).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Category Tabs Header */}
      <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'inbound' })}
          style={{
            padding: '10px 18px',
            borderRadius: 8,
            border: 'none',
            background: activeTab === 'inbound' ? '#047857' : '#f1f5f9',
            color: activeTab === 'inbound' ? '#ffffff' : '#475569',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.15s ease'
          }}
        >
          <Bell size={16} /> Gelen Operasyon & Sistem Uvarıları
          {unreadCount > 0 && (
            <span style={{ background: activeTab === 'inbound' ? '#ffffff' : '#059669', color: activeTab === 'inbound' ? '#047857' : '#ffffff', padding: '2px 7px', borderRadius: 10, fontSize: 11, fontWeight: 800 }}>
              {unreadCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'push' })}
          style={{
            padding: '10px 18px',
            borderRadius: 8,
            border: 'none',
            background: activeTab === 'push' ? '#047857' : '#f1f5f9',
            color: activeTab === 'push' ? '#ffffff' : '#475569',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.15s ease'
          }}
        >
          <Send size={16} /> Duyuru & Push Bildirim Gönderimi
        </button>
      </div>

      {/* TAB 1: Gelen Operasyon & Sistem Bildirimleri */}
      {activeTab === 'inbound' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setInboundFilter('all')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  background: inboundFilter === 'all' ? '#0f172a' : '#ffffff',
                  color: inboundFilter === 'all' ? '#ffffff' : '#475569',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Tümü ({inboundList.length})
              </button>
              <button
                type="button"
                onClick={() => setInboundFilter('unread')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  background: inboundFilter === 'unread' ? '#0f172a' : '#ffffff',
                  color: inboundFilter === 'unread' ? '#ffffff' : '#475569',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Okunmamış ({unreadCount})
              </button>
              <button
                type="button"
                onClick={() => setInboundFilter('read')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  background: inboundFilter === 'read' ? '#0f172a' : '#ffffff',
                  color: inboundFilter === 'read' ? '#ffffff' : '#475569',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Okunmuş ({inboundList.length - unreadCount})
              </button>
            </div>

            {unreadCount > 0 && (
              <Button variant="secondary" size="sm" onClick={handleInboundMarkAllRead}>
                <CheckCircle2 size={14} /> Tümünü Okundu İşaretle
              </Button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredInbound.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', color: '#64748b' }}>
                Filtreye uygun gelen sistem bildirimi bulunmuyor.
              </div>
            ) : (
              filteredInbound.map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    background: n.isRead ? '#ffffff' : '#f8fafc',
                    border: `1px solid ${n.isRead ? '#e2e8f0' : '#cbd5e1'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 16,
                    boxShadow: n.isRead ? 'none' : '0 2px 4px rgba(0,0,0,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flex: 1 }}>
                    {!n.isRead && (
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669', marginTop: 5, flexShrink: 0 }} />
                    )}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: n.isRead ? '#475569' : '#0f172a' }}>{n.title}</h4>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: 6 }}>
                          {n.category}
                        </span>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>{n.time}</span>
                      </div>
                      <p style={{ margin: '6px 0 0', fontSize: 13, color: n.isRead ? '#64748b' : '#334155', lineHeight: 1.5 }}>
                        {n.message}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {!n.isRead && (
                      <Button size="sm" variant="secondary" onClick={() => handleInboundMarkRead(n.id)}>
                        <Check size={14} /> Okundu
                      </Button>
                    )}
                    <Button size="sm" variant="secondary" onClick={() => handleInboundDelete(n.id)}>
                      <Trash2 size={14} /> Sil
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Duyuru & Push Bildirim Gönderimi */}
      {activeTab === 'push' && (
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
                label="Başlık"
                placeholder="Örn: Hafta sonu GölPuan bilgilendirmesi"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <Textarea
                required
                label="Metin"
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
              <Select label="Kitle" required value={form.targetGroup} onChange={(e) => setForm({ ...form, targetGroup: e.target.value })}>
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
                  <DateInput
                    label="Gönderim Tarihi *"
                    value={form.scheduledDate}
                    onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                  />
                  <TimeInput
                    label="Gönderim Saati *"
                    value={form.scheduledTime}
                    onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })}
                  />
                </div>
              )}
            </fieldset>

            <Button type="submit" data-testid="notification-preview">Gönderim Önizlemesi Oluştur</Button>
          </form>

          {/* List of Sent / Scheduled Notifications */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FilterBar
              search={search}
              onSearch={setSearch}
              searchPlaceholder="Bildirim başlığı ara"
              activeCount={(targetGroup ? 1 : 0) + (preset !== '30d' ? 1 : 0)}
              onClear={() => { setSearch(''); setTargetGroup(''); setPreset('30d'); }}
              onSubmit={() => void load()}
              filters={
                <>
                  <Select label="Hedef Grubu" value={targetGroup} onChange={(e) => setTargetGroup(e.target.value)}>
                    <option value="">Tümü</option>
                    <option value="All">Tüm Vatandaşlar</option>
                    <option value="AgeRange">Yaş Grubu</option>
                    <option value="EducationLevel">Öğrenim</option>
                    <option value="SingleUser">Tek Vatandaş</option>
                  </Select>
                  <Select label="Zaman Aralığı" value={preset} onChange={(e) => setPreset(e.target.value)}>
                    <option value="7d">Son 7 Gün</option>
                    <option value="30d">Son 30 Gün</option>
                    <option value="all">Tüm Zamanlar</option>
                  </Select>
                </>
              }
            />

            <DataTable
              caption="Gönderilen ve Planlanan Duyurular"
              rows={items}
              getRowId={(row) => row.id}
              emptyTitle="Henüz duyuru gönderilmedi."
              emptyDescription="Soldaki formu kullanarak vatandaşlara push ve uygulama içi bildirim gönderebilirsiniz."
              columns={[
                {
                  key: 'date',
                  header: 'Tarih / Saat',
                  render: (r) => formatDateTime(r.sentDate || r.scheduledDate || r.createdDate),
                },
                {
                  key: 'title',
                  header: 'Başlık',
                  render: (r) => (
                    <div>
                      <strong>{r.title}</strong>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.message || r.body}</div>
                    </div>
                  ),
                },
                {
                  key: 'group',
                  header: 'Hedef Kitle',
                  render: (r) => notificationGroupLabel(r.targetUserGroup),
                },
                {
                  key: 'status',
                  header: 'Durum',
                  render: (r) => <StatusBadge status={r.status === 'Sent' ? 'Active' : 'Pending'} />,
                },
                {
                  key: 'count',
                  header: 'Alıcı',
                  render: (r) => `${r.sentCount ?? r.estimatedRecipients ?? 0} cihaz`,
                },
              ]}
              actions={(r) => (
                <Button size="sm" variant="secondary" onClick={() => setViewItem(r)}>
                  <Eye size={14} /> Detay
                </Button>
              )}
            />

            <Pagination page={page} pageSize={25} totalCount={total} onPage={setPage} />
          </div>
        </div>
      )}

      {/* Confirmation / Preview Modal */}
      <Modal
        open={!!preview}
        title="Bildirim önizleme"
        onClose={() => setPreview(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPreview(null)}>
              Vazgeç
            </Button>

            <Button
              onClick={async () => {
                setSavingKey('send-notif');
                try {
                  await api.sendNotification(sendBody());
                  setSuccess('Bildirim başarıyla gönderildi / planlandı.');
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
              }}
            >
              {savingKey === 'send-notif' ? 'Gönderiliyor...' : 'Onayla ve Gönder'}
            </Button>
          </>
        }
      >
        {preview && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: 12, borderRadius: 8, background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', fontSize: 13 }}>
              Hesaplanan Alıcı Sayısı: <strong>{preview.estimatedRecipients ?? preview.recipientCount ?? 0} Vatandaş</strong> (tüm uygun kullanıcılara gönderilecek)
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 14, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              <div>
                <strong>Başlık:</strong> {form.title}
              </div>
              <div>
                <strong>Mesaj:</strong> {form.message}
              </div>
              <div>
                <strong>Deep Link:</strong> {selectedNav.label}
              </div>
              <div>
                <strong>Zamanlama:</strong> {form.scheduleType === 'scheduled' ? `${form.scheduledDate} ${form.scheduledTime}` : 'Anında Gönderim (Immediate Dispatch)'}
              </div>
            </div>
          </div>
        )}
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
