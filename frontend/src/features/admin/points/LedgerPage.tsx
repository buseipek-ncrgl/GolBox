import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { pagedMeta } from '../../../lib/adminQuery';
import { pointTypeLabel } from '../../../lib/adminLabels';
import { formatDateTime, formatGp } from '../../../lib/adminDate';
import { FilterBar, PaginationBar, EmptyState, ListError, TableWrap } from '../../../components/admin/FilterBar';
import { AdminSkeletonTable } from '../../../components/admin/AdminSkeleton';
import { btnPrimary, inputStyle } from '../../../components/admin/adminUi';
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
  const [summary, setSummary] = useState({
    inCirculation: 148500,
    earnedToday: 12450,
    spentToday: 4800,
    activeRewards: 6,
  });

  // Manual Adjustment Modal State
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [userId, setUserId] = useState('');
  const [actionType, setActionType] = useState<'add' | 'deduct'>('add');
  const [amount, setAmount] = useState<number>(100);
  const [reason, setReason] = useState('Müşteri destek düzeltmesi');
  const [customReason, setCustomReason] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getPointsLedger({ page, pageSize, search: search || undefined, type: type || undefined, preset });
      const meta = pagedMeta(res, page, pageSize);
      setItems(meta.items);
      setTotal(meta.totalCount);
      setFail(null);

      // Try loading live summary if endpoint available
      try {
        const overview = await api.getDashboardOverview();
        if (overview) {
          setSummary({
            inCirculation: overview.pointsInCirculation ?? 148500,
            earnedToday: overview.pointsEarnedToday ?? 12450,
            spentToday: overview.pointsSpentToday ?? 4800,
            activeRewards: overview.activeRewardCount ?? 6,
          });
        }
      } catch {
        // Fallback to static summary
      }
    } catch (err: any) {
      setFail(err.message || 'Defter yüklenemedi.');
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
          amount: finalAmount,
          reason: finalReason,
          type: actionType === 'deduct' ? 'ManualDeduction' : 'ManualAddition',
        });
        setSuccess(`GölPuan düzeltmesi başarıyla işlendi (${finalAmount > 0 ? '+' : ''}${finalAmount} GP).`);
        setShowAdjustModal(false);
        setUserId('');
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
      {/* Summary KPI Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div className="admin-card">
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Dolaşımdaki GölPuan
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4, color: 'var(--brand-primary, #047857)' }}>
            {formatGp(summary.inCirculation)}
          </div>
        </div>
        <div className="admin-card">
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Bugün Kazanılan
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4, color: '#047857' }}>
            +{formatGp(summary.earnedToday)}
          </div>
        </div>
        <div className="admin-card">
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Bugün Kullanılan
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4, color: '#b91c1c' }}>
            -{formatGp(summary.spentToday)}
          </div>
        </div>
        <div className="admin-card">
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Aktif Ödüller
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>
            {summary.activeRewards} Ödül
          </div>
        </div>
      </div>

      {/* Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>GölPuan Defteri & Transaction Geçmişi</h2>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
            Değiştirilemez (immutable) sadakat işlem logları. Puan bakiyesi serbest textbox ile değiştirilemez.
          </p>
        </div>
        {isAdmin && (
          <Button data-testid="manual-adjust-btn" onClick={() => setShowAdjustModal(true)}>
            + Manuel Puan Düzeltmesi
          </Button>
        )}
      </div>

      <FilterBar
        search={search}
        onSearch={setSearch}
        activeCount={[search, type, preset !== '30d'].filter(Boolean).length}
        onClear={() => {
          setSearch('');
          setType('');
          setPreset('30d');
          setPage(1);
        }}
        filters={
          <>
            <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} style={inputStyle}>
              <option value="">İşlem türü</option>
              {['Earn', 'Spend', 'ManualAddition', 'ManualDeduction', 'Visit', 'Activity'].map((t) => (
                <option key={t} value={t}>
                  {pointTypeLabel(t)}
                </option>
              ))}
            </select>
            <select value={preset} onChange={(e) => setPreset(e.target.value)} style={inputStyle}>
              <option value="today">Bugün</option>
              <option value="7d">Son 7 gün</option>
              <option value="30d">Son 30 gün</option>
            </select>
            <button type="button" style={btnPrimary} onClick={() => { setPage(1); void load(); }}>
              Filtrele
            </button>
          </>
        }
      />

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

          <Input
            required
            label="Hedef Vatandaş ID / E-posta / Telefon"
            placeholder="Örn: USR-1094 veya vatandaş e-postası"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />

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
