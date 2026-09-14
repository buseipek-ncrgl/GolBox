import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { pagedMeta } from '../../../lib/adminQuery';
import { pointTypeLabel } from '../../../lib/adminLabels';
import { formatDateTime } from '../../../lib/adminDate';
import { FilterBar, PaginationBar, EmptyState, ListError, TableWrap } from '../../../components/admin/FilterBar';
import { AdminSkeletonTable } from '../../../components/admin/AdminSkeleton';
import { btnPrimary, inputStyle } from '../../../components/admin/adminUi';
import { useAdminFeedback } from '../AdminFeedback';

export function LedgerPage() {
  const { setError } = useAdminFeedback();
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [preset, setPreset] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [fail, setFail] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getPointsLedger({ page, pageSize, search: search || undefined, type: type || undefined, preset });
      const meta = pagedMeta(res, page, pageSize);
      setItems(meta.items);
      setTotal(meta.totalCount);
      setFail(null);
    } catch (err: any) {
      setFail(err.message || 'Defter yüklenemedi.');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void load(); }, [page, pageSize, type, preset]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <FilterBar search={search} onSearch={setSearch} activeCount={[search, type, preset !== '30d'].filter(Boolean).length} onClear={() => { setSearch(''); setType(''); setPreset('30d'); setPage(1); }} filters={
        <>
          <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} style={inputStyle}>
            <option value="">İşlem türü</option>
            {['Earn', 'Spend', 'ManualAddition', 'ManualDeduction', 'Visit', 'Activity'].map((t) => <option key={t} value={t}>{pointTypeLabel(t)}</option>)}
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
      {loading ? <AdminSkeletonTable /> : items.length === 0 ? <EmptyState title="Henüz GölPuan hareketi yok." /> : (
        <TableWrap>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900, fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                <th style={{ padding: 10 }}>Tarih</th>
                <th style={{ padding: 10 }}>Vatandaş</th>
                <th style={{ padding: 10 }}>İşlem türü</th>
                <th style={{ padding: 10 }}>Kaynak</th>
                <th style={{ padding: 10 }}>GP</th>
                <th style={{ padding: 10 }}>Açıklama</th>
                <th style={{ padding: 10 }}>Personel</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: 10 }}>{formatDateTime(row.createdDate)}</td>
                  <td style={{ padding: 10 }}>{row.userFullName}</td>
                  <td style={{ padding: 10 }}>{pointTypeLabel(row.type)}</td>
                  <td style={{ padding: 10 }}>{row.source || '—'}</td>
                  <td style={{ padding: 10, fontWeight: 800, color: row.amount < 0 ? '#b91c1c' : '#047857' }}>{row.amount > 0 ? `+${row.amount}` : row.amount}</td>
                  <td style={{ padding: 10 }}>{row.description}</td>
                  <td style={{ padding: 10 }}>{row.actorName || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}
      <PaginationBar page={page} pageSize={pageSize} totalCount={total} onPage={setPage} onPageSize={(s) => { setPageSize(s); setPage(1); }} />
    </div>
  );
}
