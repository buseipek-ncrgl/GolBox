"use client"

import React, { useState, useMemo, useEffect } from "react"
import { createPortal } from "react-dom"
import {
  Coffee,
  Search,
  MapPin,
  Heart,
  Plus,
  ChevronRight,
  RotateCcw,
  ShoppingBag,
  X,
  Flame,
  Utensils,
  Check,
  Tag
} from "lucide-react"
import { Screen } from "@/components/golbox/screen"
import { useGolbox, type MenuItem } from "@/lib/golbox-context"
import type { TabId } from "@/lib/golbox-data"
import { ProductDetailScreen } from "@/components/golbox/screens/catalog-product-detail-screen"
import { CartScreen } from "@/components/golbox/screens/cart-screen"

export interface ProductOption {
  id: string
  name: string
  priceDelta: number
}

const DEFAULT_SIZES: ProductOption[] = [
  { id: "sz-1", name: "Küçük (250ml)", priceDelta: 0 },
  { id: "sz-2", name: "Orta (350ml)", priceDelta: 10 },
  { id: "sz-3", name: "Büyük (450ml)", priceDelta: 18 },
]

const DEFAULT_MILKS: ProductOption[] = [
  { id: "ml-1", name: "Tam Yağlı Süt", priceDelta: 0 },
  { id: "ml-2", name: "Yulaf Sütü", priceDelta: 12 },
  { id: "ml-3", name: "Laktozsuz Süt", priceDelta: 8 },
]

