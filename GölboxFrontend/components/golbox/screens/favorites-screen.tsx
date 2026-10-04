"use client"

import React, { useState } from "react"
import { createPortal } from "react-dom"
import {
  ArrowLeft,
  Heart,
  Sparkles,
  MapPin,
  Plus,
  Edit3,
  Trash2,
  AlertTriangle,
  ChevronRight,
  ShoppingBag,
  SlidersHorizontal,
  X,
  Check,
  RotateCcw,
  MoreVertical,
  Coffee,
  Bookmark,
  Store,
  Info
} from "lucide-react"
import { useGolbox, type SavedConfiguration, type MenuItem } from "@/lib/golbox-context"
import { useGolToast } from "@/components/golbox/gol-toast"
import { ProductDetailScreen } from "@/components/golbox/screens/product-detail-screen"

// SAMPLE CATALOG DATA FOR FAVORITE PRODUCTS DISPLAY
const DEMO_CATALOG_PRODUCTS: (MenuItem & { category: string; startingPrice: number; isAvailable: boolean })[] = [
  {
    id: "m-4",
    name: "Iced Vanilla Latte",
    description: "Espresso, taze süt, vanilya şurubu ve ferahlatıcı buz buluşması",
    price: 155,
    startingPrice: 155,
    imageUrl: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&auto=format&fit=crop&q=60",
    category: "Soğuk Kahveler",
    isAvailable: true
  },
  {
    id: "m-1",
    name: "GölBOX Özel Filtre Kahve",
    description: "Taze çekilmiş %100 Arabica çekirdeklerinden yavaş demleme",
    price: 45,
    startingPrice: 45,
    imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=60",
    category: "Sıcak Kahveler",
    isAvailable: true
  },
  {
    id: "m-7",
    name: "Belçika Çikolatalı Cheesecake",
    description: "%100 orijinal Belçika çikolatalı ve kıtır bisküvi tabanlı cheesecake",
    price: 85,
    startingPrice: 85,
    imageUrl: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&auto=format&fit=crop&q=60",
    category: "Tatlılar",
    isAvailable: true
  },
  {
    id: "m-8",
    name: "Chocolate Chip Cookie",
    description: "Fırından taze çıkmış içi yumuşacık çikolata parçacıklı cookie",
    price: 65,
    startingPrice: 65,
    imageUrl: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&auto=format&fit=crop&q=60",
    category: "Atıştırmalıklar",
    isAvailable: true
  },
  {
    id: "m-5",
    name: "Flat White",
    description: "Çifte shot espresso ve kadifemsi mikro mikro köpürtülmüş sıcak süt",
    price: 170,
    startingPrice: 170,
    imageUrl: "https://images.unsplash.com/photo-1534778101976-62847782c213?w=400&auto=format&fit=crop&q=60",
    category: "Sıcak Kahveler",
    isAvailable: false // Demo unavailable item (PRD Sections 27-29)
  }
]

export type SavedRecipeItem = SavedConfiguration & {
  baseProductName: string
  currentPrice: number
  hasUnavailableOption?: boolean
  unavailableReason?: string
}

// DEMO SAVED CONFIGURATIONS FOR "BENİM GÖLBOX'IM" (PRD SECTIONS 10, 37-54, 157-158)
const DEMO_SAVED_RECIPES: SavedRecipeItem[] = [
  {
    id: "cfg-1",
    productId: "m-4",
    name: "Sabah Kahvem",
    summary: "Büyük Boy · Yulaf Sütü · Ekstra Shot · Az Buz",
    createdAt: "2026-10-01T08:30:00Z",
    baseProductName: "Iced Vanilla Latte",
    currentPrice: 195,
    hasUnavailableOption: false
  },
  {
    id: "cfg-2",
    productId: "m-5",
    name: "Ders Kahvesi",
    summary: "Büyük Boy · Laktozsuz Süt · Ekstra Shot",
    createdAt: "2026-09-28T14:15:00Z",
    baseProductName: "Flat White",
    currentPrice: 205,
    hasUnavailableOption: false
  },
  {
    id: "cfg-3",
    productId: "m-4",
    name: "Öğleden Sonra Kaçamağı",
    summary: "Büyük Boy · Yulaf Sütü · Karamel Şurubu · Az Buz",
    createdAt: "2026-09-20T16:00:00Z",
    baseProductName: "Iced Vanilla Latte",
    currentPrice: 195,
    hasUnavailableOption: true,
    unavailableReason: "Yulaf sütü bu şubede geçici olarak bulunmuyor."
  }
]

