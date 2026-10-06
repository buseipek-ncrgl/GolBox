import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChefHat, Clock3, Grid2X2, Inbox, List, PackageCheck, RefreshCw, Search, ShoppingBag, Timer } from 'lucide-react';
import { api } from '../../../services/api';
import { pagedMeta } from '../../../lib/adminQuery';
import { formatCurrency, formatDateTime } from '../../../lib/adminDate';
import { Button, EmptyState, ErrorState, Modal, Select, StatusBadge } from '../../../admin/components';
import { canonicalizeOrderStatus, orderStatusLabel } from '../../../lib/adminLabels';
import { OrderActions } from './OrderActions';

const statusOptions = [
  ['All', 'Tüm durumlar'], ['Pending', 'Bekliyor'], ['Preparing', 'Hazırlanıyor'],
  ['Ready', 'Teslime hazır'], ['Completed', 'Tamamlandı'], ['Cancelled', 'İptal edildi'],
];
const columns = [
  ['Pending', 'Yeni siparişler', 'İşleme alınmayı bekliyor'],
  ['Preparing', 'Hazırlanıyor', 'Şube hazırlık sürecinde'],
  ['Ready', 'Teslime hazır', 'Müşteri teslimi bekleniyor'],
  ['Completed', 'Tamamlandı', 'Başarıyla teslim edildi'],
  ['Cancelled', 'İptal edildi', 'Operasyon dışında bırakıldı'],
];

const ageMinutes = (date?: string) => date ? Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 60000)) : 0;
const ageLabel = (date?: string) => {
  const value = ageMinutes(date);
  return value < 1 ? 'Şimdi' : value < 60 ? `${value} dk` : `${Math.floor(value / 60)} sa ${value % 60} dk`;
};
const selectedOptions = (json?: string): Array<{ name: string }> => {
  try { return json ? JSON.parse(json) : []; } catch { return []; }
};

function Items({ order, prices = false }: { order: any; prices?: boolean }) {
  if (!order.items?.length) return <span className="admin-muted">Ürün bilgisi bulunamadı</span>;
  return <div className={prices ? 'order-detail-items' : 'order-card-items'}>{order.items.map((item: any) => {
    const options = selectedOptions(item.selectedOptionsJson);
    return <div className="order-item-line" key={item.id}>
      <span className="order-item-quantity">{item.quantity}×</span>
      <div><strong>{item.menuItemName}</strong>{options.length ? <small>{options.map((option) => option.name).join(', ')}</small> : null}</div>
      {prices ? <span>{formatCurrency((item.finalUnitPrice || item.unitPrice) * item.quantity)}</span> : null}
    </div>;
  })}</div>;
}

function OrderCard({ order, inspect, changed }: { order: any; inspect: () => void; changed: () => void }) {
  return <article className={`order-card${ageMinutes(order.createdDate) >= 15 ? ' is-delayed' : ''}`}>
    <button className="order-card-main" type="button" onClick={inspect}>
      <div className="order-card-head"><strong>{order.collectionCode}</strong><span><Clock3 size={13} />{ageLabel(order.createdDate)}</span></div>
      <div className="order-card-customer"><span>{order.userFullName}</span><small>{order.cafeName}</small></div>
      <Items order={order} />
      <div className="order-card-total"><span>{order.paidWithPoints ? `${order.pointsUsed} GölPuan` : 'Şubede ödeme'}</span><strong>{formatCurrency(order.totalAmount)}</strong></div>
    </button>
    <div className="order-card-actions"><OrderActions order={order} onChanged={changed} /></div>
  </article>;
}

