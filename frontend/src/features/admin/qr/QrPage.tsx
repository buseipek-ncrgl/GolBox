import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { api } from '../../../services/api';
import { pagedMeta } from '../../../lib/adminQuery';
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
    void api.getAdminCafes({ page: 1, pageSize: 100 }).then((c) => {
      const list = pagedMeta(c).items;
      setCafes(list);
      if (list[0]?.id) setCafeId(list[0].id);
    }).catch((err) => setError(err.message));
  }, []);
  useEffect(() => { void loadRecent(); }, [page]);

  const isCouponCode = (value: string) => /^(GB-CLAIM-[A-F0-9]{6}|ISM-[0-9]{6})$/i.test(value.trim());

  const handleCitizenCodeChange = (value: string) => {
    if (isCouponCode(value)) {
      setRedeem(value.trim().toUpperCase());
      setToken('');
      setOp('coupon');
      return;
    }
    setToken(value);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingKey('qr');
    setResult(null);
    try {
      const scannedCode = (op === 'coupon' ? redeem : token).trim();
      if (op === 'coupon' || isCouponCode(scannedCode)) {
        const couponCode = (isCouponCode(scannedCode) ? scannedCode : redeem).trim().toUpperCase();
        setOp('coupon');
        const coupon = await api.resolveCouponQr(couponCode);
        const redeemed = await api.redeemCouponQr(coupon.id, cafeId);
        setResult({ ...redeemed, operation: 'coupon-redeem', couponCode: coupon.code, couponTitle: coupon.title });
        setSuccess(`${coupon.title} için ${redeemed.collectionCode} kodlu hazırlama siparişi oluşturuldu.`);
        setRedeem('');
        await loadRecent();
        return;
      }
      const payload: any = {
        qrToken: token.trim(),
        cafeId,
        amount: op === 'visit' || op === 'coupon' ? 0 : Number(amount) || 0,
        paidWithPoints: op === 'points',
        redeemCode: null
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
        {op !== 'coupon' && <Input
          label="Vatandaş karekodu"
          helper="Ziyaret ve GölPuan işlemleri için kullanıcının dinamik QR kodunu okutun."
          required
          value={token}
          onChange={(e) => handleCitizenCodeChange(e.target.value)}
          autoComplete="off"
        />}
        <Select label="Şube" required value={cafeId} onChange={(e) => setCafeId(e.target.value)}>
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
          <NumberInput
            label={op === 'points' ? 'Kasadaki Sepet Toplamı (TL)' : 'Fiş / Harcama Tutarı (TL)'}
            helper={op === 'points'
              ? 'Normal ürün satışında kasadaki gerçek toplamı girin. Ödül kuponlarında tutar girilmez.'
              : 'Vatandaşın nakit veya kartla ödediği gerçek fiş toplamını girin.'}
            min={1}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        )}
        {op === 'coupon' && (
          <Input label="İkram / kupon QR kodu" helper="GB-CLAIM-... veya ISM-... kodunu okutun. Ürün ve kullanıcı otomatik bulunur; ayrıca tutar girilmez." required value={redeem} onChange={(e) => setRedeem(e.target.value.toUpperCase())} autoComplete="off" />
        )}
        <Button type="submit" loading={!!savingKey}>{op === 'coupon' ? 'Kuponu Kullan ve Hazırlamayı Başlat' : 'İşlemi Tamamla'}</Button>
        {result && <div className="admin-card" style={{ background: 'var(--success-bg)', color: 'var(--success-text)', display: 'grid', gap: 8 }}>
          <strong>{qrResultLabel(result)}</strong>
          {result.operation === 'coupon-redeem' && <>
            <span>{result.collectionCode} kodlu sipariş “Hazırlanıyor” durumunda oluşturuldu. Bu kupon tekrar okutulmayacak.</span>
            <span>Hazır ve teslim adımlarını Sipariş Operasyonu ekranından yönetin.</span>
            <NavLink to="/admin/siparisler" className="admin-btn admin-btn-secondary admin-btn-sm" style={{ width: 'fit-content', textDecoration: 'none' }}>
              Sipariş Operasyonuna Git <ArrowRight size={14} />
            </NavLink>
          </>}
        </div>}
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
            { key: 'cafe', header: 'Şube', render: (row) => row.cafeName },
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
