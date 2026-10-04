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
  Sparkles,
  Zap,
  GraduationCap,
  RotateCcw,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Coins,
  Flame,
  Utensils,
  Filter,
  Check,
  RefreshCw,
  Tag
} from "lucide-react"
import { Screen } from "@/components/golbox/screen"
import { AppHeader } from "@/components/golbox/app-header"
import { SectionSkeleton } from "@/components/golbox/section-skeleton"
import { InlineError } from "@/components/golbox/inline-error"
import { useGolbox, type MenuItem } from "@/lib/golbox-context"
import type { TabId } from "@/lib/golbox-data"
import { ProductDetailScreen } from "@/components/golbox/screens/product-detail-screen"
import { CartScreen } from "@/components/golbox/screens/cart-screen"

export interface ProductOption {
  id: string
  name: string
  priceDelta: number
}

export interface CustomizationState {
  size?: ProductOption
  milk?: ProductOption
  extras: ProductOption[]
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
  { id: "ml-4", name: "Badem Sütü", priceDelta: 14 },
]

const DEFAULT_EXTRAS: ProductOption[] = [
  { id: "ex-1", name: "Ekstra Espresso Shot", priceDelta: 15 },
  { id: "ex-2", name: "Vanilya Şurubu", priceDelta: 10 },
  { id: "ex-3", name: "Karamel Şurubu", priceDelta: 10 },
  { id: "ex-4", name: "Krema", priceDelta: 8 },
]

