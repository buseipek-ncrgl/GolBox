import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { extractArray, pagedMeta } from '../../../lib/adminQuery';
import { qrOperationLabel, qrResultLabel } from '../../../lib/adminLabels';
import { formatDateTime, formatGp } from '../../../lib/adminDate';
import { Button, DataTable, ErrorState, Input, NumberInput, Pagination, RadioGroup, Select } from '../../../admin/components';
import { useAdminFeedback } from '../AdminFeedback';

export function QrPage() {
  const { setError, setSuccess, savingKey, setSavingKey } = useAdminFeedback();
  const [cafes, setCafes] = useState<any[]>([]);
  const [token, setToken] = useState('');
  const [cafeId, setCafeId] = useState('');
  const [op, setOp] = useState('visit');
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
    <div className="admin-qr-grid">
      <form onSubmit={submit} className="admin-card" style={{ display: 'grid', gap: 12, height: 'fit-content' }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Kasa işlemi</h2>
        <Input
          label="Vatandaş karekodu"
          helper="Kasada okutulan veya yapıştırılan kod."
          required
          value={token}
          onChange={(e) => setToken(e.target.value)}
          autoComplete="off"
        />
        <Select label="Tesis" required value={cafeId} onChange={(e) => setCafeId(e.target.value)}>
          {cafes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <RadioGroup
          legend="İşlem türü"
          name="qr-op"
          required
          value={op}
          onChange={setOp}
          options={[
            { value: 'visit', label: 'Ziyaret kaydı' },
            { value: 'coupon', label: 'Kupon kullan' },
            { value: 'points', label: 'GölPuan ile ödeme' },
            { value: 'cash', label: 'Nakit harcamadan GölPuan kazan' }
          ]}
        />
        {(op === 'points' || op === 'cash') && (
          <NumberInput label="Tutar (TL)" min={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        )}
        {op === 'coupon' && (
          <Input label="Kupon kodu" required value={redeem} onChange={(e) => setRedeem(e.target.value)} />
        )}
        <Button type="submit" loading={!!savingKey}>İşlemi Tamamla</Button>
        {result && <div className="admin-card" style={{ background: 'var(--success-bg)', color: 'var(--success-text)' }}>{qrResultLabel(result)}</div>}
      </form>
      <div>
        <h2 style={{ margin: '0 0 12px', fontSize: 18 }}>Son işlemler</h2>
        {fail && <ErrorState description={fail} retry={loadRecent} />}
        <DataTable
          caption="Son kasa işlemleri"
          rows={recent}
          getRowId={(row) => row.id}
          emptyTitle="Henüz QR işlemi yok."
          columns={[
            { key: 'date', header: 'Tarih', render: (row) => formatDateTime(row.createdDate) },
            { key: 'citizen', header: 'Vatandaş', render: (row) => row.citizenName },
            { key: 'cafe', header: 'Tesis', render: (row) => row.cafeName },
            { key: 'op', header: 'İşlem', render: (row) => qrOperationLabel(row.operation) },
            { key: 'gp', header: 'GP', render: (row) => formatGp(row.gp || 0) },
            { key: 'status', header: 'Sonuç', render: (row) => row.status === 'Completed' ? 'Başarılı' : row.status }
          ]}
        />
        <Pagination page={page} pageSize={25} totalCount={total} onPage={setPage} onPageSize={() => undefined} />
      </div>
    </div>
  );
}
