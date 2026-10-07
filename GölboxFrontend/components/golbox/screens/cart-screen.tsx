"use client"

import React, { useState, useMemo } from "react"
import { createPortal } from "react-dom"
import {
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  MapPin,
  ChevronRight,
  Sparkles,
  GraduationCap,
  Tag,
  Check,
  AlertTriangle,
  Info,
  ShoppingBag,
  Clock,
  RotateCcw,
  X,
  Store,
  ChevronDown
} from "lucide-react"
import { useGolbox, type FoodCartItem, type MenuItem } from "@/lib/golbox-context"
import { useGolToast } from "@/components/golbox/gol-toast"
import { ProductDetailScreen } from "@/components/golbox/screens/catalog-product-detail-screen"
import { GelAlSummaryScreen } from "@/components/golbox/screens/gel-al-summary-screen"

const CROSS_SELL_ITEMS: (MenuItem & { studentPrice?: number })[] = [
  {
    id: "cs-1",
    name: "Fındıklı Chocolate Cookie",
    description: "Taze fırınlanmış fındıklı belçika çikolatalı kurabiye",
    price: 65,
    imageUrl: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&auto=format&fit=crop&q=60"
  },
  {
    id: "cs-2",
    name: "Sıcak Çikolatalı Brownie",
    description: "Yoğun bitter çikolatalı ıslak kek",
    price: 75,
    imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&auto=format&fit=crop&q=60"
  },
  {
    id: "cs-3",
    name: "Geleneksel Çıtır Simit & Peynir",
    description: "Taze susamlı simit ve beyaz peynir tabağı",
    price: 45,
    imageUrl: "https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=400&auto=format&fit=crop&q=60"
  }
]

