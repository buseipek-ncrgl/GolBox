import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Save, Trash2, Eye, Upload } from 'lucide-react';
import { api } from '../services/api';

const TYPES = [
  { id: 'Hero', label: 'Hero' },
  { id: 'Announcement', label: 'Duyuru' },
  { id: 'EventPromo', label: 'Etkinlik tanıtımı' },
  { id: 'MayorMessage', label: 'Başkan mesajı' },
  { id: 'Campaign', label: 'Kampanya' },
  { id: 'Institutional', label: 'Kurumsal' }
];

const CTA_TYPES = [
  { id: 'None', label: 'Yok / detay' },
  { id: 'InternalRoute', label: 'İç rota' },
  { id: 'Activity', label: 'Etkinlik' },
  { id: 'Cafe', label: 'Göl Kafeler' },
  { id: 'Place', label: 'Tesisler' },
  { id: 'RewardCatalog', label: 'Katalog' },
  { id: 'Map', label: 'Harita / GölBox' },
  { id: 'Profile', label: 'Profil' },
  { id: 'ExternalUrl', label: 'Dış bağlantı' }
];

const INTERNAL_ROUTES: { id: string; label: string }[] = [
  { id: 'home', label: 'Ana Sayfa' },
  { id: 'map', label: 'Harita / GölBox' },
  { id: 'qr', label: 'QR' },
  { id: 'profile', label: 'Profil' },
  { id: 'catalog', label: 'Katalog' },
  { id: 'coupons', label: 'Kuponlarım' },
  { id: 'places', label: 'Tesisler' },
  { id: 'cafes', label: 'Göl Kafeler (Tesisler)' },
  { id: 'earn', label: 'GölPuan Kazan' }
];

const emptyForm = () => ({
  id: '',
  type: 'Hero',
  title: '',
  subtitle: '',
  body: '',
  imageUrl: '',
  imageFocus: 'center',
  ctaLabel: '',
  ctaType: 'None',
  ctaTarget: '',
  priority: 10,
  startAt: new Date().toISOString().slice(0, 16),
  endAt: '',
  isPublished: false,
  audienceType: 'Everyone',
  audienceMinAge: '',
  audienceMaxAge: '',
  audienceEducationLevel: '',
  authorName: '',
  authorTitle: '',
  authorImageUrl: '',
  activityId: ''
});

const statusLabel: Record<string, { text: string; bg: string; color: string }> = {
  Draft: { text: 'Taslak', bg: '#f1f5f9', color: '#475569' },
  Published: { text: 'Yayında', bg: '#dcfce7', color: '#15803d' },
  Scheduled: { text: 'Planlandı', bg: '#e0f2fe', color: '#0369a1' },
  Expired: { text: 'Süresi doldu', bg: '#fee2e2', color: '#b91c1c' }
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.65rem',
  background: '#f8fafc',
  border: '1px solid #cbd5e1',
  borderRadius: 8
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.775rem',
  fontWeight: 700,
  color: '#475569',
  display: 'block',
  marginBottom: 4
};

