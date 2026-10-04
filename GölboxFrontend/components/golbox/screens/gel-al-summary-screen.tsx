"use client"

import React, { useState } from "react"
import { createPortal } from "react-dom"
import {
  ArrowLeft,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info,
  ShoppingBag,
  Sparkles,
  Phone,
  User,
  QrCode,
  ChevronRight,
  ShieldCheck,
  Store,
  Coins,
  AlertTriangle
} from "lucide-react"
import { useGolbox } from "@/lib/golbox-context"
import { useGolToast } from "@/components/golbox/gol-toast"
import { OrderSuccessScreen } from "@/components/golbox/screens/order-success-screen"

export function GelAlSummaryScreen({
  subtotal,
  discount,
  finalTotal,
  onBack,
  onOrderCompleted
}: {
  subtotal: number
  discount: number
  finalTotal: number
  onBack: () => void
  onOrderCompleted: () => void
}) {
  const { token, user, selectedBranch, foodCart } = useGolbox()
  const showToast = useGolToast()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAuthGateModal, setShowAuthGateModal] = useState(false)
  const [orderSuccessModal, setOrderSuccessModal] = useState<{
    orderNumber: string
    collectionCode: string
    estimatedMin: number
    estimatedMax: number
  } | null>(null)

  // GENERATE HUMAN-READABLE ORDER NUMBER & COLLECTION CODE (SECTION 69)
  const orderNumber = "GB-" + Math.floor(1000 + Math.random() * 9000)
  const collectionCode = "GÖL-" + Math.floor(1000 + Math.random() * 9000)

  // SUBMIT GEL-AL ORDER HANDLER (SECTION 52 - 56)
  const handleSendOrder = () => {
    // 1. Auth check (Section 39)
    if (!token) {
      setShowAuthGateModal(true)
      return
    }

    if (isSubmitting) return
    setIsSubmitting(true)

    // Simulate backend Order creation API call (Section 61 & 87)
    setTimeout(() => {
      setIsSubmitting(false)
      setOrderSuccessModal({
        orderNumber,
        collectionCode,
        estimatedMin: 8,
        estimatedMax: 12
      })
      showToast(`Siparişiniz ${orderNumber} numarası ile şubeye iletildi! ☕`)
    }, 900)
  }

  // STATUS INDICATOR FOR BRANCH GEL-AL (SECTION 9 & 10)
  const isBranchGelAlOpen = true

  if (orderSuccessModal) {
    return (
      <OrderSuccessScreen
        orderNumber={orderSuccessModal.orderNumber}
        collectionCode={orderSuccessModal.collectionCode}
        estimatedMin={orderSuccessModal.estimatedMin}
        estimatedMax={orderSuccessModal.estimatedMax}
        totalAmount={finalTotal}
        foodCartSnapshot={foodCart}
        onTrackOrder={onOrderCompleted}
        onGoHome={onOrderCompleted}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background overflow-y-auto no-scrollbar animate-in fade-in duration-200">
      {/* 1. HEADER (SECTION 6) */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border/40 bg-background/95 px-4 py-3 backdrop-blur-md">
        <button
          onClick={onBack}
          aria-label="Geri Dön"
          className="flex size-9 items-center justify-center rounded-xl border border-border/80 bg-card text-foreground shadow-2xs hover:bg-accent transition active:scale-95"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div>
          <h1 className="text-base font-black text-foreground">Gel-Al Sipariş Özeti</h1>
          <p className="text-[10px] text-muted-foreground font-semibold">Son Kontrol & Şubeye Gönderim</p>
        </div>
      </header>

      {/* CONTENT (SECTION 5 HIERARCHY) */}
      <div className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full pb-36">
        {/* 2. TESLİM ALACAĞIN ŞUBE (SECTION 7 - 10) */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MapPin className="size-3.5 text-primary" />
              Teslim Alacağın Şube
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300">
              ● Gel-Al Siparişlerine Açık
            </span>
          </div>

          <div>
            <h2 className="text-sm font-black text-foreground">{selectedBranch.name}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{selectedBranch.address}</p>
          </div>
        </div>

        {/* 3. HAZIRLANMA SÜRESİ (SECTION 15 - 18) */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
            <Clock className="size-4 text-emerald-600" />
            <span>Yaklaşık Hazırlanma Süresi</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">8 – 12 dk</span>
            <span className="text-[11px] font-medium text-muted-foreground">içinde taze hazırlanır</span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-snug">
            Siparişin barista tarafından hazırlanıp taze bekletilecek. Hazır olduğunda sana anında haber vereceğiz.
          </p>
        </div>

        {/* 4. MÜŞTERİ BİLGİLERİ (SECTION 37 & 38) */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            Müşteri Bilgisi
          </h3>
          <div className="flex items-center justify-between text-xs font-bold text-foreground">
            <div className="flex items-center gap-2">
              <User className="size-4 text-muted-foreground" />
              <span>{user ? `${user.firstName} ${user.lastName}` : "GölBOX Misafiri"}</span>
            </div>
            {user?.email && (
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                ✓ Doğrulanmış Hesap
              </span>
            )}
          </div>
        </div>

        {/* 5. SİPARİŞİN (ÜRÜNLER SNAPSHOT) (SECTION 25 - 27) */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            Sipariş İçeriği ({foodCart.length} Ürün)
          </h3>
          <div className="divide-y divide-border/40">
            {foodCart.map((item) => (
              <div key={item.id} className="py-2.5 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary font-black text-xs shrink-0 mt-0.5">
                    {item.quantity}×
                  </span>
                  <div>
                    <h4 className="text-xs font-black text-foreground truncate">{item.product.name}</h4>
                    <p className="text-[11px] font-medium text-muted-foreground leading-tight mt-0.5">
                      {item.customizationSummary}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black text-foreground shrink-0">₺{item.totalPrice}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 6. SİPARİŞ ÖZETİ (SECTION 29) */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-1">
            Fiyat Detayı
          </h3>
          <div className="flex justify-between text-xs text-muted-foreground font-semibold">
            <span>Ara Toplam</span>
            <span>₺{subtotal}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400 font-extrabold">
              <span>GölBOX Avantaj İndirimi</span>
              <span>-₺{discount}</span>
            </div>
          )}
          <div className="border-t border-border/60 pt-2 flex justify-between text-sm font-black text-foreground">
            <span>Şubede Ödenecek Toplam Tutar</span>
            <span className="text-base text-primary">₺{finalTotal}</span>
          </div>
        </div>

        {/* 7. ÖDEMENİ ŞUBEDE YAPACAKSIN BİLGİLENDİRMESİ (SECTION 30) */}
        <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-4 flex items-start gap-3">
          <div className="flex size-8 items-center justify-center rounded-xl bg-amber-400 text-amber-950 font-black shrink-0 mt-0.5">
            <Store className="size-4.5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-amber-900 dark:text-amber-200">
              🏪 Ödemeni Şubede Yapacaksın
            </h4>
            <p className="text-[11px] text-amber-800 dark:text-amber-300/90 mt-0.5 leading-snug">
              Uygulamada ödeme alınmaz. Siparişini teslim alırken nakit, banka veya kredi kartıyla ödeme yapabilirsin.
            </p>
          </div>
        </div>

        {/* 8. GÖLPUAN & QR BİLGİLENDİRMESİ (SECTION 31 & 33) */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-black text-amber-600 dark:text-amber-400">
            <Coins className="size-4" />
            <span>GölPuan Avantajı</span>
          </div>
          <p className="text-xs text-foreground font-bold">
            Bakiye: <strong className="text-amber-600 dark:text-amber-400">{user?.pointsBalance ?? 1240} GölPuan</strong>
          </p>
          <div className="flex items-start gap-2 text-[11px] text-muted-foreground leading-relaxed">
            <QrCode className="size-4 text-primary shrink-0 mt-0.5" />
            <span>
              Şubeye geldiğinde GölBOX QR'ını göstererek birikmiş puanlarını kahve/ikram indirimlerinde kullanabilirsin.
            </span>
          </div>
        </div>
      </div>

      {/* 9. STICKY SİPARİŞİ GÖNDER CTA (SECTION 52 & 100) */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-4 backdrop-blur-md">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Toplam (Şubede Ödeme)
            </span>
            <h3 className="text-lg font-black text-foreground">₺{finalTotal}</h3>
          </div>

          <button
            onClick={handleSendOrder}
            disabled={isSubmitting || !isBranchGelAlOpen}
            className="flex flex-1 flex-col items-center justify-center rounded-2xl bg-primary px-6 py-3 text-xs font-black text-primary-foreground shadow-md hover:opacity-90 active:scale-95 transition disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Siparişin Gönderiliyor...</span>
            ) : (
              <>
                <span className="text-xs font-black">Siparişi Gönder 🚀</span>
                <span className="text-[9.5px] font-medium opacity-90">Ödeme şubede yapılacaktır</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* AUTH GATE MODAL (SECTION 40) */}
      {showAuthGateModal && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-2xl border border-border text-foreground">
            <User className="mx-auto size-12 text-primary" />
            <h3 className="text-base font-extrabold text-foreground mt-3">Gel-Al İçin Giriş Yap</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Siparişini şubeye gönderebilmemiz ve hazır olduğunda sana haber verebilmemiz için hesabına giriş yapmalısın.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setShowAuthGateModal(false)}
                className="flex-1 rounded-xl border border-border bg-card py-2.5 text-xs font-bold text-foreground"
              >
                Vazgeç
              </button>
              <button
                onClick={() => {
                  setShowAuthGateModal(false)
                  onOrderCompleted()
                }}
                className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-xs"
              >
                Giriş Yap ➔
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