export function CartScreen({
  onClose,
  onNavigateToMenu,
  onNavigateToQr,
}: {
  onClose?: () => void
  onNavigateToMenu: () => void
  onNavigateToQr?: () => void
}) {
  const {
    token,
    user,
    foodCart,
    selectedBranch,
    setSelectedBranch,
    updateFoodCartQuantity,
    updateFoodCartCustomization,
    removeFromFoodCart,
    clearFoodCart,
    addToFoodCart,
    cafes
  } = useGolbox()

  const showToast = useGolToast()

  // MODALS & NAVIGATION STATES
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [itemToRemove, setItemToRemove] = useState<FoodCartItem | null>(null)
  const [editingItem, setEditingItem] = useState<FoodCartItem | null>(null)
  const [showBranchModal, setShowBranchModal] = useState(false)
  const [pendingBranch, setPendingBranch] = useState<{ id: string; name: string; address: string } | null>(null)
  const [showBranchChangeWarning, setShowBranchChangeWarning] = useState(false)
  const [showGelAlSummary, setShowGelAlSummary] = useState(false)

  // COUPON CODE STATE (SECTION 47 & 48)
  const [showCouponInput, setShowCouponInput] = useState(false)
  const [couponCode, setCouponCode] = useState("")
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number; label: string } | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)

  // DYNAMIC CROSS-SELL ITEMS EXCLUDING ITEMS ALREADY IN CART
  const dynamicCrossSellItems = useMemo(() => {
    const cartProductIds = new Set(foodCart.map((fc) => fc.product.id))
    const allMenuItems = cafes.flatMap((c) => c.menuItems || [])
    const availableItems = allMenuItems.filter((m) => !cartProductIds.has(m.id))
    if (availableItems.length > 0) {
      return availableItems.slice(0, 4)
    }
    return CROSS_SELL_ITEMS.filter((m) => !cartProductIds.has(m.id))
  }, [cafes, foodCart])

  // CALCULATED TOTALS (SECTION 41)
  const subtotal = useMemo(() => {
    return foodCart.reduce((sum, item) => sum + item.totalPrice, 0)
  }, [foodCart])

  const studentDiscount = useMemo(() => {
    // GölBOX Member discount - 15 TL off coffee drinks for members
    if (user?.educationLevel || token) {
      return foodCart.length > 0 ? 15 : 0
    }
    return 0
  }, [foodCart, token, user])

  const couponDiscount = appliedDiscount ? appliedDiscount.amount : 0
  const totalDiscount = studentDiscount + couponDiscount
  const finalTotal = Math.max(0, subtotal - totalDiscount)

  // HANDLER: APPLY COUPON CODE (SECTION 48 & 49)
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault()
    setCouponError(null)
    const code = couponCode.trim().toUpperCase()

    if (!code) {
      setCouponError("Lütfen bir kupon kodu giriniz.")
      return
    }

    if (code === "GOLBOX20") {
      setAppliedDiscount({ code, amount: 20, label: "GölBOX 20 TL İndirimi" })
      showToast("Kupon başarıyla uygulandı! 🎉")
      setCouponCode("")
      setShowCouponInput(false)
    } else if (code === "GOLBOX10" || code === "KAHVE10") {
      setAppliedDiscount({ code, amount: 15, label: "GölBOX Özel İndirimi" })
      showToast("GölBOX indirim kuponu uygulandı! 🎉")
      setCouponCode("")
      setShowCouponInput(false)
    } else {
      setCouponError("Bu kampanya kodu geçerli veya aktif değil.")
    }
  }

  // HANDLER: BRANCH CHANGE CONFIRMATION (SECTION 13 & 14)
  const handleConfirmBranchChange = () => {
    if (pendingBranch) {
      setSelectedBranch(pendingBranch)
      setPendingBranch(null)
      setShowBranchChangeWarning(false)
      setShowBranchModal(false)
      showToast(`Teslimat şubesi "${pendingBranch.name}" olarak güncellendi.`)
    }
  }

  // HANDLER: PROCEED TO GEL-AL (SECTION 40 & 114)
  const handleProceedToGelAl = () => {
    // Check if any invalid items
    const invalidItem = foodCart.find(i => i.isAvailable === false)
    if (invalidItem) {
      showToast(`Devam etmek için sepetindeki uygun olmayan ürünü kaldır: ${invalidItem.product.name}`)
      return
    }
    setShowGelAlSummary(true)
  }

  // IF RENDERING GEL-AL SUMMARY SCREEN (SECTION 117 & 136)
  if (showGelAlSummary) {
    return (
      <GelAlSummaryScreen
        subtotal={subtotal}
        discount={totalDiscount}
        finalTotal={finalTotal}
        onBack={() => setShowGelAlSummary(false)}
        onOrderCompleted={() => {
          clearFoodCart()
          if (onClose) onClose()
          if (onNavigateToQr) {
            onNavigateToQr()
          } else {
            onNavigateToMenu()
          }
        }}
      />
    )
  }

  return (
    <div className="w-full flex-1 flex flex-col px-4 py-3 pb-24 animate-in fade-in duration-200">
      {/* IN-PAGE TITLE HEADER */}
      <header className="space-y-1 mb-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Sepetim</h1>
          {foodCart.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-1.5 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/20 transition active:scale-95 cursor-pointer"
            >
              <Trash2 className="size-3.5" />
              <span>Temizle</span>
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {foodCart.length > 0 ? `${foodCart.length} Farklı Ürün · ${foodCart.reduce((a, b) => a + b.quantity, 0)} Adet` : "Henüz ürün eklenmedi"}
        </p>
      </header>

      {/* MAIN CART CONTENT */}
      <div className="flex-1 space-y-4 max-w-lg mx-auto w-full pb-6">
        {/* 2. SEÇİLİ ŞUBE KARTI (SECTION 10 & 11) */}
        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
                <MapPin className="size-4" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Teslim Alacağın Şube
                </span>
                <h2 className="text-xs font-black text-foreground mt-0.5">{selectedBranch.name}</h2>
                <p className="text-[11px] text-muted-foreground line-clamp-1">{selectedBranch.address}</p>
                <span className="mt-1 inline-flex items-center gap-1 text-[9.5px] font-extrabold text-emerald-600 dark:text-emerald-400">
                  ✓ Gel-Al Siparişe Açık · 07:30 - 23:00
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowBranchModal(true)}
              className="rounded-xl border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-[11px] font-black text-primary hover:bg-primary/20 transition active:scale-95 shrink-0"
            >
              Değiştir
            </button>
          </div>
        </div>

        {/* 3. SEPET BOŞ DURUMU (SECTION 58 & 59) */}
        {foodCart.length === 0 ? (
          <div className="my-8 rounded-3xl border border-dashed border-border bg-card/60 p-8 text-center shadow-2xs">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShoppingBag className="size-8" />
            </div>
            <h3 className="mt-4 text-base font-extrabold text-foreground">Sepetin Henüz Boş</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
              Favori lezzetlerini seç, damak tadına göre özelleştir ve Gel-Al siparişini kolayca tamamla.
            </p>
            <button
              onClick={() => {
                if (onClose) onClose()
                onNavigateToMenu()
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-xs font-black text-primary-foreground shadow-md hover:opacity-90 active:scale-95 transition"
            >
              <span>Menüyü Keşfet</span>
              <ChevronRight className="size-4" />
            </button>
          </div>
        ) : (
          <>
            {/* 4. SEPET ÜRÜNLERİ LİSTESİ (SECTION 16 - 33) */}
            <div className="space-y-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground px-1">
                Sipariş Edilen Ürünler ({foodCart.length})
              </h2>

              {foodCart.map((cartItem) => {
                const isUnavailable = cartItem.isAvailable === false

                return (
                  <div
                    key={cartItem.id}
                    className={`relative flex gap-3 rounded-2xl border p-3.5 shadow-2xs transition bg-card ${isUnavailable ? "border-destructive/50 bg-destructive/5" : "border-border hover:border-primary/40"
                      }`}
                  >
                    {/* THUMBNAIL */}
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                      <img
                        src={cartItem.product.imageUrl || "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=60"}
                        alt={cartItem.product.name}
                        className="size-full object-cover"
                      />
                    </div>

                    {/* CONTENT & CUSTOMIZATION */}
                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h3 className="truncate text-xs font-black text-foreground">{cartItem.product.name}</h3>
                          <button
                            onClick={() => setItemToRemove(cartItem)}
                            aria-label={`${cartItem.product.name} ürününü kaldır`}
                            className="text-muted-foreground/60 hover:text-destructive p-1 rounded-lg transition"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>

                        {/* CUSTOMIZATION SUMMARY (SECTION 20) */}
                        <p className="text-[11px] font-medium text-muted-foreground mt-0.5 leading-snug">
                          {cartItem.customizationSummary}
                        </p>

                        {/* UNAVAILABLE WARNING (SECTION 38) */}
                        {isUnavailable && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-destructive">
                            <AlertTriangle className="size-3" />
                            <span>Bu şubede şu an tükenmiştir.</span>
                          </div>
                        )}
                      </div>

                      {/* ACTIONS: DÜZENLE, STEPPER & PRICE */}
                      <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2">
                        {/* EDIT BUTTON (SECTION 22 & 23) */}
                        <button
                          onClick={() => setEditingItem(cartItem)}
                          className="text-[11px] font-black text-primary hover:underline"
                        >
                          Düzenle
                        </button>

                        <div className="flex items-center gap-3">
                          {/* QUANTITY STEPPER (SECTION 25) */}
                          <div className="flex items-center gap-2 rounded-xl bg-accent p-0.5">
                            <button
                              onClick={() => {
                                if (cartItem.quantity === 1) {
                                  setItemToRemove(cartItem)
                                } else {
                                  updateFoodCartQuantity(cartItem.id, cartItem.quantity - 1)
                                }
                              }}
                              aria-label={`${cartItem.product.name} adedini azalt`}
                              className="flex size-6 items-center justify-center rounded-lg bg-card text-foreground font-bold shadow-2xs active:scale-95"
                            >
                              <Minus className="size-3" />
                            </button>
                            <span className="w-4 text-center text-xs font-black text-foreground">
                              {cartItem.quantity}
                            </span>
                            <button
                              onClick={() => updateFoodCartQuantity(cartItem.id, cartItem.quantity + 1)}
                              aria-label={`${cartItem.product.name} adedini artır`}
                              className="flex size-6 items-center justify-center rounded-lg bg-card text-foreground font-bold shadow-2xs active:scale-95"
                            >
                              <Plus className="size-3" />
                            </button>
                          </div>

                          {/* TOTAL PRICE */}
                          <span className="text-xs font-black text-foreground min-w-[50px] text-right">
                            ₺{cartItem.totalPrice}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 5. "SİPARİŞİNİN YANINA" DYNAMIC CROSS-SELL (SECTION 54 & 55) */}
            {dynamicCrossSellItems.length > 0 && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground px-1">
                    Siparişinin Yanına Çok Yakışır
                  </h3>
                </div>
                <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                  {dynamicCrossSellItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex w-36 shrink-0 flex-col justify-between rounded-2xl border border-border bg-card p-2 shadow-2xs hover:border-emerald-600/40 transition"
                    >
                      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted mb-1.5">
                        <img
                          src={item.imageUrl || "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&q=80"}
                          alt={item.name}
                          className="size-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="truncate text-[11px] font-black text-foreground">{item.name}</h4>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                            ₺{item.price}
                          </span>
                          <button
                            onClick={() => {
                              addToFoodCart(item, 1, "Standart Lezzet", item.price)
                              showToast(`${item.name} sepetinize eklendi.`)
                            }}
                            aria-label={`${item.name} sepete ekle`}
                            className="flex size-6 items-center justify-center rounded-lg bg-emerald-700 text-white shadow-2xs hover:scale-105 active:scale-95 cursor-pointer"
                          >
                            <Plus className="size-3.5" strokeWidth={3} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. KUPON & KAMPANYA ALANI (SECTION 46 - 49) */}
            <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="size-4 text-amber-500" />
                  <span className="text-xs font-bold text-foreground">Kampanya & İndirim Kuponu</span>
                </div>
                {!appliedDiscount && (
                  <button
                    onClick={() => setShowCouponInput(!showCouponInput)}
                    className="text-[11px] font-black text-primary hover:underline"
                  >
                    {showCouponInput ? "Kapat" : "Kupon Gir"}
                  </button>
                )}
              </div>

              {/* APPLIED DISCOUNT DISPLAY */}
              {appliedDiscount ? (
                <div className="mt-2.5 flex items-center justify-between rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 p-2.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-600" />
                    <span>{appliedDiscount.label} (-₺{appliedDiscount.amount})</span>
                  </div>
                  <button
                    onClick={() => {
                      setAppliedDiscount(null)
                      showToast("Kupon kaldırıldı.")
                    }}
                    className="text-muted-foreground hover:text-foreground text-[10px]"
                  >
                    Kaldır
                  </button>
                </div>
              ) : showCouponInput ? (
                <form onSubmit={handleApplyCoupon} className="mt-2.5 space-y-1.5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Örn: GOLBOX20"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground placeholder:text-muted-foreground uppercase"
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-primary px-4 py-2 text-xs font-extrabold text-primary-foreground shadow-2xs active:scale-95"
                    >
                      Uygula
                    </button>
                  </div>
                  {couponError && <p className="text-[10px] font-bold text-destructive">{couponError}</p>}
                </form>
              ) : null}

              {/* GÖLBOX İNDİRİM BANNER */}
              {studentDiscount > 0 && (
                <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 p-2 text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300">
                  <Sparkles className="size-4 shrink-0 text-amber-500" />
                  <span>GölBOX Üyelik Özel İndirimi ₺15 Uygulandı!</span>
                </div>
              )}
            </div>

            {/* 7. SİPARİŞ ÖZETİ (SECTION 41 & 42) */}
            <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-1">
                Sipariş Özeti
              </h3>
              <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                <span>Ara Toplam</span>
                <span>₺{subtotal}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-xs text-primary font-extrabold">
                  <span>Toplam İndirim</span>
                  <span>-₺{totalDiscount}</span>
                </div>
              )}
              <div className="border-t border-border/60 pt-2 flex justify-between text-sm font-black text-foreground">
                <span>Toplam Tutar</span>
                <span className="text-base text-primary font-extrabold">₺{finalTotal}</span>
              </div>
            </div>

            {/* 8. ŞUBEDE ÖDEME BİLGİLENDİRMESİ (SECTION 43 & 113) */}
            <div className="rounded-2xl bg-primary/5 dark:bg-primary/15 border border-primary/20 p-3.5 flex items-start gap-3">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black shrink-0 mt-0.5">
                <Info className="size-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-primary">
                  Ödemeni Şubede Yapacaksın
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                  GölBOX uygulamasında kredi kartı istenmez. Siparişini teslim alırken şubede nakit veya POS kartınızla ödeme yapabilirsiniz.
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 9. STICKY BOTTOM GEL-AL'A DEVAM ET BAR (SECTION 44, 45 & 100) */}
      {foodCart.length > 0 && (
        <div className="sticky bottom-0 z-20 mt-4 border-t border-border/80 bg-card/95 p-3.5 backdrop-blur-md shadow-lg rounded-2xl">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Şubede Ödenecek
              </span>
              <h3 className="text-lg font-black text-primary">₺{finalTotal}</h3>
            </div>

            <button
              onClick={handleProceedToGelAl}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-xs font-black text-primary-foreground shadow-md hover:bg-primary/90 active:scale-95 transition cursor-pointer"
            >
              <span>Gel-Al'a Devam Et</span>
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: CLEAR CART CONFIRMATION (SECTION 9) */}
      {showClearConfirm && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-2xl border border-border text-foreground">
            <Trash2 className="mx-auto size-10 text-destructive" />
            <h3 className="text-base font-extrabold text-foreground mt-3">Sepeti temizlemek istiyor musun?</h3>
            <p className="mt-1 text-xs text-muted-foreground">Sepetindeki tüm ürünler kaldırılacak. Bu işlem geri alınamaz.</p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 rounded-xl border border-border bg-card py-2.5 text-xs font-bold text-foreground"
              >
                Vazgeç
              </button>
              <button
                onClick={() => {
                  clearFoodCart()
                  setShowClearConfirm(false)
                  showToast("Sepetiniz temizlendi.")
                }}
                className="flex-1 rounded-xl bg-destructive py-2.5 text-xs font-bold text-destructive-foreground shadow-xs"
              >
                Sepeti Temizle
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: REMOVE SINGLE ITEM CONFIRMATION (SECTION 26 & 27) */}
      {itemToRemove && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-2xl border border-border text-foreground">
            <Trash2 className="mx-auto size-10 text-amber-500" />
            <h3 className="text-base font-extrabold text-foreground mt-3">Ürünü sepetten kaldır?</h3>
            <p className="mt-1 text-xs text-muted-foreground font-semibold">"{itemToRemove.product.name}" sepetinden çıkarılacak.</p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setItemToRemove(null)}
                className="flex-1 rounded-xl border border-border bg-card py-2.5 text-xs font-bold text-foreground"
              >
                Vazgeç
              </button>
              <button
                onClick={() => {
                  removeFromFoodCart(itemToRemove.id)
                  showToast(`${itemToRemove.product.name} sepetten kaldırıldı.`)
                  setItemToRemove(null)
                }}
                className="flex-1 rounded-xl bg-destructive py-2.5 text-xs font-bold text-destructive-foreground shadow-xs"
              >
                Kaldır
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 3: EDIT PRODUCT CUSTOMIZATION (SECTION 22 - 24) */}
      {editingItem && createPortal(
        <ProductDetailScreen
          product={editingItem.product}
          onClose={() => setEditingItem(null)}
          onAddToCartSuccess={(details) => {
            updateFoodCartCustomization(editingItem.id, details.configurationSummary, details.totalPrice / details.quantity)
            showToast(`${details.product.name} özelleştirmesi güncellendi!`)
            setEditingItem(null)
          }}
        />,
        document.body
      )}

      {/* MODAL 4: BRANCH SELECTOR (SECTION 13 - 15) */}
      {showBranchModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl bg-card p-5 shadow-2xl border border-border text-foreground">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Store className="size-5 text-primary" />
                <h3 className="text-sm font-black text-foreground">Teslim Şubesi Seç</h3>
              </div>
              <button onClick={() => setShowBranchModal(false)} className="rounded-xl p-1 text-muted-foreground hover:bg-accent">
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {cafes.map((cafe, cafeIndex) => (
                <div
                  key={`${cafe.id}-${cafeIndex}`}
                  onClick={() => {
                    if (foodCart.length > 0 && selectedBranch.id !== cafe.id) {
                      setPendingBranch(cafe)
                      setShowBranchChangeWarning(true)
                    } else {
                      setSelectedBranch(cafe)
                      setShowBranchModal(false)
                    }
                  }}
                  className={`flex items-center justify-between rounded-2xl border p-3 cursor-pointer transition ${selectedBranch.id === cafe.id
                      ? "border-primary bg-primary/10 shadow-2xs"
                      : "border-border bg-card hover:bg-accent"
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-7 items-center justify-center rounded-xl bg-primary/20 text-primary">
                      <MapPin className="size-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-foreground">{cafe.name}</h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{cafe.address}</p>
                    </div>
                  </div>
                  {selectedBranch.id === cafe.id && (
                    <div className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
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

      {/* MODAL 5: BRANCH CHANGE WARNING CONFIRMATION (SECTION 14) */}
      {showBranchChangeWarning && pendingBranch && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-2xl border border-border text-foreground">
            <AlertTriangle className="mx-auto size-10 text-amber-500" />
            <h3 className="text-base font-extrabold text-foreground mt-3">Şubeyi değiştirmek üzeresin</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Ürünlerin fiyatı veya stok durumu seçtiğin yeni şubeye ({pendingBranch.name}) göre kontrol edilecek.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => {
                  setPendingBranch(null)
                  setShowBranchChangeWarning(false)
                }}
                className="flex-1 rounded-xl border border-border bg-card py-2.5 text-xs font-bold text-foreground"
              >
                Vazgeç
              </button>
              <button
                onClick={handleConfirmBranchChange}
                className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-xs"
              >
                Şubeyi Değiştir
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
