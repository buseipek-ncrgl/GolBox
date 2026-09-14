import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchCitizens } from '../../../admin/hooks/adminApi';
import { educationLabel, MAX_MANUAL_GP, MIN_MANUAL_REASON, orderStatusLabel, pointTypeLabel } from '../../../lib/adminLabels';
import { formatDateTime, formatGp } from '../../../lib/adminDate';
import { Button, DataTable, Drawer, EmptyState, ErrorState, Input, Modal, NumberInput, Pagination, Select } from '../../../admin/components';
import { useAdminFeedback } from '../AdminFeedback';
import { api } from '../../../services/api';

export function CitizensPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { isAdmin, setError, setSuccess, confirm, savingKey, setSavingKey } = useAdminFeedback();
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [education, setEducation] = useState('');
  const [minPoints, setMinPoints] = useState('');
  const [maxPoints, setMaxPoints] = useState('');
  const [applied, setApplied] = useState({ search: '', minAge: '', maxAge: '', education: '', minPoints: '', maxPoints: '' });
  const [loading, setLoading] = useState(true);
  const [fail, setFail] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [gpOpen, setGpOpen] = useState(false);
  const [gp, setGp] = useState({ amount: 50, action: 'Add' as 'Add' | 'Deduct', reason: '', description: '' });

  const load = async () => {
    setLoading(true);
    setFail(null);
    try {
      const meta = await fetchCitizens({
        page,
        pageSize,
        search: applied.search || undefined,
        minAge: applied.minAge || undefined,
        maxAge: applied.maxAge || undefined,
        education: applied.education || undefined,
        minPoints: applied.minPoints || undefined,
        maxPoints: applied.maxPoints || undefined
      });
      setItems(meta.items);
      setTotal(meta.totalCount);
    } catch (err: any) {
      setFail(err.message || 'Vatandaşlar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [page, pageSize, applied]);

  const openDetail = async (id: string) => {
    navigate(`/admin/vatandaslar/${id}`);
    try {
      setDetail(await api.getUserDetail(id));
    } catch (err: any) {
      setError(err.message || 'Detay yüklenemedi.');
    }
  };

  useEffect(() => {
    if (userId) void openDetail(userId);
    else {
      setDetail(null);
      setGpOpen(false);
    }
  }, [userId]);

  const submitGp = () => {
    if (!detail?.id) return;
    if (gp.amount < 1 || gp.amount > MAX_MANUAL_GP) {
      setError(`Miktar 1 ile ${MAX_MANUAL_GP} GP arasında olmalıdır.`);
      return;
    }
    if (gp.reason.trim().length < MIN_MANUAL_REASON) {
      setError('Sebep en az 3 karakter olmalıdır.');
      return;
    }
    const name = `${detail.firstName || ''} ${detail.lastName || ''}`.trim();
    const verb = gp.action === 'Deduct' ? 'hesabından' : 'hesabına';
    const action = gp.action === 'Deduct' ? 'düşülecek' : 'eklenecek';
    confirm({
      title: 'GölPuan işlemi',
      message: `${name} ${verb} ${gp.amount} GP ${action}. Devam edilsin mi?`,
      confirmLabel: 'İşlemi uygula',
      danger: gp.action === 'Deduct',
      onConfirm: async () => {
        setSavingKey('manual-gp');
        try {
          await api.adjustUserPoints(detail.id, { amount: gp.amount, actionType: gp.action, reason: gp.reason, description: gp.description });
          setSuccess(gp.action === 'Deduct' ? 'GölPuan düşüldü.' : 'GölPuan eklendi.');
          setDetail(await api.getUserDetail(detail.id));
          setGpOpen(false);
          await load();
        } catch (err: any) {
          setError(err.message || 'Puan işlemi kaydedilemedi.');
        } finally {
          setSavingKey(null);
        }
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <form
        className="citizen-filter-grid"
        onSubmit={(e) => {
          e.preventDefault();
          setApplied({ search, minAge, maxAge, education, minPoints, maxPoints });
          setPage(1);
        }}
      >
        <Input label="Ara" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ad veya e-posta" data-testid="citizen-search" />
        <NumberInput label="Min yaş" value={minAge} onChange={(e) => setMinAge(e.target.value)} />
        <NumberInput label="Max yaş" value={maxAge} onChange={(e) => setMaxAge(e.target.value)} />
        <Select label="Öğrenim" value={education} onChange={(e) => setEducation(e.target.value)}>
          <option value="">Tümü</option>
          <option value="Lise">Lise</option>
          <option value="Üniversite">Üniversite</option>
        </Select>
        <NumberInput label="Min GP" value={minPoints} onChange={(e) => setMinPoints(e.target.value)} />
        <NumberInput label="Max GP" value={maxPoints} onChange={(e) => setMaxPoints(e.target.value)} />
        <Button type="submit">Filtrele</Button>
      </form>
      {fail && <ErrorState description={fail} retry={load} />}
      <DataTable
        caption="Vatandaş listesi"
        loading={loading}
        error={null}
        rows={items}
        getRowId={(u) => u.id}
        emptyTitle="Henüz vatandaş yok."
        emptyDescription="Arama veya filtreleri temizleyip tekrar deneyin."
        columns={[
          { key: 'name', header: 'Vatandaş', render: (u) => <strong>{u.firstName} {u.lastName}</strong> },
          { key: 'email', header: 'E-posta' },
          { key: 'age', header: 'Yaş', render: (u) => u.age ?? '—' },
          { key: 'edu', header: 'Öğrenim', render: (u) => educationLabel(u.educationLevel) || '—' },
          { key: 'gp', header: 'GölPuan', render: (u) => <span className="admin-gp">{formatGp(u.pointsBalance)}</span> }
        ]}
        actions={(u) => <Button size="sm" onClick={() => openDetail(u.id)}>Detay</Button>}
      />
      <Pagination page={page} pageSize={pageSize} totalCount={total} onPage={setPage} onPageSize={(s) => { setPageSize(s); setPage(1); }} />

      <Drawer
        open={!!detail}
        title={detail ? `${detail.firstName} ${detail.lastName}` : 'Vatandaş'}
        onClose={() => navigate('/admin/vatandaslar')}
      >
        {detail && (
          <>
            <section className="admin-section">
              <h3>Profil</h3>
              <p className="admin-muted">{detail.email} · {detail.phoneNumber || '—'}</p>
              <p>Yaş: {detail.age ?? '—'} · Öğrenim: {educationLabel(detail.educationLevel) || '—'}</p>
            </section>
            <section className="admin-section">
              <h3>GölPuan</h3>
              <p className="admin-gp">{formatGp(detail.pointsBalance)}</p>
              {isAdmin && (
                <Button data-testid="manual-gp-action" onClick={() => setGpOpen(true)}>GölPuan İşlemi</Button>
              )}
              <RowList title="Son hareketler" rows={(detail.pointHistory || []).map((p: any) => `${formatDateTime(p.createdDate)} · ${pointTypeLabel(p.type)} · ${formatGp(p.amount)}`)} empty="Hareket yok." />
            </section>
            <section className="admin-section">
              <h3>Kuponlar</h3>
              <RowList title="Aktif" rows={(detail.activeCoupons || []).map((c: any) => `${c.title} · ${c.redeemCode}`)} empty="Aktif kupon yok." />
              <RowList title="Geçmiş" rows={(detail.pastCoupons || []).map((c: any) => `${c.title} · ${c.status}`)} empty="Geçmiş kupon yok." />
            </section>
            <section className="admin-section">
              <h3>Ismarlıyor</h3>
              <RowList rows={(detail.ordersHistory || []).map((o: any) => `${o.collectionCode} · ${orderStatusLabel(o.status)} · ${o.cafeName}`)} empty="Sipariş yok." />
            </section>
            <section className="admin-section">
              <h3>GölBox</h3>
              <RowList rows={(detail.fieldCaptures || []).map((c: any) => `${formatDateTime(c.createdDate)} · ${c.title} · +${formatGp(c.pointsGranted)}`)} empty="Toplama yok." />
            </section>
            <section className="admin-section">
              <h3>Etkinlikler</h3>
              <RowList rows={(detail.userActivities || []).map((a: any) => `${a.title} · ${formatDateTime(a.createdDate)}`)} empty="Katılım yok." />
            </section>
          </>
        )}
        {!detail && <EmptyState title="Vatandaş yükleniyor" />}
      </Drawer>

      <Modal
        open={gpOpen}
        title="GölPuan İşlemi"
        onClose={() => setGpOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setGpOpen(false)}>Vazgeç</Button>
            <Button data-testid="manual-gp-submit" loading={savingKey === 'manual-gp'} onClick={submitGp}>Uygula</Button>
          </>
        }
      >
        <Select label="İşlem" value={gp.action} onChange={(e) => setGp({ ...gp, action: e.target.value as 'Add' | 'Deduct' })}>
          <option value="Add">Puan ekle</option>
          <option value="Deduct">Puan düş</option>
        </Select>
        <NumberInput label="Miktar (GP)" min={1} max={MAX_MANUAL_GP} value={gp.amount} onChange={(e) => setGp({ ...gp, amount: Number(e.target.value) })} />
        <Input label="Sebep" required value={gp.reason} onChange={(e) => setGp({ ...gp, reason: e.target.value })} />
        <Input label="Açıklama" helper="İsteğe bağlı" value={gp.description} onChange={(e) => setGp({ ...gp, description: e.target.value })} />
      </Modal>
    </div>
  );
}

function RowList({ title, rows, empty }: { title?: string; rows: string[]; empty: string }) {
  return (
    <div style={{ marginTop: title ? 8 : 0 }}>
      {title ? <div className="admin-label">{title}</div> : null}
      {rows.length === 0
        ? <div className="admin-muted">{empty}</div>
        : rows.map((row, i) => <div key={i} style={{ fontSize: 13, padding: '4px 0', borderBottom: '1px solid #f8fafc' }}>{row}</div>)}
    </div>
  );
}
