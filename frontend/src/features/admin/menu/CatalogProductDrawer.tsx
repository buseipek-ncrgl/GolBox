import { useEffect, useState } from 'react';
import { Plus, Sparkles, Trash2 } from 'lucide-react';
import { Button, Checkbox, Drawer, Input, NumberInput, Select, Textarea } from '../../../admin/components';

type Master = { id: string; name: string; isActive?: boolean };
type OptionGroup = { name: string; selectionType: 'SINGLE' | 'MULTI'; required: boolean; minSelections: number; maxSelections: number; displayOrder: number; options: { name: string; priceModifier: number; displayOrder: number }[] };
export type CatalogProduct = { id?: string; cafeId: string; categoryId?: string; name: string; description: string; price: number; imageUrl: string; isActive: boolean; displayOrder: number; publishedAt?: string; ingredientIds: string[]; allergenIds: string[]; optionGroups: OptionGroup[]; branchAvailabilities: { cafeId: string; isAvailable: boolean }[] };

const blankGroup = (): OptionGroup => ({ name: '', selectionType: 'SINGLE', required: false, minSelections: 0, maxSelections: 1, displayOrder: 0, options: [{ name: '', priceModifier: 0, displayOrder: 0 }] });

const PRESET_TEMPLATES: { label: string; group: OptionGroup }[] = [
  {
    label: 'Kahve Boyutu Şablonu',
    group: {
      name: 'Boyut Seçimi',
      selectionType: 'SINGLE',
      required: true,
      minSelections: 1,
      maxSelections: 1,
      displayOrder: 1,
      options: [
        { name: 'Küçük (250 ml)', priceModifier: 0, displayOrder: 1 },
        { name: 'Orta (350 ml)', priceModifier: 10, displayOrder: 2 },
        { name: 'Büyük (450 ml)', priceModifier: 18, displayOrder: 3 },
      ],
    },
  },
  {
    label: 'Süt Tercihi Şablonu',
    group: {
      name: 'Süt Tercihi',
      selectionType: 'SINGLE',
      required: false,
      minSelections: 0,
      maxSelections: 1,
      displayOrder: 2,
      options: [
        { name: 'Tam Yağlı Süt', priceModifier: 0, displayOrder: 1 },
        { name: 'Yarım Yağlı Süt', priceModifier: 0, displayOrder: 2 },
        { name: 'Laktozsuz Süt', priceModifier: 5, displayOrder: 3 },
        { name: 'Yulaf Sütü', priceModifier: 10, displayOrder: 4 },
        { name: 'Badem Sütü', priceModifier: 12, displayOrder: 5 },
      ],
    },
  },
  {
    label: 'Aromalar & Shot Şablonu',
    group: {
      name: 'Ekstra Aromalar & Shot',
      selectionType: 'MULTI',
      required: false,
      minSelections: 0,
      maxSelections: 3,
      displayOrder: 3,
      options: [
        { name: 'Vanilya Şurubu', priceModifier: 8, displayOrder: 1 },
        { name: 'Karamel Şurubu', priceModifier: 8, displayOrder: 2 },
        { name: 'Fındık Şurubu', priceModifier: 8, displayOrder: 3 },
        { name: 'Ekstra Espresso Shot', priceModifier: 12, displayOrder: 4 },
      ],
    },
  },
  {
    label: 'Buz Miktarı Şablonu',
    group: {
      name: 'Buz Miktarı',
      selectionType: 'SINGLE',
      required: false,
      minSelections: 0,
      maxSelections: 1,
      displayOrder: 4,
      options: [
        { name: 'Standart Buzlu', priceModifier: 0, displayOrder: 1 },
        { name: 'Az Buzlu', priceModifier: 0, displayOrder: 2 },
        { name: 'Buzsuz', priceModifier: 0, displayOrder: 3 },
      ],
    },
  },
];

