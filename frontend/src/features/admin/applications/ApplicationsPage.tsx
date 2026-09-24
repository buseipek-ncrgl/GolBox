import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { Button, DateInput, EmptyState, ErrorState, FilterBar, Input, Modal, Select, Textarea, UnsavedGuard } from '../../../admin/components';
import { useAdminFeedback } from '../AdminFeedback';
import { formatDate } from '../../../lib/adminDate';
import { FileText, Plus, CheckCircle, Clock, AlertCircle, XCircle, FileCheck, Eye, Download, Edit3, Trash2, Power, CalendarOff } from 'lucide-react';

const STATUS_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  Submitted: { label: 'Alındı', color: '#64748b', icon: Clock },
  UnderReview: { label: 'İncelemede', color: '#0284c7', icon: Clock },
  DocumentRequested: { label: 'Belge Talep Edildi', color: '#d97706', icon: AlertCircle },
  Approved: { label: 'Onaylandı', color: '#16a34a', icon: CheckCircle },
  Rejected: { label: 'Reddedildi', color: '#dc2626', icon: XCircle },
  Completed: { label: 'Tamamlandı', color: '#059669', icon: FileCheck },
};

const STANDARD_DOCUMENTS = [
  'T.C. Kimlik Fotokopisi / Beyanı',
  'İkametgah Belgesi (e-Devlet Barkodlu)',
  'Öğrenci Belgesi (e-Devlet / Transkript)',
  'Gelir Belgesi / Maaş Bordrosu',
  'Aile Nüfus Kayıt Örneği',
  'Sağlık Kurulu / Engelli Raporu',
  'Adli Sicil Kaydı (e-Devlet)',
  'Banka İBAN / Hesap Dekontu',
  'Veli İzin Belgesi (18 Yaş Altı)',
  'Fatura / İkametgah Teyit Belgesi',
];