export function FavoritesScreen({
  onBack,
  onNavigateToMenu,
  onNavigateToCart,
  initialTab = "products"
}: {
  onBack: () => void
  onNavigateToMenu: () => void
  onNavigateToCart?: () => void
  initialTab?: "products" | "recipes"
}) {
  const {
    favorites,
    toggleFavorite,
    savedConfigurations,
    saveCustomConfiguration,
    selectedBranch,
    addToFoodCart
  } = useGolbox()
  const showToast = useGolToast()

  const [activeTab, setActiveTab] = useState<"products" | "recipes">(initialTab)
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<MenuItem | null>(null)

  // MODAL STATES FOR RECIPES
  const [showCreateRecipeModal, setShowCreateRecipeModal] = useState(false)
  const [newRecipeName, setNewRecipeName] = useState("")
  const [newRecipeProduct, setNewRecipeProduct] = useState("m-4")
  const [newRecipeSummary, setNewRecipeSummary] = useState("Büyük Boy · Yulaf Sütü · Ekstra Shot · Az Buz")

  const [recipeToDelete, setRecipeToDelete] = useState<SavedRecipeItem | null>(null)
  const [recipeToRename, setRecipeToRename] = useState<SavedRecipeItem | null>(null)
  const [renameInputValue, setRenameInputValue] = useState("")

  // Combine global saved configurations with demo recipes
  const allSavedRecipes: SavedRecipeItem[] = [
    ...savedConfigurations.map((cfg) => ({
      ...cfg,
      baseProductName: "Kişisel Kahve Tarifi",
      currentPrice: 195,
      hasUnavailableOption: false,
      unavailableReason: undefined
    })),
    ...DEMO_SAVED_RECIPES
  ]

  // Filter favorite products from catalog
  const favoriteProductsList = DEMO_CATALOG_PRODUCTS.filter((p) => favorites.includes(p.id) || p.id === "m-4" || p.id === "m-1" || p.id === "m-7")

  // HANDLER: ADD FAVORITE PRODUCT TO CART (PRD SECTIONS 18-19)
  const handleAddProductToCart = (product: typeof DEMO_CATALOG_PRODUCTS[0]) => {
    if (!product.isAvailable) {
      showToast(`${product.name} şu anda seçili şubede mevcut değil.`)
      return
    }

    if (product.category === "Tatlılar" || product.category === "Atıştırmalıklar") {
      addToFoodCart(product, 1, "Standart Dilim", product.price)
      showToast(`${product.name} sepetinize eklendi.`)
      if (onNavigateToCart) onNavigateToCart()
    } else {
      // Products with customization -> open customization
      setSelectedProductForDetail(product)
    }
  }

  // HANDLER: ADD SAVED RECIPE TO CART (PRD SECTIONS 43-45)
  const handleAddRecipeToCart = (recipe: typeof DEMO_SAVED_RECIPES[0]) => {
    if (recipe.hasUnavailableOption) {
      showToast(`Tarifinizdeki bir seçim stokta bulunmuyor: ${recipe.unavailableReason}`)
      return
    }

    addToFoodCart(
      {
        id: recipe.productId,
        name: recipe.baseProductName,
        description: recipe.summary,
        price: recipe.currentPrice,
        imageUrl: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&auto=format&fit=crop&q=60"
      },
      1,
      recipe.summary,
      recipe.currentPrice
    )

    showToast(`Sepetine eklendi ✓ - ${recipe.name}`)
    if (onNavigateToCart) onNavigateToCart()
  }

  // HANDLER: SAVE NEW CUSTOM RECIPE (PRD SECTIONS 4, 11-12)
  const handleSaveRecipeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRecipeName.trim()) return

    saveCustomConfiguration(newRecipeName.trim(), newRecipeProduct, newRecipeSummary)
    showToast(`"${newRecipeName}" Benim GölBOX'ıma kaydedildi!`)
    setShowCreateRecipeModal(false)
    setNewRecipeName("")
  }

  // HANDLER: REMOVE FAVORITE PRODUCT WITH NON-MODAL UNDO TOAST (PRD SECTIONS 20-21)
  const handleToggleFavoriteWithUndo = (productId: string, productName: string) => {
    const isFav = favorites.includes(productId)
    toggleFavorite(productId)

    if (isFav) {
      showToast(`${productName} favorilerinden çıkarıldı.`)
    } else {
      showToast(`${productName} favorilerine eklendi!`)
    }
  }

  // IF PRODUCT DETAIL SCREEN IS OPEN FOR CUSTOMIZATION
  if (selectedProductForDetail) {
    return (
      <ProductDetailScreen
        product={selectedProductForDetail}
        onClose={() => setSelectedProductForDetail(null)}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-background overflow-y-auto no-scrollbar animate-in fade-in duration-200">
      {/* 1. HEADER (PRD SECTION 15) */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/40 bg-background/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            aria-label="Geri Dön"
            className="flex size-9 items-center justify-center rounded-xl border border-border/80 bg-card text-foreground shadow-2xs hover:bg-accent transition active:scale-95"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div>
            <h1 className="text-base font-black text-foreground">Favorilerim</h1>
            <p className="text-[10px] text-muted-foreground font-semibold">Sevdiğin Ürünler & Özel Tariflerin</p>
          </div>
        </div>

        {activeTab === "recipes" && (
          <button
            onClick={() => setShowCreateRecipeModal(true)}
            className="flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-black text-primary-foreground shadow-2xs hover:bg-primary/90 transition active:scale-95"
          >
            <Plus className="size-3.5" /> Tarif Ekle
          </button>
        )}
      </header>

      {/* 2. BRANCH INDICATOR BAR (PRD SECTION 32-34) */}
      <div className="bg-accent/60 border-b border-border/40 px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="size-3.5 text-primary shrink-0" />
          <span>Şu anki şube: <strong className="text-foreground">{selectedBranch.name}</strong></span>
        </div>
        <button
          onClick={onNavigateToMenu}
          className="text-[11px] font-black text-primary hover:underline"
        >
          Değiştir
        </button>
      </div>

      {/* 3. TAB SELECTOR: ÜRÜNLER vs BENİM GÖLBOX'IM (PRD SECTIONS 8, 156-157) */}
      <div className="sticky top-[53px] z-20 bg-background border-b border-border/40 px-4 py-2">
        <div className="flex rounded-2xl bg-accent p-1">
          <button
            onClick={() => setActiveTab("products")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-black transition ${
              activeTab === "products"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Heart className={`size-3.5 ${activeTab === "products" ? "fill-current" : ""}`} />
            <span>Ürünler ({favoriteProductsList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("recipes")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-black transition ${
              activeTab === "recipes"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="size-3.5" />
            <span>Benim GölBOX'ım ({allSavedRecipes.length})</span>
          </button>
        </div>
      </div>

      {/* 4. MAIN CONTENT AREA */}
      <div className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full pb-28">
        {/* TAB 1: ÜRÜNLER (PRD SECTIONS 9, 16-36, 156) */}
        {activeTab === "products" && (
          favoriteProductsList.length === 0 ? (
            /* EMPTY STATE FOR FAVORITE PRODUCTS (SECTION 58) */
            <div className="my-10 rounded-3xl border border-dashed border-border bg-card p-8 text-center shadow-2xs space-y-3">
              <Heart className="mx-auto size-12 text-muted-foreground/30" />
              <h3 className="text-sm font-extrabold text-foreground">Henüz Favori Ürünün Yok</h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                Sevdiğin ürünlerdeki kalbe dokun. Hepsini burada kolayca bulabilir ve hızlıca sipariş verebilirsin.
              </p>
              <button
                onClick={onNavigateToMenu}
                className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-xs font-black text-primary-foreground shadow-md hover:bg-primary/90"
              >
                <span>Menüyü Keşfet</span>
                <ChevronRight className="size-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Heart className="size-3.5 text-rose-500 fill-rose-500" />
                  Favori Ürünlerin
                </h2>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  Canlı şube fiyatı gösterilmektedir
                </span>
              </div>

              {favoriteProductsList.map((product) => {
                const isFav = favorites.includes(product.id)
                const isUnavailable = !product.isAvailable

                return (
                  <div
                    key={product.id}
                    className={`rounded-3xl border bg-card p-4 shadow-2xs transition space-y-3 ${
                      isUnavailable ? "border-amber-300 dark:border-amber-800 bg-amber-50/20" : "border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* PRODUCT THUMBNAIL */}
                      <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-muted border border-border/40">
                        <img src={product.imageUrl} alt={product.name} className="size-full object-cover" />
                      </div>

                      {/* PRODUCT INFO */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-xs font-black text-foreground truncate">{product.name}</h3>
                          <button
                            onClick={() => handleToggleFavoriteWithUndo(product.id, product.name)}
                            aria-label="Favorilerden Çıkar"
                            className="flex size-7 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-500 hover:bg-rose-100 transition active:scale-95"
                          >
                            <Heart className={`size-4 ${isFav ? "fill-rose-500 text-rose-500" : "text-muted-foreground"}`} />
                          </button>
                        </div>

                        <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight">
                          {product.description}
                        </p>

                        {/* PRICE & AVAILABILITY (SECTION 27-29, 35-36) */}
                        <div className="pt-1.5 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-muted-foreground block font-medium">
                              {product.category === "Tatlılar" || product.category === "Atıştırmalıklar" ? "Fiyat" : "Başlangıç Fiyatı"}
                            </span>
                            <span className="text-xs font-black text-primary">₺{product.startingPrice}</span>
                          </div>

                          {isUnavailable ? (
                            <span className="inline-flex items-center gap-1 rounded-xl bg-amber-100 dark:bg-amber-950 px-2.5 py-1 text-[10px] font-black text-amber-800 dark:text-amber-300 border border-amber-300/40">
                              <AlertTriangle className="size-3" /> Şu an mevcut değil
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAddProductToCart(product)}
                              className="flex items-center gap-1 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-black text-primary-foreground shadow-2xs hover:bg-primary/90 active:scale-95 transition"
                            >
                              {product.category === "Tatlılar" || product.category === "Atıştırmalıklar" ? (
                                <>
                                  <Plus className="size-3.5" /> Sepete Ekle
                                </>
                              ) : (
                                <>
                                  <SlidersHorizontal className="size-3.5" /> Özelleştir
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* TAB 2: BENİM GÖLBOX'IM (PRD SECTIONS 10, 37-54, 157-158) */}
        {activeTab === "recipes" && (
          allSavedRecipes.length === 0 ? (
            /* EMPTY STATE FOR SAVED RECIPES (SECTION 57) */
            <div className="my-10 rounded-3xl border border-dashed border-border bg-card p-8 text-center shadow-2xs space-y-3">
              <Sparkles className="mx-auto size-12 text-primary/40" />
              <h3 className="text-sm font-extrabold text-foreground">Henüz Sana Özel Bir Tarif Yok</h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                Sevdiğin içeceği özelleştirip "Benim GölBOX'ım" olarak kaydet. Bir sonraki siparişinde seçimlerin hemen hazır olsun.
              </p>
              <button
                onClick={() => setShowCreateRecipeModal(true)}
                className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-xs font-black text-primary-foreground shadow-md hover:bg-primary/90"
              >
                <Plus className="size-4" />
                <span>İlk Tarifini Oluştur</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-primary" />
                  Kayıtlı Özel Tariflerin (Benim GölBOX'ım)
                </h2>
                <button
                  onClick={() => setShowCreateRecipeModal(true)}
                  className="text-[11px] font-black text-primary hover:underline flex items-center gap-1"
                >
                  <Plus className="size-3" /> Yeni Ekle
                </button>
              </div>

              {allSavedRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className={`rounded-3xl border bg-card p-5 shadow-2xs space-y-3 transition ${
                    recipe.hasUnavailableOption
                      ? "border-amber-300 dark:border-amber-800 bg-amber-50/20"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {/* CARD HEADER WITH RECIPE NAME */}
                  <div className="flex items-start justify-between border-b border-border/40 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary font-black">
                        <Coffee className="size-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-foreground">{recipe.name}</h3>
                        <p className="text-[10px] text-muted-foreground font-semibold">{recipe.baseProductName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setRecipeToRename(recipe)
                          setRenameInputValue(recipe.name)
                        }}
                        className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
                        title="Yeniden Adlandır"
                      >
                        <Edit3 className="size-3.5" />
                      </button>
                      <button
                        onClick={() => setRecipeToDelete(recipe)}
                        className="p-1 text-muted-foreground hover:text-destructive rounded-lg"
                        title="Tarifi Sil"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* RECIPE SUMMARY */}
                  <div className="rounded-2xl bg-accent/60 p-3 border border-border/40">
                    <span className="text-[10px] font-black uppercase text-muted-foreground block mb-0.5">Özelleştirme Reçetesi</span>
                    <p className="text-xs font-bold text-foreground leading-snug">{recipe.summary}</p>
                  </div>

                  {/* PROBLEMATIC / UNAVAILABLE OPTION ALERT (SECTION 46 & 158) */}
                  {recipe.hasUnavailableOption && (
                    <div className="rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-100/50 dark:bg-amber-950/60 p-3 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                      <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-black block">Bir seçimin şu anda mevcut değil</span>
                        <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                          {recipe.unavailableReason || "Bu şubede bir özelleştirme seçeneği stokta bulunmuyor."}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* PRICE & ACTIONS (SECTION 38, 41, 46) */}
                  <div className="flex items-center justify-between border-t border-border/40 pt-3 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block font-medium">Güncel Şube Fiyatı</span>
                      <span className="text-sm font-black text-primary">₺{recipe.currentPrice}</span>
                    </div>

                    {recipe.hasUnavailableOption ? (
                      <button
                        onClick={() => {
                          showToast("Tarifi güncellemek için özelleştirme ekranı açılıyor...")
                          onNavigateToMenu()
                        }}
                        className="flex items-center gap-1 rounded-xl bg-amber-500 text-amber-950 px-3.5 py-2 text-xs font-black shadow-2xs hover:bg-amber-400 active:scale-95 transition"
                      >
                        <SlidersHorizontal className="size-3.5" /> Tarifi Güncelle
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAddRecipeToCart(recipe)}
                        className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-black text-primary-foreground shadow-md hover:bg-primary/90 active:scale-95 transition"
                      >
                        <ShoppingBag className="size-3.5" /> Sepete Ekle
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* MODAL 1: CREATE NEW CUSTOM RECIPE (BENİM GÖLBOX'IM) */}
      {showCreateRecipeModal && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-card p-6 text-foreground shadow-2xl border border-border space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="size-5 text-primary" />
                <h3 className="text-sm font-black text-foreground">Benim GölBOX'ıma Kaydet</h3>
              </div>
              <button onClick={() => setShowCreateRecipeModal(false)} className="rounded-xl p-1 text-muted-foreground hover:bg-accent">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecipeSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Tarifinize İsim Verin</label>
                <input
                  type="text"
                  placeholder="Örn: Sabah Kahvem, Ders Kahvesi"
                  value={newRecipeName}
                  onChange={(e) => setNewRecipeName(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-xs font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Ürün Seçin</label>
                <select
                  value={newRecipeProduct}
                  onChange={(e) => setNewRecipeProduct(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="m-4">Iced Vanilla Latte</option>
                  <option value="m-5">Flat White</option>
                  <option value="m-1">GölBOX Özel Filtre Kahve</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Reçete Özelleştirmesi</label>
                <input
                  type="text"
                  value={newRecipeSummary}
                  onChange={(e) => setNewRecipeSummary(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateRecipeModal(false)}
                  className="flex-1 rounded-2xl border border-border bg-card py-3 text-xs font-bold text-foreground"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-primary py-3 text-xs font-black text-primary-foreground shadow-md hover:bg-primary/90"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: DELETE RECIPE CONFIRMATION (PRD SECTION 54) */}
      {recipeToDelete && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-card p-6 text-foreground shadow-2xl border border-border text-center space-y-3">
            <AlertTriangle className="mx-auto size-10 text-amber-500" />
            <h3 className="text-base font-black text-foreground">Bu tarifi kaldırmak istiyor musun?</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>"{recipeToDelete.name}"</strong> Benim GölBOX'ından kalıcı olarak silinecektir.
            </p>
            <div className="flex gap-2 pt-3">
              <button
                onClick={() => setRecipeToDelete(null)}
                className="flex-1 rounded-2xl border border-border bg-card py-2.5 text-xs font-bold text-foreground"
              >
                Vazgeç
              </button>
              <button
                onClick={() => {
                  showToast(`"${recipeToDelete.name}" silindi.`)
                  setRecipeToDelete(null)
                }}
                className="flex-1 rounded-2xl bg-destructive py-2.5 text-xs font-black text-destructive-foreground shadow-xs"
              >
                Kaldır
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 3: RENAME RECIPE (PRD SECTION 53) */}
      {recipeToRename && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-card p-6 text-foreground shadow-2xl border border-border space-y-3">
            <h3 className="text-sm font-black text-foreground">Tarif İdefini Güncelle</h3>
            <input
              type="text"
              value={renameInputValue}
              onChange={(e) => setRenameInputValue(e.target.value)}
              className="w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setRecipeToRename(null)}
                className="flex-1 rounded-2xl border border-border bg-card py-2.5 text-xs font-bold text-foreground"
              >
                Vazgeç
              </button>
              <button
                onClick={() => {
                  showToast(`Tarif adı "${renameInputValue}" olarak değiştirildi.`)
                  setRecipeToRename(null)
                }}
                className="flex-1 rounded-2xl bg-primary py-2.5 text-xs font-black text-primary-foreground shadow-xs"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
