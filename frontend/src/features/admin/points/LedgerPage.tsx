import React, { useEffect, useState } from 'react';
import { Award, CircleDollarSign, MinusCircle, PlusCircle, Search, WalletCards } from 'lucide-react';
import { api } from '../../../services/api';
import { pagedMeta } from '../../../lib/adminQuery';
import { pointTypeLabel } from '../../../lib/adminLabels';
import { formatDateTime, formatGp } from '../../../lib/adminDate';
import { PaginationBar, EmptyState, ListError, TableWrap } from '../../../components/admin/FilterBar';
import { AdminSkeletonTable } from '../../../components/admin/AdminSkeleton';
import { Button, Input, Modal, NumberInput, Select, Textarea } from '../../../admin/components';
import { useAdminFeedback } from '../AdminFeedback';

export function LedgerPage() {
  const { isAdmin, confirm, setError, setSuccess, savingKey, setSavingKey } = useAdminFeedback();
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [preset, setPreset] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [fail, setFail] = useState<string | null>(null);

  // Summary Metrics
  const [summary, setSummary] = useState({ inCirculation: 0, earnedToday: 0, spentToday: 0, activeRewards: 0 });

  // Manual Adjustment Modal State
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [userId, setUserId] = useState('');
  const [actionType, setActionType] = useState<'add' | 'deduct'>('add');
  const [amount, setAmount] = useState<number>(100);
  const [reason, setReason] = useState('Müşteri destek düzeltmesi');
  const [customReason, setCustomReason] = useState('');
  const [citizenSearch, setCitizenSearch] = useState('');
  const [citizens, setCitizens] = useState<any[]>([]);
  const [citizenLoading, setCitizenLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getPointsLedger({ page, pageSize, search: search || undefined, type: type || undefined, preset });
      const meta = pagedMeta(res, page, pageSize);
      setItems(meta.items);
      setTotal(meta.totalCount);
      setSummary(res?.summary || { inCirculation: 0, earnedToday: 0, spentToday: 0, activeRewards: 0 });
      setFail(null);
    } catch (err: any) {
      setFail(err.message || 'Defter yüklenemedi.');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const findCitizens = async () => {
    if (citizenSearch.trim().length < 2) { setError('Ad, e-posta veya telefon için en az 2 karakter girin.'); return; }
    setCitizenLoading(true);
    try {
      const response = await api.getUsers({ role: 'User', search: citizenSearch.trim(), page: 1, pageSize: 8 });
      setCitizens(pagedMeta(response).items);
    } catch (err: any) { setError(err.message || 'Vatandaşlar aranamadı.'); }
    finally { setCitizenLoading(false); }
  };

  useEffect(() => {
    void load();
  }, [page, pageSize, type, preset]);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) {
      setError('Lütfen hedef Vatandaş ID / Kullanıcı Bilgisini girin.');
      return;
    }
    if (amount <= 0) {
      setError('Puan miktarı 0’dan büyük olmalıdır.');
      return;
    }
    if (reason === 'Diğer' && !customReason.trim()) {
      setError('Diğer seçeneği için açıklama girilmesi zorunludur.');
      return;
    }

    const finalReason = reason === 'Diğer' ? customReason.trim() : reason;
    const finalAmount = actionType === 'deduct' ? -Math.abs(amount) : Math.abs(amount);

    const executeAdjustment = async () => {
      setSavingKey('adjust-points');
      try {
        await api.adjustUserPoints(userId.trim(), {
          amount: Math.abs(finalAmount),
          actionType: actionType === 'deduct' ? 'Deduct' : 'Add',
          reason: finalReason,
          description: finalReason,
        });
        setSuccess(`GölPuan düzeltmesi başarıyla işlendi (${finalAmount > 0 ? '+' : ''}${finalAmount} GP).`);
        setShowAdjustModal(false);
        setUserId('');
        setCitizenSearch('');
        setCitizens([]);
        setAmount(100);
        setReason('Müşteri destek düzeltmesi');
        setCustomReason('');
        await load();
      } catch (err: any) {
        setError(err.message || 'Manuel puan düzeltmesi başarısız.');
      } finally {
        setSavingKey(null);
      }
    };

    // High Amount Warning Check (>1,000 GP)
    if (amount >= 1000) {
      confirm({
        title: 'Yüksek Puan Düzeltmesi Onayı',
        message: `${amount} GölPuan tutarında ${actionType === 'add' ? 'ekleme' : 'düşme'} işlemi yapmak üzeresiniz. Bu işlem denetim kaydı (audit) oluşturacaktır. Onaylıyor musunuz?`,
        confirmLabel: 'Evet, İşlemi Tamamla',
        danger: actionType === 'deduct',
        onConfirm: () => void executeAdjustment(),
      });
    } else {
      void executeAdjustment();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="catalog-summary" aria-label="GölPuan özeti">
        <div className="catalog-summary-item"><WalletCards size={18} /><div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Dolaşımdaki GölPuan
          </div>
          <div className="loyalty-summary-value">
            {formatGp(summary.inCirculation)}
          </div></div>
        </div>
        <div className="catalog-summary-item"><PlusCircle size={18} /><div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Bugün Kazanılan
          </div>
          <div className="loyalty-summary-value positive">
            +{formatGp(summary.earnedToday)}
          </div></div>
        </div>
        <div className="catalog-summary-item"><MinusCircle size={18} /><div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Bugün Kullanılan
          </div>
          <div className="loyalty-summary-value negative">
            -{formatGp(summary.spentToday)}
          </div></div>
        </div>
        <div className="catalog-summary-item"><Award size={18} /><div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Aktif Ödüller
          </div>
          <div className="loyalty-summary-value">
            {summary.activeRewards} Ödül
          </div></div>
        </div>
      </div>

      {/* Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
            Kazanılan, kullanılan ve yönetici tarafından düzeltilen tüm puan hareketlerini izleyin.
          </p>
        </div>
        {isAdmin && (
          <Button data-testid="manual-adjust-btn" onClick={() => setShowAdjustModal(true)}>
            <CircleDollarSign size={16} /> Manuel düzeltme
          </Button>
        )}
      </div>

      <form className="ledger-filter-bar" onSubmit={(e) => { e.preventDefault(); setPage(1); void load(); }}>
        <Input label="Hareket ara" placeholder="Vatandaş, açıklama veya kaynak" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select label="İşlem türü" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
          <option value="">Tüm işlemler</option>
          {['Earn', 'Spend', 'ManualAddition', 'ManualDeduction', 'Visit', 'Activity'].map((t) => <option key={t} value={t}>{pointTypeLabel(t)}</option>)}
        </Select>
        <Select label="Dönem" value={preset} onChange={(e) => { setPreset(e.target.value); setPage(1); }}>
          <option value="today">Bugün</option><option value="7d">Son 7 gün</option><option value="30d">Son 30 gün</option>
        </Select>
        <div className="ledger-filter-actions"><Button type="submit">Filtrele</Button><Button type="button" variant="ghost" onClick={() => { setSearch(''); setType(''); setPreset('30d'); setPage(1); }}>Temizle</Button></div>
      </form>

      {fail && <ListError message={fail} onRetry={load} />}

      {loading ? (
        <AdminSkeletonTable />
      ) : items.length === 0 ? (
        <EmptyState title="Henüz GölPuan hareketi yok." />
      ) : (
        <TableWrap>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900, fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                <th style={{ padding: 10 }}>Tarih</th>
                <th style={{ padding: 10 }}>Vatandaş</th>
                <th style={{ padding: 10 }}>İşlem türü</th>
                <th style={{ padding: 10 }}>Kaynak</th>
                <th style={{ padding: 10 }}>GP</th>
                <th style={{ padding: 10 }}>Açıklama / Sebep</th>
                <th style={{ padding: 10 }}>İşlemi Yapan</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: 10 }}>{formatDateTime(row.createdDate)}</td>
                  <td style={{ padding: 10, fontWeight: 600 }}>{row.userFullName || row.citizenName || '—'}</td>
                  <td style={{ padding: 10 }}>{pointTypeLabel(row.type)}</td>
                  <td style={{ padding: 10 }}>{row.source || '—'}</td>
                  <td style={{ padding: 10, fontWeight: 800, color: row.amount < 0 ? '#b91c1c' : '#047857' }}>
                    {row.amount > 0 ? `+${formatGp(row.amount)}` : formatGp(row.amount)}
                  </td>
                  <td style={{ padding: 10 }}>{row.description || row.reason || '—'}</td>
                  <td style={{ padding: 10, color: 'var(--text-secondary)' }}>{row.actorName || 'Sistem Engine'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}

      <PaginationBar page={page} pageSize={pageSize} totalCount={total} onPage={setPage} onPageSize={(s) => { setPageSize(s); setPage(1); }} />

      {/* Controlled Manual Adjustment Modal */}
      <Modal
        open={showAdjustModal}
        title="Manuel GölPuan Düzeltmesi"
        size="md"
        onClose={() => setShowAdjustModal(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAdjustModal(false)}>
              Vazgeç
            </Button>
            <Button loading={!!savingKey} onClick={() => void (document.getElementById('manual-adjust-form') as HTMLFormElement | null)?.requestSubmit()}>
              Düzeltmeyi İşle
            </Button>
          </>
        }
      >
        <form id="manual-adjust-form" onSubmit={handleAdjustSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'var(--warning-bg, #fffbeb)', border: '1px solid #fde68a', color: '#b45309', padding: 12, borderRadius: 8, fontSize: 13 }}>
            <strong>Güvenlik & Audit Kuralı:</strong> GölPuan bakiyesi doğrudan düzenlenemez. Tüm düzeltmeler gerekçeli ve izlenebilir yeni bir ledger hareketi üretir.
          </div>

          <div className="loyalty-citizen-search">
            <Input label="Vatandaş ara" placeholder="Ad, e-posta veya telefon" value={citizenSearch} onChange={(e) => { setCitizenSearch(e.target.value); setUserId(''); }} />
            <Button type="button" variant="secondary" loading={citizenLoading} onClick={() => void findCitizens()}><Search size={15} /> Ara</Button>
          </div>
          {citizens.length > 0 && <div className="loyalty-citizen-results" role="listbox" aria-label="Vatandaş sonuçları">{citizens.map((citizen) => <button type="button" key={citizen.id} className={userId === citizen.id ? 'selected' : ''} onClick={() => { setUserId(citizen.id); setCitizenSearch(`${citizen.firstName} ${citizen.lastName}`.trim()); }}><span>{citizen.firstName} {citizen.lastName}</span><small>{citizen.email || citizen.phoneNumber || citizen.id}</small><b>{formatGp(citizen.pointsBalance)}</b></button>)}</div>}
          {userId && <p className="admin-helper">Seçilen vatandaş doğrulandı. İşlem mevcut bakiye üzerinden güvenli olarak uygulanacaktır.</p>}

          <Select
            label="İşlem Yönü"
            required
            value={actionType}
            onChange={(e) => setActionType(e.target.value as 'add' | 'deduct')}
          >
            <option value="add">Puan Ekle (+ GP)</option>
            <option value="deduct">Puan Çıkar (- GP)</option>
          </Select>

          <NumberInput
            required
            min={1}
            label="Düzeltme Miktarı (GölPuan)"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />

          <Select
            label="Zorunlu Düzeltme Sebebi"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            <option value="Müşteri destek düzeltmesi">Müşteri destek düzeltmesi</option>
            <option value="Teknik hata düzeltmesi">Teknik hata düzeltmesi</option>
            <option value="Kampanya telafisi">Kampanya telafisi</option>
            <option value="Saha etkinliği telafisi">Saha etkinliği telafisi</option>
            <option value="Diğer">Diğer (Serbest Açıklama Gerekli)</option>
          </Select>

          {reason === 'Diğer' && (
            <Textarea
              required
              label="Detaylı Açıklama (Zorunlu)"
              placeholder="Düzeltmenin gerekçesini detaylıca açıklayın..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
            />
          )}
        </form>
      </Modal>
    </div>
  );
}