export function MenuScreen({
  onNavigate,
}: {
  onNavigate: (tab: TabId) => void
  onOpenCoupons?: () => void
}) {
  const {
    token,
    cafes,
    favorites,
    toggleFavorite,
    foodCart,
    addToFoodCart,
    selectedBranch,
    setSelectedBranch,
    orders,
  } = useGolbox()

  // STATE MANAGEMENT
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  
  // MODALS & SCREENS
  const [showCartScreen, setShowCartScreen] = useState<boolean>(false)
  const [customizingProduct, setCustomizingProduct] = useState<MenuItem | null>(null)

  const [showBranchModal, setShowBranchModal] = useState<boolean>(false)
  const [branchChangeWarning, setBranchChangeWarning] = useState<string | null>(null)
  const [pendingBranchId, setPendingBranchId] = useState<string | null>(null)
  const [showGuestFavoriteModal, setShowGuestFavoriteModal] = useState<boolean>(false)

  const [mounted, setMounted] = useState<boolean>(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const DEFAULT_BRANCHES = [
    {
      id: "33333333-3333-3333-3333-333333333333",
      name: "Şehitkamil Kitap Kafe",
      address: "İncilipınar Mah. Muammer Aksoy Bulv. No:12, Şehitkamil / Gaziantep",
      workingHours: "07:30 - 23:00",
      isOpen: true,
      gelAlAvailable: true,
    },
    {
      id: "11111111-1111-1111-1111-111111111111",
      name: "GölBOX Test Şubesi 2",
      address: "Atatürk Mah. 15. Sok. No:4, Şehitkamil / Gaziantep",
      workingHours: "07:30 - 23:00",
      isOpen: true,
      gelAlAvailable: true,
    },
  ]

  const availableBranches = useMemo(() => {
    if (cafes && cafes.length > 0) return cafes
    return DEFAULT_BRANCHES
  }, [cafes])

  const activeBranch = useMemo(() => {
    const found = availableBranches.find(c => c.id === selectedBranch.id)
    return found || { id: selectedBranch.id, name: selectedBranch.name, address: selectedBranch.address, isOpen: true, gelAlAvailable: true, workingHours: "07:30 - 23:00" }
  }, [availableBranches, selectedBranch])

  // REORDER CANDIDATE FROM COMPLETED ORDERS HISTORY
  const pastCompletedOrders = orders.filter(
    (o) => o.status === "Completed" || o.status === "COMPLETED"
  )
  const lastOrderCandidate = pastCompletedOrders.length > 0 ? pastCompletedOrders[0] : null

  // MENU ITEMS CATALOG WITH DYNAMIC BRANCH AVAILABILITY & SINGLE PRIORITY BADGE
  const catalogMenuItems: (MenuItem & {
    categoryId: string
    isAvailable: boolean
    badge?: string
    studentPrice?: number
  })[] = useMemo(() => {
    const branch = cafes.find((c) => c.id === selectedBranch.id)
    return (branch?.menuItems ?? []).map((item) => ({
      ...item,
      categoryId: item.categoryId ?? "uncategorized",
      isAvailable: true,
    }))
  }, [cafes, selectedBranch.id])

  // CATEGORIES DATA
  const categories = useMemo(() => {
    const seen = new Map<string, string>()
    catalogMenuItems.forEach((item) => seen.set(item.categoryId, item.categoryName || "Diğer"))
    return [{ id: "all", name: "Tümü", icon: Coffee }, ...Array.from(seen, ([id, name]) => ({ id, name, icon: Utensils }))]
  }, [catalogMenuItems])

  // SEARCH & FILTERED PRODUCTS
  const filteredProducts = useMemo(() => {
    return catalogMenuItems.filter((p) => {
      const matchCat = selectedCategoryId === "all" || p.categoryId === selectedCategoryId
      const term = searchQuery.toLowerCase().trim()
      const matchSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term)
      return matchCat && matchSearch
    })
  }, [catalogMenuItems, selectedCategoryId, searchQuery])

  // FAVORITE HANDLER
  const handleToggleFavorite = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!token) {
      setShowGuestFavoriteModal(true)
      return
    }
    toggleFavorite(productId)
  }

  // CUSTOMIZATION HANDLERS
  const handleOpenCustomize = (product: MenuItem) => {
    setCustomizingProduct(product)
  }

  const commitBranchSelect = (branchId: string) => {
    const target = availableBranches.find((b) => b.id === branchId)
    if (target) {
      setSelectedBranch({
        id: target.id,
        name: target.name,
        address: target.address || (target as any).fullAddress || ""
      })
    }
  }

  const handleRequestBranchChange = (newBranchId: string) => {
    if (foodCart.length > 0 && newBranchId !== selectedBranch.id) {
      setPendingBranchId(newBranchId)
      setBranchChangeWarning("Şubeyi değiştirmek üzeresin. Sepetindeki ürünlerin geçerliliği yeni şube için doğrulanacaktır. Devam etmek istiyor musun?")
    } else {
      commitBranchSelect(newBranchId)
      setShowBranchModal(false)
    }
  }

  const confirmBranchChange = () => {
    if (pendingBranchId) {
      commitBranchSelect(pendingBranchId)
      setPendingBranchId(null)
    }
    setBranchChangeWarning(null)
    setShowBranchModal(false)
  }

  const cartItemCount = foodCart.reduce((a, b) => a + b.quantity, 0)
  const cartTotalPrice = foodCart.reduce((a, b) => a + b.totalPrice, 0)

  return (
    <Screen className={`space-y-4 ${cartItemCount > 0 ? "pb-36" : "pb-24"}`}>

      {/* EKRAN BAŞLIĞI */}
      <header className="space-y-0.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Ürün Menüsü</h1>
        <p className="text-xs text-muted-foreground">Taze kahveler, leziz tatlılar ve sıcak ikramlar</p>
      </header>

      {/* 1. SEÇİLİ ŞUBE KISAYOL BAR (SECTION 9) */}
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
            <MapPin className="size-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Teslim Alınacak Şube</p>
            <h2 className="text-xs font-bold text-foreground">{activeBranch.name}</h2>
          </div>
        </div>
        <button
          onClick={() => setShowBranchModal(true)}
          className="rounded-xl border border-emerald-700/30 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 transition cursor-pointer"
        >
          Değiştir
        </button>
      </div>

      {/* 2. SEARCH BAR (SECTION 12 & 13) */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Kahve, tatlı veya ürün ara..."
          className="h-11 w-full rounded-2xl border border-border bg-card pl-10 pr-9 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
        />
        {searchQuery.length > 0 && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* 3. HORIZONTAL CATEGORY CHIPS (SECTION 16 & 17) */}
      <div className="sticky top-0 z-10 -mx-4 bg-background/95 px-4 py-2 backdrop-blur-md border-b border-border/40">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map((cat) => {
            const Icon = cat.icon
            const isActive = selectedCategoryId === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "border border-border bg-card text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                }`}
              >
                <Icon className="size-3.5" />
                {cat.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* 4. REORDER SHORTCUT (SECTION 37 & 38 - ONLY IF PREVIOUS COMPLETED ORDER CANDIDATE EXISTS) */}
      {token && lastOrderCandidate && !searchQuery && selectedCategoryId === "all" && (
        <div className="rounded-2xl border border-border bg-card p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              <RotateCcw className="size-3.5" /> Son Siparişiniz
            </span>
            <span className="text-[10px] text-muted-foreground">{activeBranch.name}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-foreground">
                {lastOrderCandidate.items?.[0]?.menuItemName || "GölBOX Özel Filtre Kahve"}
              </h4>
              <p className="text-[11px] text-muted-foreground">Orta Boy · Tam Yağlı Süt</p>
            </div>
            <button
              onClick={() => handleOpenCustomize(catalogMenuItems[0])}
              className="flex items-center gap-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 transition cursor-pointer"
            >
              + Tekrar Al
            </button>
          </div>
        </div>
      )}

      {/* 5. SINGLE-COLUMN PRODUCT LIST (SECTION 20 & 21) */}
      <div className="space-y-3 pt-1">
        {filteredProducts.map((product) => {
          const isFav = favorites.includes(product.id)
          const isSoldOut = !product.isAvailable

          return (
            <div
              key={product.id}
              onClick={() => !isSoldOut && handleOpenCustomize(product)}
              className={`group relative flex gap-3 rounded-2xl border border-border bg-card p-3 shadow-2xs transition-all ${
                isSoldOut ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:border-emerald-600/40 hover:shadow-sm"
              }`}
            >
              {/* PRODUCT IMAGE & MAX 1 PRIORITY BADGE */}
              <div className="relative size-22 shrink-0 overflow-hidden rounded-xl bg-muted">
                <img src={product.imageUrl} alt={product.name} className="size-full object-cover" />

                {/* FAVORITE BUTTON */}
                <button
                  onClick={(e) => handleToggleFavorite(product.id, e)}
                  aria-label={isFav ? "Favorilerden çıkar" : "Favorilere ekle"}
                  className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-xs transition hover:scale-110 cursor-pointer"
                >
                  <Heart className={`size-4 ${isFav ? "fill-rose-500 text-rose-500" : "text-white"}`} />
                </button>

                {/* SINGLE PRIORITY BADGE */}
                {product.badge && (
                  <span className="absolute left-1.5 bottom-1.5 rounded-md bg-amber-400 px-1.5 py-0.5 text-[9px] font-bold text-amber-950 shadow-2xs">
                    {product.badge}
                  </span>
                )}
              </div>

              {/* PRODUCT CONTENT */}
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                  <h3 className="truncate text-xs font-bold text-foreground">{product.name}</h3>
                  <p className="line-clamp-2 text-[11px] text-muted-foreground mt-0.5">{product.description}</p>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <div>
                    {product.studentPrice ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">₺{product.studentPrice}</span>
                        <span className="text-[10px] text-muted-foreground line-through">₺{product.price}</span>
                        <span className="flex items-center gap-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
                          <Tag className="size-3 text-emerald-600" /> İndirimli
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm font-black text-emerald-800 dark:text-emerald-300">₺{product.price}</span>
                    )}
                  </div>

                  {/* QUICK ADD BUTTON */}
                  {isSoldOut ? (
                    <span className="rounded-lg bg-muted px-2 py-1 text-[10px] font-bold text-muted-foreground">
                      Stokta Yok
                    </span>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenCustomize(product)
                      }}
                      aria-label={`${product.name} sepete ekle veya özelleştir`}
                      className="flex size-8 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-2xs transition hover:bg-emerald-800 active:scale-95 cursor-pointer"
                    >
                      <Plus className="size-4" strokeWidth={2.2} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* SEARCH EMPTY STATE (SECTION 15) */}
        {filteredProducts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center shadow-2xs">
            <Search className="mx-auto size-9 text-muted-foreground/40" />
            <h3 className="mt-3 text-xs font-bold text-foreground">Aradığın ürünü bulamadık.</h3>
            <p className="mt-1 text-[11px] text-muted-foreground">Farklı bir kelime deneyebilir veya kategorilere göz atabilirsin.</p>
            <button
              onClick={() => {
                setSearchQuery("")
                setSelectedCategoryId("all")
              }}
              className="mt-4 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-emerald-800 transition cursor-pointer"
            >
              Tüm Menüyü Gör
            </button>
          </div>
        )}

        {cartItemCount > 0 && <div className="h-28 w-full" />}
      </div>

      {/* 6. STICKY BOTTOM CART BAR (SECTION 40 - 42) */}
      {cartItemCount > 0 && (
        <div
          onClick={() => onNavigate("cart")}
          className="fixed inset-x-4 bottom-20 z-40 flex items-center justify-between rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-850 to-emerald-900 p-3.5 text-white shadow-2xl border border-emerald-700/60 animate-in fade-in slide-in-from-bottom-4 cursor-pointer hover:border-emerald-500 transition"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-950/80 text-emerald-300 font-bold shrink-0 border border-emerald-700/50">
              <ShoppingBag className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-emerald-200 uppercase tracking-wider">{cartItemCount} Ürün Sepetinizde</p>
              <h4 className="text-base font-black text-white">₺{cartTotalPrice}</h4>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onNavigate("cart")
            }}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-black text-emerald-950 shadow-md hover:bg-emerald-400 active:scale-95 transition cursor-pointer"
          >
            <span>Sepete Git</span>
            <ChevronRight className="size-4 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* CART SCREEN PORTAL */}
      {mounted && showCartScreen && createPortal(
        <CartScreen
          onClose={() => setShowCartScreen(false)}
          onNavigateToMenu={() => setShowCartScreen(false)}
          onNavigateToQr={() => {
            setShowCartScreen(false)
            if (onNavigate) onNavigate("qr")
          }}
        />,
        document.body
      )}

      {/* PRODUCT DETAIL & CUSTOMIZATION SCREEN */}
      {mounted && customizingProduct && createPortal(
        <ProductDetailScreen
          product={customizingProduct}
          onClose={() => setCustomizingProduct(null)}
          onAddToCartSuccess={(details) => {
            addToFoodCart(details.product, details.quantity, details.configurationSummary, details.totalPrice / details.quantity, details.selectedOptionIds)
          }}
        />,
        document.body
      )}

      {/* BRANCH SELECTOR MODAL */}
      {mounted && showBranchModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl bg-card p-6 shadow-2xl border border-border text-foreground">
            <div className="flex items-center justify-between mb-4 border-b border-border/60 pb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <MapPin className="size-4.5 text-emerald-600" /> Teslim Alınacak Şube
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Siparişini teslim almak istediğin GölBOX şubesini seç.</p>
              </div>
              <button onClick={() => setShowBranchModal(false)} className="rounded-xl p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
                <X className="size-5" />
              </button>
            </div>

            {branchChangeWarning && (
              <div className="mb-4 rounded-2xl border border-amber-500/40 bg-amber-50 dark:bg-amber-950/40 p-3.5 text-xs text-amber-900 dark:text-amber-200">
                <p className="font-bold">⚠️ Şube Değişimi Uyarısı</p>
                <p className="mt-1 text-[11px]">{branchChangeWarning}</p>
                <div className="mt-3 flex justify-end gap-2">
                  <button onClick={() => setBranchChangeWarning(null)} className="rounded-xl border border-border bg-card px-3 py-1.5 font-bold text-foreground">
                    Vazgeç
                  </button>
                  <button onClick={confirmBranchChange} className="rounded-xl bg-emerald-700 px-3 py-1.5 font-bold text-white shadow">
                    Devam Et
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2.5">
              {availableBranches.map((cafe) => (
                <div
                  key={cafe.id}
                  onClick={() => handleRequestBranchChange(cafe.id)}
                  className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3.5 transition-all ${
                    selectedBranch.id === cafe.id
                      ? "border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/60 shadow-2xs"
                      : "border-border bg-card hover:bg-accent/60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-xl ${selectedBranch.id === cafe.id ? "bg-emerald-700 text-white" : "bg-muted text-muted-foreground"}`}>
                      <MapPin className="size-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">{cafe.name}</h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{cafe.address}</p>
                      <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300">
                        ✓ Gel-Al Aktif · 07:30 - 23:00
                      </span>
                    </div>
                  </div>
                  {selectedBranch.id === cafe.id && (
                    <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white">
                      <Check className="size-3" strokeWidth={3} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* GUEST FAVORITE PROMPT MODAL */}
      {mounted && showGuestFavoriteModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-card p-5 text-center shadow-2xl border border-border text-foreground">
            <Heart className="mx-auto size-10 text-rose-500 fill-rose-500/20" />
            <h3 className="text-sm font-bold text-foreground mt-3">Favorilerine Ekle</h3>
            <p className="mt-1 text-xs text-muted-foreground">Favori kahve ve lezzetlerini kaydetmek için oturum açmalısın.</p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowGuestFavoriteModal(false)}
                className="flex-1 rounded-xl border border-border bg-card py-2 text-xs font-bold text-foreground cursor-pointer"
              >
                Şimdi Değil
              </button>
              <button
                onClick={() => {
                  setShowGuestFavoriteModal(false)
                  onNavigate("profile")
                }}
                className="flex-1 rounded-xl bg-emerald-700 py-2 text-xs font-bold text-white shadow-2xs hover:bg-emerald-800 transition cursor-pointer"
              >
                Giriş Yap ➔
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </Screen>
  )
}
