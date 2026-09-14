import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { extractArray, pagedMeta } from '../../../lib/adminQuery';
import { qrOperationLabel, qrResultLabel } from '../../../lib/adminLabels';
import { formatDateTime } from '../../../lib/adminDate';
import { EmptyState, ListError, PaginationBar, TableWrap } from '../../../components/admin/FilterBar';
import { AdminSkeletonTable } from '../../../components/admin/AdminSkeleton';
import { btnPrimary, inputStyle } from '../../../components/admin/adminUi';
import { useAdminFeedback } from '../AdminFeedback';

export function QrPage() {
  const { setError, setSuccess, savingKey, setSavingKey } = useAdminFeedback();
  const [cafes, setCafes] = useState<any[]>([]);
  const [token, setToken] = useState('');
  const [cafeId, setCafeId] = useState('');
  const [op, setOp] = useState<'visit' | 'coupon' | 'points' | 'cash'>('visit');
  const [amount, setAmount] = useState(45);
  const [redeem, setRedeem] = useState('');
  const [result, setResult] = useState<any>(null);
  const [recent, setRecent] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [fail, setFail] = useState<string | null>(null);

  const loadRecent = async () => {
    try {
      const res = await api.getRecentQr(page, 25);
      const meta = pagedMeta(res, page, 25);
      setRecent(meta.items);
      setTotal(meta.totalCount);
      setFail(null);
    } catch (err: any) {
      setFail(err.message || 'Son işlemler yüklenemedi.');
    }
  };

  useEffect(() => {
    void api.getCafes().then((c) => {
      const list = Array.isArray(c) ? c : extractArray(c);
      setCafes(list);
      if (list[0]?.id) setCafeId(list[0].id);
    }).catch((err) => setError(err.message));
  }, []);
  useEffect(() => { void loadRecent(); }, [page]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingKey('qr');
    setResult(null);
    try {
      const payload: any = {
        qrToken: token.trim(),
        cafeId,
        amount: op === 'visit' || op === 'coupon' ? 0 : Number(amount) || 0,
        paidWithPoints: op === 'points',
        redeemCode: op === 'coupon' ? redeem.trim() : null
      };
      const res = await api.scanQr(payload);
      setResult(res);
      setSuccess('İşlem tamamlandı.');
      setToken('');
      setRedeem('');
      await loadRecent();
    } catch (err: any) {
      setError(err.message || 'QR işlemi başarısız.');
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 }} className="admin-qr-grid">
      <form onSubmit={submit} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, display: 'grid', gap: 10, height: 'fit-content' }}>
        <h3 style={{ margin: 0 }}>Kasa işlemi</h3>
        <label>1. Vatandaş karekodunu okut / yapıştır
          <input value={token} onChange={(e) => setToken(e.target.value)} required style={inputStyle} />
        </label>
        <label>2. Tesis seç
          <select value={cafeId} onChange={(e) => setCafeId(e.target.value)} required style={inputStyle}>
            {cafes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <div>3. İşlem türü
          {([
            ['visit', 'Ziyaret kaydı'],
            ['coupon', 'Kupon kullan'],
            ['points', 'GölPuan ile ödeme'],
            ['cash', 'Nakit harcamadan GölPuan kazan']
          ] as const).map(([id, label]) => (
            <label key={id} style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <input type="radio" checked={op === id} onChange={() => setOp(id)} /> {label}
            </label>
          ))}
        </div>
        {(op === 'points' || op === 'cash') && (
          <label>Tutar (TL)
            <input type="number" min={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))} style={inputStyle} />
          </label>
        )}
        {op === 'coupon' && (
          <label>Kupon kodu
            <input value={redeem} onChange={(e) => setRedeem(e.target.value)} required style={inputStyle} />
          </label>
        )}
        <button type="submit" disabled={!!savingKey} style={btnPrimary}>{savingKey ? 'Kaydediliyor…' : 'İşlemi Tamamla'}</button>
        {result && <div style={{ background: '#f0fdf4', padding: 12, borderRadius: 10 }}>{qrResultLabel(result)}</div>}
      </form>
      <div>
        <h3>Son QR işlemleri</h3>
        {fail && <ListError message={fail} onRetry={loadRecent} />}
        {recent.length === 0 ? <EmptyState title="Henüz QR işlemi yok." /> : (
          <TableWrap>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 640 }}>
              <thead>
                <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                  <th style={{ padding: 10 }}>Tarih</th>
                  <th style={{ padding: 10 }}>Vatandaş</th>
                  <th style={{ padding: 10 }}>Tesis</th>
                  <th style={{ padding: 10 }}>İşlem</th>
                  <th style={{ padding: 10 }}>GP</th>
                  <th style={{ padding: 10 }}>Sonuç</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((row) => (
                  <tr key={row.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ padding: 10 }}>{formatDateTime(row.createdDate)}</td>
                    <td style={{ padding: 10 }}>{row.citizenName}</td>
                    <td style={{ padding: 10 }}>{row.cafeName}</td>
                    <td style={{ padding: 10 }}>{qrOperationLabel(row.operation)}</td>
                    <td style={{ padding: 10 }}>{row.gp || 0}</td>
                    <td style={{ padding: 10 }}>{row.status === 'Completed' ? 'Başarılı' : row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
        <PaginationBar page={page} pageSize={25} totalCount={total} onPage={setPage} onPageSize={() => undefined} />
      </div>
    </div>
  );
}