function toLocalInput(value?: string) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const HomeContentPanel: React.FC<{
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}> = ({ onError, onSuccess }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm());
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [places, setPlaces] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [content, events, facility] = await Promise.all([
        api.getCityContent({ type: typeFilter || undefined, status: statusFilter || undefined, search: search || undefined }),
        api.getAdminActivities().catch(() => api.getActivities().catch(() => [])),
        api.getAdminPlaces().catch(() => ({ items: [] }))
      ]);
      setItems(content?.items || (Array.isArray(content) ? content : []));
      setActivities(events?.items || (Array.isArray(events) ? events : []));
      setPlaces(facility?.items || (Array.isArray(facility) ? facility : []));
    } catch (err: any) {
      onError(err.message || 'İçerikler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, statusFilter]);

  const payload = useMemo(() => ({
    type: form.type,
    title: form.title,
    subtitle: form.subtitle || null,
    body: form.body || null,
    imageUrl: form.imageUrl || null,
    imageFocus: form.imageFocus || null,
    ctaLabel: form.ctaLabel || null,
    ctaType: form.ctaType,
    ctaTarget: form.ctaTarget || null,
    priority: Number(form.priority) || 0,
    startAt: form.startAt ? new Date(form.startAt).toISOString() : new Date().toISOString(),
    endAt: form.endAt ? new Date(form.endAt).toISOString() : null,
    isPublished: form.isPublished,
    audienceType: form.audienceType,
    audienceMinAge: form.audienceMinAge === '' ? null : Number(form.audienceMinAge),
    audienceMaxAge: form.audienceMaxAge === '' ? null : Number(form.audienceMaxAge),
    audienceEducationLevel: form.audienceEducationLevel || null,
    authorName: form.type === 'MayorMessage' ? form.authorName || null : null,
    authorTitle: form.type === 'MayorMessage' ? form.authorTitle || null : null,
    authorImageUrl: form.type === 'MayorMessage' ? form.authorImageUrl || null : null,
    activityId: form.activityId || null
  }), [form]);

  const openNew = () => {
    setForm(emptyForm());
    setEditing(true);
  };

  const openEdit = (item: any) => {
    setForm({
      id: item.id,
      type: item.type,
      title: item.title || '',
      subtitle: item.subtitle || '',
      body: item.body || '',
      imageUrl: item.imageUrl || '',
      imageFocus: item.imageFocus || 'center',
      ctaLabel: item.ctaLabel || '',
      ctaType: item.ctaType || 'None',
      ctaTarget: item.ctaTarget || '',
      priority: item.priority ?? 10,
      startAt: toLocalInput(item.startAt),
      endAt: toLocalInput(item.endAt),
      isPublished: Boolean(item.isPublished),
      audienceType: item.audienceType || 'Everyone',
      audienceMinAge: item.audienceMinAge ?? '',
      audienceMaxAge: item.audienceMaxAge ?? '',
      audienceEducationLevel: item.audienceEducationLevel || '',
      authorName: item.authorName || '',
      authorTitle: item.authorTitle || '',
      authorImageUrl: item.authorImageUrl || '',
      activityId: item.activityId || ''
    });
    setEditing(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (form.id) await api.updateCityContent(form.id, payload);
      else {
        const created = await api.createCityContent(payload);
        if (created?.id) setForm((current) => ({ ...current, id: created.id }));
      }
      onSuccess('İçerik kaydedildi.');
      setEditing(false);
      await load();
    } catch (err: any) {
      onError(err.message || 'İçerik kaydedilemedi.');
    }
  };

  const setPublished = async (item: any, published: boolean) => {
    try {
      await (published ? api.publishCityContent(item.id) : api.unpublishCityContent(item.id));
      onSuccess(published ? 'Yayına alındı.' : 'Taslağa alındı.');
      await load();
    } catch (err: any) {
      onError(err.message || 'Durum güncellenemedi.');
    }
  };

  const remove = async (item: any) => {
    if (!window.confirm('Bu içerik arşivlensin mi?')) return;
    try {
      await api.deleteCityContent(item.id);
      onSuccess('İçerik arşivlendi.');
      await load();
    } catch (err: any) {
      onError(err.message || 'Silinemedi.');
    }
  };

  const upload = async (file: File, field: 'imageUrl' | 'authorImageUrl') => {
    setUploading(true);
    try {
      const url = await api.uploadFile(file);
      setForm((current) => ({ ...current, [field]: url }));
    } catch (err: any) {
      onError(err.message || 'Görsel yüklenemedi.');
    } finally {
      setUploading(false);
    }
  };

  const previewTitle = form.type === 'MayorMessage' ? (form.authorName || form.title) : form.title;
  const previewCategory = TYPES.find((t) => t.id === form.type)?.label || form.type;

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Ana Sayfa İçerikleri</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>Vatandaş uygulamasındaki hero, gündem ve başkan mesajı kayıtları.</p>
        </div>
        <button onClick={openNew} style={{ background: '#1d5f60', color: '#fff', border: 'none', padding: '0.7rem 1.35rem', borderRadius: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={18} /> Yeni içerik
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={inputStyle}>
          <option value="">Tüm tipler</option>
          {TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={inputStyle}>
          <option value="">Tüm durumlar</option>
          <option value="Draft">Taslak</option>
          <option value="Published">Yayında</option>
          <option value="Scheduled">Planlandı</option>
          <option value="Expired">Süresi doldu</option>
        </select>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Başlık ara" style={{ ...inputStyle, minWidth: 180 }} />
        <button onClick={() => void load()} style={{ background: '#1d5f60', color: '#fff', border: 'none', borderRadius: 8, padding: '0 16px', fontWeight: 700, cursor: 'pointer' }}>Filtrele</button>
      </div>

      {loading ? <p style={{ color: '#64748b' }}>Yükleniyor…</p> : items.length === 0 ? (
        <div style={{ background: '#fff', border: '1px dashed #d7e3e0', borderRadius: 20, padding: '2rem', color: '#5b6f6e' }}>Kayıt yok.</div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
          {items.map((item) => {
            const chip = statusLabel[item.status] || statusLabel.Draft;
            return (
              <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, padding: '0.95rem 1.25rem', borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.type}</div>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{item.subtitle}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <span style={{ background: chip.bg, color: chip.color, padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 800 }}>{chip.text}</span>
                  <button onClick={() => openEdit(item)} style={{ border: 'none', background: '#f1f5f9', borderRadius: 8, padding: '8px 10px', cursor: 'pointer' }}><Eye size={16} /></button>
                  <button onClick={() => void setPublished(item, !item.isPublished)} style={{ border: 'none', background: item.isPublished ? '#fee2e2' : '#dcfce7', color: item.isPublished ? '#b91c1c' : '#15803d', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>{item.isPublished ? 'Kaldır' : 'Yayınla'}</button>
                  <button onClick={() => void remove(item)} style={{ border: 'none', background: '#fff1f2', color: '#be123c', borderRadius: 8, padding: '8px 10px', cursor: 'pointer' }}><Trash2 size={16} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <form onSubmit={save} style={{ width: 920, maxHeight: '92vh', overflowY: 'auto', background: '#fff', borderRadius: 20, padding: 24, display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>İçerik {form.id ? 'düzenle' : 'oluştur'}</h3>
              <label style={labelStyle}>İçerik tipi
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={inputStyle}>
                  {TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </label>
              <label style={labelStyle}>Başlık
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} />
              </label>
              <label style={labelStyle}>Kısa açıklama
                <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} style={inputStyle} />
              </label>
              <label style={labelStyle}>Detay
                <textarea rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} style={inputStyle} />
              </label>
              <label style={labelStyle}>Görsel
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} style={inputStyle} />
                  <label style={{ ...inputStyle, width: 'auto', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Upload size={16} /> {uploading ? '…' : 'Yükle'}
                    <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && void upload(e.target.files[0], 'imageUrl')} />
                  </label>
                </div>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <label style={labelStyle}>CTA metni
                  <input value={form.ctaLabel} onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })} style={inputStyle} />
                </label>
                <label style={labelStyle}>CTA tipi
                  <select value={form.ctaType} onChange={(e) => setForm({ ...form, ctaType: e.target.value })} style={inputStyle}>
                    {CTA_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </label>
              </div>
              {form.ctaType === 'InternalRoute' ? (
                <label style={labelStyle}>İç rota
                  <select value={form.ctaTarget} onChange={(e) => setForm({ ...form, ctaTarget: e.target.value })} style={inputStyle}>
                    <option value="">Seçin</option>
                    {INTERNAL_ROUTES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                </label>
              ) : form.ctaType === 'Activity' || form.type === 'EventPromo' ? (
                <label style={labelStyle}>Etkinlik
                  <select value={form.activityId || form.ctaTarget} onChange={(e) => setForm({ ...form, activityId: e.target.value, ctaType: 'Activity', ctaTarget: e.target.value })} style={inputStyle}>
                    <option value="">Seçin</option>
                    {activities.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
                  </select>
                </label>
              ) : form.ctaType === 'Place' ? (
                <label style={labelStyle}>Tesisler
                  <select value={form.ctaTarget} onChange={(e) => setForm({ ...form, ctaType: 'Place', ctaTarget: e.target.value })} style={inputStyle}>
                    <option value="">Seçin</option>
                    {places.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </label>
              ) : form.ctaType !== 'None' && form.ctaType !== 'Map' && form.ctaType !== 'Profile' && form.ctaType !== 'RewardCatalog' ? (
                <label style={labelStyle}>CTA hedefi
                  <input value={form.ctaTarget} onChange={(e) => setForm({ ...form, ctaTarget: e.target.value })} style={inputStyle} />
                </label>
              ) : null}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <label style={labelStyle}>Öncelik
                  <input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} style={inputStyle} />
                </label>
                <label style={labelStyle}>Başlangıç
                  <input type="datetime-local" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} style={inputStyle} />
                </label>
                <label style={labelStyle}>Bitiş
                  <input type="datetime-local" value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} style={inputStyle} />
                </label>
              </div>
              <label style={labelStyle}>Hedef kitle
                <select value={form.audienceType} onChange={(e) => setForm({ ...form, audienceType: e.target.value })} style={inputStyle}>
                  <option value="Everyone">Herkes</option>
                  <option value="LoggedIn">Giriş yapanlar</option>
                  <option value="AgeRange">Yaş aralığı</option>
                  <option value="EducationLevel">Eğitim seviyesi</option>
                </select>
              </label>
              {form.audienceType === 'AgeRange' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input type="number" placeholder="Min yaş" value={form.audienceMinAge} onChange={(e) => setForm({ ...form, audienceMinAge: e.target.value })} style={inputStyle} />
                  <input type="number" placeholder="Max yaş" value={form.audienceMaxAge} onChange={(e) => setForm({ ...form, audienceMaxAge: e.target.value })} style={inputStyle} />
                </div>
              )}
              {form.audienceType === 'EducationLevel' && (
                <select value={form.audienceEducationLevel} onChange={(e) => setForm({ ...form, audienceEducationLevel: e.target.value })} style={inputStyle}>
                  <option value="">Seçin</option>
                  <option value="Lise">Lise</option>
                  <option value="Üniversite">Üniversite</option>
                </select>
              )}
              {form.type === 'MayorMessage' && (
                <>
                  <label style={labelStyle}>Yazar adı
                    <input value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} style={inputStyle} />
                  </label>
                  <label style={labelStyle}>Unvan
                    <input value={form.authorTitle} onChange={(e) => setForm({ ...form, authorTitle: e.target.value })} style={inputStyle} />
                  </label>
                </>
              )}
              <label style={{ ...labelStyle, display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} /> Yayınla
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setEditing(false)} style={{ flex: 1, padding: 10, borderRadius: 10, border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700, cursor: 'pointer' }}>İptal</button>
                <button type="submit" style={{ flex: 1, padding: 10, borderRadius: 10, border: 'none', background: '#1d5f60', color: '#fff', fontWeight: 800, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}><Save size={16} /> Kaydet</button>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>Telefon önizleme</div>
              <div style={{ width: 280, height: 180, borderRadius: 22, overflow: 'hidden', position: 'relative', background: '#14332e', color: '#fff', boxShadow: '0 8px 24px rgba(20,40,35,0.18)' }}>
                {form.imageUrl ? <img src={form.imageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: form.imageFocus || 'center' }} /> : null}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.8), rgba(0,0,0,.2))' }} />
                <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '18px 16px' }}>
                  <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', opacity: 0.8 }}>{previewCategory}</div>
                  <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 22, lineHeight: 1.15 }}>{previewTitle || 'Başlık'}</div>
                  <div style={{ fontSize: 13, opacity: 0.85 }}>{form.subtitle || form.ctaLabel}</div>
                  {form.ctaLabel ? <div style={{ fontWeight: 700, marginTop: 6 }}>{form.ctaLabel} →</div> : null}
                </div>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
