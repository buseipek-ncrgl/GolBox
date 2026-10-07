import { Fragment, useEffect, useMemo, useState } from "react";
import {
  CircleAlert,
  Building2,
  CheckCircle2,
  Grid2X2,
  Layers3,
  List,
  MoreHorizontal,
  PackagePlus,
  Pencil,
  Plus,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { api } from "../../../services/api";
import { pagedMeta } from "../../../lib/adminQuery";
import {
  Button,
  BulkSelectionBar,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  Pagination,
  Select,
  SelectionCheckbox,
  UnsavedGuard,
} from "../../../admin/components";
import { SafeImg } from "../../../components/admin/adminUi";
import { useAdminFeedback } from "../AdminFeedback";
import { StaffProductAvailability } from "./StaffProductAvailability";
import {
  CatalogProductDrawer,
  type CatalogProduct,
} from "./CatalogProductDrawer";

type MasterType = "category" | "ingredient" | "allergen";
const newProduct = (cafeId = ""): Partial<CatalogProduct> => ({
  cafeId,
  name: "",
  description: "",
  price: 0,
  imageUrl: "",
  isActive: false,
  displayOrder: 0,
  ingredientIds: [],
  allergenIds: [],
  optionGroups: [],
  branchAvailabilities: [],
});

export function CatalogMenuPage() {
  const { isAdmin, confirm, setError, setSuccess, savingKey, setSavingKey } =
    useAdminFeedback();
  const [view, setView] = useState<"catalog" | "availability">(
    isAdmin ? "catalog" : "availability",
  );
  const [items, setItems] = useState<any[]>([]);
  const [cafes, setCafes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [allergens, setAllergens] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [active, setActive] = useState("");
  const [loading, setLoading] = useState(true);
  const [fail, setFail] = useState<unknown>(null);
  const [form, setForm] = useState<Partial<CatalogProduct> | null>(null);
  const [snapshot, setSnapshot] = useState("");
  const [masterType, setMasterType] = useState<MasterType | null>(null);
  const [masterName, setMasterName] = useState("");
  const [masterEditing, setMasterEditing] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "list">("list");
  const [selected, setSelected] = useState<string[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminMenuItems({
        page,
        pageSize: 25,
        search: search || undefined,
        active: active === "" ? undefined : active === "true",
        categoryId: categoryId || undefined,
      });
      const meta = pagedMeta(res, page, 25);
      setItems(meta.items);
      setTotal(meta.totalCount);
      setFail(null);
    } catch (e) {
      setFail(e);
    } finally {
      setLoading(false);
    }
  };
  const loadMeta = async () => {
    const [branchResult, metaResult] = await Promise.allSettled([
      api.getAdminCafes({ page: 1, pageSize: 100, active: true }),
      api.getCatalogMeta(),
    ]);
    if (branchResult.status === "fulfilled") setCafes(pagedMeta(branchResult.value, 1, 100).items);
    else {
      setCafes([]);
      setError("Şube listesi yüklenemedi. API servisini yeniden başlatıp tekrar deneyin.");
    }
    if (metaResult.status === "fulfilled") {
      const meta = metaResult.value.data || metaResult.value;
      setCategories(meta.categories || []);
      setIngredients(meta.ingredients || []);
      setAllergens(meta.allergens || []);
    } else {
      setError("Katalog tanımları yüklenemedi. Backend servisini güncel sürümle yeniden başlatın.");
    }
  };
  useEffect(() => {
    void load();
  }, [page, active, categoryId]);
  useEffect(() => {
    void loadMeta();
  }, []);
  const dirty = !!form && JSON.stringify(form) !== snapshot;
  const open = (value: Partial<CatalogProduct>) => {
    setForm(value);
    setSnapshot(JSON.stringify(value));
  };
  const close = () =>
    dirty
      ? confirm({
          title: "Kaydedilmemiş değişiklikler",
          message: "Ürün değişiklikleri kaydedilmedi. Kapatılsın mı?",
          confirmLabel: "Kapat",
          danger: true,
          onConfirm: () => setForm(null),
        })
      : setForm(null);
  const published = useMemo(
    () => items.filter((x) => x.isActive).length,
    [items],
  );
  const groupedItems = useMemo(() => {
    const groups = new Map<string, any[]>();
    items.forEach((item) => {
      const key = item.categoryName || "Kategorisiz";
      groups.set(key, [...(groups.get(key) || []), item]);
    });
    return Array.from(groups.entries());
  }, [items]);

  if (!isAdmin || view === "availability")
    return (
      <div style={{ display: "grid", gap: 12 }}>
        {isAdmin && (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button variant="secondary" onClick={() => setView("catalog")}>
              <Layers3 size={16} /> Merkezi kataloğa dön
            </Button>
          </div>
        )}
        <StaffProductAvailability />
      </div>
    );
  const masterItems =
    masterType === "category"
      ? categories
      : masterType === "ingredient"
        ? ingredients
        : allergens;
  const openMaster = (type: MasterType) => {
    setMasterType(type);
    setMasterEditing(null);
    setMasterName("");
  };
  const saveMaster = async () => {
    if (!masterType || masterName.trim().length < 2) {
      setError("Ad en az 2 karakter olmalıdır.");
      return;
    }
    setSavingKey("master");
    try {
      if (masterEditing) {
        if (masterType === "category")
          await api.updateCatalogCategory(masterEditing.id, {
            ...masterEditing,
            name: masterName,
          });
        if (masterType === "ingredient")
          await api.updateCatalogIngredient(masterEditing.id, {
            ...masterEditing,
            name: masterName,
          });
        if (masterType === "allergen")
          await api.updateCatalogAllergen(masterEditing.id, {
            ...masterEditing,
            name: masterName,
          });
      } else {
        if (masterType === "category")
          await api.createCatalogCategory({ name: masterName });
        if (masterType === "ingredient")
          await api.createCatalogIngredient({ name: masterName });
        if (masterType === "allergen")
          await api.createCatalogAllergen({ name: masterName });
      }
      setSuccess(
        masterEditing ? "Tanım güncellendi." : "Yeni tanım oluşturuldu.",
      );
      setMasterEditing(null);
      setMasterName("");
      await loadMeta();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingKey(null);
    }
  };
  const deleteMaster = (item: any) => {
    if (!masterType) return;
    confirm({
      title: `${item.name} silinsin mi?`,
      message:
        masterType === "category"
          ? "Ürünlerde kullanılan kategoriler silinemez."
          : "Kullanılan ilişkiler korunur; tanım yeni seçimler için arşivlenir.",
      confirmLabel: "Sil",
      danger: true,
      onConfirm: async () => {
        try {
          if (masterType === "category")
            await api.deleteCatalogCategory(item.id);
          if (masterType === "ingredient")
            await api.deleteCatalogIngredient(item.id);
          if (masterType === "allergen")
            await api.deleteCatalogAllergen(item.id);
          setSuccess("Tanım kaldırıldı.");
          await loadMeta();
        } catch (e: any) {
          setError(e.message);
        }
      },
    });
  };
  const deleteProduct = (item: any) => confirm({ title: "Ürün silinsin mi?", message: `'${item.name}' katalogdan kaldırılacak. Geçmiş sipariş kayıtları korunur.`, confirmLabel: "Ürünü Sil", danger: true, onConfirm: async () => { try { await api.deleteMenuItem(item.cafeId || cafes[0]?.id, item.id); setSuccess("Ürün katalogdan kaldırıldı."); await load(); } catch (e: any) { setError(e.message); } } });
  const toggleSelected = (id: string, checked: boolean) => setSelected((current) => checked ? [...new Set([...current, id])] : current.filter((value) => value !== id));
  const removeSelected = () => confirm({ title: "Seçili ürünleri sil", message: `${selected.length} ürün katalogdan kaldırılacak. Geçmiş sipariş kayıtları korunur.`, confirmLabel: "Seçilenleri sil", danger: true, onConfirm: async () => { await Promise.all(selected.map((id) => { const item = items.find((value) => value.id === id); return api.deleteMenuItem(item?.cafeId || cafes[0]?.id, id); })); setSelected([]); setSuccess("Seçili ürünler katalogdan kaldırıldı."); await load(); } });

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <UnsavedGuard dirty={dirty} />
      <div
        className="admin-page-actions"
        style={{ justifyContent: "flex-end" }}
      >
        <Button variant="secondary" onClick={() => setView("availability")}>
          <UtensilsCrossed size={16} /> Şube kullanılabilirliği
        </Button>
        <div className="catalog-view-switch">
          <button
            className={viewMode === "cards" ? "active" : ""}
            onClick={() => setViewMode("cards")}
            aria-label="Kart görünümü"
          >
            <Grid2X2 size={15} /> Kart
          </button>
          <button
            className={viewMode === "list" ? "active" : ""}
            onClick={() => setViewMode("list")}
            aria-label="Liste görünümü"
          >
            <List size={15} /> Liste
          </button>
        </div>
        <Button data-testid="menu-create" onClick={() => open(newProduct(cafes[0]?.id))}>
          <Plus size={17} /> Yeni ürün
        </Button>
      </div>
      <div className="catalog-summary">
        <div className="catalog-summary-item">
          <PackagePlus size={18} />
          <span>Toplam ürün</span>
          <strong>{total}</strong>
        </div>
        <div className="catalog-summary-item">
          <CheckCircle2 size={18} />
          <span>Bu sayfada yayında</span>
          <strong>{published}</strong>
        </div>
        <div className="catalog-summary-item">
          <Layers3 size={18} />
          <span>Kategori</span>
          <strong>{categories.length}</strong>
        </div>
        <div className="catalog-summary-item">
          <Building2 size={18} />
          <span>Şube</span>
          <strong>{cafes.length}</strong>
        </div>
      </div>
      <div className="admin-filter">
        <div className="admin-filter-search">
          <Input
            label="Ürün ara"
            placeholder="Ürün adı veya açıklama"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="admin-filter-fields">
          <Select
            label="Kategori"
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tümü</option>
            {categories.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </Select>
          <Select
            label="Yayın durumu"
            value={active}
            onChange={(e) => {
              setActive(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tümü</option>
            <option value="true">Yayında</option>
            <option value="false">Taslak / pasif</option>
          </Select>
          <Button
            onClick={() => {
              setPage(1);
              void load();
            }}
          >
            Ara
          </Button>
        </div>
      </div>
      <div className="catalog-definition-bar">
        <div>
          <strong>Katalog tanımları</strong>
          <span>Kategori, içerik ve alerjenleri merkezi olarak yönetin.</span>
        </div>
        <div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => openMaster("category")}
          >
            Kategoriler
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => openMaster("ingredient")}
          >
            İçerikler
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => openMaster("allergen")}
          >
            Alerjenler
          </Button>
        </div>
      </div>
      <div className="collection-selection-row"><div className="collection-selection-head"><SelectionCheckbox label="Sayfadaki tüm ürünleri seç" checked={items.length > 0 && items.every((item) => selected.includes(item.id))} onChange={(checked) => setSelected(checked ? items.map((item) => item.id) : [])} /><span>Sayfadakileri seç</span></div><BulkSelectionBar count={selected.length} onAction={removeSelected} onClear={() => setSelected([])} /></div>
      {fail && <ErrorState error={fail} retry={load} />}
      {loading ? (
        <div className="admin-skel-table">
          <div className="admin-skel-line" />
          {[1, 2, 3, 4, 5].map((x) => (
            <div className="admin-skel-row" key={x} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<PackagePlus />}
          title="Katalogda ürün bulunmuyor"
          description="İlk merkezi ürününüzü oluşturarak şubelerde satışa açabilirsiniz."
          actionLabel="Yeni ürün"
          onAction={() => open(newProduct(cafes[0]?.id))}
        />
      ) : viewMode === "list" ? (
        <div className="admin-table-wrap">
          <table className="admin-table" style={{ minWidth: 940 }}>
            <thead>
              <tr>
                <th className="admin-selection-column">Seç</th>
                <th>Ürün</th>
                <th>Kategori</th>
                <th>Fiyat</th>
                <th>Yayın</th>
                <th>Şube</th>
                <th>Son güncelleme</th>
                <th aria-label="İşlemler" />
              </tr>
            </thead>
            <tbody>
              {groupedItems.map(([group, products]) => (
                <Fragment key={group}>
                  {
                    <tr className="catalog-category-row" key={`group-${group}`}>
                      <td colSpan={8}>
                        <strong>{group}</strong>
                        <span>{products.length} ürün</span>
                      </td>
                    </tr>
                  }
                  {products.map((item) => (
                    <tr key={item.id} data-testid="menu-row">
                      <td className="admin-selection-column"><SelectionCheckbox label={`${item.name} seç`} checked={selected.includes(item.id)} onChange={(checked) => toggleSelected(item.id, checked)} /></td>
                      <td>
                        <div className="catalog-product-cell">
                          <SafeImg
                            className="catalog-product-thumb"
                            src={item.imageUrl}
                            alt=""
                          />
                          <div className="catalog-product-meta">
                            <div className="catalog-product-name">
                              {item.name}
                            </div>
                            <div className="catalog-product-description">
                              {item.description || "Açıklama eklenmemiş"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{item.categoryName || "Kategorisiz"}</td>
                      <td style={{ fontWeight: 800 }}>
                        {Number(item.price).toLocaleString("tr-TR")} ₺
                      </td>
                      <td>
                        <span
                          className={`admin-badge ${item.isActive ? "admin-badge-success" : "admin-badge-neutral"}`}
                        >
                          {item.isActive ? "Yayında" : "Taslak"}
                        </span>
                      </td>
                      <td>
                        {item.availableBranchCount || 0}/
                        {item.branchCount || cafes.length}
                      </td>
                      <td className="admin-muted">
                        {item.updatedDate
                          ? new Date(item.updatedDate).toLocaleDateString(
                              "tr-TR",
                            )
                          : "—"}
                      </td>
                      <td className="admin-table-actions">
                        <Button
                          size="sm"
                          variant="ghost"
                          data-testid="menu-edit"
                          aria-label={`${item.name} ürününü düzenle`}
                          onClick={() => open(item)}
                        >
                          <MoreHorizontal size={18} />
                        </Button>
                        <Button size="sm" variant="ghost" aria-label={`${item.name} ürününü sil`} onClick={() => deleteProduct(item)}><Trash2 size={16} /></Button>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="catalog-groups">
          {groupedItems.map(([group, products]) => (
            <section key={group} className="catalog-group">
              <div className="catalog-group-head">
                <div>
                  <strong>{group}</strong>
                  <span>{products.length} ürün</span>
                </div>
              </div>
              <div className="catalog-card-grid">
                {products.map((item) => (
                  <article key={item.id} className="catalog-product-card">
                    <SelectionCheckbox label={`${item.name} seç`} checked={selected.includes(item.id)} onChange={(checked) => toggleSelected(item.id, checked)} />
                    <SafeImg src={item.imageUrl} alt="" />
                    <div>
                      <span
                        className={`admin-badge ${item.isActive ? "admin-badge-success" : "admin-badge-neutral"}`}
                      >
                        {item.isActive ? "Yayında" : "Taslak"}
                      </span>
                      <h3>{item.name}</h3>
                      <p>{item.description || "Açıklama eklenmemiş"}</p>
                      <footer>
                        <strong>
                          {Number(item.price).toLocaleString("tr-TR")} ₺
                        </strong>
                        <span>
                          {item.availableBranchCount || 0}/
                          {item.branchCount || cafes.length} şube
                        </span>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => open(item)}
                        >
                          Düzenle
                        </Button>
                        <Button size="sm" variant="ghost" aria-label={`${item.name} ürününü sil`} onClick={() => deleteProduct(item)}><Trash2 size={15} /></Button>
                      </footer>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
      <Pagination
        page={page}
        pageSize={25}
        totalCount={total}
        onPage={setPage}
      />
      <CatalogProductDrawer
        open={!!form}
        data={form}
        cafes={cafes}
        categories={categories}
        ingredients={ingredients}
        allergens={allergens}
        loading={savingKey === "product"}
        onClose={close}
        onSave={async (value) => {
          const resolvedCafeId = value.cafeId || cafes[0]?.id || "";
          if (!resolvedCafeId) {
            setError("Ürünü kaydetmek için önce en az bir aktif şube oluşturulmalıdır.");
            return;
          }
          if (!value.categoryId) {
            setError("Kahve, tatlı veya içecek gibi bir ürün kategorisi seçin.");
            return;
          }
          if (!value.name.trim() || !value.description.trim() || Number(value.price) <= 0) {
            setError("Ürün adı, açıklama ve sıfırdan büyük fiyat zorunludur.");
            return;
          }
          const payload = {
            ...value,
            cafeId: resolvedCafeId,
            categoryId: value.categoryId || null,
            ingredientIds: (value.ingredientIds || []).filter(Boolean),
            allergenIds: (value.allergenIds || []).filter(Boolean),
            branchAvailabilities: (value.branchAvailabilities || []).filter((branch) => branch.cafeId),
          };
          setSavingKey("product");
          try {
            if (value.id)
              await api.updateMenuItem(resolvedCafeId, value.id, payload);
            else await api.createMenuItem(resolvedCafeId, payload);
            setSuccess(
              value.id ? "Ürün güncellendi." : "Ürün kataloğa eklendi.",
            );
            setForm(null);
            await load();
          } catch (e: any) {
            setError(e.message);
          } finally {
            setSavingKey(null);
          }
        }}
      />
      <Modal
        open={!!masterType}
        size="lg"
        title={
          masterType === "category"
            ? "Kategori Yönetimi"
            : masterType === "ingredient"
              ? "İçerik Yönetimi"
              : "Alerjen Yönetimi"
        }
        onClose={() => setMasterType(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setMasterType(null)}>
              Kapat
            </Button>
            <Button
              loading={savingKey === "master"}
              onClick={() => void saveMaster()}
            >
              {masterEditing ? "Değişiklikleri Kaydet" : "Yeni Tanım Ekle"}
            </Button>
          </>
        }
      >
        <div className="catalog-master-layout">
          <div className="catalog-master-list">
            {masterItems.map((item) => (
              <div key={item.id} className="catalog-master-row">
                <div>
                  <strong>{item.name}</strong>
                  {item.isActive === false ? <span>Arşivlendi</span> : null}
                </div>
                <div>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`${item.name} düzenle`}
                    onClick={() => {
                      setMasterEditing(item);
                      setMasterName(item.name);
                    }}
                  >
                    <Pencil size={15} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`${item.name} sil`}
                    onClick={() => deleteMaster(item)}
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="catalog-master-form">
            <strong>{masterEditing ? "Tanımı düzenle" : "Yeni tanım"}</strong>
            <Input
              autoFocus
              required
              label="Ad"
              value={masterName}
              onChange={(e) => setMasterName(e.target.value)}
            />
            {masterEditing ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setMasterEditing(null);
                  setMasterName("");
                }}
              >
                Yeni kayıt moduna dön
              </Button>
            ) : null}
            {masterType === "allergen" && (
              <p className="admin-muted">
                <CircleAlert size={14} style={{ verticalAlign: "middle" }} />{" "}
                Alerjenler müşteri ürün detayına otomatik yansır.
              </p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