export function CatalogProductDrawer({ open, data, cafes, categories, ingredients, allergens, loading, onClose, onSave }: { open: boolean; data: Partial<CatalogProduct> | null; cafes: Master[]; categories: Master[]; ingredients: Master[]; allergens: Master[]; loading: boolean; onClose: () => void; onSave: (value: CatalogProduct) => Promise<void> }) {
  const [tab, setTab] = useState<'basic' | 'content' | 'options' | 'branches' | 'publish'>('basic');
  const [form, setForm] = useState<CatalogProduct>({ cafeId: '', name: '', description: '', price: 0, imageUrl: '', isActive: false, displayOrder: 0, ingredientIds: [], allergenIds: [], optionGroups: [], branchAvailabilities: [] });

  useEffect(() => {
    if (!data) return;
    setTab('basic');
    setForm({ id: data.id, cafeId: data.cafeId || cafes[0]?.id || '', categoryId: data.categoryId || '', name: data.name || '', description: data.description || '', price: Number(data.price || 0), imageUrl: data.imageUrl || '', isActive: data.isActive === true, displayOrder: Number(data.displayOrder || 0), publishedAt: data.publishedAt, ingredientIds: data.ingredientIds || [], allergenIds: data.allergenIds || [], optionGroups: data.optionGroups || [], branchAvailabilities: cafes.map((c) => ({ cafeId: c.id, isAvailable: data.branchAvailabilities?.find((b) => b.cafeId === c.id)?.isAvailable === true })) });
  }, [data, cafes]);
  if (!open) return null;

  const addPresetGroup = (preset: OptionGroup) => {
    setForm((f) => ({
      ...f,
      optionGroups: [...f.optionGroups, structuredClone(preset)],
    }));
  };

  const toggle = (key: 'ingredientIds' | 'allergenIds', id: string) => setForm((f) => ({ ...f, [key]: f[key].includes(id) ? f[key].filter((x) => x !== id) : [...f[key], id] }));
  const nav = [['basic', 'Ürün bilgileri'], ['content', 'İçerik ve alerjen'], ['options', 'Özelleştirme'], ['branches', 'Şubeler'], ['publish', 'Yayın']] as const;

  return <Drawer wide open={open} onClose={onClose} title={form.id ? form.name || 'Ürün düzenle' : 'Yeni ürün'}>
    <form className="catalog-editor" onSubmit={(e) => { e.preventDefault(); void onSave(form); }}>
      <nav className="catalog-editor-nav" aria-label="Ürün düzenleme bölümleri">{nav.map(([id, label]) => <button key={id} type="button" className={`catalog-editor-tab${tab === id ? ' is-active' : ''}`} onClick={() => setTab(id)}>{label}</button>)}</nav>
      <div className="catalog-editor-body"><div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
        {tab === 'basic' && <section className="catalog-section"><header className="catalog-section-head"><h3>Ürün bilgileri</h3><p>Merkezi katalogdaki kalıcı ürün tanımı.</p></header><Input required label="Ürün adı" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><Textarea required rows={4} label="Açıklama" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /><div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 12 }}><Select required label="Kategori" value={form.categoryId || ''} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}><option value="">Kategori seçin</option>{categories.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select><NumberInput required min={0.01} step="0.01" label="Taban fiyat (₺)" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div><Input label="Görsel URL" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />{form.imageUrl && <img src={form.imageUrl} alt="Ürün önizlemesi" style={{ width: 180, height: 110, objectFit: 'cover', borderRadius: 12 }} />}</section>}
        {tab === 'content' && <section className="catalog-section"><header className="catalog-section-head"><h3>İçerik ve alerjenler</h3><p>Buradaki veriler müşteri ürün detayına doğrudan yansır.</p></header><fieldset className="admin-fieldset"><legend className="admin-label">İçindekiler</legend>{ingredients.length ? <div className="catalog-choice-grid">{ingredients.filter((x) => x.isActive !== false).map((x) => <div className="catalog-choice" key={x.id}><Checkbox label={x.name} checked={form.ingredientIds.includes(x.id)} onChange={() => toggle('ingredientIds', x.id)} /></div>)}</div> : <p className="admin-helper">Henüz içerik tanımı yok. Çekmeceyi kapatıp Katalog tanımları bölümünden içerik ekleyin.</p>}</fieldset><fieldset className="admin-fieldset"><legend className="admin-label">Alerjenler</legend>{allergens.length ? <div className="catalog-choice-grid">{allergens.filter((x) => x.isActive !== false).map((x) => <div className="catalog-choice" key={x.id}><Checkbox label={x.name} checked={form.allergenIds.includes(x.id)} onChange={() => toggle('allergenIds', x.id)} /></div>)}</div> : <p className="admin-helper">Henüz alerjen tanımı yok. Katalog tanımları bölümünden alerjen ekleyin.</p>}</fieldset></section>}
        {tab === 'options' && (
          <section className="catalog-section">
            <header className="catalog-section-head">
              <h3>Özelleştirme Seçenekleri</h3>
              <p>Seçenek fiyatları sipariş sırasında backend tarafından doğrulanır.</p>
            </header>

            {/* Quick Preset Templates Bar */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, display: 'grid', gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} color="#047857" /> Hızlı Şablon Ekle (Preset Grupları)
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {PRESET_TEMPLATES.map((tmpl, idx) => (
                  <Button
                    key={idx}
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => addPresetGroup(tmpl.group)}
                  >
                    + {tmpl.label}
                  </Button>
                ))}
              </div>
            </div>

            {form.optionGroups.map((group, gi) => (
              <div className="catalog-option-card" key={gi}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px auto', gap: 8, alignItems: 'end' }}>
                  <Input required label="Grup adı" value={group.name} onChange={(e) => { const n = structuredClone(form.optionGroups); n[gi].name = e.target.value; setForm({ ...form, optionGroups: n }); }} />
                  <Select label="Seçim tipi" value={group.selectionType} onChange={(e) => { const n = structuredClone(form.optionGroups); n[gi].selectionType = e.target.value as 'SINGLE' | 'MULTI'; n[gi].maxSelections = e.target.value === 'SINGLE' ? 1 : Math.max(1, n[gi].maxSelections); setForm({ ...form, optionGroups: n }); }}>
                    <option value="SINGLE">Tek seçim</option>
                    <option value="MULTI">Çoklu seçim</option>
                  </Select>
                  <Button type="button" variant="ghost" aria-label="Grubu kaldır" onClick={() => setForm({ ...form, optionGroups: form.optionGroups.filter((_, i) => i !== gi) })}><Trash2 size={16} /></Button>
                </div>
                <Checkbox label="Seçim zorunlu" checked={group.required} onChange={(e) => { const n = structuredClone(form.optionGroups); n[gi].required = e.target.checked; n[gi].minSelections = e.target.checked ? 1 : 0; setForm({ ...form, optionGroups: n }); }} />
                {group.options.map((o, oi) => (
                  <div key={oi} style={{ display: 'grid', gridTemplateColumns: '1fr 140px auto', gap: 8, alignItems: 'end' }}>
                    <Input required label={oi === 0 ? 'Seçenek' : undefined} value={o.name} onChange={(e) => { const n = structuredClone(form.optionGroups); n[gi].options[oi].name = e.target.value; setForm({ ...form, optionGroups: n }); }} />
                    <NumberInput step="0.01" label={oi === 0 ? 'Fiyat farkı (₺)' : undefined} value={o.priceModifier} onChange={(e) => { const n = structuredClone(form.optionGroups); n[gi].options[oi].priceModifier = Number(e.target.value); setForm({ ...form, optionGroups: n }); }} />
                    <Button type="button" variant="ghost" aria-label="Seçeneği kaldır" onClick={() => { const n = structuredClone(form.optionGroups); n[gi].options.splice(oi, 1); setForm({ ...form, optionGroups: n }); }}><Trash2 size={15} /></Button>
                  </div>
                ))}
                <Button type="button" size="sm" variant="secondary" onClick={() => { const n = structuredClone(form.optionGroups); n[gi].options.push({ name: '', priceModifier: 0, displayOrder: n[gi].options.length }); setForm({ ...form, optionGroups: n }); }}><Plus size={15} /> Seçenek ekle</Button>
              </div>
            ))}
            <Button type="button" variant="secondary" onClick={() => setForm({ ...form, optionGroups: [...form.optionGroups, blankGroup()] })}><Plus size={16} /> Özel Boş Grup Ekle</Button>
          </section>
        )}
        {tab === 'branches' && <section className="catalog-section"><header className="catalog-section-head"><h3>Şube kullanılabilirliği</h3><p>Ürünün mobil uygulamada hangi şubelerde satılacağını seçin.</p></header>{cafes.length ? cafes.map((c) => { const value = form.branchAvailabilities.find((x) => x.cafeId === c.id)?.isAvailable === true; return <div className="catalog-choice" key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><strong>{c.name}</strong><Checkbox label={value ? 'Kullanılabilir' : 'Sunulmuyor'} checked={value} onChange={(e) => setForm({ ...form, branchAvailabilities: form.branchAvailabilities.map((x) => x.cafeId === c.id ? { ...x, isAvailable: e.target.checked } : x) })} /></div>; }) : <div className="admin-empty"><strong>Aktif şube bulunamadı</strong><p>Şube verileri API’den alınamadı veya sistemde aktif şube yok.</p></div>}</section>}
        {tab === 'publish' && <section className="catalog-section"><header className="catalog-section-head"><h3>Yayın durumu</h3><p>Taslak ürünler müşteri menüsünde görünmez.</p></header><div className="catalog-choice"><Checkbox label="Müşteri kataloğunda yayınla" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /></div><NumberInput min={0} label="Gösterim sırası" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} /></section>}
      </div><footer style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 16, marginTop: 16, borderTop: '1px solid var(--border-light)' }}><Button type="button" variant="secondary" onClick={onClose}>Vazgeç</Button><Button type="submit" loading={loading}>{form.id ? 'Değişiklikleri kaydet' : form.isActive ? 'Ürünü yayınla' : 'Taslak oluştur'}</Button></footer></div>
    </form>
  </Drawer>;
}
