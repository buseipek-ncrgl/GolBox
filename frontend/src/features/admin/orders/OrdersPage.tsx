import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { pagedMeta } from '../../../lib/adminQuery';
import { formatCurrency, formatDateTime } from '../../../lib/adminDate';
import { Button, DataTable, FilterBar, Modal, Pagination, Select, StatusBadge } from '../../../admin/components';
import { canonicalizeOrderStatus } from '../../../lib/adminLabels';
import { useAdminFeedback } from '../AdminFeedback';
import { OrderActions } from './OrderActions';
import { StaffOrdersView } from './StaffOrdersView';

const PILLS = [
  { id: 'All', label: 'Tümü' },
  { id: 'Pending', label: 'Bekliyor' },
  { id: 'Preparing', label: 'Hazırlanıyor' },
  { id: 'Ready', label: 'Teslime Hazır' },
  { id: 'Completed', label: 'Tamamlandı' },
  { id: 'Cancelled', label: 'İptal Edildi' }
];

export function OrdersPage() {
  const { isAdmin, setSuccess, setError, savingKey, setSavingKey } = useAdminFeedback();
  const [viewMode, setViewMode] = useState<'terminal' | 'table'>(isAdmin ? 'table' : 'terminal');

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

  // Staff users always use the operational terminal view
  if (!isAdmin || viewMode === 'terminal') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {isAdmin && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button size="sm" variant="secondary" onClick={() => setViewMode('table')}>
              📋 Liste Görünümüne Geç (Admin Tablosu)
            </Button>
          </div>
        )}
        <StaffOrdersView />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <p style={{ color: '#64748b', margin: 0 }}>Canonical akış: Bekliyor → Hazırlanıyor → Teslime Hazır → Tamamlandı</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="sm" variant="secondary" onClick={() => setViewMode('terminal')}>
            📱 Personel Terminal Görünümü (Kanban)
          </Button>
          <Button onClick={() => setShowCreate(true)}>+ Yeni Ismarlıyor</Button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {PILLS.map((p) => (
          <button key={p.id} type="button" onClick={() => { setStatus(p.id); setPage(1); }} className={`admin-btn admin-btn-sm ${status === p.id ? 'admin-btn-primary' : 'admin-btn-secondary'}`}>{p.label}</button>
        ))}
      </div>
      <FilterBar search={search} onSearch={setSearch} activeCount={applied ? 1 : 0} onClear={() => { setSearch(''); setApplied(''); }} onSubmit={() => { setApplied(search); setPage(1); }}>
        <Button type="submit" size="sm">Filtrele</Button>
      </FilterBar>
      <DataTable
        caption="Ismarlıyor siparişleri"
        loading={loading}
        error={fail}
        onRetry={load}
        rows={items}
        getRowId={(o) => o.id}
        emptyTitle="Henüz Ismarlıyor kaydı yok."
        emptyDescription="Yeni bir sipariş oluşturabilirsiniz."
        columns={[
          { key: 'code', header: 'Kod', render: (o) => <span className="admin-gp">{o.collectionCode}</span> },
          { key: 'user', header: 'Vatandaş', render: (o) => o.userFullName },
          { key: 'cafe', header: 'Şube', render: (o) => `${o.cafeName} (${formatCurrency(o.totalAmount)})` },
          { key: 'status', header: 'Durum', render: (o) => <StatusBadge status={canonicalizeOrderStatus(o.status)} /> },
          { key: 'date', header: 'Tarih', render: (o) => formatDateTime(o.createdDate) }
        ]}
        actions={(o) => <OrderActions order={o} onChanged={load} />}
      />
      <Pagination page={page} pageSize={pageSize} totalCount={total} onPage={setPage} onPageSize={(s) => { setPageSize(s); setPage(1); }} />
      <Modal
        open={showCreate}
        title="Yeni Ismarlıyor"
        onClose={() => setShowCreate(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Vazgeç</Button>
            <Button form="order-create" type="submit" loading={!!savingKey}>Oluştur</Button>
          </>
        }
      >
        <form id="order-create" onSubmit={async (e) => {
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
        }} style={{ display: 'grid', gap: 10 }}>
          <Select required label="Vatandaş" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
            <option value="">Vatandaş</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
          </Select>
          <Select required label="Kafe" value={form.cafeId} onChange={(e) => setForm({ ...form, cafeId: e.target.value })}>
            <option value="">Kafe</option>
            {cafes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select required label="Ürün" value={form.menuItemId} onChange={(e) => setForm({ ...form, menuItemId: e.target.value })}>
            <option value="">Ürün Seçiniz...</option>
            {menu.filter((m) => !form.cafeId || !m.cafeId || m.cafeId === form.cafeId).map((m) => (
              <option key={m.id} value={m.id}>{m.name} ({m.price} ₺)</option>
            ))}
          </Select>
        </form>
      </Modal>
    </div>
  );
}
