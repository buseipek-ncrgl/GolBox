"use client"

import React, { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import QRCode from "qrcode"
import {
  ArrowLeft,
  Clock,
  MapPin,
  QrCode,
  Store,
  Coins,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  RefreshCw,
  Navigation,
  Info,
  ChevronRight,
  AlertTriangle,
  RotateCcw
} from "lucide-react"
import { useGolbox, type Order } from "@/lib/golbox-context"
import { useGolToast } from "@/components/golbox/gol-toast"

export function ActiveOrderScreen({
  order: initialOrder,
  onClose,
  onNavigateToMenu
}: {
  order?: Order | null
  onClose?: () => void
  onNavigateToMenu: () => void
}) {
  const { user, selectedBranch, orders, cancelFoodOrder } = useGolbox()
  const showToast = useGolToast()

  // Find actual active order from context if initialOrder is not explicitly passed
  const activeOrderFromContext = orders.find(
    (o) =>
      o.status?.toUpperCase() === "PENDING" ||
      o.status?.toUpperCase() === "CONFIRMED" ||
      o.status?.toUpperCase() === "PREPARING" ||
      o.status?.toUpperCase() === "READY"
  )

  const [activeOrder, setActiveOrder] = useState<Order | null>(initialOrder || activeOrderFromContext || orders[0] || null)
  const [showQrModal, setShowQrModal] = useState(false)
  const [showSummaryDetails, setShowSummaryDetails] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [qrToken, setQrToken] = useState("QR-TOK-" + Math.floor(100000 + Math.random() * 900000))
  const [qrTimeRemaining, setQrTimeRemaining] = useState(120) // 2 min expiration timer
  const [qrModalImage, setQrModalImage] = useState<string | null>(null)

  // Keep activeOrder synchronized with context orders update
  useEffect(() => {
    if (initialOrder) {
      const updated = orders.find((o) => o.id === initialOrder.id)
      if (updated) setActiveOrder(updated)
      else setActiveOrder(initialOrder)
    } else if (activeOrderFromContext) {
      setActiveOrder(activeOrderFromContext)
    } else if (orders.length > 0) {
      setActiveOrder(orders[0])
    }
  }, [initialOrder, orders, activeOrderFromContext])

  // DYNAMIC QR IMAGE GENERATION FOR PICKUP MODAL
  useEffect(() => {
    if (!showQrModal || !activeOrder) return
    let isMounted = true
    const qrPayload = `GOLBOX-ORDER-${activeOrder.orderNumber}-${activeOrder.collectionCode}-${qrToken}`
    QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 340,
      color: { dark: "#1d5f60", light: "#ffffff" }
    })
      .then((url) => {
        if (isMounted) setQrModalImage(url)
      })
      .catch(() => {
        if (isMounted) setQrModalImage(null)
      })
    return () => {
      isMounted = false
    }
  }, [showQrModal, qrToken, activeOrder?.orderNumber, activeOrder?.collectionCode])

  // QR TOKEN EXPIRATION TIMER (SECTION 28 - 30)
  useEffect(() => {
    if (!showQrModal) return
    const interval = setInterval(() => {
      setQrTimeRemaining((prev) => {
        if (prev <= 1) {
          setQrToken("QR-TOK-" + Math.floor(100000 + Math.random() * 900000))
          return 120
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [showQrModal])

  // CANCEL ORDER HANDLER (SECTION 57 - 63)
  const handleCancelOrder = async () => {
    if (!activeOrder) return
    if (cancelFoodOrder) {
      await cancelFoodOrder(activeOrder.id)
    }
    setActiveOrder((prev) => (prev ? { ...prev, status: "CANCELLED", canCancel: false } : null))
    setShowCancelConfirm(false)
    showToast("Siparişiniz iptal edildi.")
  }

  if (!activeOrder) {
    return (
      <div className="fixed inset-0 z-[95] flex flex-col bg-background overflow-y-auto no-scrollbar animate-in fade-in duration-200">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border/40 bg-background/95 px-4 py-3 backdrop-blur-md">
          <button
            onClick={onClose || onNavigateToMenu}
            aria-label="Geri Dön"
            className="flex size-9 items-center justify-center rounded-xl border border-border/80 bg-card text-foreground shadow-2xs hover:bg-accent transition active:scale-95"
          >
            <ArrowLeft className="size-4" />
          </button>
          <h1 className="text-base font-black text-foreground">Sipariş Takibi</h1>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Clock className="size-8" />
          </div>
          <h2 className="text-base font-bold text-foreground">Aktif Siparişiniz Bulunmuyor</h2>
          <p className="text-xs text-muted-foreground max-w-xs">
            GölBOX lezzetlerini keşfetmek ve sipariş vermek için menüye göz atabilirsiniz.
          </p>
          <button
            onClick={onNavigateToMenu}
            className="rounded-2xl bg-emerald-700 px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-800 transition active:scale-95 cursor-pointer"
          >
            Menüyü Keşfet
          </button>
        </div>
      </div>
    )
  }

  const currentStatus = (activeOrder.status || "PENDING").toUpperCase()

  return (
    <div className="fixed inset-0 z-[95] flex flex-col bg-background overflow-y-auto no-scrollbar animate-in fade-in duration-200">
      {/* 1. HEADER (SECTION 10) */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/40 bg-background/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose || onNavigateToMenu}
            aria-label="Geri Dön"
            className="flex size-9 items-center justify-center rounded-xl border border-border/80 bg-card text-foreground shadow-2xs hover:bg-accent transition active:scale-95"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div>
            <h1 className="text-base font-black text-foreground">Sipariş Takibi</h1>
            <p className="text-[10px] text-muted-foreground font-extrabold">#{activeOrder.orderNumber || "GB-1042"}</p>
          </div>
        </div>

        <span className="rounded-xl bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-black text-primary">
          {currentStatus === "READY" ? "Teslime Hazır" : currentStatus === "PREPARING" ? "Hazırlanıyor" : currentStatus === "CONFIRMED" ? "Onaylandı" : currentStatus === "PENDING" ? "Sipariş Alındı" : "İşleniyor"}
        </span>
      </header>

      {/* CONTENT (SECTION 9 HIERARCHY) */}
      <div className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full pb-36">
        {/* 2. DYNAMIC STATUS HERO BANNER (SECTIONS 11, 14, 17, 21, 63) */}
        {currentStatus === "PENDING" && (
          <div className="rounded-3xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-5 text-center shadow-2xs space-y-2">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-400 text-amber-950 font-black animate-pulse">
              <Clock className="size-7" />
            </div>
            <h2 className="text-base font-black text-amber-900 dark:text-amber-200">
              Siparişin Şubeye İletildi
            </h2>
            <p className="text-xs text-amber-800 dark:text-amber-300 max-w-xs mx-auto leading-relaxed">
              <strong>{activeOrder.cafeName}</strong> baristalarının siparişini onaylamasını bekliyoruz. Onaylandığında hazırlık hemen başlayacak.
            </p>
          </div>
        )}

        {currentStatus === "CONFIRMED" && (
          <div className="rounded-3xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-5 text-center shadow-2xs space-y-2">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md">
              <CheckCircle2 className="size-7" />
            </div>
            <h2 className="text-base font-black text-emerald-900 dark:text-emerald-200">
              Siparişin Onaylandı ✓
            </h2>
            <p className="text-xs text-emerald-800 dark:text-emerald-300 max-w-xs mx-auto">
              GölBOX baristamız siparişini kabul etti. Kahven ve atıştırmalığın az sonra hazırlanmaya başlanacak.
            </p>
          </div>
        )}

        {currentStatus === "PREPARING" && (
          <div className="rounded-3xl border border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 p-5 text-center shadow-2xs space-y-2">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-md animate-bounce">
              <Sparkles className="size-7" />
            </div>
            <h2 className="text-lg font-black text-blue-900 dark:text-blue-100 flex items-center justify-center gap-1.5">
              <Sparkles className="size-5 text-amber-400" /> Kahven Hazırlanıyor
            </h2>
            <p className="text-xs text-blue-800 dark:text-blue-300 max-w-xs mx-auto">
              Baristamız siparişini özenle hazırlıyor. Hazır olduğunda telefonuna bildirim göndereceğiz.
            </p>
            <div className="pt-2">
              <span className="inline-block rounded-2xl bg-blue-600/10 px-4 py-1.5 text-xs font-black text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                Tahmini Hazırlanma: ~{activeOrder.estimatedMin || 6} – {activeOrder.estimatedMax || 9} dk
              </span>
            </div>
          </div>
        )}

        {currentStatus === "READY" && (
          <div className="rounded-3xl border border-emerald-500 bg-emerald-600 text-white p-6 text-center shadow-xl space-y-3 animate-in zoom-in-95">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-white text-emerald-600 font-black shadow-lg">
              <Sparkles className="size-9 animate-spin" style={{ animationDuration: "6s" }} />
            </div>
            <h2 className="text-xl font-black tracking-tight flex items-center justify-center gap-2">
              <Sparkles className="size-6 text-amber-300" /> Siparişin Hazır!
            </h2>
            <p className="text-xs font-medium text-emerald-100 max-w-xs mx-auto leading-relaxed">
              <strong>{activeOrder.cafeName}</strong> şubemizde seni bekliyor. Şubeye ulaştığında aşağıdaki QR butonuna dokun.
            </p>

            <button
              onClick={() => setShowQrModal(true)}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-xs font-black text-emerald-950 shadow-lg hover:bg-emerald-50 active:scale-95 transition"
            >
              <QrCode className="size-5 text-emerald-700" />
              <span>QR'ımı Göster (Teslim & Ödeme)</span>
            </button>
          </div>
        )}

        {currentStatus === "COMPLETED" && (
          <div className="rounded-3xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 p-5 text-center shadow-2xs space-y-2">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md">
              <CheckCircle2 className="size-7" />
            </div>
            <h2 className="text-lg font-black text-indigo-900 dark:text-indigo-100 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="size-5 text-indigo-600" /> Afiyet Olsun!
            </h2>
            <p className="text-xs text-indigo-800 dark:text-indigo-300 max-w-xs mx-auto">
              Siparişiniz şubemizde teslim edilmiştir. Bizi tercih ettiğiniz için teşekkür ederiz!
            </p>

            {/* LOYALTY EARN CELEBRATION (SECTION 64) */}
            <div className="mt-3 rounded-2xl bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 p-3 text-amber-900 dark:text-amber-200">
              <span className="text-xs font-black flex items-center justify-center gap-1">
                <Coins className="size-4 text-amber-500" /> +45 GölPuan Kazandınız!
              </span>
              <p className="text-[10px] text-amber-800 dark:text-amber-300 mt-0.5">
                Yeni bakiyeniz: <strong>{(user?.pointsBalance ?? 1240) + 45} GölPuan</strong>
              </p>
            </div>
          </div>
        )}

        {currentStatus === "CANCELLED" && (
          <div className="rounded-3xl border border-destructive/40 bg-destructive/10 p-5 text-center shadow-2xs space-y-2">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive text-destructive-foreground font-black">
              <X className="size-7" />
            </div>
            <h2 className="text-base font-black text-destructive">Sipariş İptal Edildi</h2>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Bu sipariş iptal edilmiştir. Yeni bir kahve siparişi vermek için menüyü keşfedebilirsiniz.
            </p>
            <button
              onClick={onNavigateToMenu}
              className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-2xs"
            >
              <RotateCcw className="size-4" />
              <span>Yeniden Sipariş Ver</span>
            </button>
          </div>
        )}

        {/* 3. PROGRESS TRACKER (SECTION 12 & 75) */}
        {currentStatus !== "CANCELLED" && (
          <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-4">
              Sipariş Yolculuğu
            </h3>

            <div className="relative flex items-center justify-between px-2">
              {/* CONNECTING LINE */}
              <div className="absolute top-4 left-6 right-6 h-0.5 bg-border -z-0" />
              <div
                className="absolute top-4 left-6 h-0.5 bg-emerald-500 transition-all duration-500 -z-0"
                style={{
                  width:
                    currentStatus === "PENDING"
                      ? "10%"
                      : currentStatus === "CONFIRMED" || currentStatus === "PREPARING"
                      ? "50%"
                      : currentStatus === "READY"
                      ? "80%"
                      : "100%"
                }}
              />

              {/* STAGE 1: ALINDI */}
              <div className="relative flex flex-col items-center gap-1 text-center z-10">
                <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500 text-white font-black text-xs shadow-2xs">
                  ✓
                </div>
                <span className="text-[10px] font-black text-foreground">Alındı</span>
              </div>

              {/* STAGE 2: HAZIRLANIYOR */}
              <div className="relative flex flex-col items-center gap-1 text-center z-10">
                <div
                  className={`flex size-8 items-center justify-center rounded-full text-xs font-black shadow-2xs transition ${
                    currentStatus === "PREPARING" || currentStatus === "CONFIRMED"
                      ? "bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-950"
                      : currentStatus === "READY" || currentStatus === "COMPLETED"
                      ? "bg-emerald-500 text-white"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {currentStatus === "READY" || currentStatus === "COMPLETED" ? "✓" : "●"}
                </div>
                <span className="text-[10px] font-black text-foreground">Hazırlanıyor</span>
              </div>

              {/* STAGE 3: HAZIR */}
              <div className="relative flex flex-col items-center gap-1 text-center z-10">
                <div
                  className={`flex size-8 items-center justify-center rounded-full text-xs font-black shadow-2xs transition ${
                    currentStatus === "READY"
                      ? "bg-amber-400 text-amber-950 ring-4 ring-amber-100 dark:ring-amber-950 animate-bounce"
                      : currentStatus === "COMPLETED"
                      ? "bg-emerald-500 text-white"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {currentStatus === "COMPLETED" ? "✓" : "★"}
                </div>
                <span className="text-[10px] font-black text-foreground">Hazır</span>
              </div>

              {/* STAGE 4: TESLİM EDİLDİ */}
              <div className="relative flex flex-col items-center gap-1 text-center z-10">
                <div
                  className={`flex size-8 items-center justify-center rounded-full text-xs font-black shadow-2xs transition ${
                    currentStatus === "COMPLETED"
                      ? "bg-emerald-600 text-white"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {currentStatus === "COMPLETED" ? "✓" : "○"}
                </div>
                <span className="text-[10px] font-black text-foreground">Teslim</span>
              </div>
            </div>
          </div>
        )}

        {/* 4. ŞUBE BİLGİSİ & YOL TARİFİ (SECTION 75 & 76) */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MapPin className="size-3.5 text-primary" />
              Teslim Alma Şubesi
            </span>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(activeOrder.cafeName)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 rounded-xl bg-primary/10 border border-primary/20 px-2.5 py-1 text-[10px] font-black text-primary hover:bg-primary/20 transition"
            >
              <Navigation className="size-3" /> Yol Tarifi
            </a>
          </div>

          <div>
            <h4 className="text-xs font-black text-foreground">{activeOrder.cafeName}</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">{activeOrder.branchAddress}</p>
          </div>
        </div>

        {/* 5. ÖDEME VE GÖLPUAN BİLGİSİ (SECTION 23 & 33) */}
        {currentStatus !== "COMPLETED" && (
          <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex size-8 items-center justify-center rounded-xl bg-amber-400 text-amber-950 font-black shrink-0">
                <Store className="size-4.5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-foreground flex items-center gap-1">
                  Ödeme Şubede Yapılacaktır <Store className="size-3.5 text-primary" />
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                  Mobil uygulamadan ödeme alınmaz. Teslim alırken kasada nakit veya kredi kartınla <strong>₺{activeOrder.totalAmount}</strong> ödeme yapabilirsin.
                </p>
              </div>
            </div>

            <div className="border-t border-border/40 pt-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="size-4 text-amber-500" />
                <span className="text-xs font-bold text-foreground">
                  Bakiyeniz: <strong className="text-amber-600 dark:text-amber-400">{user?.pointsBalance ?? 1240} GP</strong>
                </span>
              </div>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-md">
                Kasada QR ile Kullan
              </span>
            </div>
          </div>
        )}

        {/* 6. SİPARİŞ İÇERİĞİ ACCORDION (SECTION 78 & 79) */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
          <button
            onClick={() => setShowSummaryDetails(!showSummaryDetails)}
            className="flex w-full items-center justify-between text-xs font-black text-foreground"
          >
            <span>Sipariş İçeriği ({activeOrder.items.length} Kalem)</span>
            {showSummaryDetails ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>

          {showSummaryDetails && (
            <div className="mt-3 border-t border-border/40 pt-3 space-y-2.5">
              {activeOrder.items.map((item) => (
                <div key={item.id} className="flex items-start justify-between text-xs">
                  <div>
                    <h5 className="font-bold text-foreground">{item.quantity}× {item.menuItemName}</h5>
                    {item.customizationSummary && (
                      <p className="text-[10px] text-muted-foreground leading-tight">{item.customizationSummary}</p>
                    )}
                  </div>
                  <span className="font-bold text-foreground shrink-0">₺{item.unitPrice * item.quantity}</span>
                </div>
              ))}
              <div className="border-t border-border/40 pt-2 flex justify-between font-black text-sm">
                <span>Toplam Sipariş Tutarı</span>
                <span className="text-primary">₺{activeOrder.totalAmount}</span>
              </div>
            </div>
          )}
        </div>

        {/* 7. İPTAL BUTONU (SECTION 61) */}
        {activeOrder.canCancel && (
          <div className="text-center pt-2">
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="text-xs font-bold text-destructive hover:underline"
            >
              Siparişi İptal Et
            </button>
          </div>
        )}
      </div>

      {/* 8. STICKY BOTTOM BUTTON (READY AKA QR BUTTON) (SECTION 22) */}
      {currentStatus === "READY" && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-4 backdrop-blur-md">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => setShowQrModal(true)}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 dark:bg-emerald-500 py-3.5 text-xs font-black text-white shadow-lg hover:bg-emerald-700 active:scale-95 transition"
            >
              <QrCode className="size-5" />
              <span>QR'ımı Göster (Teslim & Ödeme)</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: PICKUP QR SHEET (SECTION 24, 27, 31) */}
      {showQrModal && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-2xl border border-border text-foreground">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  GölBOX Dijital Müşteri Kimliği
                </span>
                <h3 className="text-xs font-black text-foreground">Sipariş #{activeOrder.orderNumber}</h3>
              </div>
              <button onClick={() => setShowQrModal(false)} className="rounded-xl p-1 text-muted-foreground hover:bg-accent">
                <X className="size-5" />
              </button>
            </div>

            {/* QR CONTAINER */}
            <div className="my-5 rounded-3xl border-2 border-primary/40 bg-white p-5 shadow-inner text-center">
              <div className="mx-auto flex size-44 items-center justify-center rounded-2xl bg-white p-2 border border-slate-200 shadow-sm">
                {qrModalImage ? (
                  <img
                    src={qrModalImage}
                    alt="GölBOX QR Kodu"
                    className="size-full object-contain rounded-xl"
                  />
                ) : (
                  <div className="size-full flex flex-col items-center justify-center text-slate-900 bg-white p-2 rounded-xl border border-slate-200">
                    <RefreshCw className="size-8 text-primary animate-spin" />
                    <span className="text-[10px] text-muted-foreground font-bold mt-2">QR Oluşturuluyor...</span>
                  </div>
                )}
              </div>
              <span className="text-xs font-mono font-black mt-3 text-emerald-900 tracking-wider block">
                {activeOrder.collectionCode}
              </span>

              {/* DYNAMIC TOKEN EXPIRATION (SECTION 28 - 30) */}
              <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] font-extrabold text-muted-foreground">
                <RefreshCw className="size-3 animate-spin text-primary" />
                <span>QR Güvenlik Süresi: {qrTimeRemaining}s (Otomatik Yenilenir)</span>
              </div>
            </div>

            {/* INSTRUCTIONS FOR BARISTA */}
            <div className="rounded-2xl bg-accent p-3 text-left text-[11px] font-medium text-foreground space-y-1">
              <span className="font-extrabold text-primary flex items-center gap-1">
                <Info className="size-3.5" /> Kasadaki Baristaya Gösterin:
              </span>
              <p className="leading-snug text-muted-foreground">
                Bu QR ile siparişiniz hemen bulunur, birikmiş GölPuanlarınız görüntülenir ve ödemeniz tamamlanarak kahveniz teslim edilir.
              </p>
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="mt-4 w-full rounded-2xl bg-primary py-3 text-xs font-black text-primary-foreground shadow-md active:scale-95"
            >
              Tamam
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: CANCEL ORDER CONFIRMATION (SECTION 62) */}
      {showCancelConfirm && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-2xl border border-border text-foreground">
            <AlertTriangle className="mx-auto size-10 text-amber-500" />
            <h3 className="text-base font-extrabold text-foreground mt-3">Siparişini iptal etmek istiyor musun?</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              İptal ettikten sonra bu sipariş baristamız tarafından hazırlanmayacaktır.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 rounded-xl border border-border bg-card py-2.5 text-xs font-bold text-foreground"
              >
                Vazgeç
              </button>
              <button
                onClick={handleCancelOrder}
                className="flex-1 rounded-xl bg-destructive py-2.5 text-xs font-bold text-destructive-foreground shadow-xs"
              >
                Siparişi İptal Et
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
