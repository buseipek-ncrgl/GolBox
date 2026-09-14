import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { extractArray } from '../../../lib/adminQuery';
import { formatDateTime } from '../../../lib/adminDate';
import { EmptyState, ListError, TableWrap } from '../../../components/admin/FilterBar';
import { AdminSkeletonTable } from '../../../components/admin/AdminSkeleton';
import { btnDanger, btnNeutral, btnPrimary, inputStyle } from '../../../components/admin/adminUi';
import { useAdminFeedback } from '../AdminFeedback';

export function RolesPage() {
  const { confirm, setError, setSuccess, savingKey, setSavingKey } = useAdminFeedback();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fail, setFail] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Staff');
  const [reg, setReg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setItems(extractArray(await api.getStaff()));
      setFail(null);
    } catch (err: any) {
      setFail(err.message || 'Personel listesi yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void load(); }, []);

  const changeRole = (row: any, next: string) => {
    confirm({
      title: 'Rol değişikliği',
      message: `${row.userFullName} rolü ${row.role} → ${next} olacak. Devam edilsin mi?`,
      confirmLabel: 'Rolü değiştir',
      onConfirm: async () => {
        setSavingKey(row.userId);
        try {
          await api.changeStaffRole(row.userId, next);
          setSuccess('Personel rolü güncellendi.');
          await load();
        } catch (err: any) {
          setError(err.message || 'Rol güncellenemedi.');
        } finally {
          setSavingKey(null);
        }
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <form style={{ display: 'flex', gap: 8, flexWrap: 'wrap', background: '#fff', padding: 12, borderRadius: 12, border: '1px solid #e2e8f0' }} onSubmit={async (e) => {
        e.preventDefault();
        setSavingKey('add');
        try {
          await api.addStaff({ email, role, registrationNumber: reg });
          setSuccess('Personel eklendi.');
          setEmail('');
          await load();
        } catch (err: any) {
          setError(err.message);
        } finally {
          setSavingKey(null);
        }
      }}>
        <input required placeholder="E-posta" value={email} onChange={(e) => setEmail(e.target.value)} style={{ ...inputStyle, width: 220 }} />
        <input placeholder="Sicil no" value={reg} onChange={(e) => setReg(e.target.value)} style={{ ...inputStyle, width: 140 }} />
        <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>
          <option value="Staff">Staff</option>
          <option value="Admin">Admin</option>
        </select>
        <button type="submit" disabled={!!savingKey} style={btnPrimary}>{savingKey === 'add' ? 'Kaydediliyor…' : '+ Staff ekle'}</button>
      </form>
      {fail && <ListError message={fail} onRetry={load} />}
      {loading ? <AdminSkeletonTable /> : items.length === 0 ? <EmptyState title="Henüz personel yok." /> : (
        <TableWrap>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
            <thead>
              <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                <th style={{ padding: 12 }}>Personel</th>
                <th style={{ padding: 12 }}>Rol</th>
                <th style={{ padding: 12 }}>Durum</th>
                <th style={{ padding: 12 }}>Son giriş</th>
                <th style={{ padding: 12 }}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.userId} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: 12 }}><strong>{row.userFullName}</strong><div style={{ fontSize: 12, color: '#64748b' }}>{row.userEmail}</div></td>
                  <td style={{ padding: 12 }}>{row.role}</td>
                  <td style={{ padding: 12 }}>{row.isActive === false ? 'Pasif' : 'Aktif'}</td>
                  <td style={{ padding: 12 }}>{formatDateTime(row.lastLoginDate)}</td>
                  <td style={{ padding: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {row.role === 'Staff' && <button type="button" style={btnPrimary} onClick={() => changeRole(row, 'Admin')}>Staff → Admin</button>}
                    {row.role === 'Admin' && <button type="button" style={btnNeutral} onClick={() => changeRole(row, 'Staff')}>Admin → Staff</button>}
                    {row.isActive !== false && <button type="button" style={btnDanger} onClick={() => confirm({
                      title: 'Pasife al',
                      message: `${row.userFullName} pasife alınacak. Devam edilsin mi?`,
                      danger: true,
                      confirmLabel: 'Pasife al',
                      onConfirm: async () => {
                        await api.setStaffActive(row.userId, false);
                        setSuccess('Personel pasife alındı.');
                        await load();
                      }
                    })}>Pasife al</button>}
                    {row.isActive === false && <button type="button" style={btnPrimary} onClick={async () => { await api.setStaffActive(row.userId, true); setSuccess('Personel aktif edildi.'); await load(); }}>Aktif et</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}
    </div>
  );
}
