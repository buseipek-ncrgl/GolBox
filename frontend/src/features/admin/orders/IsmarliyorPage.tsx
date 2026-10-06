import React, { useState } from 'react';
import { Gift, Coffee, Plus, CheckCircle2, Users, Edit, Trash2, Calendar, ArrowRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Button, Checkbox, EmptyState, Input, Modal, NumberInput } from '../../../admin/components';
import { useAdminFeedback } from '../AdminFeedback';

interface IsmarliyorAdminCampaign {
  id: string;
  sponsorName: string;
  sponsorTitle: string;
  itemName: string;
  quota: number;
  claimed: number;
  targetAudience: string;
  endDate: string; // ISO Date YYYY-MM-DD
  isActive: boolean;
}

const DEFAULT_CAMPAIGNS: IsmarliyorAdminCampaign[] = [
  {
    id: 'ism-1',
    sponsorName: 'Umut Yılmaz',
    sponsorTitle: 'Hayırsever Vatandaş',
    itemName: 'Soğuk Kahve İkramı',
    quota: 500,
    claimed: 142,
    targetAudience: 'Üniversite Öğrencileri (18–25 Yaş)',
    endDate: '2026-10-15',
    isActive: true,
  },
  {
    id: 'ism-2',
    sponsorName: 'Şehitkamil Belediyesi',
    sponsorTitle: 'Kurumsal İkram',
    itemName: 'GölBOX Filtre Kahve',
    quota: 1000,
    claimed: 850,
    targetAudience: 'Tüm Vatandaşlar',
    endDate: '2026-10-20',
    isActive: true,
  }
];

function getDaysRemainingText(endDateStr?: string): string {
  if (!endDateStr) return 'Süresiz';
  const end = new Date(endDateStr).getTime();
  if (isNaN(end)) return endDateStr;
  const now = new Date().getTime();
  const diffDays = Math.ceil((end - now) / (1000 * 3600 * 24));
  if (diffDays < 0) return 'Süresi Doldu';
  if (diffDays === 0) return 'Bugün Son Gün';
  return `Son ${diffDays} Gün`;
}

