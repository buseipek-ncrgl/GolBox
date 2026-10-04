import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchCitizens } from '../../../admin/hooks/adminApi';
import { educationLabel, MAX_MANUAL_GP, MIN_MANUAL_REASON, pointTypeLabel } from '../../../lib/adminLabels';
import { formatDateTime, formatGp } from '../../../lib/adminDate';
import { Button, DataTable, Drawer, EmptyState, ErrorState, Input, Modal, NumberInput, Pagination, Select, StatusBadge, Textarea } from '../../../admin/components';
import { useAdminFeedback } from '../AdminFeedback';
import { api } from '../../../services/api';

// Helper for PII Phone Masking
function maskPhoneNumber(phone?: string): string {
  if (!phone) return 'Belirtilmemiş';
  const cleaned = phone.replace(/\s+/g, '');
  if (cleaned.length >= 10) {
    const start = cleaned.slice(0, 3);
    const end = cleaned.slice(-2);
    return `${start}•• ••• •• ${end}`;
  }
  return phone;
}

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
  const [fail, setFail] = useState<unknown>(null);
  const [detail, setDetail] = useState<any>(null);
  const [showPii, setShowPii] = useState(false);

  // Manual Points Modal
  const [gpOpen, setGpOpen] = useState(false);
  const [gp, setGp] = useState({ amount: 50, action: 'Add' as 'Add' | 'Deduct', reason: '', description: '' });
  const [gpErrors, setGpErrors] = useState<{ amount?: string; reason?: string }>({});

  // Account Restriction Modal
  const [restrictModalOpen, setRestrictModalOpen] = useState(false);
  const [restrictForm, setRestrictForm] = useState({
    type: 'PICKUP_ORDER_RESTRICTED',
    reasonCode: 'Gel-Al Sipariş No-Show Suistimali',
    durationDays: 7,
    internalNote: '',
  });

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
        maxPoints: applied.maxPoints || undefined,
      });
      setItems(meta.items);
      setTotal(meta.totalCount);
    } catch (err: any) {
      setFail(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [page, pageSize, applied]);

  const openDetail = async (id: string) => {
    navigate(`/admin/vatandaslar/${id}`);
    try {
      setDetail(await api.getUserDetail(id));
      setShowPii(false);
    } catch (err: any) {
      setError(err.message || 'Vatandaş detayı yüklenemedi.');
    }
  };

  useEffect(() => {
    if (userId) void openDetail(userId);
    else {
      setDetail(null);
      setGpOpen(false);
      setRestrictModalOpen(false);
    }
  }, [userId]);

  const submitGp = () => {
    if (!detail?.id) return;
    const nextErrors: { amount?: string; reason?: string } = {};
    if (gp.amount < 1 || gp.amount > MAX_MANUAL_GP) {
      nextErrors.amount = `Miktar 1 ile ${MAX_MANUAL_GP} GP arasında olmalıdır.`;
    }
    if (gp.reason.trim().length < MIN_MANUAL_REASON) {
      nextErrors.reason = 'Sebep en az 3 karakter olmalıdır.';
    }
    setGpErrors(nextErrors);
    if (nextErrors.amount || nextErrors.reason) return;

    const name = `${detail.firstName || ''} ${detail.lastName || ''}`.trim();
    const verb = gp.action === 'Deduct' ? 'hesabından' : 'hesabına';
    const action = gp.action === 'Deduct' ? 'düşülecek' : 'eklenecek';

    confirm({
      title: 'GölPuan Manuel İşlemi',
      message: `${name} ${verb} ${gp.amount} GP ${action}. Bu işlem denetim defterine işlenecektir. Devam edilsin mi?`,
      confirmLabel: 'İşlemi Uygula',
      danger: gp.action === 'Deduct',
      onConfirm: async () => {
        setSavingKey('manual-gp');
        try {
          await api.adjustUserPoints(detail.id, {
            amount: gp.amount,
            actionType: gp.action,
            reason: gp.reason,
            description: gp.description,
          });
          setSuccess(gp.action === 'Deduct' ? 'GölPuan düşüldü.' : 'GölPuan eklendi.');
          setDetail(await api.getUserDetail(detail.id));
          setGpOpen(false);
          await load();
        } catch (err: any) {
          setError(err.message || 'Puan işlemi kaydedilemedi.');
        } finally {
          setSavingKey(null);
        }
      },
    });
  };

  const handleRestrictionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail?.id) return;

    setSavingKey('restriction');
    try {
      await api.addUserRestriction(detail.id, restrictForm);
      setSuccess('Hesap kısıtlaması başarıyla uygulandı.');
      setRestrictModalOpen(false);
      setDetail(await api.getUserDetail(detail.id));
      await load();
    } catch (err: any) {
      setError(err.message || 'Kısıtlama uygulanamadı.');
    } finally {
      setSavingKey(null);
    }
  };

  const handleRevokeSessions = () => {
    if (!detail?.id) return;
    const name = `${detail.firstName || ''} ${detail.lastName || ''}`.trim();

    confirm({
      title: 'Tüm Oturumları Sonlandır',
      message: `${name} isimli vatandaşın tüm mobil cihazlardaki aktif oturumları (refresh token) iptal edilecek. Devam edilsin mi?`,
      confirmLabel: 'Oturumları İptal Et',
      danger: true,
      onConfirm: async () => {
        setSavingKey('revoke-session');
        try {
          await api.revokeUserSessions(detail.id);
          setSuccess('Vatandaşın tüm oturumları başarıyla sonlandırıldı.');
        } catch (err: any) {
          setError(err.message || 'Oturumlar sonlandırılamadı.');
        } finally {
          setSavingKey(null);
        }
      },
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
        <Input label="Vatandaş Ara" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ad, e-posta veya telefon" data-testid="citizen-search" />
        <NumberInput label="Min Yaş" value={minAge} onChange={(e) => setMinAge(e.target.value)} />
        <NumberInput label="Max Yaş" value={maxAge} onChange={(e) => setMaxAge(e.target.value)} />
        <Select label="Öğrenim" value={education} onChange={(e) => setEducation(e.target.value)}>
          <option value="">Tümü</option>
          <option value="Lise">Lise</option>
          <option value="Üniversite">Üniversite</option>
        </Select>
        <NumberInput label="Min GP" value={minPoints} onChange={(e) => setMinPoints(e.target.value)} />
        <NumberInput label="Max GP" value={maxPoints} onChange={(e) => setMaxPoints(e.target.value)} />
        <Button type="submit">Filtrele</Button>
      </form>

      {fail ? <ErrorState error={fail} retry={load} /> : null}

      <DataTable
        caption="Vatandaş Hesabı Listesi"
        loading={loading}
        error={null}
        rows={items}
        getRowId={(u) => u.id}
        emptyTitle="Henüz kayıtlı vatandaş bulunmuyor."
        emptyDescription="Arama kriterlerinizi değiştirip tekrar deneyin."
        columns={[
          { key: 'name', header: 'Vatandaş', render: (u) => <strong>{u.firstName} {u.lastName}</strong> },
          { key: 'phone', header: 'Telefon', render: (u) => maskPhoneNumber(u.phoneNumber) },
          { key: 'age', header: 'Yaş', render: (u) => u.age ?? '—' },
          { key: 'edu', header: 'Öğrenim', render: (u) => educationLabel(u.educationLevel) || '—' },
          { key: 'gp', header: 'GölPuan', render: (u) => <span className="admin-gp">{formatGp(u.pointsBalance)}</span> },
          { key: 'status', header: 'Durum', render: (u) => <StatusBadge status={u.status || 'Active'} label={u.status === 'Restricted' ? 'Kısıtlı' : u.status === 'Suspended' ? 'Askıda' : 'Aktif'} /> },
        ]}
        actions={(u) => <Button size="sm" onClick={() => openDetail(u.id)}>360° Detay</Button>}
      />

      <Pagination page={page} pageSize={pageSize} totalCount={total} onPage={setPage} onPageSize={(s) => { setPageSize(s); setPage(1); }} />

      {/* User 360 Drawer */}
      <Drawer
        open={!!detail}
        title={detail ? `${detail.firstName} ${detail.lastName} (Vatandaş 360°)` : 'Vatandaş Detayı'}
        onClose={() => navigate('/admin/vatandaslar')}
      >
        {detail && (
          <>
            <section className="admin-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Profil & İletişim</h3>
                {isAdmin && (
                  <Button size="sm" variant="secondary" onClick={() => setShowPii(!showPii)}>
                    {showPii ? 'PII Gizle' : 'Tam İletişim Göster'}
                  </Button>
                )}
              </div>
              <dl className="admin-dl" style={{ marginTop: 10 }}>
                <div><dt>E-posta</dt><dd>{showPii ? (detail.email || 'Belirtilmemiş') : (detail.email ? `${detail.email.slice(0, 3)}••••@••••` : 'Belirtilmemiş')}</dd></div>
                <div><dt>Telefon</dt><dd>{showPii ? (detail.phoneNumber || 'Belirtilmemiş') : maskPhoneNumber(detail.phoneNumber)}</dd></div>
                <div><dt>Yaş</dt><dd>{detail.age ?? 'Belirtilmemiş'}</dd></div>
                <div><dt>Öğrenim Durumu</dt><dd>{educationLabel(detail.educationLevel) || 'Belirtilmemiş'}</dd></div>
                <div><dt>Hesap Durumu</dt><dd><StatusBadge status={detail.status || 'Active'} label={detail.status === 'Restricted' ? 'Kısıtlı' : 'Aktif'} /></dd></div>
              </dl>
            </section>

            {/* Account Restrictions & Security */}
            <section className="admin-section" style={{ background: 'var(--bg-subtle, #f8fafc)', padding: 12, borderRadius: 8 }}>
              <h3>Hesap Güvenliği & Kısıtlamalar</h3>
              {detail.activeRestrictions && detail.activeRestrictions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                  {detail.activeRestrictions.map((r: any, idx: number) => (
                    <div key={idx} style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: 8, borderRadius: 6, fontSize: 13 }}>
                      <strong>{r.type === 'PICKUP_ORDER_RESTRICTED' ? 'Gel-Al Sipariş Kısıtlaması' : 'Hesap Askıya Alındı'}</strong>
                      <div>Sebep: {r.reasonCode}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Bu hesap üzerinde aktif bir kısıtlama bulunmuyor.</p>
              )}
              {isAdmin && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                  <Button size="sm" variant="secondary" onClick={() => setRestrictModalOpen(true)}>
                    + Kısıtlama Ekle
                  </Button>
                  <Button size="sm" variant="danger" onClick={handleRevokeSessions}>
                    Tüm Oturumları Sonlandır
                  </Button>
                </div>
              )}
            </section>

            {/* GölPuan Section */}
            <section className="admin-section">
              <h3>GölPuan Bakiyesi</h3>
              <p className="admin-gp">{formatGp(detail.pointsBalance)}</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 10px' }}>
                Bakiye serbest textbox ile düzenlenemez. Düzeltmeler gerekçeli audit log üretir.
              </p>
              {isAdmin && (
                <Button data-testid="manual-gp-action" onClick={() => { setGpErrors({}); setGpOpen(true); }}>
                  Manuel GölPuan Düzeltmesi
                </Button>
              )}
              <RowList
                title="Son Puan Hareketleri"
                rows={(detail.pointHistory || []).map((p: any) => `${formatDateTime(p.createdDate)} · ${pointTypeLabel(p.type)} · ${formatGp(p.amount)}`)}
                empty="Puan hareketi bulunmuyor."
              />
            </section>

            <section className="admin-section">
              <h3>Gel-Al Sipariş Geçmişi</h3>
              <RowList
                rows={(detail.ordersHistory || []).map((o: any) => ({
                  text: `${o.collectionCode || '—'} · ${o.cafeName || 'Şube'} · ${formatDateTime(o.createdDate)}`,
                  badge: o.status,
                }))}
                empty="Sipariş kaydı bulunmuyor."
              />
            </section>

            <section className="admin-section">
              <h3>Etkinlik Katılımları</h3>
              <RowList
                rows={(detail.userActivities || []).map((a: any) => `${a.title} · ${formatDateTime(a.createdDate)}`)}
                empty="Etkinlik katılımı bulunmuyor."
              />
            </section>
          </>
        )}
        {!detail && <EmptyState title="Vatandaş bilgileri yükleniyor..." />}
      </Drawer>

      {/* Manual Points Adjustment Modal */}
      <Modal
        open={gpOpen}
        title="Manuel GölPuan Düzeltmesi"
        onClose={() => setGpOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setGpOpen(false)}>Vazgeç</Button>
            <Button data-testid="manual-gp-submit" loading={savingKey === 'manual-gp'} onClick={submitGp}>Uygula</Button>
          </>
        }
      >
        <Select label="İşlem Yönü" value={gp.action} onChange={(e) => setGp({ ...gp, action: e.target.value as 'Add' | 'Deduct' })}>
          <option value="Add">Puan Ekle (+ GP)</option>
          <option value="Deduct">Puan Çıkar (- GP)</option>
        </Select>
        <NumberInput label="Miktar (GP)" min={1} max={MAX_MANUAL_GP} value={gp.amount} error={gpErrors.amount} onChange={(e) => { setGpErrors((p) => ({ ...p, amount: undefined })); setGp({ ...gp, amount: Number(e.target.value) }); }} />
        <Input label="Zorunlu Sebep" required value={gp.reason} error={gpErrors.reason} onChange={(e) => { setGpErrors((p) => ({ ...p, reason: undefined })); setGp({ ...gp, reason: e.target.value }); }} />
        <Input label="Açıklama / Not" helper="İsteğe bağlı" value={gp.description} onChange={(e) => setGp({ ...gp, description: e.target.value })} />
      </Modal>

      {/* Account Restriction Modal */}
      <Modal
        open={restrictModalOpen}
        title="Vatandaş Hesabına Kısıtlama Ekle"
        onClose={() => setRestrictModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRestrictModalOpen(false)}>Vazgeç</Button>
            <Button loading={savingKey === 'restriction'} onClick={() => void (document.getElementById('restrict-form') as HTMLFormElement | null)?.requestSubmit()}>
              Kısıtlamayı Uygula
            </Button>
          </>
        }
      >
        <form id="restrict-form" onSubmit={handleRestrictionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Select
            label="Kısıtlama Türü"
            required
            value={restrictForm.type}
            onChange={(e) => setRestrictForm({ ...restrictForm, type: e.target.value })}
          >
            <option value="PICKUP_ORDER_RESTRICTED">Gel-Al Sipariş Kısıtlaması (Pickup Order Restricted)</option>
            <option value="ACCOUNT_SUSPENDED">Tüm Hesabı Askıya Al (Account Suspended)</option>
          </Select>

          <Select
            label="Kısıtlama Gerekçesi"
            required
            value={restrictForm.reasonCode}
            onChange={(e) => setRestrictForm({ ...restrictForm, reasonCode: e.target.value })}
          >
            <option value="Gel-Al Sipariş No-Show Suistimali">Gel-Al Sipariş No-Show Suistimali</option>
            <option value="Mükerrer Şüpheli QR İşlemi">Mükerrer Şüpheli QR İşlemi</option>
            <option value="Güvenlik & Politika İhlali">Güvenlik & Politika İhlali</option>
            <option value="Müşteri Destek Talebi Üzerine">Müşteri Destek Talebi Üzerine</option>
          </Select>

          <Select
            label="Kısıtlama Süresi"
            required
            value={restrictForm.durationDays}
            onChange={(e) => setRestrictForm({ ...restrictForm, durationDays: Number(e.target.value) })}
          >
            <option value={7}>7 Gün Geçici Kısıtlama</option>
            <option value={30}>30 Gün Geçici Kısıtlama</option>
            <option value={365}>1 Yıl Kısıtlama</option>
            <option value={0}>Süresiz (Manuel Kaldırılana Kadar)</option>
          </Select>

          <Textarea
            label="Dahili Admin Notu (Opsiyonel)"
            placeholder="İnceleme notları veya destek bilet no..."
            value={restrictForm.internalNote}
            onChange={(e) => setRestrictForm({ ...restrictForm, internalNote: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
}

function RowList({ title, rows, empty }: { title?: string; rows: Array<string | { text: string; extra?: string; badge?: string }>; empty: string }) {
  return (
    <div style={{ marginTop: title ? 8 : 0 }}>
      {title ? <div className="admin-label">{title}</div> : null}
      {rows.length === 0
        ? <div className="admin-muted">{empty}</div>
        : rows.map((row, i) => {
            const item = typeof row === 'string' ? { text: row } : row;
            return (
              <div key={i} style={{ fontSize: 13, padding: '4px 0', borderBottom: '1px solid #f8fafc', display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                <span>
                  {item.text}
                  {item.extra ? <span className="admin-muted" style={{ display: 'block' }}>{item.extra}</span> : null}
                </span>
                {item.badge ? <StatusBadge status={item.badge} /> : null}
              </div>
            );
          })}
    </div>
  );
}