export function ApplicationsPage() {
  const { isAdmin, confirm, setError, setSuccess, savingKey, setSavingKey } = useAdminFeedback();
  const [activeTab, setActiveTab] = useState<'submissions' | 'programs'>('submissions');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [programFilter, setProgramFilter] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [fail, setFail] = useState<unknown>(null);
  
  // Modals
  const [programForm, setProgramForm] = useState<any>(null);
  const [programSnapshot, setProgramSnapshot] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [statusNote, setStatusNote] = useState('');

  const syncProgramsToStorage = (updatedList: any[]) => {
    try {
      localStorage.setItem('golbox_admin_programs', JSON.stringify(updatedList));
    } catch {}
  };

  const loadData = async () => {
    try {
      if (activeTab === 'submissions') {
        const res = await api.getAdminApplications({
          status: statusFilter === 'All' ? undefined : statusFilter,
          search: search || undefined,
        });
        setSubmissions(res.items || []);
      } else {
        const res = await api.getAdminApplicationPrograms();
        let loaded = res || [];
        try {
          const stored = localStorage.getItem('golbox_admin_programs');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              loaded = parsed;
            }
          }
        } catch {}
        setPrograms(loaded);
      }
      setFail(null);
    } catch (err: any) {
      setFail(err);
    }
  };

  useEffect(() => {
    void loadData();
  }, [activeTab, statusFilter]);

  const dirtyProgram = !!programForm && JSON.stringify(programForm) !== programSnapshot;

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedSubmission) return;
    setSavingKey('app-status');
    try {
      await api.updateApplicationStatus(selectedSubmission.id, newStatus, statusNote);
      setSuccess(`Başvuru durumu "${STATUS_LABELS[newStatus]?.label || newStatus}" olarak güncellendi.`);
      setSelectedSubmission(null);
      setStatusNote('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Durum güncellenemedi.');
    } finally {
      setSavingKey(null);
    }
  };

  const getProgramStatus = (prog: any) => {
    const today = new Date().toISOString().slice(0, 10);
    if (prog.endDate && prog.endDate < today) {
      return 'Expired';
    }
    return prog.isActive ? 'Active' : 'Passive';
  };

  const handleToggleProgramStatus = async (prog: any) => {
    const newActiveState = !prog.isActive;
    setSavingKey(`toggle-${prog.id}`);
    try {
      await api.toggleApplicationProgramStatus(prog.id, newActiveState);
      setPrograms(prev => {
        const next = prev.map(p => p.id === prog.id ? { ...p, isActive: newActiveState } : p);
        syncProgramsToStorage(next);
        return next;
      });
      setSuccess(`"${prog.title}" programı ${newActiveState ? 'Aktif başvuruya açıldı' : 'Pasife alındı'}.`);
    } catch (err: any) {
      setError(err.message || 'Durum güncellenemedi.');
    } finally {
      setSavingKey(null);
    }
  };

  const handleDeleteProgram = (prog: any) => {
    confirm({
      title: 'Programı Sil',
      message: `"${prog.title}" isimli başvuru programını silmek istediğinizden emin misiniz?`,
      confirmLabel: 'Evet, Sil',
      danger: true,
      onConfirm: async () => {
        setSavingKey(`del-${prog.id}`);
        try {
          await api.deleteApplicationProgram(prog.id);
          setPrograms((prev) => {
            const next = prev.filter((p) => p.id !== prog.id);
            syncProgramsToStorage(next);
            return next;
          });
          setSuccess(`"${prog.title}" programı silindi.`);
        } catch (err: any) {
          setError(err.message || 'Program silinemedi.');
        } finally {
          setSavingKey(null);
        }
      },
    });
  };

  const filteredPrograms = programs.filter((prog) => {
    const st = getProgramStatus(prog);
    if (programFilter !== 'All' && st !== programFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        prog.title?.toLowerCase().includes(q) ||
        prog.description?.toLowerCase().includes(q) ||
        prog.category?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <UnsavedGuard dirty={dirtyProgram} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <p className="admin-muted" style={{ margin: 0, maxWidth: 640 }}>
          Vatandaşların belediyemize yaptığı destek ve hizmet başvurularını inceleyebilir, yeni başvuru/destek programları açabilir, düzenleyebilir ve yönetebilirsiniz.
        </p>
        {isAdmin && activeTab === 'programs' && (
          <Button
            onClick={() => {
              const init = {
                id: undefined,
                title: '',
                category: 'Eğitim Desteği',
                description: '',
                startDate: new Date().toISOString().slice(0, 10),
                endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
                isActive: true,
                requiredDocuments: ['T.C. Kimlik Fotokopisi / Beyanı', 'İkametgah Belgesi (e-Devlet Barkodlu)'],
                customDoc: '',
              };
              setProgramForm(init);
              setProgramSnapshot(JSON.stringify(init));
            }}
          >
            <Plus size={16} style={{ marginRight: 6 }} /> Yeni Başvuru Programı Aç
          </Button>
        )}
      </div>

      {/* Main Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--admin-border)', paddingBottom: 8 }}>
        <button
          type="button"
          className={`admin-btn ${activeTab === 'submissions' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
          onClick={() => setActiveTab('submissions')}
        >
          Gelen Vatandaş Başvuruları ({submissions.length})
        </button>
        <button
          type="button"
          className={`admin-btn ${activeTab === 'programs' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
          onClick={() => setActiveTab('programs')}
        >
          Başvuru / Hizmet Programları ({programs.length})
        </button>
      </div>

      {activeTab === 'submissions' && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['All', 'UnderReview', 'DocumentRequested', 'Approved', 'Rejected', 'Completed'].map((st) => (
            <button
              key={st}
              type="button"
              className={`admin-btn ${statusFilter === st ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
              style={{ fontSize: 13, padding: '4px 12px' }}
              onClick={() => setStatusFilter(st)}
            >
              {st === 'All' ? 'Tüm Durumlar' : STATUS_LABELS[st]?.label || st}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'programs' && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { id: 'All', label: 'Tüm Programlar' },
            { id: 'Active', label: 'Aktif / Başvuruya Açık' },
            { id: 'Passive', label: 'Pasif (Kapatıldı)' },
            { id: 'Expired', label: 'Süresi Dolmuş' },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              className={`admin-btn ${programFilter === st.id ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
              style={{ fontSize: 13, padding: '4px 12px' }}
              onClick={() => setProgramFilter(st.id)}
            >
              {st.label}
            </button>
          ))}
        </div>
      )}

      <FilterBar
        search={search}
        onSearch={setSearch}
        activeCount={search ? 1 : 0}
        onClear={() => setSearch('')}
        onSubmit={() => {
          void loadData();
        }}
        filters={<Button type="submit" size="sm">Filtrele</Button>}
      />

      {fail ? <ErrorState error={fail} retry={loadData} /> : null}

      {/* SUBMISSIONS TAB */}
      {activeTab === 'submissions' && (
        submissions.length === 0 ? (
          <EmptyState
            title="Kayıtlı başvuru bulunamadı."
            description="Filtreleme kriterlerinizi değiştirebilir veya başvuru programlarını kontrol edebilirsiniz."
          />
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {submissions.map((sub) => {
              const StatusConfig = STATUS_LABELS[sub.status] || STATUS_LABELS.Submitted;
              const StatusIcon = StatusConfig.icon;
              return (
                <div key={sub.id} className="admin-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: 'rgba(29, 95, 96, 0.1)', color: '#1d5f60', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileText size={22} />
                    </div>
                    <div>
                      <strong style={{ fontSize: 16 }}>{sub.programTitle}</strong>
                      <div style={{ fontSize: 14, marginTop: 2, color: 'var(--admin-text)' }}>
                        <strong>{sub.citizenName}</strong> · T.C: {sub.tcNo} · Tel: {sub.phone}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--admin-muted)', marginTop: 4 }}>
                        Başvuru Tarihi: {formatDate(sub.appliedAt)} · Yüklenen Belge: {sub.documents?.length || 0} Adet
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: `${StatusConfig.color}15`, color: StatusConfig.color, padding: '4px 10px', borderRadius: 6, fontSize: 13, fontWeight: 600 }}>
                      <StatusIcon size={14} />
                      <span>{StatusConfig.label}</span>
                    </div>

                    <Button size="sm" variant="secondary" onClick={() => { setSelectedSubmission(sub); setStatusNote(sub.note || ''); }}>
                      <Eye size={14} style={{ marginRight: 4 }} /> Başvuruyu İncele
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* PROGRAMS TAB */}
      {activeTab === 'programs' && (
        filteredPrograms.length === 0 ? (
          <EmptyState
            title="Kriterlere uygun başvuru programı bulunamadı."
            description="Filtrenizi değiştirebilir veya 'Yeni Başvuru Programı Aç' butonundan hizmet tanımı yapabilirsiniz."
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {filteredPrograms.map((prog) => {
              const status = getProgramStatus(prog);
              return (
                <div key={prog.id} className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#1d5f60', backgroundColor: 'rgba(29,95,96,0.1)', padding: '2px 8px', borderRadius: 4 }}>
                        {prog.category}
                      </span>
                      
                      {status === 'Expired' && (
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#d97706', backgroundColor: '#fef3c7', padding: '2px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CalendarOff size={13} /> Süresi Doldu (Otomatik Kapatıldı)
                        </span>
                      )}
                      {status === 'Active' && (
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle size={13} /> Aktif / Başvuruya Açık
                        </span>
                      )}
                      {status === 'Passive' && (
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Power size={13} /> Pasif (Kapatıldı)
                        </span>
                      )}
                    </div>

                    <div>
                      <strong style={{ fontSize: 16 }}>{prog.title}</strong>
                      <p style={{ fontSize: 13, color: 'var(--admin-muted)', margin: '6px 0 0 0', lineHeight: 1.4 }}>
                        {prog.description}
                      </p>
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--admin-muted)', borderTop: '1px dashed var(--admin-border)', paddingTop: 8 }}>
                      <strong>İstenen Belgeler:</strong> {prog.requiredDocuments?.join(', ') || 'Belge şartı yok'}
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--admin-muted)' }}>
                      <strong>Tarih Aralığı:</strong> {prog.startDate} – {prog.endDate}
                    </div>
                  </div>

                  {/* ADMIN PROGRAM CONTROL ACTIONS */}
                  <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--admin-border)', paddingTop: 10, flexWrap: 'wrap' }}>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        const init = {
                          id: prog.id,
                          title: prog.title || '',
                          category: prog.category || 'Eğitim Desteği',
                          description: prog.description || '',
                          startDate: prog.startDate || new Date().toISOString().slice(0, 10),
                          endDate: prog.endDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
                          isActive: prog.isActive !== false,
                          requiredDocuments: Array.isArray(prog.requiredDocuments) ? prog.requiredDocuments : [],
                          customDoc: '',
                        };
                        setProgramForm(init);
                        setProgramSnapshot(JSON.stringify(init));
                      }}
                    >
                      <Edit3 size={13} style={{ marginRight: 4 }} /> Düzenle
                    </Button>

                    <Button
                      size="sm"
                      variant={prog.isActive ? 'secondary' : 'primary'}
                      loading={savingKey === `toggle-${prog.id}`}
                      onClick={() => void handleToggleProgramStatus(prog)}
                    >
                      <Power size={13} style={{ marginRight: 4 }} />
                      {prog.isActive ? 'Pasife Al' : 'Aktif Et'}
                    </Button>

                    <Button
                      size="sm"
                      variant="danger"
                      loading={savingKey === `del-${prog.id}`}
                      onClick={() => void handleDeleteProgram(prog)}
                    >
                      <Trash2 size={13} style={{ marginRight: 4 }} /> Sil
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* SUBMISSION REVIEW MODAL */}
      <Modal open={!!selectedSubmission} title="Vatandaş Başvurusu İnceleme" size="lg" onClose={() => setSelectedSubmission(null)}>
        {selectedSubmission && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ backgroundColor: 'var(--admin-card-bg)', padding: 12, borderRadius: 8, border: '1px solid var(--admin-border)' }}>
              <strong style={{ fontSize: 16 }}>{selectedSubmission.programTitle}</strong>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8, fontSize: 13 }}>
                <div><strong>Vatandaş:</strong> {selectedSubmission.citizenName}</div>
                <div><strong>T.C. Kimlik No:</strong> {selectedSubmission.tcNo}</div>
                <div><strong>Telefon:</strong> {selectedSubmission.phone}</div>
                <div><strong>Başvuru Tarihi:</strong> {formatDate(selectedSubmission.appliedAt)}</div>
              </div>
            </div>

            {/* Documents */}
            <div>
              <strong style={{ fontSize: 14 }}>Yüklenen Başvuru Belgeleri:</strong>
              {selectedSubmission.documents && selectedSubmission.documents.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  {selectedSubmission.documents.map((doc: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, backgroundColor: 'var(--admin-subtle)', borderRadius: 6, fontSize: 13 }}>
                      <span>📄 {doc.name}</span>
                      <a href={doc.url} target="_blank" rel="noreferrer" className="admin-btn admin-btn-secondary admin-btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                        <Download size={13} /> Belgeyi İncele / İndir
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--admin-muted)', margin: '4px 0 0 0' }}>Yüklenmiş belge bulunmuyor.</p>
              )}
            </div>

            {/* Status Change */}
            <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <strong style={{ fontSize: 14 }}>Başvuru Durumunu Değerlendir:</strong>
              <Textarea
                label="Personel / Değerlendirme Notu"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Vatandaşa iletilecek açıklama veya eksik belge talebi metni..."
              />

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Button loading={!!savingKey} onClick={() => handleUpdateStatus('UnderReview')}>
                  İncelemeye Al
                </Button>
                <Button loading={!!savingKey} variant="secondary" onClick={() => handleUpdateStatus('DocumentRequested')}>
                  Belge Talep Et
                </Button>
                <Button loading={!!savingKey} style={{ backgroundColor: '#16a34a', color: '#fff' }} onClick={() => handleUpdateStatus('Approved')}>
                  Başvuruyu Onayla
                </Button>
                <Button loading={!!savingKey} variant="danger" onClick={() => handleUpdateStatus('Rejected')}>
                  Reddet
                </Button>
                <Button loading={!!savingKey} style={{ backgroundColor: '#059669', color: '#fff' }} onClick={() => handleUpdateStatus('Completed')}>
                  Hizmeti Tamamla
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* CREATE / EDIT PROGRAM MODAL */}
      <Modal
        open={!!programForm}
        title={programForm?.id ? 'Başvuru Programını Düzenle' : 'Yeni Başvuru / Hizmet Programı Aç'}
        size="lg"
        onClose={() => setProgramForm(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setProgramForm(null)}>
              Vazgeç
            </Button>
            <Button loading={!!savingKey} onClick={() => void (document.getElementById('program-form') as HTMLFormElement | null)?.requestSubmit()}>
              {programForm?.id ? 'Güncelle' : 'Programı Aç'}
            </Button>
          </>
        }
      >
        {programForm && (
          <form
            id="program-form"
            style={{ display: 'grid', gap: 14 }}
            onSubmit={async (e) => {
              e.preventDefault();
              setSavingKey('prog');
              try {
                const requiredDocuments = Array.isArray(programForm.requiredDocuments) ? programForm.requiredDocuments : [];
                const payload = {
                  id: programForm.id,
                  title: programForm.title,
                  category: programForm.category,
                  description: programForm.description,
                  startDate: programForm.startDate,
                  endDate: programForm.endDate,
                  isActive: programForm.isActive,
                  requiredDocuments,
                };

                if (programForm.id) {
                  await api.updateApplicationProgram(programForm.id, payload);
                  setPrograms((prev) => {
                    const next = prev.map((p) => (p.id === programForm.id ? { ...p, ...payload } : p));
                    syncProgramsToStorage(next);
                    return next;
                  });
                  setSuccess('Başvuru programı başarıyla güncellendi.');
                } else {
                  const res = await api.createApplicationProgram(payload);
                  const newProg = { ...payload, id: res.id || `prog-${Date.now()}` };
                  setPrograms((prev) => {
                    const next = [newProg, ...prev];
                    syncProgramsToStorage(next);
                    return next;
                  });
                  setSuccess('Yeni başvuru programı başarıyla açıldı ve vatandaş uygulamasına tanımlandı.');
                }
                setProgramForm(null);
              } catch (err: any) {
                setError(err.message || 'İşlem başarısız.');
              } finally {
                setSavingKey(null);
              }
            }}
          >
            <Input id="program-title" required label="Program / Hizmet Başlığı" value={programForm.title || ''} onChange={(e) => setProgramForm({ ...programForm, title: e.target.value })} placeholder="Örn: 2026 Üniversite Öğrenci Kırtasiye Desteği" />

            <Select id="program-category" label="Kategori" value={programForm.category} onChange={(e) => setProgramForm({ ...programForm, category: e.target.value })}>
              <option value="Eğitim Desteği">Eğitim Desteği</option>
              <option value="Sosyal Yardım">Sosyal Yardım</option>
              <option value="Sağlık ve Bakım">Sağlık ve Bakım</option>
              <option value="Kültür ve Spor">Kültür ve Spor</option>
              <option value="Diğer Hizmetler">Diğer Hizmetler</option>
            </Select>

            <Select id="program-status" label="Program Durumu" value={programForm.isActive ? 'true' : 'false'} onChange={(e) => setProgramForm({ ...programForm, isActive: e.target.value === 'true' })}>
              <option value="true">Aktif (Vatandaş Başvurusuna Açık)</option>
              <option value="false">Pasif (Kapalı / Görünmez)</option>
            </Select>

            <Textarea id="program-description" required label="Açıklama ve Başvuru Koşulları" value={programForm.description || ''} onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })} placeholder="Başvurudan kimlerin yararlanabileceği ve şartlar..." />

            {/* SELECTABLE STANDARD REQUIRED DOCUMENTS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text)' }}>
                İstenen Belgeler (Standart Belge Listesinden İşaretleyin)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8, backgroundColor: 'var(--admin-subtle)', padding: 12, borderRadius: 8, border: '1px solid var(--admin-border)' }}>
                {STANDARD_DOCUMENTS.map((docName) => {
                  const isChecked = (programForm.requiredDocuments || []).includes(docName);
                  return (
                    <label key={docName} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', userSelect: 'none' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const current = programForm.requiredDocuments || [];
                          const next = e.target.checked
                            ? [...current, docName]
                            : current.filter((d: string) => d !== docName);
                          setProgramForm({ ...programForm, requiredDocuments: next });
                        }}
                        style={{ accentColor: '#1d5f60', width: 16, height: 16 }}
                      />
                      <span>{docName}</span>
                    </label>
                  );
                })}
              </div>

              {/* Custom document addition */}
              <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'flex-end' }}>
                <Input
                  id="program-custom-doc"
                  label="Özel Belge"
                  placeholder="Diğer / Özel Belge Adı Yazın..."
                  value={programForm.customDoc || ''}
                  onChange={(e) => setProgramForm({ ...programForm, customDoc: e.target.value })}
                  style={{ flex: 1 }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const val = (programForm.customDoc || '').trim();
                    if (!val) return;
                    const current = programForm.requiredDocuments || [];
                    if (!current.includes(val)) {
                      setProgramForm({ ...programForm, requiredDocuments: [...current, val], customDoc: '' });
                    }
                  }}
                >
                  + Özel Belge Ekle
                </Button>
              </div>

              {/* Selected document badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {(programForm.requiredDocuments || []).map((doc: string) => (
                  <span
                    key={doc}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      backgroundColor: 'rgba(29, 95, 96, 0.1)',
                      color: '#1d5f60',
                      padding: '4px 10px',
                      borderRadius: 16,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    📄 {doc}
                    <button
                      type="button"
                      onClick={() => {
                        const next = (programForm.requiredDocuments || []).filter((d: string) => d !== doc);
                        setProgramForm({ ...programForm, requiredDocuments: next });
                      }}
                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 0, fontSize: 12, fontWeight: 'bold' }}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <DateInput id="program-start-date" required label="Başvuru Başlangıç Tarihi" value={programForm.startDate || ''} onChange={(e) => setProgramForm({ ...programForm, startDate: e.target.value })} />
            <DateInput id="program-end-date" required label="Başvuru Bitiş Tarihi" value={programForm.endDate || ''} onChange={(e) => setProgramForm({ ...programForm, endDate: e.target.value })} />
          </form>
        )}
      </Modal>
    </div>
  );
}
