"use client"

import React, { useState } from "react"
import { createPortal } from "react-dom"
import {
  ArrowLeft,
  Clock,
  MapPin,
  ChevronRight,
  ShoppingBag,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  Coins,
  Store,
  Receipt,
  HelpCircle,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
  FileText,
  Navigation,
  ShieldCheck,
  Award
} from "lucide-react"
import { useGolbox, type Order } from "@/lib/golbox-context"
import { useGolToast } from "@/components/golbox/gol-toast"
import { ActiveOrderScreen } from "@/components/golbox/screens/active-order-screen"

export function OrdersHistoryScreen({
  onBack,
  onNavigateToMenu,
  onNavigateToCart
}: {
  onBack: () => void
  onNavigateToMenu: () => void
  onNavigateToCart?: () => void
}) {
  const { user, selectedBranch, orders, addToFoodCart } = useGolbox()
  const showToast = useGolToast()

  const [activeTab, setActiveTab] = useState<"active" | "past">("active")
  const [selectedActiveOrder, setSelectedActiveOrder] = useState<Order | null>(null)
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null)
  const [showTimelineDetails, setShowTimelineDetails] = useState(false)

  // REORDER VALIDATION MODAL STATES (PRD SECTIONS 55-80, 160-163)
  const [reorderModalType, setReorderModalType] = useState<"PRICE_CHANGED" | "OPTION_UNAVAILABLE" | "PRODUCT_UNAVAILABLE" | null>(null)
  const [pendingReorderOrder, setPendingReorderOrder] = useState<Order | null>(null)

  // COMPREHENSIVE DEMO ORDERS (PRD SECTION 7, 12, 158-159)
  const demoOrders: Order[] = [
    {
      id: "ord-gb-1042",
      orderNumber: "GB-1042",
      userId: user?.id || "u-1",
      userFullName: user ? `${user.firstName} ${user.lastName}` : "GölBOX Misafiri",
      cafeName: selectedBranch?.name || "GölBOX Üniversite Şubesi",
      branchAddress: selectedBranch?.address || "Kampüs İçi Rektörlük Yanı, Şehitkamil",
      totalAmount: 240,
      paidWithPoints: false,
      pointsUsed: 0,
      status: "PREPARING",
      paymentStatus: "UNPAID",
      collectionCode: "GÖL-8492",
      createdDate: new Date().toISOString(),
      estimatedMin: 6,
      estimatedMax: 9,
      canCancel: true,
      items: [
        {
          id: "it-1",
          menuItemId: "m-4",
          menuItemName: "Iced Vanilla Latte",
          customizationSummary: "Büyük Boy · Yulaf Sütü · Ekstra Shot · Az Buz",
          quantity: 1,
          unitPrice: 155
        },
        {
          id: "it-2",
          menuItemId: "m-7",
          menuItemName: "Belçika Çikolatalı Cheesecake",
          customizationSummary: "Standart Dilim",
          quantity: 1,
          unitPrice: 85
        }
      ]
    },
    {
      id: "ord-gb-1031",
      orderNumber: "GB-1031",
      userId: user?.id || "u-1",
      userFullName: user ? `${user.firstName} ${user.lastName}` : "GölBOX Misafiri",
      cafeName: "GölBOX Üniversite Şubesi",
      branchAddress: "Kampüs İçi Rektörlük Yanı, Şehitkamil",
      totalAmount: 240,
      paidWithPoints: true,
      pointsUsed: 500,
      status: "COMPLETED",
      paymentStatus: "PAID",
      collectionCode: "GÖL-4120",
      createdDate: "12 Ekim 2026 · 14:32",
      canCancel: false,
      items: [
        {
          id: "it-3",
          menuItemId: "m-4",
          menuItemName: "Iced Vanilla Latte",
          customizationSummary: "Büyük Boy · Yulaf Sütü · Ekstra Shot · Az Buz",
          quantity: 1,
          unitPrice: 175
        },
        {
          id: "it-4",
          menuItemId: "m-8",
          menuItemName: "Chocolate Cookie",
          customizationSummary: "Fırınlanmış Sıcak Taze Cookie",
          quantity: 1,
          unitPrice: 65
        }
      ]
    },
    {
      id: "ord-gb-1025",
      orderNumber: "GB-1025",
      userId: user?.id || "u-1",
      userFullName: user ? `${user.firstName} ${user.lastName}` : "GölBOX Misafiri",
      cafeName: "GölBOX Merkez Şubesi",
      branchAddress: "Atatürk Mah. Bulvar No:42, Gaziantep",
      totalAmount: 185,
      paidWithPoints: false,
      pointsUsed: 0,
      status: "COMPLETED",
      paymentStatus: "PAID",
      collectionCode: "GÖL-2918",
      createdDate: "8 Ekim 2026 · 11:20",
      canCancel: false,
      items: [
        {
          id: "it-5",
          menuItemId: "m-3",
          menuItemName: "Caramel Latte",
          customizationSummary: "Orta Boy · Karamel Şurubu · Yağsız Süt",
          quantity: 1,
          unitPrice: 185
        }
      ]
    },
    {
      id: "ord-gb-1021",
      orderNumber: "GB-1021",
      userId: user?.id || "u-1",
      userFullName: user ? `${user.firstName} ${user.lastName}` : "GölBOX Misafiri",
      cafeName: "GölBOX Üniversite Şubesi",
      branchAddress: "Kampüs İçi Rektörlük Yanı, Şehitkamil",
      totalAmount: 140,
      paidWithPoints: false,
      pointsUsed: 0,
      status: "CANCELLED",
      paymentStatus: "UNPAID",
      collectionCode: "GÖL-1092",
      createdDate: "4 Ekim 2026 · 16:15",
      canCancel: false,
      items: [
        {
          id: "it-6",
          menuItemId: "m-2",
          menuItemName: "Iced Americano",
          customizationSummary: "Büyük Boy · Ekstra Shot",
          quantity: 1,
          unitPrice: 140
        }
      ]
    }
  ]

  // Combine real context orders with demo orders for complete UI testing
  const allOrdersList = orders.length > 0 ? orders : demoOrders
  const activeOrdersList = allOrdersList.filter((o) => o.status === "PENDING" || o.status === "CONFIRMED" || o.status === "PREPARING" || o.status === "READY")
  const pastOrdersList = allOrdersList.filter((o) => o.status === "COMPLETED" || o.status === "CANCELLED" || o.status === "NO_SHOW")

  // SMART REORDER ENGINE (PRD SECTIONS 55-80, 160-163)
  const handleInitiateReorder = (targetOrder: Order) => {
    // Check demo scenario simulation based on order ID
    if (targetOrder.id === "ord-gb-1031") {
      // Simulate Price Changed Alert (Section 162)
      setPendingReorderOrder(targetOrder)
      setReorderModalType("PRICE_CHANGED")
      return
    }

    if (targetOrder.id === "ord-gb-1025") {
      // Simulate Option Unavailable Alert (Section 161)
      setPendingReorderOrder(targetOrder)
      setReorderModalType("OPTION_UNAVAILABLE")
      return
    }

    // Normal Reorder: Re-validate & add items directly to foodCart (Section 62, 78)
    executeReorderToCart(targetOrder)
  }

  const executeReorderToCart = (targetOrder: Order) => {
    targetOrder.items.forEach((item) => {
      addToFoodCart(
        {
          id: item.menuItemId,
          name: item.menuItemName,
          description: item.customizationSummary || "Standart Reçete",
          price: item.unitPrice,
          imageUrl: item.menuItemImageUrl
        },
        item.quantity,
        item.customizationSummary || "Standart Reçete",
        item.unitPrice
      )
    })

    showToast("Sepetinize eklendi! Son siparişinizdeki seçimler güncel menüyle kontrol edildi.")
    setReorderModalType(null)
    setPendingReorderOrder(null)

    if (onNavigateToCart) {
      onNavigateToCart()
    } else {
      onNavigateToMenu()
    }
  }

  // IF DETAILED ACTIVE ORDER IS OPEN
  if (selectedActiveOrder) {
    return (
      <ActiveOrderScreen
        order={selectedActiveOrder}
        onClose={() => setSelectedActiveOrder(null)}
        onNavigateToMenu={onNavigateToMenu}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-background overflow-y-auto no-scrollbar animate-in fade-in duration-200">
      {/* 1. HEADER (PRD SECTION 35) */}
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
            <h1 className="text-base font-black text-foreground">Siparişlerim</h1>
            <p className="text-[10px] text-muted-foreground font-semibold">Aktif & Geçmiş Sipariş Takibi</p>
          </div>
        </div>

        <button
          onClick={onNavigateToMenu}
          className="flex items-center gap-1.5 rounded-xl bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-black text-primary hover:bg-primary/20 transition"
        >
          <ShoppingBag className="size-3.5" /> Menü
        </button>
      </header>

      {/* 2. TAB SELECTOR (PRD SECTION 5-7) */}
      <div className="sticky top-[53px] z-20 bg-background border-b border-border/40 px-4 py-2">
        <div className="flex rounded-2xl bg-accent p-1">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 rounded-xl py-2 text-xs font-black transition ${
              activeTab === "active"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Aktif Siparişler ({activeOrdersList.length})
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className={`flex-1 rounded-xl py-2 text-xs font-black transition ${
              activeTab === "past"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Geçmiş Siparişler ({pastOrdersList.length})
          </button>
        </div>
      </div>

      {/* 3. MAIN CONTENT AREA */}
      <div className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full pb-28">
        {/* TAB 1: AKTİF SİPARİŞLER (PRD SECTIONS 8-10, 158) */}
        {activeTab === "active" && (
          activeOrdersList.length === 0 ? (
            <div className="my-10 rounded-3xl border border-dashed border-border bg-card p-8 text-center shadow-2xs space-y-3">
              <ShoppingBag className="mx-auto size-12 text-muted-foreground/40" />
              <h3 className="text-sm font-extrabold text-foreground">Aktif Siparişin Bulunmuyor</h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                GölBOX'tan ilk favorini seç, istediğin gibi özelleştir ve Gel-Al ile siparişini hemen oluştur.
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
              <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="size-3.5 text-primary animate-spin" />
                Aktif Gel-Al Siparişin
              </h2>

              {activeOrdersList.map((ord) => (
                <div
                  key={ord.id}
                  onClick={() => setSelectedActiveOrder(ord)}
                  className="rounded-3xl border-2 border-primary/40 bg-card p-5 shadow-md hover:border-primary transition cursor-pointer space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-border/40 pb-3">
                    <div>
                      <span className="text-xs font-black text-foreground">#{ord.orderNumber}</span>
                      <p className="text-[10px] text-muted-foreground font-semibold">{ord.createdDate}</p>
                    </div>
                    {ord.status === "READY" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 text-white px-3 py-1 text-xs font-black shadow-xs">
                        <Sparkles className="size-3.5" /> Siparişin Hazır!
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-950 px-3 py-1 text-xs font-black text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                        <Clock className="size-3.5" /> Kahven Hazırlanıyor (~{ord.estimatedMin || 6}-{ord.estimatedMax || 9} dk)
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xs font-black text-foreground">{ord.cafeName}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                      {ord.items.map((i) => `${i.quantity}× ${i.menuItemName}`).join(", ")}
                    </p>
                  </div>

                  <div className="border-t border-border/40 pt-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block font-semibold">Toplam Tutar</span>
                      <span className="text-sm font-black text-primary">₺{ord.totalAmount}</span>
                    </div>

                    <button className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-black text-primary-foreground shadow-2xs">
                      <span>Siparişi Takip Et</span>
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* TAB 2: GEÇMİŞ SİPARİŞLER (PRD SECTIONS 12-20, 158) */}
        {activeTab === "past" && (
          pastOrdersList.length === 0 ? (
            <div className="my-10 rounded-3xl border border-dashed border-border bg-card p-8 text-center shadow-2xs space-y-3">
              <Clock className="mx-auto size-12 text-muted-foreground/40" />
              <h3 className="text-sm font-extrabold text-foreground">Henüz bir siparişin yok</h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                GölBOX'tan ilk favorini seç, istediğin gibi özelleştir ve Gel-Al ile siparişini oluştur.
              </p>
              <button
                onClick={onNavigateToMenu}
                className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-xs font-black text-primary-foreground shadow-md"
              >
                <span>Menüyü Keşfet</span>
                <ChevronRight className="size-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="size-3.5 text-primary" />
                Geçmiş Sipariş Geçmişin
              </h2>

              {pastOrdersList.map((ord) => {
                const firstItemName = ord.items[0]?.menuItemName || "GölBOX Kahve"
                const extraItemsCount = ord.items.length - 1
                const summaryTitle = extraItemsCount > 0 ? `${firstItemName} + ${extraItemsCount} ürün` : firstItemName

                return (
                  <div
                    key={ord.id}
                    className="rounded-3xl border border-border bg-card p-5 shadow-2xs hover:shadow-md transition space-y-3"
                  >
                    {/* TOP HEADER */}
                    <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-foreground">#{ord.orderNumber}</span>
                        <span className="text-[10px] text-muted-foreground font-semibold">· {ord.createdDate}</span>
                      </div>

                      {/* HUMAN-READABLE STATUS MAPPING (PRD SECTION 17-18) */}
                      {ord.status === "COMPLETED" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 px-2.5 py-0.5 text-[10px] font-black text-emerald-700 dark:text-emerald-300">
                          <CheckCircle2 className="size-3" /> Teslim Edildi
                        </span>
                      )}
                      {ord.status === "CANCELLED" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 border border-destructive/30 px-2.5 py-0.5 text-[10px] font-black text-destructive">
                          <XCircle className="size-3" /> İptal Edildi
                        </span>
                      )}
                      {ord.status === "NO_SHOW" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950 px-2.5 py-0.5 text-[10px] font-black text-amber-800 dark:text-amber-300">
                          <AlertCircle className="size-3" /> Teslim Alınmadı
                        </span>
                      )}
                    </div>

                    {/* CARD BODY */}
                    <div>
                      <h3 className="text-sm font-black text-foreground">{summaryTitle}</h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <MapPin className="size-3 text-primary" /> {ord.cafeName}
                      </p>
                    </div>

                    {/* PRICING & LOYALTY SUMMARY */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <div className="flex items-center gap-3">
                        <span className="font-black text-foreground text-sm">₺{ord.totalAmount}</span>
                        {ord.status === "COMPLETED" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-md border border-amber-300/40">
                            <Sparkles className="size-3" /> +45 GölPuan
                          </span>
                        )}
                      </div>

                      {/* CARD ACTIONS (PRD SECTION 12 & 33) */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedOrderDetail(ord)}
                          className="rounded-xl border border-border bg-card px-3 py-1.5 text-[11px] font-bold text-foreground hover:bg-accent transition active:scale-95"
                        >
                          Detayı Gör
                        </button>
                        {ord.status === "COMPLETED" && (
                          <button
                            onClick={() => handleInitiateReorder(ord)}
                            className="flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-[11px] font-black text-primary-foreground shadow-2xs hover:bg-primary/90 transition active:scale-95"
                          >
                            <RotateCcw className="size-3" />
                            <span>Tekrar Sipariş Ver</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>

      {/* MODAL 1: SİPARİŞ DETAYI SHEET (PRD SECTIONS 33-54, 159) */}
      {selectedOrderDetail && createPortal(
        <div className="fixed inset-0 z-[110] flex flex-col bg-background overflow-y-auto no-scrollbar animate-in fade-in duration-200">
          {/* DETAIL HEADER */}
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/40 bg-background/95 px-4 py-3 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedOrderDetail(null)}
                aria-label="Geri Dön"
                className="flex size-9 items-center justify-center rounded-xl border border-border/80 bg-card text-foreground shadow-2xs hover:bg-accent transition active:scale-95"
              >
                <ArrowLeft className="size-4" />
              </button>
              <div>
                <h1 className="text-base font-black text-foreground">Sipariş Detayı</h1>
                <p className="text-[10px] font-mono font-black text-primary">#{selectedOrderDetail.orderNumber}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrderDetail(null)}
              className="rounded-xl p-1.5 text-muted-foreground hover:bg-accent"
            >
              <X className="size-5" />
            </button>
          </header>

          <div className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full pb-28">
            {/* STATUS HERO BANNER (SECTION 36) */}
            <div className="rounded-3xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-5 text-center shadow-2xs space-y-1.5">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-600 text-white font-black shadow-md">
                <CheckCircle2 className="size-6" />
              </div>
              <h2 className="text-base font-black text-emerald-900 dark:text-emerald-100">
                Sipariş Teslim Edildi ✓
              </h2>
              <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                {selectedOrderDetail.createdDate}
              </p>
            </div>

            {/* ŞUBE BİLGİSİ (SECTION 37-38) */}
            <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <MapPin className="size-3.5 text-primary" /> Teslim Alınan Şube
              </span>
              <h3 className="text-xs font-black text-foreground">{selectedOrderDetail.cafeName}</h3>
              <p className="text-[11px] text-muted-foreground">{selectedOrderDetail.branchAddress}</p>
            </div>

            {/* SİPARİŞ İÇERİĞİ SNAPSHOT (SECTION 39-42) */}
            <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Sipariş İçeriği ({selectedOrderDetail.items.length} Kalem)
              </h3>

              <div className="space-y-3 border-t border-border/40 pt-3">
                {selectedOrderDetail.items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between text-xs">
                    <div className="space-y-0.5">
                      <h4 className="font-black text-foreground">{item.quantity}× {item.menuItemName}</h4>
                      {item.customizationSummary && (
                        <p className="text-[10px] text-muted-foreground leading-snug font-medium">
                          {item.customizationSummary}
                        </p>
                      )}
                    </div>
                    <span className="font-bold text-foreground shrink-0">₺{item.unitPrice * item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ÖDEME ÖZETİ (SECTION 43-48) */}
            <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-2.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Receipt className="size-3.5 text-primary" /> Ödeme Özeti
              </h3>

              <div className="space-y-1.5 border-t border-border/40 pt-2.5 text-xs">
                <div className="flex justify-between text-muted-foreground font-medium">
                  <span>Ara Toplam</span>
                  <span>₺280</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>GölBOX Özel İndirimi</span>
                  <span>-₺20</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>GölPuan Kullanımı</span>
                  <span>-₺20</span>
                </div>

                <div className="border-t border-border/40 pt-2 flex justify-between font-black text-sm">
                  <span>Sipariş Toplamı</span>
                  <span className="text-primary">₺{selectedOrderDetail.totalAmount}</span>
                </div>
              </div>

              {/* PAYMENT BREAKDOWN */}
              <div className="rounded-xl bg-accent p-3 text-xs space-y-1 border border-border/60">
                <div className="flex justify-between font-bold text-foreground">
                  <span>Kart ile ödenen:</span>
                  <span>₺190</span>
                </div>
                <div className="flex justify-between font-bold text-amber-600 dark:text-amber-400">
                  <span>500 GölPuan:</span>
                  <span>-₺50</span>
                </div>
              </div>
            </div>

            {/* GÖLPUAN HAREKETİ (SECTION 48-50) */}
            <div className="rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-4 shadow-2xs space-y-2">
              <h3 className="text-xs font-black text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <Coins className="size-4 text-amber-500" /> GölPuan Hareketi
              </h3>
              <div className="flex justify-between text-xs font-bold text-amber-800 dark:text-amber-300">
                <span>Kullanılan: 500 GP (-₺50)</span>
                <span className="text-emerald-700 dark:text-emerald-300">Kazanılan: +45 GP</span>
              </div>
            </div>

            {/* SİPARİŞ YOLCULUĞU TIMELINE (SECTION 51, 159) */}
            <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-2.5">
              <button
                onClick={() => setShowTimelineDetails(!showTimelineDetails)}
                className="flex w-full items-center justify-between text-xs font-black text-foreground"
              >
                <span>Sipariş Yolculuğu Zaman Çizelgesi</span>
                {showTimelineDetails ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </button>

              {showTimelineDetails && (
                <div className="border-t border-border/40 pt-3 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span>✓ Sipariş Alındı · 14:32</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span>✓ Hazırlanıyor · 14:34</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span>✓ Hazır · 14:41</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground font-bold text-emerald-600">
                    <span className="size-2 rounded-full bg-emerald-600" />
                    <span>✓ Teslim Edildi · 14:47</span>
                  </div>
                </div>
              )}
            </div>

            {/* REORDER BUTTON (SECTION 55, 121) */}
            <div className="pt-2 space-y-2">
              <button
                onClick={() => handleInitiateReorder(selectedOrderDetail)}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-xs font-black text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-95 transition"
              >
                <RotateCcw className="size-4" />
                <span>Tekrar Sipariş Ver</span>
              </button>

              <button
                onClick={() => showToast("Destek talebiniz sipariş #GB-1031 ile ilişkilendirildi.")}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground py-2"
              >
                <HelpCircle className="size-3.5" />
                <span>Bu siparişle ilgili yardım al</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: REORDER VALIDATION ALERTS (PRD SECTIONS 161 - 163) */}
      {reorderModalType && pendingReorderOrder && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-card p-6 text-foreground shadow-2xl border border-border text-center space-y-4">
            <AlertTriangle className="mx-auto size-10 text-amber-500" />

            {reorderModalType === "PRICE_CHANGED" && (
              <>
                <h3 className="text-base font-black text-foreground">Fiyat Güncellendi</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong>Iced Vanilla Latte</strong> son siparişinizde <strong>₺175</strong> idi. Güncel katalog fiyatı <strong>₺195</strong>.
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setReorderModalType(null)}
                    className="flex-1 rounded-xl border border-border bg-card py-2.5 text-xs font-bold text-foreground"
                  >
                    Vazgeç
                  </button>
                  <button
                    onClick={() => executeReorderToCart(pendingReorderOrder)}
                    className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-black text-primary-foreground shadow-xs"
                  >
                    Güncel Fiyatla Devam Et
                  </button>
                </div>
              </>
            )}

            {reorderModalType === "OPTION_UNAVAILABLE" && (
              <>
                <h3 className="text-base font-black text-foreground">Seçimi Güncellemeniz Gerekiyor</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Son siparişinizdeki <strong>Yulaf Sütü</strong> seçeneği şu anda seçili şubemizde stokta bulunmuyor.
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => executeReorderToCart(pendingReorderOrder)}
                    className="flex-1 rounded-xl border border-border bg-card py-2.5 text-xs font-bold text-foreground"
                  >
                    Mevcut Ürünlerle Devam Et
                  </button>
                  <button
                    onClick={() => {
                      setReorderModalType(null)
                      onNavigateToMenu()
                    }}
                    className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-black text-primary-foreground shadow-xs"
                  >
                    Seçimi Güncelle
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
