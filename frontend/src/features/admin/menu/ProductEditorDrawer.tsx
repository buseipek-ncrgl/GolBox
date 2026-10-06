import React, { useState, useEffect } from 'react';
import { Button, Input, Textarea, NumberInput, Checkbox, Select, Drawer } from '../../../admin/components';

export interface ProductEditorData {
  id?: string;
  cafeId: string;
  categoryId?: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isActive: boolean;
  displayOrder?: number;
  publishedAt?: string;
  ingredients: string[];
  allergens: string[];
  optionGroups: {
    name: string;
    selectionType: 'SINGLE' | 'MULTI';
    required: boolean;
    options: { name: string; priceModifier: number }[];
  }[];
  pairings: string[];
  branchAvailabilities: { cafeId: string; isAvailable: boolean }[];
}

const COMMON_INGREDIENTS = [
  'Espresso', 'Sıcak Su', 'Süt', 'Laktozsuz Süt', 'Yulaf Sütü',
  'Karamel Şurubu', 'Vanilya Şurubu', 'Çikolata Sosu', 'Buz', 'Krema'
];

const MASTER_ALLERGENS = [
  { id: 'milk', name: 'Süt ve Süt Ürünleri (Laktoz)' },
  { id: 'gluten', name: 'Glüten (Buğday/Arpa)' },
  { id: 'nuts', name: 'Kabuklu Yemişler (Fındık/Fıstık)' },
  { id: 'soy', name: 'Soya' },
  { id: 'egg', name: 'Yumurta' },
];

