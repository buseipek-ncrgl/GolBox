import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../../services/api';
import { pagedMeta } from '../../../lib/adminQuery';
import { educationLabel, MAX_MANUAL_GP, MIN_MANUAL_REASON, orderStatusLabel, pointTypeLabel } from '../../../lib/adminLabels';
import { formatDateTime } from '../../../lib/adminDate';
import { FilterBar, PaginationBar, EmptyState, ListError, TableWrap } from '../../../components/admin/FilterBar';
import { AdminSkeletonTable } from '../../../components/admin/AdminSkeleton';
import { btnPrimary, inputStyle } from '../../../components/admin/adminUi';
import { useAdminFeedback } from '../AdminFeedback';

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
  const [gp, setGp] = useState({ amount: 50, action: 'Add' as 'Add' | 'Deduct', reason: '', description: '' });

  const activeCount = [applied.search, applied.minAge, applied.maxAge, applied.education, applied.minPoints, applied.maxPoints].filter(Boolean).length;

  const load = async () => {
    setLoading(true);
    setFail(null);
    try {
      const res = await api.getUsers({
        role: 'citizen',
        page,
        pageSize,
        search: applied.search || undefined,
        minAge: applied.minAge || undefined,
        maxAge: applied.maxAge || undefined,
        education: applied.education || undefined,
        minPoints: applied.minPoints || undefined,
        maxPoints: applied.maxPoints || undefined
      });
      const meta = pagedMeta(res, page, pageSize);
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
    else setDetail(null);
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
      <FilterBar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Ad veya e-posta"
        activeCount={activeCount}
        onClear={() => { setSearch(''); setMinAge(''); setMaxAge(''); setEducation(''); setMinPoints(''); setMaxPoints(''); setApplied({ search: '', minAge: '', maxAge: '', education: '', minPoints: '', maxPoints: '' }); setPage(1); }}
        filters={
          <>
            <input placeholder="Min yaş" value={minAge} onChange={(e) => setMinAge(e.target.value)} style={{ width: 90, ...inputStyle }} />
            <input placeholder="Max yaş" value={maxAge} onChange={(e) => setMaxAge(e.target.value)} style={{ width: 90, ...inputStyle }} />
            <select value={education} onChange={(e) => setEducation(e.target.value)} style={inputStyle}>
              <option value="">Öğrenim</option>
              <option value="Lise">Lise</option>
              <option value="Üniversite">Üniversite</option>
            </select>
            <input placeholder="Min GP" value={minPoints} onChange={(e) => setMinPoints(e.target.value)} style={{ width: 90, ...inputStyle }} />
            <input placeholder="Max GP" value={maxPoints} onChange={(e) => setMaxPoints(e.target.value)} style={{ width: 90, ...inputStyle }} />
            <button type="button" style={btnPrimary} onClick={() => { setApplied({ search, minAge, maxAge, education, minPoints, maxPoints }); setPage(1); }}>Filtrele</button>
          </>
        }
      />
      {fail && <ListError message={fail} onRetry={load} />}
      {loading ? <AdminSkeletonTable /> : items.length === 0 ? <EmptyState title="Henüz vatandaş yok." /> : (
        <TableWrap>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 860 }}>
            <thead>
              <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                <th style={{ padding: 12 }}>Vatandaş</th>
                <th style={{ padding: 12 }}>E-posta</th>
                <th style={{ padding: 12 }}>Yaş</th>
                <th style={{ padding: 12 }}>Öğrenim</th>
                <th style={{ padding: 12 }}>GölPuan</th>
                <th style={{ padding: 12 }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: 12, fontWeight: 700 }}>{u.firstName} {u.lastName}</td>
                  <td style={{ padding: 12 }}>{u.email}</td>
                  <td style={{ padding: 12 }}>{u.age ?? '—'}</td>
                  <td style={{ padding: 12 }}>{educationLabel(u.educationLevel) || '—'}</td>
                  <td style={{ padding: 12, color: '#b45309', fontWeight: 800 }}>{u.pointsBalance} GP</td>
                  <td style={{ padding: 12, textAlign: 'right' }}>
                    <button type="button" onClick={() => openDetail(u.id)} style={btnPrimary}>Detay</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}
      <PaginationBar page={page} pageSize={pageSize} totalCount={total} onPage={setPage} onPageSize={(s) => { setPageSize(s); setPage(1); }} />

      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)', zIndex: 70, display: 'flex', justifyContent: 'flex-end' }} onClick={() => navigate('/admin/vatandaslar')}>
          <div style={{ width: 460, maxWidth: '100%', background: '#fff', height: '100%', overflowY: 'auto', padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 4px' }}>{detail.firstName} {detail.lastName}</h2>
            <p style={{ color: '#64748b' }}>{detail.email} · {detail.phoneNumber || '—'}</p>
            <p>Yaş: {detail.age ?? '—'} · Öğrenim: {educationLabel(detail.educationLevel) || '—'}</p>
            <p style={{ fontWeight: 800, color: '#b45309' }}>Bakiye: {detail.pointsBalance} GP</p>
            {isAdmin && (
              <div style={{ display: 'grid', gap: 8, margin: '12px 0', padding: 12, background: '#f8fafc', borderRadius: 12 }}>
                <select value={gp.action} onChange={(e) => setGp({ ...gp, action: e.target.value as any })} style={inputStyle}>
                  <option value="Add">Puan ekle</option>
                  <option value="Deduct">Puan düş</option>
                </select>
                <input type="number" value={gp.amount} onChange={(e) => setGp({ ...gp, amount: Number(e.target.value) })} style={inputStyle} />
                <input placeholder="Sebep" value={gp.reason} onChange={(e) => setGp({ ...gp, reason: e.target.value })} style={inputStyle} />
                <input placeholder="Açıklama (opsiyonel)" value={gp.description} onChange={(e) => setGp({ ...gp, description: e.target.value })} style={inputStyle} />
                <button type="button" disabled={savingKey === 'manual-gp'} style={btnPrimary} onClick={submitGp}>{savingKey === 'manual-gp' ? 'Kaydediliyor…' : 'Uygula'}</button>
              </div>
            )}
            <Section title="Son GölPuan hareketleri" rows={(detail.pointHistory || []).map((p: any) => `${formatDateTime(p.createdDate)} · ${pointTypeLabel(p.type)} · ${p.amount} GP`)} empty="Hareket yok." />
            <Section title="Aktif kuponlar" rows={(detail.activeCoupons || []).map((c: any) => `${c.title} · ${c.redeemCode}`)} empty="Aktif kupon yok." />
            <Section title="Geçmiş kuponlar" rows={(detail.pastCoupons || []).map((c: any) => `${c.title} · ${c.status}`)} empty="Geçmiş kupon yok." />
            <Section title="Ismarlıyor siparişleri" rows={(detail.ordersHistory || []).map((o: any) => `${o.collectionCode} · ${orderStatusLabel(o.status)} · ${o.cafeName}`)} empty="Sipariş yok." />
            <Section title="GölBox toplama geçmişi" rows={(detail.fieldCaptures || []).map((c: any) => `${formatDateTime(c.createdDate)} · ${c.title} · +${c.pointsGranted} GP`)} empty="Toplama yok." />
            <Section title="Etkinlik katılımları" rows={(detail.userActivities || []).map((a: any) => `${a.title} · ${formatDateTime(a.createdDate)}`)} empty="Katılım yok." />
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, rows, empty }: { title: string; rows: string[]; empty: string }) {
  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={{ fontSize: 15, margin: '0 0 8px' }}>{title}</h3>
      {rows.length === 0 ? <div style={{ color: '#64748b', fontSize: 13 }}>{empty}</div> : rows.map((row, i) => <div key={i} style={{ fontSize: 13, padding: '4px 0', borderBottom: '1px solid #f8fafc' }}>{row}</div>)}
    </div>
  );
}
