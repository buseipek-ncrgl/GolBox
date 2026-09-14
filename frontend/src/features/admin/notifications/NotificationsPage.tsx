import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { pagedMeta } from '../../../lib/adminQuery';
import { NAV_TARGETS, notificationGroupLabel } from '../../../lib/adminLabels';
import { formatDateTime } from '../../../lib/adminDate';
import { Button, DataTable, FilterBar, Input, Modal, Pagination, Select, Textarea } from '../../../admin/components';
import { useAdminFeedback } from '../AdminFeedback';

export function NotificationsPage() {
  const { isAdmin, confirm, setError, setSuccess, savingKey, setSavingKey } = useAdminFeedback();
  const [items, setItems] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [targetGroup, setTargetGroup] = useState('');
  const [preset, setPreset] = useState('30d');
  const [fail, setFail] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', message: '', targetGroup: '', minAge: '', maxAge: '', education: '', userId: '', nav: 'none' });
  const [preview, setPreview] = useState<any>(null);

  const load = async () => {
    try {
      const res = await api.getNotifications({ page, pageSize: 25, search: search || undefined, targetGroup: targetGroup || undefined, preset });
      const meta = pagedMeta(res, page, 25);
      setItems(meta.items);
      setTotal(meta.totalCount);
      setFail(null);
    } catch (err: any) {
      setFail(err.message);
    }
  };
  useEffect(() => { void load(); }, [page, targetGroup, preset]);
  useEffect(() => { void api.getUsers({ role: 'citizen', pageSize: 100 }).then((r) => setUsers(pagedMeta(r).items)).catch(() => undefined); }, []);

  const nav = NAV_TARGETS.find((n) => n.id === form.nav) || NAV_TARGETS[0];

  const sendBody = () => ({
    title: form.title,
    message: form.message,
    targetUserGroup: form.targetGroup,
    minAge: form.minAge ? Number(form.minAge) : null,
    maxAge: form.maxAge ? Number(form.maxAge) : null,
    educationLevel: form.education || null,
    targetUserId: form.targetGroup === 'SingleUser' ? form.userId : null,
    targetType: nav.targetType,
    targetId: nav.targetId
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? 'minmax(280px, 1fr) minmax(0, 1.1fr)' : '1fr', gap: 20 }} className="admin-split">
      {isAdmin && (
        <form
          className="admin-card"
          style={{ display: 'grid', gap: 16 }}
          onSubmit={async (e) => {
            e.preventDefault();
            if (!form.targetGroup) { setError('Lütfen hedef kitle seçin'); return; }
            try {
              const p = await api.previewNotification(sendBody());
              setPreview(p);
            } catch (err: any) {
              setError(err.message);
            }
          }}
        >
          <fieldset className="admin-fieldset">
            <legend className="admin-label">Mesaj</legend>
            <Input required label="Başlık" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Textarea required label="Metin" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </fieldset>
          <fieldset className="admin-fieldset">
            <legend className="admin-label">Hedef</legend>
            <Select label="Kitle" required value={form.targetGroup} onChange={(e) => setForm({ ...form, targetGroup: e.target.value })}>
              <option value="">Lütfen hedef kitle seçin</option>
              <option value="All">Herkese</option>
              <option value="AgeRange">Belirli yaş grubu</option>
              <option value="EducationLevel">Öğrenim durumuna göre</option>
              <option value="SingleUser">Belirli vatandaş</option>
            </Select>
            {form.targetGroup === 'AgeRange' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <Input label="Min yaş" value={form.minAge} onChange={(e) => setForm({ ...form, minAge: e.target.value })} />
                <Input label="Max yaş" value={form.maxAge} onChange={(e) => setForm({ ...form, maxAge: e.target.value })} />
              </div>
            )}
            {form.targetGroup === 'EducationLevel' && (
              <Select label="Öğrenim" value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })}>
                <option value="Lise">Lise</option>
                <option value="Üniversite">Üniversite</option>
              </Select>
            )}
            {form.targetGroup === 'SingleUser' && (
              <Select label="Vatandaş" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
                <option value="">Vatandaş seç</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
              </Select>
            )}
          </fieldset>
          <fieldset className="admin-fieldset">
            <legend className="admin-label">Yönlendirme</legend>
            <Select label="Uygulama hedefi" value={form.nav} onChange={(e) => setForm({ ...form, nav: e.target.value })}>
              {NAV_TARGETS.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
            </Select>
          </fieldset>
          <Button type="submit" data-testid="notification-preview" disabled={!form.targetGroup}>Önizle</Button>
        </form>
      )}
      <div>
        <FilterBar
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Başlık ara"
          activeCount={[search, targetGroup, preset !== '30d'].filter(Boolean).length}
          onClear={() => { setSearch(''); setTargetGroup(''); setPreset('30d'); }}
          onSubmit={() => { setPage(1); void load(); }}
          filters={
            <>
              <Select label="Hedef" value={targetGroup} onChange={(e) => setTargetGroup(e.target.value)}>
                <option value="">Tümü</option>
                <option value="All">Herkese</option>
                <option value="AgeRange">Yaş grubu</option>
                <option value="EducationLevel">Öğrenim</option>
                <option value="SingleUser">Belirli vatandaş</option>
              </Select>
              <Select label="Dönem" value={preset} onChange={(e) => setPreset(e.target.value)}>
                <option value="today">Bugün</option>
                <option value="7d">Son 7 gün</option>
                <option value="30d">Son 30 gün</option>
              </Select>
              <Button type="submit" size="sm">Filtrele</Button>
            </>
          }
        />
        <DataTable
          caption="Bildirim geçmişi"
          error={fail}
          onRetry={load}
          rows={items}
          getRowId={(n) => n.id}
          emptyTitle="Henüz bildirim yok."
          columns={[
            { key: 'date', header: 'Tarih', render: (n) => formatDateTime(n.sentDate || n.createdDate) },
            { key: 'title', header: 'Başlık' },
            { key: 'group', header: 'Hedef', render: (n) => notificationGroupLabel(n.targetUserGroup) },
            { key: 'count', header: 'Alıcı', render: (n) => n.sentCount ?? 0 },
            { key: 'nav', header: 'Yönlendirme', render: (n) => NAV_TARGETS.find((t) => t.targetId === n.targetId)?.label || 'Yönlendirme yok' }
          ]}
        />
        <Pagination page={page} pageSize={25} totalCount={total} onPage={setPage} onPageSize={() => undefined} />
      </div>
      <Modal
        open={!!preview}
        title="Bildirim önizleme"
        onClose={() => setPreview(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPreview(null)}>Vazgeç</Button>
            <Button
              data-testid="notification-send"
              loading={!!savingKey}
              onClick={() => confirm({
                title: 'Bildirimi gönder',
                message: form.targetGroup === 'All' ? 'Bu bildirim tüm uygun kullanıcılara gönderilecek.' : 'Bildirim gönderilsin mi?',
                confirmLabel: 'Bildirimi Gönder',
                onConfirm: async () => {
                  setSavingKey('notif');
                  try {
                    await api.sendNotification(sendBody());
                    setSuccess('Bildirim gönderildi.');
                    setPreview(null);
                    await load();
                  } catch (err: any) {
                    setError(err.message);
                  } finally {
                    setSavingKey(null);
                  }
                }
              })}
            >
              Bildirimi Gönder
            </Button>
          </>
        }
      >
        <p><strong>{form.title}</strong></p>
        <p>{form.message}</p>
        <p>Hedef: {notificationGroupLabel(form.targetGroup)}</p>
        {preview?.estimatedRecipients != null && <p>Tahmini alıcı: {preview.estimatedRecipients}</p>}
        {form.targetGroup === 'All' && <p style={{ color: 'var(--accent-gold)' }}>Bu bildirim tüm uygun kullanıcılara gönderilecek.</p>}
      </Modal>
    </div>
  );
}
