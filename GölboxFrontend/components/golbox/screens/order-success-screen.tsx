"use client"

import React, { useState } from "react"
import {
  CheckCircle2,
  Clock,
  MapPin,
  QrCode,
  Store,
  Coins,
  ChevronDown,
  ChevronUp,
  Bell,
  ChevronRight,
  Sparkles,
  Copy,
  Check
} from "lucide-react"
import { useGolbox, type FoodCartItem } from "@/lib/golbox-context"
import { useGolToast } from "@/components/golbox/gol-toast"

export function OrderSuccessScreen({
  orderNumber = "GB-1042",
  collectionCode = "GÖL-8492",
  estimatedMin = 8,
  estimatedMax = 12,
  totalAmount = 240,
  foodCartSnapshot = [],
  onTrackOrder,
  onGoHome
}: {
  orderNumber?: string
  collectionCode?: string
  estimatedMin?: number
  estimatedMax?: number
  totalAmount?: number
  foodCartSnapshot?: FoodCartItem[]
  onTrackOrder: () => void
  onGoHome: () => void
}) {
  const { user, selectedBranch, foodCart } = useGolbox()
  const showToast = useGolToast()

  const [copied, setCopied] = useState(false)
  const [showSummaryDetails, setShowSummaryDetails] = useState(false)
  const [notificationEnabled, setNotificationEnabled] = useState(false)

  // Use passed snapshot or context items
  const displayItems = foodCartSnapshot.length > 0 ? foodCartSnapshot : foodCart

  const handleCopyOrderNumber = () => {
    try {
      navigator.clipboard.writeText(orderNumber)
      setCopied(true)
      showToast("Sipariş numarası kopyalandı!")
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const handleEnableNotifications = () => {
    setNotificationEnabled(true)
    showToast("Sipariş bildirimleri başarıyla aktifleştirildi! 🔔")
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background overflow-y-auto no-scrollbar animate-in fade-in duration-300">
      {/* HEADER */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/40 bg-background/95 px-4 py-3 backdrop-blur-md">
        <span className="text-xs font-black text-foreground uppercase tracking-wider">
          GölBOX Sipariş Onayı
        </span>
        <button
          onClick={onGoHome}
          className="text-xs font-extrabold text-primary hover:underline"
        >
          Ana Sayfa
        </button>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex-1 px-4 py-6 space-y-4 max-w-lg mx-auto w-full pb-36">
        {/* 1. HERO SUCCESS BADGE & TITLE (SECTION 7 & 8) */}
        <div className="text-center space-y-3 pt-2">
          <div className="relative mx-auto flex size-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 shadow-lg animate-in zoom-in-75 duration-300">
            <CheckCircle2 className="size-12" />
            <Sparkles className="absolute -top-1 -right-1 size-6 text-amber-400 animate-pulse" />
          </div>

          <div>
            <h1 className="text-xl font-black text-foreground tracking-tight">
              Siparişin Alındı! ☕
            </h1>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
              Siparişini <strong>{selectedBranch.name}</strong> şubemize ilettik. Durumunu canlı olarak takip edebilirsin.
            </p>
          </div>

          {/* ORDER NUMBER & STATUS CARD (SECTION 11 & 13) */}
          <div className="inline-flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-2.5 shadow-2xs">
            <div className="text-left">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Sipariş Numarası
              </span>
              <h2 className="text-sm font-black text-foreground">{orderNumber}</h2>
            </div>

            <button
              onClick={handleCopyOrderNumber}
              aria-label="Sipariş numarasını kopyala"
              className="flex size-8 items-center justify-center rounded-xl bg-accent text-muted-foreground hover:text-foreground active:scale-95 transition"
            >
              {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
            </button>

            <div className="border-l border-border/60 pl-3 text-left">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Canlı Durum
              </span>
              <p className="flex items-center gap-1 text-xs font-black text-amber-600 dark:text-amber-400">
                <span className="inline-block size-2 rounded-full bg-amber-500 animate-ping" />
                Şube Onayı Bekleniyor
              </p>
            </div>
          </div>
        </div>

        {/* 2. TAHMİNİ HAZIRLANMA SÜRESİ (SECTION 15 & 17) */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-1.5 text-center">
          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center justify-center gap-1.5">
            <Clock className="size-3.5 text-emerald-600" />
            Tahmini Hazırlanma Süresi
          </span>
          <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
            {estimatedMin} – {estimatedMax} dakika
          </h3>
          <p className="text-[11px] text-muted-foreground font-medium">
            Şube siparişini onaylayıp hazırlığa başladığında süre kesinleşecektir.
          </p>
        </div>

        {/* 3. TESLİM ALACAĞIN ŞUBE (SECTION 18) */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
            <MapPin className="size-4 text-primary" />
            <span>Teslim Alacağın Şube</span>
          </div>
          <div>
            <h4 className="text-xs font-black text-foreground">{selectedBranch.name}</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">{selectedBranch.address}</p>
          </div>
        </div>

        {/* 4. ŞİMDİ NE YAPMALISIN? 3-ADIM REHBERİ (SECTION 21) */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            Şimdi Ne Yapmalısın?
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground font-black text-xs shrink-0 mt-0.5">
                1
              </span>
              <div>
                <h4 className="text-xs font-black text-foreground">Siparişini takip et</h4>
                <p className="text-[11px] text-muted-foreground">
                  Baristanın hazırlık durumunu uygulamadan canlı olarak görebilirsin.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground font-black text-xs shrink-0 mt-0.5">
                2
              </span>
              <div>
                <h4 className="text-xs font-black text-foreground">"Hazır" bildirimini bekle</h4>
                <p className="text-[11px] text-muted-foreground">
                  Kahven hazır olduğunda telefonuna bildirim göndereceğiz.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground font-black text-xs shrink-0 mt-0.5">
                3
              </span>
              <div>
                <h4 className="text-xs font-black text-foreground">Kasada QR'ını göster</h4>
                <p className="text-[11px] text-muted-foreground">
                  Şubeye geldiğinde QR'ını göstererek siparişini teslim alabilir, varsa GölPuan kullanabilir ve ödemeni yapabilirsin.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 5. ÖDEME BİLGİSİ (SECTION 23 & 24) */}
        <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-4 flex items-start gap-3">
          <div className="flex size-8 items-center justify-center rounded-xl bg-amber-400 text-amber-950 font-black shrink-0 mt-0.5">
            <Store className="size-4.5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-amber-900 dark:text-amber-200">
              Ödeme Şubede Yapılacaktır
            </h4>
            <p className="text-[11px] text-amber-800 dark:text-amber-300/90 mt-0.5 leading-snug">
              Henüz ödeme yapılmadı. Siparişini teslim alırken kasada nakit veya kredi kartınızla ödeme yapabilirsin.
            </p>
          </div>
        </div>

        {/* 6. GÖLPUAN BAKİYESİ (SECTION 33) */}
        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 font-bold">
              <Coins className="size-4" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Mevcut Bakiyeniz</span>
              <h4 className="text-xs font-black text-foreground">{user?.pointsBalance ?? 1240} GölPuan</h4>
            </div>
          </div>
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-2 py-1 rounded-lg">
            Kasada QR ile Kullan
          </span>
        </div>

        {/* 7. PUSH BİLDİRİM İZNİ KARTI (SECTION 45 & 46) */}
        {!notificationEnabled && (
          <div className="rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/50 p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-600 text-white shrink-0">
                <Bell className="size-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-indigo-900 dark:text-indigo-200">
                  Hazır olduğunda haber verelim mi?
                </h4>
                <p className="text-[10px] text-indigo-700 dark:text-indigo-300 mt-0.5">
                  Kahven hazırlandığında anında bildirim almak için izin ver.
                </p>
              </div>
            </div>
            <button
              onClick={handleEnableNotifications}
              className="rounded-xl bg-indigo-600 px-3 py-2 text-[11px] font-black text-white shadow-2xs active:scale-95 shrink-0"
            >
              Bildirimleri Aç
            </button>
          </div>
        )}

        {/* 8. SİPARİŞ ÖZETİ ACCORDION (SECTION 30 & 31) */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
          <button
            onClick={() => setShowSummaryDetails(!showSummaryDetails)}
            className="flex w-full items-center justify-between text-xs font-black text-foreground"
          >
            <span>Sipariş Detayı ({displayItems.length} Kalem)</span>
            {showSummaryDetails ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>

          {showSummaryDetails && (
            <div className="mt-3 border-t border-border/40 pt-3 space-y-2">
              {displayItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-foreground">{item.quantity}× {item.product.name}</span>
                    <p className="text-[10px] text-muted-foreground">{item.customizationSummary}</p>
                  </div>
                  <span className="font-bold text-foreground">₺{item.totalPrice}</span>
                </div>
              ))}
              <div className="border-t border-border/40 pt-2 flex justify-between font-black text-sm">
                <span>Ödenecek Toplam Tutar</span>
                <span className="text-primary">₺{totalAmount}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 9. STICKY BOTTOM BUTTONS (SECTION 36 & 37) */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-4 backdrop-blur-md">
        <div className="max-w-lg mx-auto space-y-2">
          <button
            onClick={onTrackOrder}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-xs font-black text-primary-foreground shadow-md hover:opacity-90 active:scale-95 transition"
          >
            <span>Siparişimi Takip Et</span>
            <ChevronRight className="size-4" />
          </button>
          <button
            onClick={onGoHome}
            className="w-full text-center text-xs font-bold text-muted-foreground hover:text-foreground py-1"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    </div>
  )
}
