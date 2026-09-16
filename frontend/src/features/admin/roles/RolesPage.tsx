import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { extractArray } from '../../../lib/adminQuery';
import { formatDateTime } from '../../../lib/adminDate';
import { Button, DataTable, ErrorState, Input, Select, StatusBadge } from '../../../admin/components';
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

  const activeAdmins = items.filter((r) => r.role === 'Admin' && r.isActive !== false).length;
  const lastAdmin = (row: any) => row.role === 'Admin' && row.isActive !== false && activeAdmins <= 1;

  const changeRole = (row: any, next: string) => {
    const extra = lastAdmin(row) && next === 'Staff'
      ? '\n\nBu, son yönetici hesabıdır. Rolü düşürmek paneli yönetilemez bırakabilir.'
      : '';
    confirm({
      title: 'Rol değişikliği',
      message: `${row.userFullName} rolü ${row.role === 'Admin' ? 'Yönetici' : 'Personel'} → ${next === 'Admin' ? 'Yönetici' : 'Personel'} olacak.${extra} Devam edilsin mi?`,
      confirmLabel: 'Rolü değiştir',
      danger: Boolean(extra),
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
      <form
        className="admin-card"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, alignItems: 'end' }}
        onSubmit={async (e) => {
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
        }}
      >
        <Input required label="E-posta" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Sicil no" value={reg} onChange={(e) => setReg(e.target.value)} />
        <Select label="Rol" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="Staff">Personel</option>
          <option value="Admin">Yönetici</option>
        </Select>
        <Button type="submit" loading={savingKey === 'add'}>Personel ekle</Button>
      </form>
      {fail && <ErrorState description={fail} retry={load} />}
      <DataTable
        caption="Personel listesi"
        loading={loading}
        rows={items}
        getRowId={(row) => row.userId}
        emptyTitle="Henüz personel yok."
        columns={[
          { key: 'name', header: 'Personel', render: (row) => <><strong>{row.userFullName}</strong><div className="admin-muted">{row.userEmail}</div></> },
          { key: 'role', header: 'Rol', render: (row) => <StatusBadge status={row.role} /> },
          { key: 'status', header: 'Durum', render: (row) => <StatusBadge status={row.isActive === false ? 'Inactive' : 'Active'} /> },
          { key: 'login', header: 'Son giriş', render: (row) => formatDateTime(row.lastLoginDate) }
        ]}
        actions={(row) => (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {row.role === 'Staff' && <Button size="sm" onClick={() => changeRole(row, 'Admin')}>Yönetici yap</Button>}
            {row.role === 'Admin' && <Button size="sm" variant="secondary" onClick={() => changeRole(row, 'Staff')}>Personel yap</Button>}
            {row.isActive !== false && (
              <Button size="sm" variant="danger" onClick={() => confirm({
                title: 'Pasife al',
                message: lastAdmin(row)
                  ? `${row.userFullName} son yönetici olabilir. Pasife almak paneli yönetilemez bırakabilir. Devam edilsin mi?`
                  : `${row.userFullName} pasife alınacak. Devam edilsin mi?`,
                danger: true,
                confirmLabel: 'Pasife al',
                onConfirm: async () => {
                  await api.setStaffActive(row.userId, false);
                  setSuccess('Personel pasife alındı.');
                  await load();
                }
              })}>Pasife al</Button>
            )}
            {row.isActive === false && (
              <Button size="sm" onClick={async () => { await api.setStaffActive(row.userId, true); setSuccess('Personel aktif edildi.'); await load(); }}>Aktif et</Button>
            )}
          </div>
        )}
      />
    </div>
  );
}
