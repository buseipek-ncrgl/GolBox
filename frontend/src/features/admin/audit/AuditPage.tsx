import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { pagedMeta } from '../../../lib/adminQuery';
import { auditActionLabel } from '../../../lib/adminLabels';
import { formatDateTime } from '../../../lib/adminDate';
import { FilterBar, PaginationBar, EmptyState, ListError, TableWrap } from '../../../components/admin/FilterBar';
import { AdminSkeletonTable } from '../../../components/admin/AdminSkeleton';
import { btnPrimary, inputStyle } from '../../../components/admin/adminUi';
import { useAdminFeedback } from '../AdminFeedback';

export function AuditPage() {
  const { setError } = useAdminFeedback();
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [moduleName, setModuleName] = useState('');
  const [action, setAction] = useState('');
  const [staff, setStaff] = useState('');
  const [preset, setPreset] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [fail, setFail] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditLogs({ page, pageSize, search: search || undefined, module: moduleName || undefined, action: action || undefined, staff: staff || undefined, preset });
      const meta = pagedMeta(res, page, pageSize);
      setItems(meta.items);
      setTotal(meta.totalCount);
      setFail(null);
    } catch (err: any) {
      setFail(err.message || 'Denetim kayıtları yüklenemedi.');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void load(); }, [page, pageSize, moduleName, preset]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <FilterBar search={search} onSearch={setSearch} searchPlaceholder="Açıklama / işlem" activeCount={[search, moduleName, action, staff, preset !== '30d'].filter(Boolean).length} onClear={() => { setSearch(''); setModuleName(''); setAction(''); setStaff(''); setPreset('30d'); setPage(1); void load(); }} filters={
        <>
          <input placeholder="Personel e-posta" value={staff} onChange={(e) => setStaff(e.target.value)} style={{ ...inputStyle, width: 180 }} />
          <input placeholder="İşlem kodu" value={action} onChange={(e) => setAction(e.target.value)} style={{ ...inputStyle, width: 160 }} />
          <select value={moduleName} onChange={(e) => setModuleName(e.target.value)} style={inputStyle}>
            <option value="">Modül</option>
            {['Users', 'Rewards', 'Qr', 'Orders', 'Campaigns', 'Cafes', 'Activities', 'Staff', 'MenuItems'].map((m) => <option key={m} value={m}>{m}</option>)}
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
      {loading ? <AdminSkeletonTable /> : items.length === 0 ? <EmptyState title="Denetim kaydı yok." /> : (
        <TableWrap>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 960, fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                <th style={{ padding: 10 }}>Tarih-saat</th>
                <th style={{ padding: 10 }}>Personel</th>
                <th style={{ padding: 10 }}>İşlem</th>
                <th style={{ padding: 10 }}>Modül</th>
                <th style={{ padding: 10 }}>Hedef</th>
                <th style={{ padding: 10 }}>Açıklama</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: 10 }}>{formatDateTime(row.createdDate)}</td>
                  <td style={{ padding: 10 }}>{row.userEmail}</td>
                  <td style={{ padding: 10 }}>{auditActionLabel(row.actionType)}</td>
                  <td style={{ padding: 10 }}>{row.moduleName}</td>
                  <td style={{ padding: 10 }}>{row.entityName} {row.entityId ? `· ${String(row.entityId).slice(0, 8)}` : ''}</td>
                  <td style={{ padding: 10 }}>{row.reason || row.newValues || '—'}</td>
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
