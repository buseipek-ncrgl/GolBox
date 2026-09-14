import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { pagedMeta } from '../../../lib/adminQuery';
import { orderStatusLabel } from '../../../lib/adminLabels';
import { formatDateTime } from '../../../lib/adminDate';
import { FilterBar, PaginationBar, EmptyState, ListError, TableWrap } from '../../../components/admin/FilterBar';
import { AdminSkeletonTable } from '../../../components/admin/AdminSkeleton';
import { btnPrimary, inputStyle } from '../../../components/admin/adminUi';
import { useAdminFeedback } from '../AdminFeedback';
import { OrderActions } from './OrderActions';

const PILLS = [
  { id: 'All', label: 'Tümü' },
  { id: 'Pending', label: 'Bekliyor' },
  { id: 'Preparing', label: 'Hazırlanıyor' },
  { id: 'Ready', label: 'Teslime Hazır' },
  { id: 'Completed', label: 'Tamamlandı' },
  { id: 'Cancelled', label: 'İptal Edildi' }
];

export function OrdersPage() {
  const { setSuccess, setError, savingKey, setSavingKey } = useAdminFeedback();
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [applied, setApplied] = useState('');
  const [loading, setLoading] = useState(true);
  const [fail, setFail] = useState<string | null>(null);
  const [cafes, setCafes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [menu, setMenu] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ userId: '', cafeId: '', menuItemId: '', quantity: 1, amount: 45, targetCriteria: 'Gençler' });

  const load = async () => {
    setLoading(true);
    setFail(null);
    try {
      const res = await api.getOrders({ page, pageSize, status: status === 'All' ? undefined : status, search: applied || undefined });
      const meta = pagedMeta(res, page, pageSize);
      setItems(meta.items);
      setTotal(meta.totalCount);
    } catch (err: any) {
      setFail(err.message || 'Siparişler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [page, pageSize, status, applied]);
  useEffect(() => {
    void Promise.all([api.getCafes(), api.getUsers({ role: 'citizen', pageSize: 100 }), api.getAllMenuItems()]).then(([c, u, m]) => {
      setCafes(Array.isArray(c) ? c : []);
      setUsers(pagedMeta(u).items);
      setMenu(Array.isArray(m) ? m : []);
    }).catch(() => undefined);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <p style={{ color: '#64748b', margin: 0 }}>Canonical akış: Bekliyor → Hazırlanıyor → Teslime Hazır → Tamamlandı</p>
        <button type="button" style={btnPrimary} onClick={() => setShowCreate(true)}>+ Yeni Ismarlıyor</button>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {PILLS.map((p) => (
          <button key={p.id} type="button" onClick={() => { setStatus(p.id); setPage(1); }} style={{ padding: '6px 12px', border: 'none', borderRadius: 8, background: status === p.id ? '#1d5f60' : '#fff', color: status === p.id ? '#fff' : '#64748b', fontWeight: 700, cursor: 'pointer' }}>{p.label}</button>
        ))}
      </div>
      <FilterBar search={search} onSearch={setSearch} activeCount={applied ? 1 : 0} onClear={() => { setSearch(''); setApplied(''); }} >
        <button type="button" style={btnPrimary} onClick={() => { setApplied(search); setPage(1); }}>Filtrele</button>
      </FilterBar>
      {fail && <ListError message={fail} onRetry={load} />}
      {loading ? <AdminSkeletonTable /> : items.length === 0 ? <EmptyState title="Henüz Ismarlıyor kaydı yok." actionLabel="+ Yeni Ismarlıyor" onAction={() => setShowCreate(true)} /> : (
        <TableWrap>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 900 }}>
            <thead>
              <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                <th style={{ padding: 12 }}>Kod</th>
                <th style={{ padding: 12 }}>Vatandaş</th>
                <th style={{ padding: 12 }}>Şube</th>
                <th style={{ padding: 12 }}>Durum</th>
                <th style={{ padding: 12 }}>Tarih</th>
                <th style={{ padding: 12 }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <tr key={o.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: 12, fontWeight: 800, color: '#b45309' }}>{o.collectionCode}</td>
                  <td style={{ padding: 12 }}>{o.userFullName}</td>
                  <td style={{ padding: 12 }}>{o.cafeName} ({o.totalAmount} TL)</td>
                  <td style={{ padding: 12 }}>{orderStatusLabel(o.status)}</td>
                  <td style={{ padding: 12 }}>{formatDateTime(o.createdDate)}</td>
                  <td style={{ padding: 12 }}><OrderActions order={o} onChanged={load} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}
      <PaginationBar page={page} pageSize={pageSize} totalCount={total} onPage={setPage} onPageSize={(s) => { setPageSize(s); setPage(1); }} />
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)', display: 'grid', placeItems: 'center', zIndex: 80 }} onClick={() => setShowCreate(false)}>
          <form style={{ background: '#fff', padding: 24, borderRadius: 16, width: 420 }} onClick={(e) => e.stopPropagation()} onSubmit={async (e) => {
            e.preventDefault();
            setSavingKey('order-create');
            try {
              await api.createOrder({ userId: form.userId, cafeId: form.cafeId, items: [{ menuItemId: form.menuItemId, quantity: form.quantity }], totalAmount: form.amount, targetCriteria: form.targetCriteria });
              setSuccess('Sipariş oluşturuldu.');
              setShowCreate(false);
              await load();
            } catch (err: any) {
              setError(err.message || 'Sipariş oluşturulamadı.');
            } finally {
              setSavingKey(null);
            }
          }}>
            <h3>Yeni Ismarlıyor</h3>
            <select required value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} style={{ ...inputStyle, marginTop: 8 }}>
              <option value="">Vatandaş</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
            </select>
            <select required value={form.cafeId} onChange={(e) => setForm({ ...form, cafeId: e.target.value })} style={{ ...inputStyle, marginTop: 8 }}>
              <option value="">Kafe</option>
              {cafes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select required value={form.menuItemId} onChange={(e) => setForm({ ...form, menuItemId: e.target.value })} style={{ ...inputStyle, marginTop: 8 }}>
              <option value="">Ürün</option>
              {menu.filter((m) => !form.cafeId || m.cafeId === form.cafeId).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="button" onClick={() => setShowCreate(false)}>Vazgeç</button>
              <button type="submit" disabled={!!savingKey} style={btnPrimary}>{savingKey ? 'Kaydediliyor…' : 'Oluştur'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
