import React, { useEffect, useState } from 'react';
import {
  Target,
  Award,
  CheckCircle2,
  Clock,
  Copy,
  Plus,
  Trash2,
  Eye,
  Edit2,
  Play,
  Square,
  Users,
  Sparkles,
  Flame,
  Search,
  Filter,
  ChevronRight,
  Info,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../../../services/api';
import { pagedMeta } from '../../../lib/adminQuery';
import { formatDate } from '../../../lib/adminDate';
import {
  BulkSelectionBar,
  Button,
  DateInput,
  EmptyState,
  ErrorState,
  FilterBar,
  Input,
  Modal,
  NumberInput,
  Pagination,
  Select,
  SelectionCheckbox,
  Skeleton,
  StatusBadge,
  Textarea,
  UnsavedGuard
} from '../../../admin/components';
import { useAdminFeedback } from '../AdminFeedback';

export interface AdminMission {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription?: string;
  category: 'Keşif' | 'Etkinlik' | 'Şube' | 'GölBOX' | 'Topluluk';
  missionType: 'ORDER_COMPLETED' | 'EVENT_ATTENDED' | 'DISTINCT_BRANCH' | 'DISTINCT_CATEGORY' | 'FIRST_ORDER';
  targetProgress: number;
  pointsGranted: number;
  startDate: string;
  endDate: string;
  status: 'Draft' | 'Published' | 'Active' | 'Ended' | 'Cancelled';
  targetAudience: 'All' | 'Youth' | 'Student';
  howToCompleteSteps?: string[];
  howToCompleteJson?: string;
  joinedCount?: number;
  completedCount?: number;
}

const MISSION_TYPE_LABELS: Record<string, string> = {
  ORDER_COMPLETED: 'Sipariş Tamamlama',
  EVENT_ATTENDED: 'Etkinlik Katılımı',
  DISTINCT_BRANCH: 'Farklı Şube Ziyareti',
  DISTINCT_CATEGORY: 'Farklı Ürün Kategori',
  FIRST_ORDER: 'İlk Alışveriş'
};

const CATEGORY_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  Keşif: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  Etkinlik: { bg: '#faf5ff', color: '#7e22ce', border: '#e9d5ff' },
  Şube: { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
  GölBOX: { bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
  Topluluk: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
};

export function MissionsPage() {
  const { isAdmin, confirm, setError, setSuccess, savingKey, setSavingKey } = useAdminFeedback();
  const [items, setItems] = useState<AdminMission[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [fail, setFail] = useState<unknown>(null);
  const [form, setForm] = useState<any>(null);
  const [stepsInput, setStepsInput] = useState<string[]>([]);
  const [snapshot, setSnapshot] = useState('');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ total: 0, active: 0, draft: 0, completed: 0 });

  // Detail Modal State
  const [viewingMission, setViewingMission] = useState<any>(null);
  const [viewingLoading, setViewingLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getMissions({
        page,
        pageSize: 25,
        search: search || undefined,
        status: statusFilter || undefined
      });
      const meta = pagedMeta(res, page, 25);
      setItems(meta.items);
      setTotal(meta.totalCount);
      setSummary(res.summary || { total: meta.totalCount, active: 0, draft: 0, completed: 0 });
      setFail(null);
    } catch (error) {
      setFail(error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [page, statusFilter]);

  const blank = () => ({
    title: '',
    shortDescription: '',
    fullDescription: '',
    category: 'GölBOX',
    missionType: 'ORDER_COMPLETED',
    targetProgress: 2,
    pointsGranted: 100,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    targetAudience: 'All',
    status: 'Draft',
    howToCompleteSteps: ['GölBOX şubesine git', 'İçecek siparişi ver', 'QR ile doğrula'],
  });

  const dirty = !!form && JSON.stringify(form) !== snapshot;

  const openForm = (next: any) => {
    let steps: string[] = [];
    if (next.howToCompleteSteps && Array.isArray(next.howToCompleteSteps)) {
      steps = next.howToCompleteSteps;
    } else if (next.howToCompleteJson) {
      try {
        steps = JSON.parse(next.howToCompleteJson);
      } catch {
        steps = [];
      }
    } else {
      steps = ['GölBOX şubesinde sipariş ver', 'QR ile işlemi doğrula'];
    }
    setStepsInput(steps);
    setForm(next);
    setSnapshot(JSON.stringify(next));
  };

  const closeForm = () => {
    if (dirty) {
      confirm({
        title: 'Kaydedilmemiş Değişiklikler',
        message: 'Görev formundaki değişiklikler henüz kaydedilmedi. Kapatmak istediğinize emin misiniz?',
        confirmLabel: 'Kapat',
        danger: true,
        onConfirm: () => setForm(null)
      });
    } else {
      setForm(null);
    }
  };

  const openDetail = async (missionId: string) => {
    setViewingLoading(true);
    try {
      const res = await api.getMissionById(missionId);
      setViewingMission(res.data || res);
    } catch (err: any) {
      setError('Görev detayları alınamadı.');
    } finally {
      setViewingLoading(false);
    }
  };

  const handleDuplicate = (mission: AdminMission) => {
    confirm({
      title: 'Görevi Kopyala',
      message: `"${mission.title}" görevini taslak olarak kopyalamak istiyor musunuz?`,
      confirmLabel: 'Kopyala',
      onConfirm: async () => {
        try {
          await api.duplicateMission(mission.id);
          setSuccess('Görev taslak olarak kopyalandı.');
          await load();
        } catch (err: any) {
          setError(err.message || 'Görev kopyalanamadı.');
        }
      }
    });
  };

  const handleDelete = (mission: AdminMission) => {
    confirm({
      title: 'Görevi Sil / İptal Et',
      message: `"${mission.title}" görevini silmek istediğinize emin misiniz? Kazanılan puanlar korunur, görev pasife çekilir.`,
      danger: true,
      confirmLabel: 'Sil',
      onConfirm: async () => {
        try {
          await api.deleteMission(mission.id);
          setSuccess('Görev silindi.');
          await load();
        } catch (err: any) {
          setError(err.message || 'Görev silinemedi.');
        }
      }
    });
  };
  const toggleSelected = (id: string, checked: boolean) => setSelected((current) => checked ? [...new Set([...current, id])] : current.filter((value) => value !== id));
  const removeSelected = () => confirm({ title: 'Seçili görevleri sil', message: `${selected.length} görev kaldırılacak. Kazanılmış puan ve tamamlanma kayıtları korunur.`, confirmLabel: 'Seçilenleri sil', danger: true, onConfirm: async () => { await Promise.all(selected.map((id) => api.deleteMission(id))); setSelected([]); setSuccess('Seçili görevler silindi.'); await load(); } });

  const filteredItems = items.filter((m) => {
    if (statusFilter && m.status !== statusFilter) return false;
    if (categoryFilter && m.category !== categoryFilter) return false;
    if (search && !m.title.toLowerCase().includes(search.toLowerCase()) && !m.shortDescription.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getDaysLeft = (endDateStr: string) => {
    const end = new Date(endDateStr).getTime();
    const now = new Date().getTime();
    const diff = Math.ceil((end - now) / (1000 * 3600 * 24));
    if (diff < 0) return { label: 'Sona Erdi', color: '#94a3b8' };
    if (diff === 0) return { label: 'Bugün Son Gün', color: '#ef4444' };
    return { label: `${diff} Gün Kaldı`, color: '#059669' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <UnsavedGuard dirty={dirty} />

      <div className="activity-toolbar">
        <p className="admin-muted mission-context">Sipariş, etkinlik ve şube ziyaretlerine bağlı hedefleri ve GölPuan ödüllerini yönetin.</p>
        {isAdmin && (
          <Button data-testid="mission-create" onClick={() => openForm(blank())}><Plus size={17} /> Yeni görev</Button>
        )}
      </div>

      <div className="catalog-summary mission-summary" aria-label="Görev özeti">
        <div className="catalog-summary-item"><Layers size={18} /><span>Toplam görev</span><strong>{summary.total}</strong></div>
        <div className="catalog-summary-item"><CheckCircle2 size={18} /><span>Aktif</span><strong>{summary.active}</strong></div>
        <div className="catalog-summary-item"><Clock size={18} /><span>Taslak</span><strong>{summary.draft}</strong></div>
        <div className="catalog-summary-item"><Award size={18} /><span>Tamamlanan hak</span><strong>{summary.completed}</strong></div>
      </div>

      {/* Filter & Quick Status Tabs Bar */}
      <div className="admin-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 10, overflowX: 'auto' }}>
          {[
            { id: '', label: 'Tüm Görevler' },
            { id: 'Active', label: 'Aktif' },
            { id: 'Draft', label: 'Taslaklar' },
            { id: 'Ended', label: 'Sona erenler' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setStatusFilter(tab.id); setPage(1); }}
              style={{
                background: statusFilter === tab.id ? '#047857' : 'transparent',
                color: statusFilter === tab.id ? '#ffffff' : '#64748b',
                border: 'none',
                padding: '6px 14px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter Toolbar */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <Input
              placeholder="Görev adı veya açıklama ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ width: 180 }}>
            <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">Tüm Kategoriler</option>
              <option value="Keşif">Keşif Görevi</option>
              <option value="Etkinlik">Etkinlik Görevi</option>
              <option value="Şube">Şube Ziyareti</option>
              <option value="GölBOX">GölBOX Genel</option>
              <option value="Topluluk">Topluluk</option>
            </Select>
          </div>

          {(search || categoryFilter || statusFilter) && (
            <Button variant="secondary" size="sm" onClick={() => { setSearch(''); setCategoryFilter(''); setStatusFilter(''); setPage(1); }}>
              Filtreleri Temizle
            </Button>
          )}
        </div>
      </div>
      <div className="collection-selection-row"><div className="collection-selection-head"><SelectionCheckbox label="Sayfadaki tüm görevleri seç" checked={filteredItems.length > 0 && filteredItems.every((item) => selected.includes(item.id))} onChange={(checked) => setSelected(checked ? filteredItems.map((item) => item.id) : [])} /><span>Sayfadakileri seç</span></div><BulkSelectionBar count={selected.length} onAction={removeSelected} onClear={() => setSelected([])} /></div>

      {/* Main Table Section */}
      {fail ? (
        <ErrorState error={fail} retry={load} />
      ) : loading ? (
        <Skeleton variant="table" />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          title="Görev bulunamadı."
          description="Seçilen kriterlere uygun görev bulunmuyor. Yeni bir görev oluşturabilirsiniz."
          actionLabel={isAdmin ? '+ Yeni Görev Tanımla' : undefined}
          onAction={isAdmin ? () => openForm(blank()) : undefined}
        />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="admin-selection-column">Seç</th>
                <th>Görev & Detay</th>
                <th>Kategori</th>
                <th>Tetikleyici Türü</th>
                <th>Hedef</th>
                <th>Ödül</th>
                <th>Tarih & Kalan Süre</th>
                <th>Tamamlanma Oranı</th>
                <th>Durum</th>
                <th style={{ textAlign: 'right' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((m) => {
                const catStyle = CATEGORY_STYLES[m.category] || { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
                const daysInfo = getDaysLeft(m.endDate);
                const percent = m.joinedCount && m.joinedCount > 0
                  ? Math.round(((m.completedCount || 0) / m.joinedCount) * 100)
                  : 0;

                return (
                  <tr key={m.id}>
                    <td className="admin-selection-column"><SelectionCheckbox label={`${m.title} seç`} checked={selected.includes(m.id)} onChange={(checked) => toggleSelected(m.id, checked)} /></td>
                    {/* Mission Name & Description */}
                    <td style={{ maxWidth: 280 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{m.title}</span>
                        <span style={{ fontSize: 12, color: '#64748b', lineHeight: 1.3 }}>{m.shortDescription}</span>
                      </div>
                    </td>

                    {/* Category Badge */}
                    <td>
                      <span
                        style={{
                          backgroundColor: catStyle.bg,
                          color: catStyle.color,
                          border: `1px solid ${catStyle.border}`,
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          display: 'inline-block'
                        }}
                      >
                        {m.category}
                      </span>
                    </td>

                    {/* Mission Trigger Type */}
                    <td>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>
                        {MISSION_TYPE_LABELS[m.missionType] || m.missionType}
                      </div>
                    </td>

                    {/* Target Progress */}
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13 }}>
                        {m.targetProgress} Adım
                      </div>
                    </td>

                    {/* Points Granted Reward */}
                    <td>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        backgroundColor: '#fffbeb',
                        color: '#b45309',
                        border: '1px solid #fde68a',
                        padding: '4px 10px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 700
                      }}>
                        <Sparkles size={13} style={{ color: '#d97706' }} />
                        +{m.pointsGranted} GP
                      </div>
                    </td>

                    {/* Date & Remaining Time */}
                    <td>
                      <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ color: '#475569' }}>{formatDate(m.startDate)} – {formatDate(m.endDate)}</span>
                        <span style={{ color: daysInfo.color, fontWeight: 600, fontSize: 11 }}>{daysInfo.label}</span>
                      </div>
                    </td>

                    {/* Progress Bar & Counter */}
                    <td style={{ minWidth: 140 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: '#475569' }}>
                          <span>{m.completedCount ?? 0} Tamamlayan</span>
                          <span>%{percent}</span>
                        </div>
                        <div style={{ width: '100%', height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.min(100, percent)}%`,
                              height: '100%',
                              backgroundColor: percent > 75 ? '#059669' : percent > 30 ? '#2563eb' : '#047857',
                              borderRadius: 3,
                              transition: 'width 0.3s ease'
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td>
                      <StatusBadge
                        status={m.status}
                        label={
                          m.status === 'Active' ? 'Aktif' :
                          m.status === 'Draft' ? 'Taslak' :
                          m.status === 'Ended' ? 'Sona Erdi' :
                          m.status === 'Cancelled' ? 'İptal' : m.status
                        }
                      />
                    </td>

                    {/* Actions Menu */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <Button
                          size="sm"
                          variant="secondary"
                          title="Detayları İncele"
                          onClick={() => void openDetail(m.id)}
                        >
                          <Eye size={14} />
                        </Button>

                        {isAdmin && (
                          <>
                            <Button
                              size="sm"
                              variant="secondary"
                              title="Düzenle"
                              onClick={() => openForm(m)}
                            >
                              <Edit2 size={14} />
                            </Button>

                            <Button
                              size="sm"
                              variant="secondary"
                              title="Kopyala"
                              onClick={() => handleDuplicate(m)}
                            >
                              <Copy size={14} />
                            </Button>

                            {m.status === 'Active' ? (
                              <Button
                                size="sm"
                                variant="danger"
                                title="Görevi Sonlandır"
                                onClick={() =>
                                  confirm({
                                    title: 'Görev Sona Erdirilsin mi?',
                                    message: `"${m.title}" görevi sonlandırılacaktır. Vatandaşların kazandığı ödüller etkilenmez.`,
                                    danger: true,
                                    confirmLabel: 'Sonlandır',
                                    onConfirm: async () => {
                                      await api.endMission(m.id);
                                      setSuccess('Görev sonlandırıldı.');
                                      await load();
                                    }
                                  })
                                }
                              >
                                <Square size={14} />
                              </Button>
                            ) : m.status === 'Draft' || m.status === 'Ended' ? (
                              <Button
                                size="sm"
                                title="Yayınla"
                                onClick={async () => {
                                  await api.publishMission(m.id);
                                  setSuccess('Görev başarıyla yayınlandı ve aktif edildi.');
                                  await load();
                                }}
                              >
                                <Play size={14} />
                              </Button>
                            ) : null}

                            <Button
                              size="sm"
                              variant="danger"
                              title="Sil"
                              onClick={() => handleDelete(m)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} pageSize={25} totalCount={total} onPage={setPage} />

      {/* Detail Drawer Modal */}
      <Modal
        open={!!viewingMission}
        title={`Görev Detayı: ${viewingMission?.title || ''}`}
        size="lg"
        onClose={() => setViewingMission(null)}
        footer={
          <Button variant="secondary" onClick={() => setViewingMission(null)}>Kapat</Button>
        }
      >
        {viewingMission && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, backgroundColor: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{viewingMission.title}</h4>
                <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.4 }}>{viewingMission.fullDescription || viewingMission.shortDescription}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                <StatusBadge status={viewingMission.status} label={viewingMission.status === 'Active' ? 'Aktif' : viewingMission.status} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#b45309' }}>Ödül: +{viewingMission.pointsGranted} GP</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div style={{ backgroundColor: '#ffffff', padding: 12, borderRadius: 6, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, color: '#64748b' }}>Kategori</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{viewingMission.category}</div>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: 12, borderRadius: 6, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, color: '#64748b' }}>Tetikleyici</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{MISSION_TYPE_LABELS[viewingMission.missionType] || viewingMission.missionType}</div>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: 12, borderRadius: 6, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, color: '#64748b' }}>Hedef Kitle</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{viewingMission.targetAudience === 'All' ? 'Tüm Vatandaşlar' : viewingMission.targetAudience}</div>
              </div>
            </div>

            {/* Steps Section */}
            {stepsInput && stepsInput.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <h5 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Nasıl Tamamlanır? (Vatandaş Adımları)</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {stepsInput.map((step, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#334155', backgroundColor: '#f1f5f9', padding: '8px 12px', borderRadius: 6 }}>
                      <span style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: '#047857', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{idx + 1}</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Completions Log Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h5 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Son Tamamlayan Vatandaşlar</h5>
              {viewingMission.recentCompletions && viewingMission.recentCompletions.length > 0 ? (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
                  <table className="admin-table" style={{ fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th>Vatandaş</th>
                        <th>Tamamlama Tarihi</th>
                        <th>Kazanılan Ödül</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingMission.recentCompletions.map((rc: any, i: number) => (
                        <tr key={i}>
                          <td><strong>{rc.userFullName || 'Vatandaş'}</strong></td>
                          <td>{formatDate(rc.completedAt)}</td>
                          <td><span style={{ fontWeight: 700, color: '#b45309' }}>+{rc.pointsEarned || viewingMission.pointsGranted} GP</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', padding: 12, backgroundColor: '#f8fafc', borderRadius: 6, textAlign: 'center' }}>
                  Henüz bu görevi tamamlayan vatandaş kaydı bulunmuyor.
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Mission Create & Edit Form Modal */}
      <Modal
        open={!!form}
        title={form?.id ? 'Görevi düzenle' : 'Yeni görev'}
        size="md"
        onClose={closeForm}
        footer={
          <>
            <Button variant="secondary" onClick={closeForm}>Vazgeç</Button>
            <Button loading={!!savingKey} onClick={() => void (document.getElementById('mission-form') as HTMLFormElement | null)?.requestSubmit()}>
              {form?.id ? 'Değişiklikleri kaydet' : 'Taslak oluştur'}
            </Button>
          </>
        }
      >
        {form && (
          <form
            id="mission-form"
            style={{ display: 'grid', gap: 16 }}
            onSubmit={async (e) => {
              e.preventDefault();
              if (Number(form.targetProgress) <= 0) {
                setError('Hedef adım sayısı 0 dan büyük olmalıdır.');
                return;
              }
              if (Number(form.pointsGranted) <= 0) {
                setError('Ödül puanı 0 dan büyük olmalıdır.');
                return;
              }
              setSavingKey('mission');
              try {
                const payload = {
                  title: form.title,
                  shortDescription: form.shortDescription,
                  fullDescription: form.fullDescription,
                  category: form.category,
                  missionType: form.missionType,
                  targetProgress: Number(form.targetProgress),
                  pointsGranted: Number(form.pointsGranted),
                  startDate: form.startDate,
                  endDate: form.endDate,
                  targetAudience: form.targetAudience,
                  howToCompleteJson: JSON.stringify(stepsInput.filter((s) => s.trim().length > 0))
                };
                if (form.id) {
                  await api.updateMission(form.id, payload);
                } else {
                  await api.createMission(payload);
                }
                setSuccess(form.id ? 'Görev güncellendi.' : 'Görev başarıyla oluşturuldu.');
                setForm(null);
                await load();
              } catch (err: any) {
                setError(err.message || 'Görev kaydedilemedi.');
              } finally {
                setSavingKey(null);
              }
            }}
          >
            {/* Section 1: Basic Info */}
            <div style={{ backgroundColor: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0', display: 'grid', gap: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Info size={16} style={{ color: '#047857' }} /> 1. Temel Görev Bilgileri
              </div>
              <Input
                required
                label="Görev Başlığı *"
                placeholder="Örn: GölBOX Kaşifi"
                value={form.title || ''}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <Input
                required
                label="Kısa Açıklama *"
                placeholder="Örn: Bu ay 2 farklı GölBOX şubesini ziyaret et."
                value={form.shortDescription || ''}
                onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
              />
              <Textarea
                label="Detaylı Görev Açıklaması"
                placeholder="Vatandaşın görev kartında ve detay ekranında göreceği açıklama metni..."
                value={form.fullDescription || ''}
                onChange={(e) => setForm({ ...form, fullDescription: e.target.value })}
              />
              <Select
                label="Görev Kategorisi"
                value={form.category || 'GölBOX'}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="Keşif">Keşif Görevi</option>
                <option value="Etkinlik">Etkinlik Görevi</option>
                <option value="Şube">Şube Ziyareti</option>
                <option value="GölBOX">GölBOX Genel</option>
                <option value="Topluluk">Topluluk Katılımı</option>
              </Select>
            </div>

            {/* Section 2: Rule & Rewards */}
            <div style={{ backgroundColor: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0', display: 'grid', gap: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Target size={16} style={{ color: '#047857' }} /> 2. Kurallar ve Ödül
              </div>
              <Select
                label="Tetikleyici türü *"
                value={form.missionType || 'ORDER_COMPLETED'}
                onChange={(e) => setForm({ ...form, missionType: e.target.value })}
              >
                <option value="ORDER_COMPLETED">Sipariş Tamamlama (Tamamlanan Sipariş)</option>
                <option value="EVENT_ATTENDED">Doğrulanmış Etkinlik Katılımı (QR Check-in)</option>
                <option value="DISTINCT_BRANCH">Farklı Şube Ziyareti (Farklı Lokasyon)</option>
                <option value="DISTINCT_CATEGORY">Farklı İçecek/Ürün Kategorisi</option>
                <option value="FIRST_ORDER">İlk Alışveriş / Hoş Geldin</option>
              </Select>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <NumberInput
                  required
                  min={1}
                  label="Hedef Adım Sayısı *"
                  helper="Örn: 2 Şube veya 3 Sipariş"
                  value={form.targetProgress}
                  onChange={(e) => setForm({ ...form, targetProgress: Number(e.target.value) })}
                />
                <NumberInput
                  required
                  min={1}
                  label="GölPuan Ödülü (GP) *"
                  helper="Tamamlandığında kazanılacak GP"
                  value={form.pointsGranted}
                  onChange={(e) => setForm({ ...form, pointsGranted: Number(e.target.value) })}
                />
              </div>
            </div>

            {/* Section 3: Timeline & Audience */}
            <div style={{ backgroundColor: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0', display: 'grid', gap: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={16} style={{ color: '#047857' }} /> 3. Zamanlama ve Hedef Kitle
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <DateInput
                  required
                  label="Başlangıç Tarihi *"
                  value={form.startDate || ''}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
                <DateInput
                  required
                  label="Bitiş Tarihi *"
                  value={form.endDate || ''}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
              <Select
                label="Hedef Kitle"
                value={form.targetAudience || 'All'}
                onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
              >
                <option value="All">Tüm Vatandaşlar</option>
                <option value="Youth">Gençler (18-25 Yaş)</option>
                <option value="Student">Öğrenciler</option>
              </Select>
            </div>

            {/* Section 4: Dynamic How-to Steps */}
            <div style={{ backgroundColor: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0', display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>4. "Nasıl Tamamlanır?" Adım Rehberi</div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setStepsInput([...stepsInput, ''])}
                >
                  <Plus size={14} /> Adım ekle
                </Button>
              </div>
              {stepsInput.map((step, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', width: 24 }}>{idx + 1}.</span>
                  <Input
                    placeholder={`Adım ${idx + 1} detayını yazın...`}
                    value={step}
                    onChange={(e) => {
                      const next = [...stepsInput];
                      next[idx] = e.target.value;
                      setStepsInput(next);
                    }}
                  />
                  {stepsInput.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      onClick={() => setStepsInput(stepsInput.filter((_, i) => i !== idx))}
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
