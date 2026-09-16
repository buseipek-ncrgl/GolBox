import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { pagedMeta } from '../../../lib/adminQuery';
import { auditHumanSummary, auditModuleLabel } from '../../../lib/adminLabels';
import { formatDateTime } from '../../../lib/adminDate';
import { Button, ErrorState, FilterBar, Input, Pagination, Select, Skeleton, EmptyState, TableWrap } from '../../../admin/components';
import { useAdminFeedback } from '../AdminFeedback';

const MODULES = [
  { id: 'Users', label: 'Kullanıcılar' },
  { id: 'Qr', label: 'QR' },
  { id: 'Orders', label: 'Ismarlıyor' },
  { id: 'Rewards', label: 'Ödüller' },
  { id: 'Places', label: 'Tesisler' },
  { id: 'Campaigns', label: 'Kampanyalar' },
  { id: 'Cafes', label: 'Göl Kafeler' },
  { id: 'Activities', label: 'Etkinlikler' },
  { id: 'Staff', label: 'Personel' },
  { id: 'MenuItems', label: 'Menü' },
  { id: 'FieldDrops', label: 'Saha hediyeleri' },
  { id: 'Points', label: 'GölPuan' }
];

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
  const [fail, setFail] = useState<unknown>(null);
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
      setFail(err);
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
              {MODULES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
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
      {fail ? <ErrorState error={fail} retry={load} /> : null}
      {loading ? <Skeleton variant="table" /> : items.length === 0 ? <EmptyState title="Denetim kaydı yok." description="Seçilen dönemde işlem kaydı bulunamadı." /> : (
        <TableWrap>
          <table className="admin-table">
            <caption className="admin-sr-only">Denetim kayıtları</caption>
            <thead>
              <tr>
                <th scope="col">Tarih</th>
                <th scope="col">Personel</th>
                <th scope="col">Özet</th>
                <th scope="col">Modül</th>
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
                      <td>{auditHumanSummary(row)}</td>
                      <td>
                        <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setOpenId(expanded ? null : row.id)}>
                          {auditModuleLabel(row.moduleName)} {expanded ? '▲' : '▼'}
                        </button>
                      </td>
                    </tr>
                    {expanded && (
                      <tr>
                        <td colSpan={4}>
                          <details open>
                            <summary>Teknik detaylar</summary>
                            <pre className="admin-muted" style={{ whiteSpace: 'pre-wrap', fontSize: 12, margin: '8px 0 0' }}>
                              {JSON.stringify({ module: row.moduleName, action: row.actionType, reason: row.reason, newValues: row.newValues, oldValues: row.oldValues }, null, 2)}
                            </pre>
                          </details>
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
