import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { pagedMeta } from '../../../lib/adminQuery';
import { auditActionLabel } from '../../../lib/adminLabels';
import { formatDateTime } from '../../../lib/adminDate';
import { Button, FilterBar, Input, Pagination, Select, Skeleton, EmptyState, ErrorState, TableWrap } from '../../../admin/components';
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
  const [openId, setOpenId] = useState<string | null>(null);

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
      <FilterBar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Açıklama / işlem"
        activeCount={[search, moduleName, action, staff, preset !== '30d'].filter(Boolean).length}
        onClear={() => { setSearch(''); setModuleName(''); setAction(''); setStaff(''); setPreset('30d'); setPage(1); void load(); }}
        onSubmit={() => { setPage(1); void load(); }}
        filters={
          <>
            <Input label="Personel" value={staff} onChange={(e) => setStaff(e.target.value)} />
            <Input label="İşlem" value={action} onChange={(e) => setAction(e.target.value)} />
            <Select label="Modül" value={moduleName} onChange={(e) => setModuleName(e.target.value)}>
              <option value="">Tümü</option>
              {['Users', 'Rewards', 'Qr', 'Orders', 'Campaigns', 'Cafes', 'Activities', 'Staff', 'MenuItems'].map((m) => <option key={m} value={m}>{m}</option>)}
            </Select>
            <Select label="Dönem" value={preset} onChange={(e) => setPreset(e.target.value)}>
              <option value="today">Bugün</option>
              <option value="7d">Son 7 gün</option>
              <option value="30d">Son 30 gün</option>
            </Select>
            <Button type="submit" size="sm">Filtrele</Button>
          </>
        }
      />
      {fail && <ErrorState description={fail} retry={load} />}
      {loading ? <Skeleton variant="table" /> : items.length === 0 ? <EmptyState title="Denetim kaydı yok." /> : (
        <TableWrap>
          <table className="admin-table">
            <caption className="admin-sr-only">Denetim kayıtları</caption>
            <thead>
              <tr>
                <th scope="col">Tarih</th>
                <th scope="col">Personel</th>
                <th scope="col">İşlem</th>
                <th scope="col">Hedef</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => {
                const expanded = openId === row.id;
                return (
                  <React.Fragment key={row.id}>
                    <tr>
                      <td>{formatDateTime(row.createdDate)}</td>
                      <td>{row.userEmail}</td>
                      <td>{auditActionLabel(row.actionType)}</td>
                      <td>
                        <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setOpenId(expanded ? null : row.id)}>
                          {row.entityName || 'Kayıt'} {expanded ? '▲' : '▼'}
                        </button>
                      </td>
                    </tr>
                    {expanded && (
                      <tr>
                        <td colSpan={4}>
                          <pre className="admin-muted" style={{ whiteSpace: 'pre-wrap', fontSize: 12, margin: 0 }}>
                            {JSON.stringify({ module: row.moduleName, reason: row.reason, newValues: row.newValues, oldValues: row.oldValues }, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </TableWrap>
      )}
      <Pagination page={page} pageSize={pageSize} totalCount={total} onPage={setPage} onPageSize={(s) => { setPageSize(s); setPage(1); }} />
    </div>
  );
}
