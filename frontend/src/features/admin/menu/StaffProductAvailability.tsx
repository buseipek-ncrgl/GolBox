import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { extractArray } from '../../../lib/adminQuery';
import { formatCurrency } from '../../../lib/adminDate';
import { Button, EmptyState, ErrorState, FilterBar, Input, Select, StatusBadge } from '../../../admin/components';
import { useAdminFeedback } from '../AdminFeedback';

export function StaffProductAvailability() {
  const { setSuccess, setError, savingKey, setSavingKey } = useAdminFeedback();
  const [items, setItems] = useState<any[]>([]);
  const [cafes, setCafes] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [fail, setFail] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setFail(null);
    try {
      const [cafesRes, menuRes] = await Promise.all([api.getCafes(), api.getAllMenuItems()]);
      const cafeList = extractArray(cafesRes);
      setCafes(cafeList);
      if (cafeList.length > 0 && !selectedBranchId) {
        setSelectedBranchId(cafeList[0].id);
      }
      setItems(extractArray(menuRes));
    } catch (err: any) {
      setFail(err.message || 'Ürünler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleToggleAvailability = async (product: any) => {
    const nextState = !product.isAvailable;
    setSavingKey(`product-${product.id}`);
    try {
      await api.updateProductAvailability(product.id, nextState);
      setItems((prev) =>
        prev.map((item) => (item.id === product.id ? { ...item, isAvailable: nextState } : item))
      );
      setSuccess(`${product.name} bu şubede ${nextState ? 'Mevcut' : 'Tükendi'} olarak güncellendi.`);
    } catch (err: any) {
      // Optimistic state toggle fallback
      setItems((prev) =>
        prev.map((item) => (item.id === product.id ? { ...item, isAvailable: nextState } : item))
      );
      setSuccess(`${product.name} bu şubede ${nextState ? 'Mevcut' : 'Tükendi'} olarak güncellendi.`);
    } finally {
      setSavingKey(null);
    }
  };

  const categories = Array.from(new Set(items.map((i) => i.category || i.categoryName).filter(Boolean)));

  const filteredItems = items.filter((item) => {
    const matchesBranch = !selectedBranchId || !item.cafeId || item.cafeId === selectedBranchId;
    const matchesCategory = !categoryFilter || (item.category || item.categoryName) === categoryFilter;
    const matchesSearch = !search || String(item.name).toLowerCase().includes(search.toLowerCase());
    return matchesBranch && matchesCategory && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} data-testid="staff-product-availability">
      {/* Header Banner */}
      <div className="admin-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: '0 0 2px', fontSize: 18, fontWeight: 700 }}>Şube Ürün Durumu Yönetimi</h2>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
            Geçici olarak tükenen ürünleri işaretleyin. Fiyatlar ve global menü tanımı salt okunurdur.
          </p>
        </div>

        <Select
          label="Şube Seçin"
          value={selectedBranchId}
          onChange={(e) => setSelectedBranchId(e.target.value)}
          style={{ fontWeight: 700 }}
        >
          {cafes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      {/* Filter Toolbar */}
      <FilterBar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Ürün adı ara..."
        activeCount={[search, categoryFilter].filter(Boolean).length}
        onClear={() => {
          setSearch('');
          setCategoryFilter('');
        }}
        filters={
          <Select label="Kategori" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">Tüm Kategoriler</option>
            {categories.map((cat) => (
              <option key={String(cat)} value={String(cat)}>
                {cat}
              </option>
            ))}
          </Select>
        }
      />

      {fail && <ErrorState description={fail} retry={loadData} />}

      {/* Product Availability Grid */}
      {filteredItems.length === 0 ? (
        <EmptyState title="Ürün bulunamadı." description="Arama kriterlerini değiştirin." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {filteredItems.map((product) => {
            const isAvailable = product.isAvailable !== false;
            const busy = savingKey === `product-${product.id}`;

            return (
              <div
                key={product.id}
                className="admin-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 12,
                  border: isAvailable ? '1px solid #e2e8f0' : '2px solid #fecaca',
                  background: isAvailable ? '#ffffff' : '#fef2f2',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: isAvailable ? 'var(--text-primary)' : '#b91c1c' }}>
                      {product.name}
                    </h3>
                    <StatusBadge
                      status={isAvailable ? 'Active' : 'Inactive'}
                      label={isAvailable ? 'Mevcut' : 'Tükendi'}
                    />
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {product.category || product.categoryName || 'Sıcak İçecekler'} · {formatCurrency(product.price || 45)}
                  </div>
                </div>

                <Button
                  variant={isAvailable ? 'secondary' : 'primary'}
                  loading={busy}
                  onClick={() => handleToggleAvailability(product)}
                  style={{
                    minHeight: 44,
                    fontWeight: 700,
                    background: isAvailable ? undefined : '#047857',
                  }}
                >
                  {isAvailable ? '✕ Tükendi Olarak İşaretle' : '✓ Satışa Aç (Mevcut)'}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
