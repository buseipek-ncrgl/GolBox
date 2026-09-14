import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Save, Trash2, Upload, Search } from 'lucide-react';
import { api } from '../services/api';
import { AdminMapPicker } from '../components/admin/AdminMapPicker';

const CATEGORIES = [
  { id: 'Cafe', label: 'Göl Kafeler' },
  { id: 'ScienceCenter', label: 'Bilim Şehitkamil' },
  { id: 'Library', label: 'Kütüphaneler' },
  { id: 'YouthCenter', label: 'Gençlik' },
  { id: 'SportsFacility', label: 'Spor' },
  { id: 'CultureCenter', label: 'Kültür' },
  { id: 'Theatre', label: 'Sahne / Tiyatro' },
  { id: 'Park', label: 'Parklar' },
  { id: 'Other', label: 'Diğer' }
];

const AMENITIES = [
  { id: 'Wifi', label: 'Wi-Fi' },
  { id: 'Parking', label: 'Otopark' },
  { id: 'WheelchairAccess', label: 'Engelli erişimi' },
  { id: 'AccessibleToilet', label: 'Erişilebilir WC' },
  { id: 'KidsArea', label: 'Çocuk alanı' },
  { id: 'Library', label: 'Kütüphane' },
  { id: 'Cafe', label: 'Kafe' },
  { id: 'Wc', label: 'WC' },
  { id: 'PrayerRoom', label: 'Mescit' }
];