export function IsmarliyorPage() {
  const { setSuccess, setError } = useAdminFeedback();
  const [campaigns, setCampaigns] = useState<IsmarliyorAdminCampaign[]>(() => {
    const saved = localStorage.getItem('gol_ismarliyor_campaigns');
    return saved ? JSON.parse(saved) : DEFAULT_CAMPAIGNS;
  });
  const [editing, setEditing] = useState<IsmarliyorAdminCampaign | null>(null);

  const saveCampaignsToStorage = (list: IsmarliyorAdminCampaign[]) => {
    setCampaigns(list);
    localStorage.setItem('gol_ismarliyor_campaigns', JSON.stringify(list));
  };

  const openNew = () => {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 7);
    const dateStr = nextDate.toISOString().split('T')[0];

    setEditing({
      id: `ism-${Date.now()}`,
      sponsorName: '',
      sponsorTitle: 'Hayırsever Vatandaş',
      itemName: '',
      quota: 100,
      claimed: 0,
      targetAudience: 'Tüm Vatandaşlar',
      endDate: dateStr,
      isActive: true,
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!editing.sponsorName || !editing.itemName) {
      setError('Lütfen sponsor adı ve ikram ürün adını doldurun.');
      return;
    }
    const exists = campaigns.some((c) => c.id === editing.id);
    const updated = exists
      ? campaigns.map((c) => (c.id === editing.id ? editing : c))
      : [editing, ...campaigns];
    saveCampaignsToStorage(updated);
    setSuccess(exists ? 'İkram kampanyası güncellendi.' : 'Yeni ikram kampanyası oluşturuldu.');
    setEditing(null);
  };

  const toggleActive = (id: string) => {
    const updated = campaigns.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c));
    saveCampaignsToStorage(updated);
    setSuccess('Kampanya yayın durumu değiştirildi.');
  };

  const removeCampaign = (id: string) => {
    const updated = campaigns.filter((c) => c.id !== id);
    saveCampaignsToStorage(updated);
    setSuccess('İkram kampanyası silindi.');
  };

  const totalQuota = campaigns.reduce((sum, c) => sum + c.quota, 0);
  const totalClaimed = campaigns.reduce((sum, c) => sum + c.claimed, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Action Bar & Direct Link */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Button onClick={openNew}>
            <Plus size={16} /> Yeni Ismarlıyor Kampanyası
          </Button>
        </div>
        <NavLink
          to="/admin/siparisler"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 700,
            color: '#047857',
            textDecoration: 'none',
            padding: '6px 12px',
            borderRadius: 8,
            background: '#ecfdf5',
            border: '1px solid #a7f3d0'
          }}
        >
          Sipariş Operasyonuna Git <ArrowRight size={14} />
        </NavLink>
      </div>

      <div className="catalog-summary">
        <div className="catalog-summary-item">
          <Gift size={18} />
          <span>Toplam Kampanya</span>
          <strong>{campaigns.length}</strong>
        </div>
        <div className="catalog-summary-item">
          <CheckCircle2 size={18} />
          <span>Yayında (Aktif)</span>
          <strong>{campaigns.filter((c) => c.isActive).length}</strong>
        </div>
        <div className="catalog-summary-item">
          <Users size={18} />
          <span>Toplam İkram Stok</span>
          <strong>{totalQuota} Adet</strong>
        </div>
        <div className="catalog-summary-item">
          <Coffee size={18} />
          <span>Dağıtılan İkram</span>
          <strong>{totalClaimed} Adet</strong>
        </div>
      </div>

      {/* Campaign List Cards */}
      {campaigns.length === 0 ? (
        <EmptyState
          title="Henüz aktif Ismarlıyor kampanyası yok."
          description="Sponsorlu veya kurumsal bir kahve ikram kampanyası oluşturarak vatandaşlara dağıtın."
          actionLabel="+ Yeni Ismarlıyor Kampanyası"
          onAction={openNew}
        />
      ) : (
        <div className="branch-collection branch-collection-cards">
          {campaigns.map((c) => {
            const countdownText = getDaysRemainingText(c.endDate);
            return (
              <div key={c.id} className="admin-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#047857', letterSpacing: '0.04em' }}>
                      {c.sponsorName} ({c.sponsorTitle})
                    </div>
                    <strong style={{ fontSize: 16, color: '#0f172a', display: 'block', marginTop: 2 }}>{c.itemName}</strong>
                  </div>
                  <span className={`admin-badge ${c.isActive ? 'admin-badge-success' : 'admin-badge-neutral'}`}>
                    {c.isActive ? 'Yayında' : 'Pasif'}
                  </span>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, display: 'grid', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600 }}>
                    <span style={{ color: '#475569' }}>İkram Stok / Kontenjan:</span>
                    <strong style={{ color: '#0f172a' }}>{c.claimed} / {c.quota} Adet Kullanıldı</strong>
                  </div>
                  <div style={{ height: 7, width: '100%', background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(100, (c.claimed / Math.max(1, c.quota)) * 100)}%`,
                        background: '#047857',
                        borderRadius: 4,
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#64748b', marginTop: 4 }}>
                    <span>Hedef Kitle: {c.targetAudience}</span>
                    <span style={{ fontWeight: 700, color: '#047857', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={12} /> {countdownText}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 2 }}>
                  <Button size="sm" variant="secondary" onClick={() => toggleActive(c.id)}>
                    {c.isActive ? 'Pasife Al' : 'Yayına Al'}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setEditing({ ...c })}>
                    <Edit size={14} /> Düzenle
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => removeCampaign(c.id)}>
                    <Trash2 size={14} color="#ef4444" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / Create Campaign Modal */}
      <Modal open={!!editing} title={editing?.id && campaigns.some((x) => x.id === editing.id) ? 'Ismarlıyor Kampanyasını Düzenle' : 'Yeni Ismarlıyor Kampanyası'} onClose={() => setEditing(null)}>
        {editing && (
          <form style={{ display: 'grid', gap: 14 }} onSubmit={handleSave}>
            <Input
              required
              label="Sponsor / Hayırsever Adı *"
              placeholder="Örn: Umut Yılmaz veya Şehitkamil Belediyesi"
              value={editing.sponsorName}
              onChange={(e) => setEditing({ ...editing, sponsorName: e.target.value })}
            />
            <Input
              label="Sponsor Unvanı"
              placeholder="Örn: Hayırsever Vatandaş veya Kurumsal İkram"
              value={editing.sponsorTitle}
              onChange={(e) => setEditing({ ...editing, sponsorTitle: e.target.value })}
            />
            <Input
              required
              label="İkram Edilecek Kahve / Ürün Adı *"
              placeholder="Örn: 500 Üniversite Öğrencisine Soğuk Kahve"
              value={editing.itemName}
              onChange={(e) => setEditing({ ...editing, itemName: e.target.value })}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <NumberInput
                min={1}
                label="Toplam Stok / Kontenjan Adedi *"
                value={editing.quota}
                onChange={(e) => setEditing({ ...editing, quota: Number(e.target.value) })}
              />
              <NumberInput
                min={0}
                label="Dağıtılan Adet"
                value={editing.claimed}
                onChange={(e) => setEditing({ ...editing, claimed: Number(e.target.value) })}
              />
            </div>
            <Input
              label="Hedef Kitle & Katılım Şartları"
              placeholder="Örn: Üniversite öğrencisi olmak (18-25 yaş)"
              value={editing.targetAudience}
              onChange={(e) => setEditing({ ...editing, targetAudience: e.target.value })}
            />
            <Input
              type="date"
              label="Kampanya Bitiş Tarihi *"
              helper="Bitiş tarihine kalan gün sayısı otomatik hesaplanır."
              value={editing.endDate || ''}
              onChange={(e) => setEditing({ ...editing, endDate: e.target.value })}
            />
            <Checkbox
              label="Kampanyayı Aktif Olarak Yayına Al"
              helper="Pasif kampanyalar mobil anasayfada vatandaşlara gösterilmez."
              checked={editing.isActive}
              onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>Vazgeç</Button>
              <Button type="submit">Kaydet ve Yayınla</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