export function ProductEditorDrawer({
  open,
  data,
  cafes,
  categories = [],
  allProducts = [],
  onClose,
  onSave,
  loading = false,
}: {
  open: boolean;
  data: Partial<ProductEditorData> | null;
  cafes: { id: string; name: string }[];
  categories?: { id: string; name: string }[];
  allProducts?: { id: string; name: string }[];
  onClose: () => void;
  onSave: (form: ProductEditorData) => Promise<void>;
  loading?: boolean;
}) {
  const [tab, setTab] = useState<'basic' | 'image' | 'price' | 'ingredients' | 'allergens' | 'options' | 'pairings' | 'branches' | 'publish'>('basic');
  const [form, setForm] = useState<ProductEditorData>({
    cafeId: '',
    name: '',
    description: '',
    price: 45,
    imageUrl: '',
    isActive: true,
    ingredients: [],
    allergens: [],
    optionGroups: [
      {
        name: 'Boyut',
        selectionType: 'SINGLE',
        required: true,
        options: [
          { name: 'Küçük Boy (250 ml)', priceModifier: 0 },
          { name: 'Orta Boy (350 ml)', priceModifier: 10 },
          { name: 'Büyük Boy (450 ml)', priceModifier: 18 },
        ],
      },
      {
        name: 'Süt Tercihi',
        selectionType: 'SINGLE',
        required: false,
        options: [
          { name: 'Tam Yağlı Süt', priceModifier: 0 },
          { name: 'Laktozsuz Süt', priceModifier: 5 },
          { name: 'Yulaf Sütü', priceModifier: 10 },
        ],
      },
    ],
    pairings: [],
    branchAvailabilities: [],
  });

  useEffect(() => {
    if (data) {
      setForm({
        id: data.id,
        cafeId: data.cafeId || (cafes[0]?.id ?? ''),
        categoryId: data.categoryId || '',
        name: data.name || '',
        description: data.description || '',
        price: data.price ?? 45,
        imageUrl: data.imageUrl || '',
        isActive: data.isActive !== false,
        displayOrder: data.displayOrder ?? 0,
        publishedAt: data.publishedAt || new Date().toISOString(),
        ingredients: Array.isArray(data.ingredients) ? data.ingredients : ['Espresso', 'Süt'],
        allergens: Array.isArray(data.allergens) ? data.allergens : ['milk'],
        optionGroups: Array.isArray(data.optionGroups) && data.optionGroups.length > 0 ? data.optionGroups : [
          {
            name: 'Boyut',
            selectionType: 'SINGLE',
            required: true,
            options: [
              { name: 'Küçük Boy (250 ml)', priceModifier: 0 },
              { name: 'Orta Boy (350 ml)', priceModifier: 10 },
              { name: 'Büyük Boy (450 ml)', priceModifier: 18 },
            ],
          },
        ],
        pairings: Array.isArray(data.pairings) ? data.pairings : [],
        branchAvailabilities: cafes.map((c) => ({ cafeId: c.id, isAvailable: true })),
      });
    }
  }, [data, cafes]);

  if (!open) return null;

  const toggleIngredient = (ing: string) => {
    const exists = form.ingredients.includes(ing);
    setForm({
      ...form,
      ingredients: exists ? form.ingredients.filter((i) => i !== ing) : [...form.ingredients, ing],
    });
  };

  const toggleAllergen = (allId: string) => {
    const exists = form.allergens.includes(allId);
    setForm({
      ...form,
      allergens: exists ? form.allergens.filter((a) => a !== allId) : [...form.allergens, allId],
    });
  };

  const handleAddOptionGroup = () => {
    setForm({
      ...form,
      optionGroups: [
        ...form.optionGroups,
        { name: 'Yeni Seçenek Grubu', selectionType: 'SINGLE', required: false, options: [{ name: 'Seçenek 1', priceModifier: 0 }] },
      ],
    });
  };

  return (
    <Drawer open={open} onClose={onClose} title={form.id ? `Ürün Düzenle: ${form.name}` : 'Yeni Ürün Kataloğu Tanımla'}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 16 }}>
        {/* Editor 9-Section Navigation Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, borderBottom: '1px solid var(--admin-border)', paddingBottom: 10 }}>
          {[
            { id: 'basic', label: '1. Temel Bilgiler' },
            { id: 'image', label: '2. Görsel' },
            { id: 'price', label: '3. Fiyatlandırma' },
            { id: 'ingredients', label: '4. İçindekiler' },
            { id: 'allergens', label: '5. Alerjenler' },
            { id: 'options', label: '6. Özelleştirme' },
            { id: 'pairings', label: '7. Önerilenler' },
            { id: 'branches', label: '8. Şube Stok' },
            { id: 'publish', label: '9. Yayın Durumu' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id as any)}
              className={`admin-btn ${tab === t.id ? 'admin-btn-primary' : 'admin-btn-secondary'} admin-btn-sm`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Form Body per Section */}
        <form
          id="product-editor-form"
          style={{ flex: 1, overflowY: 'auto', display: 'grid', gap: 16, paddingRight: 4 }}
          onSubmit={async (e) => {
            e.preventDefault();
            await onSave(form);
          }}
        >
          {tab === 'basic' && (
            <div style={{ display: 'grid', gap: 12 }}>
              <Input required label="Ürün Adı" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="örn. Karamel Macchiato" />
              <Select label="Kategori" value={form.categoryId || ''} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">Kategori seçin (İsteğe bağlı)</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
              <Textarea label="Açıklama" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ürün içeriği, lezzet notları..." rows={3} />
              <Select required label="Ana Şube / Tesis" value={form.cafeId} onChange={(e) => setForm({ ...form, cafeId: e.target.value })}>
                <option value="">Göl Kafe seç</option>
                {cafes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
              <NumberInput min={0} label="Gösterim Sırası (Display Order)" value={form.displayOrder ?? 0} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} />
            </div>
          )}

          {tab === 'image' && (
            <div style={{ display: 'grid', gap: 12 }}>
              <Input label="Görsel URL" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
              {form.imageUrl ? (
                <div style={{ border: '1px solid var(--admin-border)', borderRadius: 12, overflow: 'hidden', maxWidth: 320 }}>
                  <img src={form.imageUrl} alt="Önizleme" style={{ width: '100%', height: 180, objectFit: 'cover' }} />
                  <p style={{ padding: 8, fontSize: 11, color: 'gray', textAlign: 'center' }}>Görsel Önizlemesi</p>
                </div>
              ) : (
                <p style={{ fontSize: 12, color: 'gray' }}>Görsel URL girdiğinizde önizleme burada görünecektir.</p>
              )}
            </div>
          )}

          {tab === 'price' && (
            <div style={{ display: 'grid', gap: 12 }}>
              <NumberInput required min={0} label="Taban Fiyat (TL)" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              <p style={{ fontSize: 12, color: 'var(--admin-subtext)' }}>
                * Özelleştirme seçeneklerindeki fiyat farkları (örn. +10 TL büyük boy) bu taban fiyatın üzerine backend tarafından otomatik eklenir.
              </p>
            </div>
          )}

          {tab === 'ingredients' && (
            <div style={{ display: 'grid', gap: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 'bold' }}>İçindekiler / Bileşenler</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {COMMON_INGREDIENTS.map((ing) => {
                  const selected = form.ingredients.includes(ing);
                  return (
                    <button
                      key={ing}
                      type="button"
                      onClick={() => toggleIngredient(ing)}
                      className={`admin-btn ${selected ? 'admin-btn-primary' : 'admin-btn-secondary'} admin-btn-sm`}
                    >
                      {selected ? `✓ ${ing}` : `+ ${ing}`}
                    </button>
                  );
                })}
              </div>
              <p style={{ fontSize: 11, color: 'gray' }}>Müşteri ürün detay sayfasında sergilenir.</p>
            </div>
          )}

          {tab === 'allergens' && (
            <div style={{ display: 'grid', gap: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 'bold' }}>Alerjen Bilgileri (Backend Authoritative)</label>
              <div style={{ display: 'grid', gap: 8 }}>
                {MASTER_ALLERGENS.map((all) => (
                  <Checkbox
                    key={all.id}
                    label={all.name}
                    checked={form.allergens.includes(all.id)}
                    onChange={() => toggleAllergen(all.id)}
                  />
                ))}
              </div>
              <p style={{ fontSize: 11, color: 'var(--admin-subtext)' }}>
                * İstemci tarafında isim karşılaştırmalı alerjen üretimi engellenmiştir. Burada seçilen alerjenler müşteri mobil uygulamasında rozet olarak görüntülenecektir.
              </p>
            </div>
          )}

          {tab === 'options' && (
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 'bold' }}>Özelleştirme Seçenek Grupları</span>
                <Button type="button" size="sm" variant="secondary" onClick={handleAddOptionGroup}>+ Yeni Grup Ekle</Button>
              </div>
              {form.optionGroups.map((group, groupIdx) => (
                <div key={groupIdx} style={{ border: '1px solid var(--admin-border)', borderRadius: 12, padding: 12, display: 'grid', gap: 10, background: 'var(--admin-surface)' }}>
                  <Input
                    label="Grup Adı"
                    value={group.name}
                    onChange={(e) => {
                      const next = [...form.optionGroups];
                      next[groupIdx].name = e.target.value;
                      setForm({ ...form, optionGroups: next });
                    }}
                  />
                  <div style={{ display: 'flex', gap: 12 }}>
                    <Checkbox
                      label="Zorunlu Seçim"
                      checked={group.required}
                      onChange={(e) => {
                        const next = [...form.optionGroups];
                        next[groupIdx].required = e.target.checked;
                        setForm({ ...form, optionGroups: next });
                      }}
                    />
                  </div>
                  <div style={{ display: 'grid', gap: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 'bold' }}>Seçenekler & Fiyat Farkı</label>
                    {group.options.map((opt, optIdx) => (
                      <div key={optIdx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                          type="text"
                          value={opt.name}
                          onChange={(e) => {
                            const next = [...form.optionGroups];
                            next[groupIdx].options[optIdx].name = e.target.value;
                            setForm({ ...form, optionGroups: next });
                          }}
                          placeholder="Seçenek adı"
                          style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--admin-border)' }}
                        />
                        <input
                          type="number"
                          value={opt.priceModifier}
                          onChange={(e) => {
                            const next = [...form.optionGroups];
                            next[groupIdx].options[optIdx].priceModifier = Number(e.target.value);
                            setForm({ ...form, optionGroups: next });
                          }}
                          placeholder="+TL"
                          style={{ width: 80, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--admin-border)' }}
                        />
                      </div>
                    ))}
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      style={{ marginTop: 4 }}
                      onClick={() => {
                        const next = [...form.optionGroups];
                        next[groupIdx].options.push({ name: 'Yeni Seçenek', priceModifier: 0 });
                        setForm({ ...form, optionGroups: next });
                      }}
                    >
                      + Seçenek Ekle
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'pairings' && (
            <div style={{ display: 'grid', gap: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 'bold' }}>Bunun Yanına İyi Gider (Pairings)</label>
              <p style={{ fontSize: 12, color: 'gray' }}>Müşteri bu ürünü incelerken birlikte önerilecek tamamlayıcı lezzetler.</p>
              {allProducts.length > 0 ? (
                <div style={{ display: 'grid', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                  {allProducts.filter((p) => p.id !== form.id).map((p) => {
                    const selected = form.pairings.includes(p.id);
                    return (
                      <Checkbox
                        key={p.id}
                        label={p.name}
                        checked={selected}
                        onChange={() => {
                          setForm({
                            ...form,
                            pairings: selected ? form.pairings.filter((id) => id !== p.id) : [...form.pairings, p.id],
                          });
                        }}
                      />
                    );
                  })}
                </div>
              ) : (
                <p style={{ fontSize: 12, color: 'gray' }}>Katalogda seçilebilecek diğer ürünler listelenecek.</p>
              )}
            </div>
          )}

          {tab === 'branches' && (
            <div style={{ display: 'grid', gap: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 'bold' }}>Şube Kullanılabilirliği (Branch Stock Policy)</label>
              <p style={{ fontSize: 12, color: 'gray' }}>Ürünün aktif olarak satışa açık olduğu GölBOX şubeleri.</p>
              <div style={{ display: 'grid', gap: 8 }}>
                {cafes.map((c) => {
                  const avail = form.branchAvailabilities.find((b) => b.cafeId === c.id)?.isAvailable !== false;
                  return (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', border: '1px solid var(--admin-border)', borderRadius: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: '600' }}>{c.name}</span>
                      <Checkbox
                        label={avail ? 'Satışa Açık' : 'Tükendi / Pasif'}
                        checked={avail}
                        onChange={(e) => {
                          const exists = form.branchAvailabilities.some((b) => b.cafeId === c.id);
                          const next = exists
                            ? form.branchAvailabilities.map((b) => (b.cafeId === c.id ? { ...b, isAvailable: e.target.checked } : b))
                            : [...form.branchAvailabilities, { cafeId: c.id, isAvailable: e.target.checked }];
                          setForm({ ...form, branchAvailabilities: next });
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'publish' && (
            <div style={{ display: 'grid', gap: 12 }}>
              <Checkbox label="Genel Katalogda Aktif (IsActive)" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              <p style={{ fontSize: 12, color: 'gray' }}>
                Yayın Tarihi: {form.publishedAt ? new Date(form.publishedAt).toLocaleString('tr-TR') : 'Şimdi yayınlanacak'}
              </p>
            </div>
          )}
        </form>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid var(--admin-border)' }}>
          <Button variant="secondary" onClick={onClose}>Vazgeç</Button>
          <Button form="product-editor-form" type="submit" loading={loading}>
            {form.id ? 'Ürün Değişikliklerini Kaydet' : 'Ürünü Yayınla'}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