export function OrdersOperationsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'board' | 'list'>('board');
  const [branchId, setBranchId] = useState('');
  const [status, setStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setOrders(pagedMeta(await api.getOrders({ page: 1, pageSize: 100, cafeId: branchId || undefined })).items); }
    catch (cause: any) { setError(cause.message || 'Siparişler yüklenemedi.'); }
    finally { setLoading(false); }
  }, [branchId]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { void api.getAdminCafes({ page: 1, pageSize: 100 }).then((data) => setBranches(pagedMeta(data).items)).catch(() => setBranches([])); }, []);

  const visible = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('tr-TR');
    return orders.filter((order) => (status === 'All' || canonicalizeOrderStatus(order.status) === status) &&
      (!term || [order.collectionCode, order.userFullName, order.userEmail, order.cafeName].some((field) => String(field || '').toLocaleLowerCase('tr-TR').includes(term))));
  }, [orders, search, status]);
  const count = (value: string) => orders.filter((order) => canonicalizeOrderStatus(order.status) === value).length;
  const active = orders.filter((order) => ['Pending', 'Preparing', 'Ready'].includes(canonicalizeOrderStatus(order.status)));
  const delayed = active.filter((order) => ageMinutes(order.createdDate) >= 15).length;
  const changed = async () => { await load(); setDetail(null); };

  return <div className="order-page">
    <div className="order-toolbar"><div className="catalog-view-switch" aria-label="Sipariş görünümü">
      <button type="button" className={view === 'board' ? 'active' : ''} onClick={() => setView('board')}><Grid2X2 size={15} />Operasyon</button>
      <button type="button" className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}><List size={15} />Liste</button>
    </div><Button size="sm" variant="secondary" loading={loading} onClick={() => void load()}><RefreshCw size={15} /> Yenile</Button></div>

    <div className="catalog-summary order-summary">
      <div className="catalog-summary-item"><ShoppingBag size={18} /><span>Aktif sipariş</span><strong>{active.length}</strong></div>
      <div className="catalog-summary-item"><Inbox size={18} /><span>Yeni</span><strong>{count('Pending')}</strong></div>
      <div className="catalog-summary-item"><ChefHat size={18} /><span>Hazırlanıyor</span><strong>{count('Preparing')}</strong></div>
      <div className="catalog-summary-item"><PackageCheck size={18} /><span>Teslime hazır</span><strong>{count('Ready')}</strong></div>
      <div className={`catalog-summary-item${delayed ? ' is-alert' : ''}`}><Timer size={18} /><span>15 dk üzeri</span><strong>{delayed}</strong></div>
    </div>

    <div className="order-filters"><label className="order-search"><Search size={17} /><input aria-label="Sipariş ara" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Kod, vatandaş veya şube ara" /></label>
      <Select label="Şube" value={branchId} onChange={(event) => setBranchId(event.target.value)}><option value="">Tüm şubeler</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</Select>
      <Select label="Durum" value={status} onChange={(event) => setStatus(event.target.value)}>{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
    </div>
    {error ? <ErrorState description={error} retry={load} /> : null}
    {!error && loading ? <div className="order-loading">Siparişler yükleniyor…</div> : null}
    {!error && !loading && !visible.length ? <EmptyState title="Sipariş bulunamadı." description="Filtreleri değiştirerek diğer siparişleri görüntüleyebilirsiniz." /> : null}

    {!error && !loading && visible.length > 0 && view === 'board' ? <div className={`order-board${status === 'All' ? '' : ' is-filtered'}`}>{columns.map(([columnStatus, title, description]) => {
      if (status === 'All' && ['Completed', 'Cancelled'].includes(columnStatus)) return null;
      const entries = visible.filter((order) => canonicalizeOrderStatus(order.status) === columnStatus);
      return <section key={columnStatus} className={`order-column status-${columnStatus.toLowerCase()}`}><header><div><strong>{title}</strong><small>{description}</small></div><span>{entries.length}</span></header>
        <div className="order-column-body">{entries.length ? entries.map((order) => <OrderCard key={order.id} order={order} inspect={() => setDetail(order)} changed={load} />) : <div className="order-column-empty">Bu aşamada sipariş yok.</div>}</div></section>;
    })}</div> : null}

    {!error && !loading && visible.length > 0 && view === 'list' ? <div className="admin-table-wrap"><table className="admin-table order-table"><thead><tr><th>Sipariş</th><th>Vatandaş</th><th>Şube</th><th>İçerik</th><th>Tutar</th><th>Durum</th><th>Bekleme</th><th /></tr></thead><tbody>{visible.map((order) => <tr key={order.id}>
      <td><button type="button" className="order-code-link" onClick={() => setDetail(order)}>{order.collectionCode}</button><small>{formatDateTime(order.createdDate)}</small></td>
      <td><strong>{order.userFullName}</strong><small>{order.userEmail}</small></td><td>{order.cafeName}</td><td>{order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0} ürün</td><td><strong>{formatCurrency(order.totalAmount)}</strong></td>
      <td><StatusBadge status={canonicalizeOrderStatus(order.status)} /></td><td><span className={ageMinutes(order.createdDate) >= 15 ? 'order-delay' : ''}>{ageLabel(order.createdDate)}</span></td><td><div className="order-list-actions"><Button size="sm" variant="secondary" onClick={() => setDetail(order)}>İncele</Button><OrderActions order={order} onChanged={load} /></div></td>
    </tr>)}</tbody></table></div> : null}

    <Modal open={!!detail} title={detail ? `Sipariş ${detail.collectionCode}` : 'Sipariş ayrıntısı'} size="lg" onClose={() => setDetail(null)} footer={<><Button variant="secondary" onClick={() => setDetail(null)}>Kapat</Button>{detail ? <OrderActions order={detail} onChanged={changed} /> : null}</>}>
      {detail ? <div className="order-detail"><div className="order-detail-hero"><div><span>Sipariş durumu</span><StatusBadge status={canonicalizeOrderStatus(detail.status)} label={orderStatusLabel(detail.status)} /></div><div><span>Teslim kodu</span><strong>{detail.collectionCode}</strong></div><div><span>Toplam</span><strong>{formatCurrency(detail.totalAmount)}</strong></div></div>
        <section><h3>Sipariş içeriği</h3><Items order={detail} prices /></section><div className="order-detail-grid"><section><h3>Vatandaş</h3><dl><div><dt>Ad soyad</dt><dd>{detail.userFullName}</dd></div><div><dt>E-posta</dt><dd>{detail.userEmail || 'Belirtilmedi'}</dd></div></dl></section><section><h3>Operasyon</h3><dl><div><dt>Şube</dt><dd>{detail.cafeName}</dd></div><div><dt>Oluşturulma</dt><dd>{formatDateTime(detail.createdDate)}</dd></div><div><dt>Geçen süre</dt><dd>{ageLabel(detail.createdDate)}</dd></div></dl></section></div>
        <section><h3>Ödeme</h3><dl className="order-payment"><div><dt>Yöntem</dt><dd>{detail.paidWithPoints ? 'GölPuan' : detail.paymentMethod === 'CASH' ? 'Nakit' : detail.paymentMethod === 'CARD' ? 'Kart' : 'Şubede ödeme'}</dd></div><div><dt>Durum</dt><dd>{detail.paymentStatus === 'PAID' || detail.paidWithPoints ? 'Ödendi' : 'Ödeme bekliyor'}</dd></div>{detail.paidWithPoints ? <div><dt>Kullanılan puan</dt><dd>{detail.pointsUsed} GölPuan</dd></div> : null}</dl></section>
        {detail.cancellationReason ? <div className="order-cancel-reason"><strong>İptal nedeni</strong><span>{detail.cancellationReason}</span></div> : null}</div> : null}
    </Modal>
  </div>;
}
