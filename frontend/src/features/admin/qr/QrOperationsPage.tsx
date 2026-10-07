import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Banknote, CheckCircle2, Clock3, CreditCard, QrCode, RefreshCw, ShieldCheck } from 'lucide-react';
import { api } from '../../../services/api';
import { pagedMeta } from '../../../lib/adminQuery';
import { formatCurrency, formatDateTime } from '../../../lib/adminDate';
import { Button, EmptyState, ErrorState, Select, StatusBadge } from '../../../admin/components';
import { useAdminFeedback } from '../AdminFeedback';
import { QrPage as LoyaltyQrPage } from './QrPage';

const optionsFromJson = (json?: string): Array<{ name: string }> => {
  try { return json ? JSON.parse(json) : []; } catch { return []; }
};

export function QrOperationsPage() {
  const { setError, setSuccess, savingKey, setSavingKey } = useAdminFeedback();
  const [tab, setTab] = useState<'pickup' | 'loyalty'>('pickup');
  const [branches, setBranches] = useState<any[]>([]);
  const [branchId, setBranchId] = useState('');
  const [code, setCode] = useState('');
  const [order, setOrder] = useState<any | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'CASH'>('CARD');
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true); setLoadError(null);
    try {
      const [branchResponse, orderResponse] = await Promise.all([api.getAdminCafes({ page: 1, pageSize: 100 }), api.getOrders({ page: 1, pageSize: 100 })]);
      const branchList = pagedMeta(branchResponse).items;
      setBranches(branchList);
      setBranchId((current) => current || branchList[0]?.id || '');
      setOrders(pagedMeta(orderResponse).items);
    } catch (cause: any) { setLoadError(cause.message || 'Kasa verileri yüklenemedi.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setOrder(null); setCode(''); }, [branchId]);

  const branchOrders = useMemo(() => orders.filter((item) => !branchId || item.cafeId === branchId), [orders, branchId]);
  const ready = branchOrders.filter((item) => item.status === 'Ready');
  const today = new Date();
  const completedToday = branchOrders.filter((item) => item.status === 'Completed' && item.completedAt && new Date(item.completedAt).toDateString() === today.toDateString());
  const averageMinutes = completedToday.length ? Math.round(completedToday.reduce((sum, item) => {
    const end = new Date(item.completedAt).getTime(); const start = new Date(item.createdDate).getTime();
    return sum + Math.max(0, (end - start) / 60000);
  }, 0) / completedToday.length) : 0;

  const resolve = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!branchId) { setError('Önce işlem yapılacak şubeyi seçin.'); return; }
    setSavingKey('pickup-resolve'); setOrder(null);
    try {
      const result = await api.resolveOrderQr(code.trim(), branchId);
      setOrder(result); setSuccess('Sipariş doğrulandı. Teslim bilgilerini kontrol edin.');
    } catch (cause: any) { setError(cause.message || 'Sipariş doğrulanamadı. Ismarlıyor siparişleri ikinci kez okutulmaz; Sipariş Operasyonundan teslim edilir.'); }
    finally { setSavingKey(null); }
  };

  const complete = async () => {
    if (!order) return;
    setSavingKey('pickup-complete');
    try {
      await api.completeOrderPickup(order.id, { cafeId: branchId, paymentMethod: order.paidWithPoints ? 'POINTS' : paymentMethod });
      setSuccess(`${order.collectionCode} kodlu sipariş teslim edildi.`);
      setOrder(null); setCode(''); await load(); inputRef.current?.focus();
    } catch (cause: any) { setError(cause.message || 'Teslim işlemi tamamlanamadı.'); }
    finally { setSavingKey(null); }
  };

  return <div className="qr-operations-page">
    <div className="qr-mode-switch" role="tablist" aria-label="Kasa işlem türü">
      <button type="button" role="tab" aria-selected={tab === 'pickup'} className={tab === 'pickup' ? 'active' : ''} onClick={() => setTab('pickup')}><QrCode size={17} />Gel-Al Teslim</button>
      <button type="button" role="tab" aria-selected={tab === 'loyalty'} className={tab === 'loyalty' ? 'active' : ''} onClick={() => setTab('loyalty')}><ShieldCheck size={17} />Puan ve İkram</button>
    </div>
    {tab === 'loyalty' ? <LoyaltyQrPage /> : <>
      <div className="catalog-summary qr-summary">
        <div className="catalog-summary-item"><span>Teslim bekleyen</span><strong>{ready.length}</strong></div>
        <div className="catalog-summary-item"><span>Bugün teslim</span><strong>{completedToday.length}</strong></div>
        <div className="catalog-summary-item"><span>Ortalama süre</span><strong>{averageMinutes ? `${averageMinutes} dk` : '—'}</strong></div>
        <div className="catalog-summary-item"><span>Aktif şube</span><strong>{branches.length}</strong></div>
      </div>
      {loadError ? <ErrorState description={loadError} retry={load} /> : null}
      <div className="qr-terminal-layout">
        <section className="qr-terminal admin-card">
          <div className="qr-terminal-head"><div><span className="qr-terminal-icon"><QrCode size={22} /></span><div><h2>Gel-Al sipariş doğrulama</h2><p>Ücretli Gel-Al siparişlerinde teslim kodunu okutun. Ismarlıyor siparişleri burada tekrar okutulmaz.</p></div></div><Button size="sm" variant="secondary" loading={loading} onClick={() => void load()}><RefreshCw size={14} /> Yenile</Button></div>
          <form className="qr-resolve-form" onSubmit={resolve}>
            <Select label="İşlem yapılan şube" required value={branchId} onChange={(event) => setBranchId(event.target.value)}><option value="">Şube seçin</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</Select>
            <label><span>Teslim kodu veya QR içeriği</span><div className="qr-code-input"><QrCode size={20} /><input ref={inputRef} autoFocus autoComplete="off" required value={code} onChange={(event) => setCode(event.target.value)} placeholder="Örn. IS-MR-4821" /><Button type="submit" loading={savingKey === 'pickup-resolve'}>Doğrula</Button></div><small>USB veya Bluetooth barkod okuyucular bu alana doğrudan veri aktarabilir.</small></label>
          </form>
          {!order ? <div className="qr-terminal-idle"><span><ShieldCheck size={28} /></span><strong>Gel-Al doğrulaması bekleniyor</strong><p>Ismarlıyor kuponu Puan ve İkram sekmesinde yalnızca bir kez kullanılır. Hazır ve teslim adımları Sipariş Operasyonu ekranından yapılır.</p></div> : <div className="pickup-confirmation">
            <div className="pickup-success-head"><CheckCircle2 size={22} /><div><strong>Sipariş doğrulandı</strong><span>{order.collectionCode}</span></div><StatusBadge status="Ready" label="Teslime hazır" /></div>
            <div className="pickup-meta"><div><span>Vatandaş</span><strong>{order.memberName}</strong><small>{order.email}</small></div><div><span>Şube</span><strong>{order.cafeName}</strong></div><div><span>Sipariş zamanı</span><strong>{formatDateTime(order.createdDate)}</strong></div></div>
            <div className="pickup-items">{order.items?.map((item: any) => { const choices = optionsFromJson(item.selectedOptionsJson); return <div key={item.id}><span>{item.quantity}×</span><div><strong>{item.name}</strong>{choices.length ? <small>{choices.map((choice) => choice.name).join(', ')}</small> : null}</div><b>{formatCurrency(item.finalUnitPrice * item.quantity)}</b></div>; })}</div>
            <div className="pickup-payment"><div><span>Ödenecek toplam</span><strong>{formatCurrency(order.totalAmount)}</strong></div>{order.paidWithPoints ? <div className="pickup-paid"><ShieldCheck size={18} /><span><strong>GölPuan ile ödendi</strong><small>Kasada ek ödeme alınmaz.</small></span></div> : <fieldset><legend>Ödeme yöntemi</legend><label className={paymentMethod === 'CARD' ? 'selected' : ''}><input type="radio" name="payment" value="CARD" checked={paymentMethod === 'CARD'} onChange={() => setPaymentMethod('CARD')} /><CreditCard size={18} />Kart</label><label className={paymentMethod === 'CASH' ? 'selected' : ''}><input type="radio" name="payment" value="CASH" checked={paymentMethod === 'CASH'} onChange={() => setPaymentMethod('CASH')} /><Banknote size={18} />Nakit</label></fieldset>}</div>
            <div className="pickup-actions"><Button variant="secondary" onClick={() => { setOrder(null); setCode(''); }}>Vazgeç</Button><Button loading={savingKey === 'pickup-complete'} onClick={() => void complete()}>Ödemeyi Onayla ve Teslim Et</Button></div>
          </div>}
        </section>
        <aside className="qr-recent admin-card"><div className="qr-recent-head"><div><h2>Son teslimler</h2><p>Bugün tamamlanan siparişler</p></div><Clock3 size={18} /></div>{completedToday.length ? <div className="qr-recent-list">{completedToday.slice(0, 8).map((item) => <div key={item.id}><span className="qr-recent-check"><CheckCircle2 size={16} /></span><div><strong>{item.collectionCode}</strong><small>{item.userFullName} · {item.cafeName}</small></div><span>{item.completedAt ? new Date(item.completedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''}</span></div>)}</div> : <EmptyState title="Bugün teslim yok." description="Tamamlanan siparişler burada görüntülenir." />}</aside>
      </div>
    </>}
  </div>;
}