const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.65rem 0.85rem',
  background: '#f8fafc',
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  color: '#0f172a',
  outline: 'none'
};
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#475569', display: 'grid', gap: 6 };
const sectionTitle: React.CSSProperties = { margin: '1.25rem 0 0.6rem', fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1d5f60' };

const emptyHours = () => DAYS.map((_, dayOfWeek) => ({ dayOfWeek, openTime: '09:00', closeTime: '18:00', isClosed: false }));

const emptyForm = () => ({
  id: '',
  name: '',
  category: 'Library',
  shortDescription: '',
  description: '',
  address: '',
  district: 'Şehitkamil',
  neighborhood: '',
  latitude: 37.0662,
  longitude: 37.3781,
  phone: '',
  email: '',
  websiteUrl: '',
  coverImageUrl: '',
  isActive: true,
  isPublished: false,
  sortOrder: 0,
  wheelchairAccessible: '' as '' | 'true' | 'false',
  accessibleToilet: '' as '' | 'true' | 'false',
  amenities: [] as string[],
  openingHours: emptyHours(),
  images: [] as { id: string; imageUrl: string; isCover: boolean }[]
});

export const PlacesPanel: React.FC<{
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}> = ({ onError, onSuccess }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminPlaces({ category: category || undefined, search: search || undefined });
      setItems(data?.items || (Array.isArray(data) ? data : []));
    } catch (err: any) {
      onError(err.message || 'Tesisler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const openNew = () => {
    setForm(emptyForm());
    setEditing(true);
  };

  const openEdit = async (id: string) => {
    try {
      const item = await api.getAdminPlace(id);
      setForm({
        id: item.id,
        name: item.name || '',
        category: item.category || 'Other',
        shortDescription: item.shortDescription || '',
        description: item.description || '',
        address: item.address || '',
        district: item.district || '',
        neighborhood: item.neighborhood || '',
        latitude: item.latitude ?? 37.0662,
        longitude: item.longitude ?? 37.3781,
        phone: item.phone || '',
        email: item.email || '',
        websiteUrl: item.websiteUrl || '',
        coverImageUrl: item.coverImageUrl || '',
        isActive: item.isActive !== false,
        isPublished: Boolean(item.isPublished),
        sortOrder: item.sortOrder || 0,
        wheelchairAccessible: item.wheelchairAccessible == null ? '' : item.wheelchairAccessible ? 'true' : 'false',
        accessibleToilet: item.accessibleToilet == null ? '' : item.accessibleToilet ? 'true' : 'false',
        amenities: item.amenities || [],
        openingHours: (item.openingHours?.length ? DAYS.map((_, day) => {
          const found = item.openingHours.find((h: any) => h.dayOfWeek === day);
          return found || { dayOfWeek: day, openTime: '09:00', closeTime: '18:00', isClosed: true };
        }) : emptyHours()),
        images: item.images || []
      });
      setEditing(true);
    } catch (err: any) {
      onError(err.message || 'Tesis yüklenemedi.');
    }
  };

  const payload = () => ({
    name: form.name,
    category: form.category,
    shortDescription: form.shortDescription || null,
    description: form.description || null,
    address: form.address || null,
    district: form.district || null,
    neighborhood: form.neighborhood || null,
    latitude: form.latitude,
    longitude: form.longitude,
    phone: form.phone || null,
    email: form.email || null,
    websiteUrl: form.websiteUrl || null,
    coverImageUrl: form.coverImageUrl || null,
    isActive: form.isActive,
    isPublished: form.isPublished,
    sortOrder: Number(form.sortOrder) || 0,
    wheelchairAccessible: form.wheelchairAccessible === '' ? null : form.wheelchairAccessible === 'true',
    accessibleToilet: form.accessibleToilet === '' ? null : form.accessibleToilet === 'true',
    amenities: form.amenities,
    openingHours: form.openingHours
  });

  const save = async () => {
    try {
      if (form.id) await api.updateAdminPlace(form.id, payload());
      else {
        const created = await api.createAdminPlace(payload());
        if (created?.id) setForm({ ...form, id: created.id });
      }
      onSuccess('Tesis kaydedildi.');
      setEditing(false);
      await load();
    } catch (err: any) {
      onError(err.message || 'Tesis kaydedilemedi.');
    }
  };

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const url = await api.uploadFile(file);
      if (form.id) {
        await api.addAdminPlaceImage(form.id, { imageUrl: url, isCover: !form.coverImageUrl });
        await openEdit(form.id);
      } else {
        setForm({ ...form, coverImageUrl: url });
      }
    } catch (err: any) {
      onError(err.message || 'Görsel yüklenemedi.');
    } finally {
      setUploading(false);
    }
  };

  const onMapChange = useCallback((latitude: number, longitude: number) => {
    setForm((current) => ({ ...current, latitude, longitude }));
  }, []);

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Tesisler</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>Belediye yerleri ve tesis yönetimi. Göl Kafe menüsü ayrı kalır.</p>
        </div>
        <button onClick={openNew} style={{ background: '#1d5f60', color: '#fff', border: 'none', padding: '0.65rem 1.25rem', borderRadius: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={18} /> Yeni tesis
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#64748b' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void load()} placeholder="Ad, mahalle, ilçe" style={{ ...inputStyle, paddingLeft: 36 }} />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...inputStyle, width: 220 }}>
          <option value="">Tüm kategoriler</option>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>

      {editing && (
        <form onSubmit={(e) => { e.preventDefault(); void save(); }} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.25rem' }}>
          <p style={sectionTitle}>Temel</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <label style={labelStyle}>Ad<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} /></label>
            <label style={labelStyle}>Kategori
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={inputStyle}>
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </label>
          </div>
          <label style={{ ...labelStyle, marginTop: 8 }}>Kısa açıklama<input value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} style={inputStyle} /></label>
          <label style={{ ...labelStyle, marginTop: 8 }}>Açıklama<textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={inputStyle} /></label>

          <p style={sectionTitle}>Konum</p>
          <label style={labelStyle}>Adres<input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} style={inputStyle} /></label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            <label style={labelStyle}>İlçe<input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} style={inputStyle} /></label>
            <label style={labelStyle}>Mahalle<input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} style={inputStyle} /></label>
          </div>
          <div style={{ marginTop: 10 }}>
            <AdminMapPicker latitude={form.latitude} longitude={form.longitude} onChange={onMapChange} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            <label style={labelStyle}>Enlem<input type="number" step="0.000001" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: Number(e.target.value) })} style={inputStyle} /></label>
            <label style={labelStyle}>Boylam<input type="number" step="0.000001" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: Number(e.target.value) })} style={inputStyle} /></label>
          </div>

          <p style={sectionTitle}>İletişim</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <label style={labelStyle}>Telefon<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inputStyle} /></label>
            <label style={labelStyle}>E-posta<input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} /></label>
            <label style={labelStyle}>Web<input value={form.websiteUrl} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} style={inputStyle} /></label>
          </div>

          <p style={sectionTitle}>Görseller</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input value={form.coverImageUrl} onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })} placeholder="Kapak URL" style={inputStyle} />
            <label style={{ ...inputStyle, width: 'auto', cursor: 'pointer' }}>
              <Upload size={16} /> {uploading ? '…' : 'Yükle'}
              <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && void upload(e.target.files[0])} />
            </label>
          </div>
          {form.images.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              {form.images.map((image) => (
                <button key={image.id} type="button" onClick={() => form.id && void api.deleteAdminPlaceImage(form.id, image.id).then(() => openEdit(form.id))} style={{ width: 72, height: 72, borderRadius: 12, overflow: 'hidden', border: image.isCover ? '2px solid #1d5f60' : '1px solid #e2e8f0', padding: 0, cursor: 'pointer' }}>
                  <img src={image.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}

          <p style={sectionTitle}>Çalışma saatleri</p>
          <div style={{ display: 'grid', gap: 6 }}>
            {form.openingHours.map((hour, index) => (
              <div key={hour.dayOfWeek} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr auto', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{DAYS[hour.dayOfWeek]}</span>
                <input type="time" value={hour.openTime || ''} disabled={hour.isClosed} onChange={(e) => {
                  const next = [...form.openingHours];
                  next[index] = { ...hour, openTime: e.target.value };
                  setForm({ ...form, openingHours: next });
                }} style={inputStyle} />
                <input type="time" value={hour.closeTime || ''} disabled={hour.isClosed} onChange={(e) => {
                  const next = [...form.openingHours];
                  next[index] = { ...hour, closeTime: e.target.value };
                  setForm({ ...form, openingHours: next });
                }} style={inputStyle} />
                <label style={{ fontSize: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input type="checkbox" checked={hour.isClosed} onChange={(e) => {
                    const next = [...form.openingHours];
                    next[index] = { ...hour, isClosed: e.target.checked };
                    setForm({ ...form, openingHours: next });
                  }} /> Kapalı
                </label>
              </div>
            ))}
          </div>

          <p style={sectionTitle}>Olanaklar</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {AMENITIES.map((amenity) => {
              const on = form.amenities.includes(amenity.id);
              return (
                <button key={amenity.id} type="button" onClick={() => setForm({
                  ...form,
                  amenities: on ? form.amenities.filter((id) => id !== amenity.id) : [...form.amenities, amenity.id]
                })} style={{ minHeight: 44, padding: '0 12px', borderRadius: 999, border: on ? 'none' : '1px solid #d7e3e0', background: on ? '#1d5f60' : '#fff', color: on ? '#fff' : '#1c2e2e', fontWeight: 700, cursor: 'pointer' }}>
                  {amenity.label}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
            <label style={labelStyle}>Tekerlekli sandalye
              <select value={form.wheelchairAccessible} onChange={(e) => setForm({ ...form, wheelchairAccessible: e.target.value as any })} style={inputStyle}>
                <option value="">Bilinmiyor</option>
                <option value="true">Evet</option>
                <option value="false">Hayır</option>
              </select>
            </label>
            <label style={labelStyle}>Erişilebilir WC
              <select value={form.accessibleToilet} onChange={(e) => setForm({ ...form, accessibleToilet: e.target.value as any })} style={inputStyle}>
                <option value="">Bilinmiyor</option>
                <option value="true">Evet</option>
                <option value="false">Hayır</option>
              </select>
            </label>
          </div>

          <p style={sectionTitle}>Yayın</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <label style={{ ...labelStyle, alignItems: 'center', display: 'flex', gap: 8 }}>
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Aktif
            </label>
            <label style={{ ...labelStyle, alignItems: 'center', display: 'flex', gap: 8 }}>
              <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} /> Yayında
            </label>
            <label style={labelStyle}>Sıra<input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} style={inputStyle} /></label>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button type="submit" style={{ background: '#1d5f60', color: '#fff', border: 'none', padding: '0.7rem 1.2rem', borderRadius: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Save size={16} /> Kaydet
            </button>
            <button type="button" onClick={() => setEditing(false)} style={{ background: '#fff', border: '1px solid #d7e3e0', padding: '0.7rem 1.2rem', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Vazgeç</button>
            {form.id ? (
              <button type="button" onClick={() => void api.deleteAdminPlace(form.id).then(() => { onSuccess('Tesis silindi.'); setEditing(false); return load(); })} style={{ marginLeft: 'auto', background: '#fff', color: '#b91c1c', border: '1px solid #fecaca', padding: '0.7rem 1.2rem', borderRadius: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Trash2 size={16} /> Sil
              </button>
            ) : null}
          </div>
        </form>
      )}

      {loading ? <p style={{ color: '#64748b' }}>Yükleniyor…</p> : items.length === 0 ? (
        <div style={{ background: '#fff', border: '1px dashed #d7e3e0', borderRadius: 20, padding: '2rem', color: '#5b6f6e' }}>Henüz tesis kaydı yok. Production’a uydurma tesis eklenmez.</div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {items.map((item) => (
            <button key={item.id} onClick={() => void openEdit(item.id)} style={{ textAlign: 'left', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1rem', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <strong style={{ color: '#0f172a' }}>{item.name}</strong>
                <span style={{ fontSize: 12, fontWeight: 700, color: item.isPublished && item.isActive ? '#1d5f60' : '#64748b' }}>
                  {item.isPublished && item.isActive ? 'Yayında' : item.isPublished ? 'Pasif' : 'Taslak'}
                </span>
              </div>
              <div style={{ marginTop: 4, fontSize: 13, color: '#64748b' }}>
                {CATEGORIES.find((c) => c.id === item.category)?.label || item.category} · {item.neighborhood || item.district || item.address || 'Konum yok'}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