export function MenuScreen({
  onNavigate,
  onOpenCoupons,
}: {
  onNavigate: (tab: TabId) => void
  onOpenCoupons?: () => void
}) {
  const {
    token,
    user,
    unreadCount,
    cafes,
    cafesLoadState,
    refreshData,
    favorites,
    toggleFavorite,
    foodCart,
    addToFoodCart,
  } = useGolbox()

  // STATE MANAGEMENT (SECTION 53)
  const [selectedBranchId, setSelectedBranchId] = useState<string>("branch-1")
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  
  // MODALS & CART SCREEN
  const [showCartScreen, setShowCartScreen] = useState<boolean>(false)
  const [customizingProduct, setCustomizingProduct] = useState<MenuItem | null>(null)
  const [selectedSize, setSelectedSize] = useState<ProductOption>(DEFAULT_SIZES[0])
  const [selectedMilk, setSelectedMilk] = useState<ProductOption>(DEFAULT_MILKS[0])
  const [selectedExtras, setSelectedExtras] = useState<ProductOption[]>([])
  const [quantity, setQuantity] = useState<number>(1)

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
    id: "branch-1",
    name: "Şehitkamil Merkez Kitap Kafe",
    address: "Atatürk Mah. Bulvar No:42, Şehitkamil",
    workingHours: "07:30 - 23:00",
    isOpen: true,
    gelAlAvailable: true,
    imageUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "branch-2",
    name: "GölBOX Üniversite Şubesi",
    address: "Gaziantep Üniv. Kampüsü Sosyal Bina No:12",
    workingHours: "08:00 - 22:00",
    isOpen: true,
    gelAlAvailable: true,
    imageUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "branch-3",
    name: "Dülükbaba Park Şubesi",
    address: "Dülükbaba Tabiat Parkı İçi No:5",
    workingHours: "09:00 - 21:00",
    isOpen: true,
    gelAlAvailable: true,
    imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "branch-4",
    name: "İbrahimli Kitap Kafe",
    address: "İbrahimli Mah. Turgut Özal Blv. No:88",
    workingHours: "08:00 - 23:00",
    isOpen: true,
    gelAlAvailable: true,
    imageUrl: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=500&auto=format&fit=crop&q=60"
  }
]

  const availableBranches = useMemo(() => {
    if (cafes && cafes.length > 0) return cafes
    return DEFAULT_BRANCHES
  }, [cafes])

  const activeBranch = useMemo(() => {
    return availableBranches.find(c => c.id === selectedBranchId) || availableBranches[0]
  }, [availableBranches, selectedBranchId])

  // MENU ITEMS CATALOG
  const catalogMenuItems: (MenuItem & {
    categoryId: string
    isAvailable: boolean
    isNew?: boolean
    isPopular?: boolean
    badge?: string
    studentPrice?: number
  })[] = useMemo(() => [
    {
      id: "m-1",
      categoryId: "c-hot",
      name: "GölBOX Özel Filtre Kahve",
      description: "%100 Arabica taze çekilmiş yöresel Şehitkamil demleme filtre kahve.",
      price: 35,
      imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=60",
      isAvailable: true,
      isPopular: true,
      badge: "2X GÖLPUAN",
      studentPrice: 28
    },
    {
      id: "m-2",
      categoryId: "c-hot",
      name: "Karamel Macchiato",
      description: "Yoğun espresso, kadifemsi sıcak süt ve zengin karamel sosu dokunuşu.",
      price: 65,
      imageUrl: "https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=400&auto=format&fit=crop&q=60",
      isAvailable: true,
      isPopular: true
    },
    {
      id: "m-3",
      categoryId: "c-hot",
      name: "Caffè Latte",
      description: "Zengin espresso ve buharla ısıtılmış yumuşak süt köpüğü.",
      price: 55,
      imageUrl: "https://images.unsplash.com/photo-1534778101976-62847782c213?w=400&auto=format&fit=crop&q=60",
      isAvailable: true,
      studentPrice: 45
    },
    {
      id: "m-4",
      categoryId: "c-cold",
      name: "Iced Vanilla Latte",
      description: "Buzlu taze süt, vanilya aroması ve çift shot yoğun espresso.",
      price: 70,
      imageUrl: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&auto=format&fit=crop&q=60",
      isAvailable: true,
      isNew: true,
      badge: "YENİ"
    },
    {
      id: "m-5",
      categoryId: "c-cold",
      name: "GölBOX Iced Cold Brew",
      description: "20 saat soğuk demleme özel harman sert ferahlatıcı soğuk kahve.",
      price: 60,
      imageUrl: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&auto=format&fit=crop&q=60",
      isAvailable: true
    },
    {
      id: "m-6",
      categoryId: "c-tea",
      name: "Demli Çay & Taze Simit",
      description: "Rize yaprak çayı ve günlük taze susamlı Şehitkamil fırın simidi.",
      price: 25,
      imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=60",
      isAvailable: true,
      badge: "ÇOK SEVİLEN"
    },
    {
      id: "m-7",
      categoryId: "c-dessert",
      name: "Çikolatalı Cheesecake",
      description: "GölBOX mutfağından taze günlük çikolatalı ve kıtır tabanlı cheesecake.",
      price: 85,
      imageUrl: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&auto=format&fit=crop&q=60",
      isAvailable: true
    },
    {
      id: "m-8",
      categoryId: "c-dessert",
      name: "Tereyağlı Sıcak Kruvasan",
      description: "Fransız usulü kat kat tereyağlı taze fırınlanmış sıcak kruvasan.",
      price: 55,
      imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&auto=format&fit=crop&q=60",
      isAvailable: false // Section 37: Sold out / unavailable test
    }
  ], [])

  // CATEGORIES DATA (SECTION 12 - 15)
  const categories = [
    { id: "all", name: "Tümü", icon: Coffee },
    { id: "c-hot", name: "Sıcak Kahveler", icon: Coffee },
    { id: "c-cold", name: "Soğuk Kahveler", icon: Flame },
    { id: "c-tea", name: "Çaylar", icon: Sparkles },
    { id: "c-dessert", name: "Tatlılar", icon: Sparkles },
  ]

  // SEARCH & FILTERED PRODUCTS (SECTION 9, 10, 11)
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

  // FAVORITE TOGGLE HANDLER (SECTION 31, 32, 33)
  const handleToggleFavorite = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!token) {
      setShowGuestFavoriteModal(true)
      return
    }
    toggleFavorite(productId)
  }

  // CUSTOMIZATION HANDLERS (SECTION 26 - 30)
  const handleOpenCustomize = (product: MenuItem) => {
    setCustomizingProduct(product)
    setSelectedSize(DEFAULT_SIZES[0])
    setSelectedMilk(DEFAULT_MILKS[0])
    setSelectedExtras([])
    setQuantity(1)
  }

  const handleAddCustomizedToCart = () => {
    if (!customizingProduct) return
    const unitExtra = selectedSize.priceDelta + selectedMilk.priceDelta + selectedExtras.reduce((a, b) => a + b.priceDelta, 0)
    const unitTotal = customizingProduct.price + unitExtra

    addToFoodCart(customizingProduct, quantity, `${selectedSize.name} · ${selectedMilk.name}`, unitTotal)
    setCustomizingProduct(null)
  }

  // BRANCH CHANGE RE-VALIDATION (SECTION 39)
  const handleRequestBranchChange = (newBranchId: string) => {
    if (foodCart.length > 0 && newBranchId !== selectedBranchId) {
      setPendingBranchId(newBranchId)
      setBranchChangeWarning("Şubeyi değiştirmek üzeresin. Sepetindeki ürünlerin geçerliliği yeni şube için doğrulanacaktır. Devam etmek istiyor musun?")
    } else {
      setSelectedBranchId(newBranchId)
      setShowBranchModal(false)
    }
  }

  const confirmBranchChange = () => {
    if (pendingBranchId) {
      setSelectedBranchId(pendingBranchId)
      setPendingBranchId(null)
    }
    setBranchChangeWarning(null)
    setShowBranchModal(false)
  }

  const cartItemCount = foodCart.reduce((a, b) => a + b.quantity, 0)
  const cartTotalPrice = foodCart.reduce((a, b) => a + b.totalPrice, 0)

  return (
    <Screen className={`space-y-4 ${cartItemCount > 0 ? "pb-36" : "pb-24"}`}>

      {/* 2. ŞUBE SEÇİCİ BAR (SECTION 7, 8 & UX 5, 6) */}
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
            <MapPin className="size-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Teslim Alınacak Şube</p>
            <h2 className="text-xs font-black text-foreground">{activeBranch.name}</h2>
          </div>
        </div>
        <button
          onClick={() => setShowBranchModal(true)}
          className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-extrabold text-primary hover:bg-primary/20 transition"
        >
          Değiştir
        </button>
      </div>

      {/* 3. DEBOUNCED ARAMA BAR (SECTION 9, 10 & UX 7, 8) */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Kahve, tatlı veya ürün ara..."
          className="min-h-11 w-full rounded-2xl border border-border bg-card pl-10 pr-9 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
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

      {/* 4. KATEGORİ TABS (SECTION 12 - 17 & UX 9 - 11) */}
      <div className="sticky top-0 z-10 -mx-4 bg-background/95 px-4 py-2 backdrop-blur-md border-b border-border/40">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map((cat) => {
            const Icon = cat.icon
            const isActive = selectedCategoryId === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-extrabold transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm scale-[1.02]"
                    : "border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon className="size-3.5" />
                {cat.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* 5. SON SİPARİŞ / TEKRAR SİPARİŞ KISAYOLU (SECTION 21, 47, 48 & UX 21, 22) */}
      {!searchQuery && selectedCategoryId === "all" && (
        <div className="rounded-2xl border border-border bg-card p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              <RotateCcw className="size-3.5" /> Son Siparişin
            </span>
            <span className="text-[10px] font-bold text-muted-foreground">Şehitkamil Kitap Kafe</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-foreground">GölBOX Özel Filtre Kahve</h4>
              <p className="text-[11px] text-muted-foreground">Orta Boy · Tam Yağlı Süt</p>
            </div>
            <button
              onClick={() => handleOpenCustomize(catalogMenuItems[0])}
              className="flex items-center gap-1 rounded-xl bg-accent px-3 py-1.5 text-xs font-extrabold text-primary hover:bg-accent/80"
            >
              + Tekrar Al
            </button>
          </div>
        </div>
      )}

      {/* 6. ÜRÜN LİSTESİ & KARTLARI (SECTION 18 - 25 & UX 12 - 20) */}
      <div className="space-y-3 pt-1">
        {filteredProducts.map((product) => {
          const isFav = favorites.includes(product.id)
          const isSoldOut = !product.isAvailable

          return (
            <div
              key={product.id}
              onClick={() => !isSoldOut && handleOpenCustomize(product)}
              className={`group relative flex gap-3.5 rounded-2xl border border-border bg-card p-3 shadow-xs transition-all ${
                isSoldOut ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:border-primary/40 hover:shadow-md"
              }`}
            >
              {/* PRODUCT IMAGE & BADGES */}
              <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                <img src={product.imageUrl} alt={product.name} className="size-full object-cover" />

                {/* FAVORITE BUTTON (SECTION 31 & UX 16) */}
                <button
                  onClick={(e) => handleToggleFavorite(product.id, e)}
                  className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-xs transition hover:scale-110"
                >
                  <Heart className={`size-4 ${isFav ? "fill-rose-500 text-rose-500" : "text-white"}`} />
                </button>

                {/* PROMOTION BADGES (SECTION 40 & UX 18) */}
                {product.badge && (
                  <span className="absolute left-1.5 bottom-1.5 rounded-md bg-amber-400 px-1.5 py-0.5 text-[9px] font-black text-amber-950 shadow-xs">
                    {product.badge}
                  </span>
                )}
              </div>

              {/* PRODUCT DETAILS */}
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="truncate text-sm font-extrabold text-foreground">{product.name}</h3>
                  </div>
                  <p className="line-clamp-2 text-[11px] text-muted-foreground mt-0.5">{product.description}</p>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <div>
                    {product.studentPrice ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">₺{product.studentPrice}</span>
                        <span className="text-[10px] text-muted-foreground line-through">₺{product.price}</span>
                        <span className="flex items-center gap-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 text-[9px] font-black text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800">
                          <Tag className="size-3 text-emerald-600" /> İndirimli
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs font-extrabold text-primary">₺{product.price}'den başlayan</span>
                    )}
                  </div>

                  {/* QUICK ADD / CUSTOMIZE BUTTON (SECTION 26 & UX 17) */}
                  {isSoldOut ? (
                    <span className="rounded-xl bg-destructive/10 px-2.5 py-1 text-[10px] font-extrabold text-destructive">
                      Stokta Yok
                    </span>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenCustomize(product)
                      }}
                      className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs transition hover:scale-105 active:scale-95"
                    >
                      <Plus className="size-4" strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* EMPTY SEARCH STATE (SECTION 11 & UX 31) */}
        {filteredProducts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center shadow-xs">
            <Search className="mx-auto size-10 text-muted-foreground/40" />
            <h3 className="mt-3 text-sm font-extrabold text-foreground">Aradığın ürünü bulamadık.</h3>
            <p className="mt-1 text-xs text-muted-foreground">Farklı bir arama kelimesi deneyebilir veya kategorilere göz atabilirsin.</p>
            <button
              onClick={() => {
                setSearchQuery("")
                setSelectedCategoryId("all")
              }}
              className="mt-4 rounded-xl bg-primary px-4 py-2 text-xs font-extrabold text-primary-foreground shadow-xs"
            >
              Tüm Menüyü Gör
            </button>
          </div>
        )}

        {cartItemCount > 0 && <div className="h-28 w-full" />}
      </div>

      {/* 7. FLOATING CART SUMMARY BAR (SECTION 51, 52 & UX 26) */}
      {cartItemCount > 0 && (
        <div className="fixed inset-x-4 bottom-20 z-40 flex items-center justify-between rounded-2xl bg-emerald-950 p-4 text-white shadow-2xl border border-emerald-800 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-800 text-amber-400 font-extrabold">
              <ShoppingBag className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-emerald-300 uppercase tracking-wider">{cartItemCount} Ürün Sepetinizde</p>
              <h4 className="text-base font-black text-amber-400">₺{cartTotalPrice}</h4>
            </div>
          </div>
          <button
            onClick={() => setShowCartScreen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-extrabold text-white shadow hover:bg-emerald-500 active:scale-95 transition"
          >
            Sepete Git <ChevronRight className="size-4" />
          </button>
        </div>
      )}

      {/* CART SCREEN PORTAL (SECTIONS 1 - 136) */}
      {mounted && showCartScreen && createPortal(
        <CartScreen
          onClose={() => setShowCartScreen(false)}
          onNavigateToMenu={() => setShowCartScreen(false)}
        />,
        document.body
      )}

      {/* PRODUCT DETAIL & CUSTOMIZATION SCREEN (SECTIONS 1 - 95) */}
      {mounted && customizingProduct && createPortal(
        <ProductDetailScreen
          product={customizingProduct}
          onClose={() => setCustomizingProduct(null)}
          onAddToCartSuccess={(details) => {
            addToFoodCart(details.product, details.quantity, details.configurationSummary, details.totalPrice / details.quantity)
          }}
        />,
        document.body
      )}

      {/* BRANCH SELECTOR MODAL (SECTION 7, 39) */}
      {mounted && showBranchModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl bg-card p-6 shadow-2xl border border-border text-foreground">
            <div className="flex items-center justify-between mb-4 border-b border-border/60 pb-3">
              <div>
                <h3 className="text-base font-black text-foreground flex items-center gap-2">
                  <MapPin className="size-5 text-primary" /> Teslim Alınacak Şube
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Siparişini teslim almak istediğin GölBOX şubesini seç.</p>
              </div>
              <button onClick={() => setShowBranchModal(false)} className="rounded-xl p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
                <X className="size-5" />
              </button>
            </div>

            {branchChangeWarning && (
              <div className="mb-4 rounded-2xl border border-amber-500/40 bg-amber-50 dark:bg-amber-950/40 p-3.5 text-xs text-amber-900 dark:text-amber-200">
                <p className="font-bold">⚠️ Uyarı</p>
                <p className="mt-1">{branchChangeWarning}</p>
                <div className="mt-3 flex justify-end gap-2">
                  <button onClick={() => setBranchChangeWarning(null)} className="rounded-xl border border-border bg-card px-3 py-1.5 font-bold text-foreground">
                    Vazgeç
                  </button>
                  <button onClick={confirmBranchChange} className="rounded-xl bg-amber-600 px-3 py-1.5 font-bold text-white shadow">
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
                    selectedBranchId === cafe.id
                      ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30"
                      : "border-border bg-card hover:bg-accent"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl ${selectedBranchId === cafe.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      <MapPin className="size-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-foreground">{cafe.name}</h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{cafe.address}</p>
                      <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                        ✓ Gel-Al Aktif · {"workingHours" in cafe && typeof (cafe as any).workingHours === "string" ? (cafe as any).workingHours : "07:30 - 23:00"}
                      </span>
                    </div>
                  </div>
                  {selectedBranchId === cafe.id && (
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3.5" strokeWidth={3} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* GUEST FAVORITE PROMPT MODAL (SECTION 33) */}
      {mounted && showGuestFavoriteModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-2xl border border-border text-foreground">
            <Heart className="mx-auto size-12 text-rose-500 fill-rose-500/20" />
            <h3 className="text-base font-extrabold text-foreground mt-3">Favorilerine Ekle</h3>
            <p className="mt-1 text-xs text-muted-foreground">Favori kahve ve lezzetlerini kaydetmek için oturum açmalısın.</p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setShowGuestFavoriteModal(false)}
                className="flex-1 rounded-xl border border-border bg-card py-2.5 text-xs font-bold text-foreground"
              >
                Şimdi Değil
              </button>
              <button
                onClick={() => {
                  setShowGuestFavoriteModal(false)
                  onNavigate("profile")
                }}
                className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow"
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
