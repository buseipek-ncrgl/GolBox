"use client"

import React, { useState } from "react"
import { createPortal } from "react-dom"
import {
  ArrowLeft,
  MapPin,
  Clock,
  User,
  QrCode,
  Store,
  Coins,
} from "lucide-react"
import { useGolbox, type Order } from "@/lib/golbox-context"
import { useGolToast } from "@/components/golbox/gol-toast"
import { OrderSuccessScreen } from "@/components/golbox/screens/order-success-screen"
import { AuthGate } from "@/components/golbox/auth-gate"

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
  const { token, user, selectedBranch, foodCart, submitFoodCartOrder } = useGolbox()
  const showToast = useGolToast()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAuthGateModal, setShowAuthGateModal] = useState(false)
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null)

  // SUBMIT GEL-AL ORDER HANDLER WITH DOUBLE-TAP PROTECTION
  const handleSendOrder = async () => {
    if (!token) {
      setShowAuthGateModal(true)
      return
    }

    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const order = await submitFoodCartOrder(false)
      setIsSubmitting(false)

      if (order) {
        setCreatedOrder(order)
        showToast(`Siparişiniz ${order.orderNumber || "GB-101"} numarası ile şubeye iletildi! ☕`)
      } else {
        showToast("Sipariş oluşturulamadı. Lütfen tekrar deneyiniz.")
      }
    } catch {
      setIsSubmitting(false)
      showToast("Sipariş iletilirken bağlantı hatası oluştu.")
    }
  }

  if (createdOrder) {
    return (
      <OrderSuccessScreen
        orderNumber={createdOrder.orderNumber}
        collectionCode={createdOrder.collectionCode}
        estimatedMin={createdOrder.estimatedMin || 5}
        estimatedMax={createdOrder.estimatedMax || 10}
        totalAmount={finalTotal}
        foodCartSnapshot={foodCart}
        onTrackOrder={onOrderCompleted}
        onGoHome={onOrderCompleted}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background overflow-y-auto no-scrollbar animate-in fade-in duration-200">
      {/* 1. HEADER */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border/40 bg-background/95 px-4 py-3 backdrop-blur-md">
        <button
          onClick={onBack}
          aria-label="Geri Dön"
          className="flex size-9 items-center justify-center rounded-xl border border-border/80 bg-card text-foreground shadow-2xs hover:bg-accent transition active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div>
          <h1 className="text-base font-bold text-foreground">Gel-Al Sipariş Özeti</h1>
          <p className="text-[10px] text-muted-foreground font-semibold">Son Kontrol & Şubeye Gönderim</p>
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full pb-36">
        {/* 2. TESLİM ALACAĞIN ŞUBE */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MapPin className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              Teslim Alacağın Şube
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
              ● Gel-Al Siparişlerine Açık
            </span>
          </div>

          <div>
            <h2 className="text-xs font-bold text-foreground">{selectedBranch.name}</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">{selectedBranch.address}</p>
          </div>
        </div>

        {/* 3. HAZIRLANMA SÜRESİ */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Clock className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span>Yaklaşık Hazırlanma Süresi</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">5 – 10 dk</span>
            <span className="text-[11px] font-medium text-muted-foreground">içinde taze hazırlanır</span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-snug">
            Siparişin barista tarafından taze hazırlanıp bekletilecektir. Hazır olduğunda anında haber verilecektir.
          </p>
        </div>

        {/* 4. MÜŞTERİ BİLGİLERİ */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-2">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
            Müşteri Bilgisi
          </h3>
          <div className="flex items-center justify-between text-xs font-bold text-foreground">
            <div className="flex items-center gap-2">
              <User className="size-4 text-muted-foreground" />
              <span>{user ? `${user.firstName} ${user.lastName}` : "GölBOX Üyesi"}</span>
            </div>
            {user?.email && (
              <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                ✓ Doğrulanmış Hesap
              </span>
            )}
          </div>
        </div>

        {/* 5. SİPARİŞ İÇERİĞİ SNAPSHOT */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
            Sipariş İçeriği ({foodCart.length} Ürün)
          </h3>
          <div className="divide-y divide-border/40">
            {foodCart.map((item) => (
              <div key={item.id} className="py-2 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="flex size-5 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold text-[11px] shrink-0 mt-0.5">
                    {item.quantity}×
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-foreground truncate">{item.product.name}</h4>
                    <p className="text-[11px] font-medium text-muted-foreground leading-tight mt-0.5">
                      {item.customizationSummary}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-foreground shrink-0">₺{item.totalPrice}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 6. SİPARİŞ ÖZETİ */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-2">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground mb-1">
            Fiyat Detayı
          </h3>
          <div className="flex justify-between text-xs text-muted-foreground font-medium">
            <span>Ara Toplam</span>
            <span>₺{subtotal}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-xs text-emerald-700 dark:text-emerald-400 font-bold">
              <span>GölBOX Avantaj İndirimi</span>
              <span>-₺{discount}</span>
            </div>
          )}
          <div className="border-t border-border/60 pt-2 flex justify-between text-sm font-bold text-foreground">
            <span>Şubede Ödenecek Toplam Tutar</span>
            <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">₺{finalTotal}</span>
          </div>
        </div>

        {/* 7. ÖDEMENİ ŞUBEDE YAPACAKSIN BİLGİLENDİRMESİ */}
        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-4 flex items-start gap-3">
          <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-700 text-white font-bold shrink-0 mt-0.5">
            <Store className="size-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
              Ödemenizi Şubede Yapılacaktır
            </h4>
            <p className="text-[11px] text-emerald-800 dark:text-emerald-300/90 mt-0.5 leading-snug">
              Uygulamada kredi kartı istenmez. Siparişinizi teslim alırken kasada nakit veya kartınızla ödeme yapabilirsiniz.
            </p>
          </div>
        </div>

        {/* 8. GÖLPUAN & QR BİLGİLENDİRMESİ */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
            <Coins className="size-4" />
            <span>GölPuan Durumunuz</span>
          </div>
          <p className="text-xs text-foreground font-semibold">
            Bakiye: <strong className="text-amber-600 dark:text-amber-400">{user?.pointsBalance ?? 0} GP</strong>
          </p>
          <div className="flex items-start gap-2 text-[11px] text-muted-foreground leading-relaxed">
            <QrCode className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Şubeye ulaştığınızda QR kodunuzu okutarak puan kazanabilir ve teslimatınızı tamamlayabilirsiniz.
            </span>
          </div>
        </div>
      </div>

      {/* 9. STICKY SİPARİŞİ GÖNDER CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-4 backdrop-blur-md">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Şubede Ödenecek Tutar
            </span>
            <h3 className="text-base font-extrabold text-foreground">₺{finalTotal}</h3>
          </div>

          <button
            onClick={handleSendOrder}
            disabled={isSubmitting}
            className="flex flex-1 flex-col items-center justify-center rounded-2xl bg-emerald-700 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-800 active:scale-95 transition disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <span>Sipariş Gönderiliyor...</span>
            ) : (
              <>
                <span className="text-xs font-bold">Siparişi Gönder</span>
                <span className="text-[9.5px] font-medium opacity-90">Ödeme şubede yapılacaktır</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* AUTH GATE MODAL */}
      {showAuthGateModal && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-card p-5 text-center shadow-2xl border border-border text-foreground">
            <User className="mx-auto size-10 text-emerald-700" />
            <h3 className="text-sm font-bold text-foreground mt-3">Gel-Al İçin Giriş Yap</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Siparişini şubeye gönderebilmemiz için hesabına giriş yapmalısın.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowAuthGateModal(false)}
                className="flex-1 rounded-xl border border-border bg-card py-2 text-xs font-bold text-foreground cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                onClick={() => {
                  setShowAuthGateModal(false)
                  onOrderCompleted()
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
    </div>
  )
}

