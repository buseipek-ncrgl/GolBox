import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { pagedMeta } from '../../../lib/adminQuery';
import { NAV_TARGETS, notificationGroupLabel } from '../../../lib/adminLabels';
import { formatDateTime } from '../../../lib/adminDate';
import { EmptyState, FilterBar, ListError, PaginationBar, TableWrap } from '../../../components/admin/FilterBar';
import { btnNeutral, btnPrimary, inputStyle } from '../../../components/admin/adminUi';
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
    <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1fr 1fr' : '1fr', gap: 20 }}>
      {isAdmin && (
        <form style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, display: 'grid', gap: 8 }} onSubmit={async (e) => {
          e.preventDefault();
          if (!form.targetGroup) { setError('Lütfen hedef kitle seçin'); return; }
          try {
            const p = await api.previewNotification(sendBody());
            setPreview(p);
          } catch (err: any) {
            setError(err.message);
          }
        }}>
          <h3>Yeni bildirim</h3>
          <input required placeholder="Başlık" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} />
          <textarea required placeholder="Mesaj" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} style={inputStyle} />
          <select value={form.targetGroup} onChange={(e) => setForm({ ...form, targetGroup: e.target.value })} style={inputStyle}>
            <option value="">Lütfen hedef kitle seçin</option>
            <option value="All">Herkese</option>
            <option value="AgeRange">Belirli yaş grubu</option>
            <option value="EducationLevel">Öğrenim durumuna göre</option>
            <option value="SingleUser">Belirli vatandaş</option>
          </select>
          {form.targetGroup === 'AgeRange' && <div style={{ display: 'flex', gap: 8 }}><input placeholder="Min yaş" value={form.minAge} onChange={(e) => setForm({ ...form, minAge: e.target.value })} style={inputStyle} /><input placeholder="Max yaş" value={form.maxAge} onChange={(e) => setForm({ ...form, maxAge: e.target.value })} style={inputStyle} /></div>}
          {form.targetGroup === 'EducationLevel' && <select value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} style={inputStyle}><option value="Lise">Lise</option><option value="Üniversite">Üniversite</option></select>}
          {form.targetGroup === 'SingleUser' && <select value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} style={inputStyle}><option value="">Vatandaş seç</option>{users.map((u) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}</select>}
          <select value={form.nav} onChange={(e) => setForm({ ...form, nav: e.target.value })} style={inputStyle}>
            {NAV_TARGETS.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
          </select>
          <button type="submit" disabled={!form.targetGroup} style={btnPrimary}>Önizle</button>
        </form>
      )}
      <div>
        <FilterBar search={search} onSearch={setSearch} searchPlaceholder="Başlık ara" activeCount={[search, targetGroup, preset !== '30d'].filter(Boolean).length} onClear={() => { setSearch(''); setTargetGroup(''); setPreset('30d'); }} filters={
          <>
            <select value={targetGroup} onChange={(e) => setTargetGroup(e.target.value)} style={inputStyle}>
              <option value="">Hedef tipi</option>
              <option value="All">Herkese</option>
              <option value="AgeRange">Yaş grubu</option>
              <option value="EducationLevel">Öğrenim</option>
              <option value="SingleUser">Belirli vatandaş</option>
            </select>
            <select value={preset} onChange={(e) => setPreset(e.target.value)} style={inputStyle}>
              <option value="today">Bugün</option>
              <option value="7d">Son 7 gün</option>
              <option value="30d">Son 30 gün</option>
            </select>
            <button type="button" style={btnPrimary} onClick={() => { setPage(1); void load(); }}>Filtrele</button>
          </>
        } />
        {fail && <ListError message={fail} onRetry={load} />}
        {items.length === 0 ? <EmptyState title="Henüz bildirim yok." /> : (
          <TableWrap>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720, fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                  <th style={{ padding: 10 }}>Tarih</th>
                  <th style={{ padding: 10 }}>Başlık</th>
                  <th style={{ padding: 10 }}>Hedef</th>
                  <th style={{ padding: 10 }}>Alıcı</th>
                  <th style={{ padding: 10 }}>Yönlendirme</th>
                </tr>
              </thead>
              <tbody>
                {items.map((n) => (
                  <tr key={n.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ padding: 10 }}>{formatDateTime(n.sentDate || n.createdDate)}</td>
                    <td style={{ padding: 10 }}>{n.title}</td>
                    <td style={{ padding: 10 }}>{notificationGroupLabel(n.targetUserGroup)}</td>
                    <td style={{ padding: 10 }}>{n.sentCount ?? 0}</td>
                    <td style={{ padding: 10 }}>{NAV_TARGETS.find((t) => t.targetId === n.targetId)?.label || 'Yönlendirme yok'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
        <PaginationBar page={page} pageSize={25} totalCount={total} onPage={setPage} onPageSize={() => undefined} />
      </div>
      {preview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)', display: 'grid', placeItems: 'center', zIndex: 90 }} onClick={() => setPreview(null)}>
          <div style={{ background: '#fff', padding: 24, width: 420, borderRadius: 16 }} onClick={(e) => e.stopPropagation()}>
            <h3>Bildirim önizleme</h3>
            <p><strong>{form.title}</strong></p>
            <p>{form.message}</p>
            <p>Hedef: {notificationGroupLabel(form.targetGroup)}</p>
            {preview.estimatedRecipients != null && <p>Tahmini alıcı: {preview.estimatedRecipients}</p>}
            {form.targetGroup === 'All' && <p style={{ color: '#b45309' }}>Bu bildirim tüm uygun kullanıcılara gönderilecek.</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" style={btnNeutral} onClick={() => setPreview(null)}>Vazgeç</button>
              <button type="button" disabled={!!savingKey} style={btnPrimary} onClick={() => confirm({
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
              })}>{savingKey ? 'Kaydediliyor…' : 'Bildirimi Gönder'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
