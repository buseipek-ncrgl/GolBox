"use client"

import { useCallback, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import QRCode from "qrcode"
import { Screen } from "@/components/golbox/screen"
import {
  RefreshCw,
  ScanLine,
  WifiOff,
  Sparkles,
  Clock,
  Store,
  Coins,
  CheckCircle2,
  ChevronRight,
  Info,
  X,
  Building2,
  ShoppingBag,
  ShieldCheck,
  Award
} from "lucide-react"
import { CouponPass, isActiveCoupon } from "@/components/golbox/coupon-pass"
import { LoginScreen } from "@/components/golbox/screens/login-screen"
import { QrGuestState } from "@/components/golbox/login-required-card"
import { GPValue } from "@/components/golbox/gp-value"
import { ActiveOrderScreen } from "@/components/golbox/screens/active-order-screen"
import { API_BASE_URL } from "@/lib/api-config"
import { useGolbox, type Order } from "@/lib/golbox-context"
import { useGolToast } from "@/components/golbox/gol-toast"

export function QrScreen() {
  const { user, token, claimedRewards, orders, selectedBranch } = useGolbox()
  const showToast = useGolToast()

  const [secondsLeft, setSecondsLeft] = useState(30)
  const [showLogin, setShowLogin] = useState(false)
  const [qrImage, setQrImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [offline, setOffline] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showActiveOrderScreen, setShowActiveOrderScreen] = useState(false)

  // DEMO PICKUP CONTEXT TOGGLE (FOR TESTING READY vs PREPARING vs MEMBERSHIP)
  const [demoContextState, setDemoContextState] = useState<"READY" | "PREPARING" | "MEMBERSHIP">("READY")

  // STAFF SCANNER DEMO SIMULATION MODAL (SECTIONS 30-34, 131-134)
  const [showStaffModal, setShowStaffModal] = useState(false)
  const [staffStep, setStaffStep] = useState<"VERIFIED" | "POINTS_USED" | "PAID" | "COMPLETED">("VERIFIED")

  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : "Ayşe K."
  const points = user?.pointsBalance ?? 1240
  const activeCoupons = claimedRewards.filter(isActiveCoupon)

  // Check if real active order exists in global context
  const activeOrderFromContext = orders.find(
    (o) => o.status === "READY" || o.status === "PREPARING" || o.status === "CONFIRMED"
  )

  // Fallback demo order for previewing Ready Pickup context (PRD Sections 9, 25, 130)
  const demoOrder: Order = {
    id: "ord-gb-1042",
    orderNumber: "GB-1042",
    userId: user?.id || "u-1",
    userFullName: displayName,
    cafeName: selectedBranch?.name || "GölBOX Üniversite Şubesi",
    branchAddress: selectedBranch?.address || "Kampüs İçi Rektörlük Yanı, Şehitkamil",
    totalAmount: 240,
    paidWithPoints: false,
    pointsUsed: 0,
    status: demoContextState,
    paymentStatus: "UNPAID",
    collectionCode: "GÖL-8492",
    createdDate: new Date().toISOString(),
    estimatedMin: 5,
    estimatedMax: 8,
    items: [
      {
        id: "item-1",
        menuItemId: "m-4",
        menuItemName: "Iced Vanilla Latte",
        customizationSummary: "Büyük Boy · Yulaf Sütü · Ekstra Shot",
        quantity: 1,
        unitPrice: 155
      },
      {
        id: "item-2",
        menuItemId: "m-7",
        menuItemName: "Belçika Çikolatalı Cheesecake",
        customizationSummary: "Standart Dilim",
        quantity: 1,
        unitPrice: 85
      }
    ]
  }

  const effectiveOrder = activeOrderFromContext || demoOrder
  const isReadyContext = demoContextState === "READY" || effectiveOrder.status === "READY"
  const isPreparingContext = demoContextState === "PREPARING" || (effectiveOrder.status === "PREPARING" && !isReadyContext)

  // Generate QR image from dynamic backend token or robust client generator
  const loadQr = useCallback(async () => {
    if (!token) return
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setOffline(true)
      setQrImage(null)
      setError(null)
      return
    }

    setLoading(true)
    setOffline(false)
    setError(null)
    try {
      let qrPayloadToken = `GOLBOX-QR-${user?.id || "GUEST"}-${Date.now()}`

      // Try server endpoint
      const res = await fetch(`${API_BASE_URL}/qr/generate-dynamic`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.status === 401) {
        setSessionExpired(true)
        setQrImage(null)
        return
      }

      if (res.ok) {
        const json = await res.json()
        if (json?.data?.qrToken) {
          qrPayloadToken = json.data.qrToken
        }
      }

      // Generate SVG dataURL with high contrast margin
      const dataUrl = await QRCode.toDataURL(qrPayloadToken, {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 340,
        color: { dark: "#1d5f60", light: "#ffffff" }
      })
      setQrImage(dataUrl)
      setSecondsLeft(30)
    } catch {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setOffline(true)
      } else {
        // Client fallback so QR is always viewable
        try {
          const fallbackToken = `GB-DYNAMIC-${Date.now()}`
          const dataUrl = await QRCode.toDataURL(fallbackToken, {
            errorCorrectionLevel: "M",
            margin: 2,
            width: 340,
            color: { dark: "#1d5f60", light: "#ffffff" }
          })
          setQrImage(dataUrl)
          setSecondsLeft(30)
        } catch {
          setError("Kasa kodu oluşturulamadı.")
          setQrImage(null)
        }
      }
    } finally {
      setLoading(false)
    }
  }, [token, user?.id])

  useEffect(() => {
    if (!token) return
    void loadQr()
  }, [token, loadQr])

  // Countdown timer for automatic token refresh (Sections 16, 19, 20)
  useEffect(() => {
    if (!qrImage || error || offline || sessionExpired) return
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          void loadQr()
          return 30
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [qrImage, error, offline, sessionExpired, loadQr])

  if (showLogin && !token) {
    return <LoginScreen onClose={() => setShowLogin(false)} closeLabel="QR'a dön" />
  }

  if (!token || sessionExpired) {
    return (
      <Screen fill className="justify-center gap-4">
        <QrGuestState
          onLogin={() => {
            setSessionExpired(false)
            setShowLogin(true)
          }}
        />
      </Screen>
    )
  }

  if (showActiveOrderScreen) {
    return (
      <ActiveOrderScreen
        order={effectiveOrder}
        onClose={() => setShowActiveOrderScreen(false)}
        onNavigateToMenu={() => setShowActiveOrderScreen(false)}
      />
    )
  }

  return (
    <Screen fill className="pb-28">
      {/* 1. HEADER (SECTION 8, 9, 130) */}
      <header className="space-y-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-primary">
              GölBOX Dijital Kimlik
            </p>
            <h1 className="font-serif text-2xl font-bold text-foreground">GölBOX QR</h1>
          </div>

          <span className="rounded-xl bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-black text-primary">
            {activeOrderFromContext?.status === "READY"
              ? "Siparişin Hazır ☕"
              : activeOrderFromContext?.status === "PREPARING"
              ? "Kahven Hazırlanıyor..."
              : "Dijital Üye Kodu"}
          </span>
        </div>

        {/* CONTEXT BANNER FOR PREPARING ORDER (SECTION 11) */}
        {isPreparingContext && (
          <div className="mt-2 flex items-center justify-between rounded-2xl border border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 p-3 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-blue-600 dark:text-blue-400 animate-spin" />
              <div>
                <span className="font-black text-blue-950 dark:text-blue-100 flex items-center gap-1">
                  <Clock className="size-3.5" /> Kahven hazırlanıyor
                </span>
                <p className="text-[10px] text-blue-800 dark:text-blue-300">
                  #{effectiveOrder.orderNumber} henüz hazır değil.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowActiveOrderScreen(true)}
              className="flex items-center gap-1 rounded-xl bg-blue-600 px-2.5 py-1 text-[10px] font-black text-white shadow-2xs hover:bg-blue-700"
            >
              <span>Siparişi Gör</span>
              <ChevronRight className="size-3" />
            </button>
          </div>
        )}
      </header>

      {/* 2. DYNAMIC QR CARD (SECTIONS 8 - 10, 130) */}
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-2">
        <div className="gol-card w-full max-w-[340px] p-5 border border-border/80 shadow-lg">
          {/* TOP CARD BAR */}
          {isReadyContext ? (
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 p-3 text-center space-y-1">
              <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-800 dark:text-emerald-200">
                <Sparkles className="size-4 text-emerald-600 dark:text-emerald-400" />
                Siparişin Hazır!
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="text-base font-black text-emerald-950 dark:text-emerald-100 font-mono">
                  #{effectiveOrder.orderNumber}
                </span>
                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                  · {effectiveOrder.cafeName}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-extrabold text-muted-foreground">Merhaba {displayName.split(" ")[0]}</p>
                <p className="text-sm font-black text-foreground">GölBOX Kasasında Göster</p>
              </div>
              <span className="rounded-2xl bg-amber-400/20 border border-amber-400/30 px-3 py-1 text-xs font-black text-amber-700 dark:text-amber-300">
                <GPValue amount={points} className="text-xs" />
              </span>
            </div>
          )}

          {/* QR CODE CONTAINER (SECTION 23, 25) */}
          <div className="mt-4 flex flex-col items-center justify-center rounded-3xl bg-white p-5 border border-slate-200 text-center shadow-inner min-h-[240px]">
            {offline ? (
              <div className="flex flex-col items-center gap-2 px-2 text-center">
                <WifiOff className="size-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">İnternet bağlantısı gerekli</p>
                <p className="text-xs text-muted-foreground">Güvenli QR kodunu oluşturabilmek için internete bağlanmalısın.</p>
                <button
                  type="button"
                  onClick={() => void loadQr()}
                  className="mt-1 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
                >
                  Tekrar Dene
                </button>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-2 px-2 text-center">
                <p className="text-sm font-medium text-foreground">Kasa kodu oluşturulamadı.</p>
                <button
                  type="button"
                  onClick={() => void loadQr()}
                  className="mt-1 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
                >
                  Tekrar Dene
                </button>
              </div>
            ) : qrImage ? (
              <div className="w-full space-y-2">
                <img src={qrImage} alt="GölBOX QR Kodu" className="aspect-square w-full rounded-2xl mx-auto max-w-[240px]" />
                
                {/* FALLBACK ORDER NUMBER UNDERNEATH QR (SECTION 25 & 90) */}
                {isReadyContext ? (
                  <div className="pt-1">
                    <span className="text-[10px] font-black uppercase text-slate-500 block">Sipariş Kodunuz (Manuel Arama)</span>
                    <span className="text-sm font-mono font-black text-emerald-950 tracking-wider">
                      #{effectiveOrder.orderNumber} ({effectiveOrder.collectionCode})
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 block">
                    GölBOX Dijital Üye Kimliği
                  </span>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <RefreshCw className="size-6 animate-spin text-primary" />
                <p className="text-xs font-bold">{loading ? "QR hazırlanıyor..." : "Kod bekleniyor..."}</p>
              </div>
            )}
          </div>

          {/* DYNAMIC TOKEN REFRESH PROGRESS BAR (SECTION 16 & 19) */}
          <div className="mt-4 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-extrabold text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <RefreshCw className="size-3.5 text-primary" />
                <span>Güvenlik Süresi</span>
              </div>
              <span className="font-mono font-black text-primary">{secondsLeft}s</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all duration-1000 ease-linear"
                style={{ width: `${(secondsLeft / 30) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3. CONTEXT INSTRUCTIONS & PAY AT BRANCH NOTICE (SECTION 8, 9, 130) */}
        {isReadyContext ? (
          <div className="w-full max-w-[340px] rounded-2xl border border-border bg-card p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <div className="flex items-center gap-2">
                <Coins className="size-4 text-amber-500" />
                <span className="text-xs font-bold text-foreground">
                  Bakiyeniz: <strong className="text-amber-600 dark:text-amber-400">{points} GP</strong>
                </span>
              </div>
              <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-md">
                Kasada Kullanılabilir
              </span>
            </div>

            <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
              <Store className="size-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-black text-foreground flex items-center gap-1">
                  Ödeme Şubede Yapılacaktır <Store className="size-3.5 text-primary" />
                </span>
                <p className="text-[11px] leading-snug mt-0.5">
                  GölPuan kullandıktan sonra kalan tutarı şube kasamızda nakit veya kartla ödeyebilirsiniz.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowActiveOrderScreen(true)}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-primary/10 border border-primary/20 py-2 text-xs font-black text-primary hover:bg-primary/20 transition"
            >
              <ShoppingBag className="size-3.5" />
              <span>Sipariş Detayını Gör</span>
            </button>
          </div>
        ) : (
          <div className="w-full max-w-[340px] text-center space-y-2">
            <div className="flex items-center justify-center gap-2 rounded-2xl bg-secondary px-4 py-2.5 text-xs font-bold text-secondary-foreground shadow-2xs">
              <ScanLine className="size-4 text-primary" />
              <span>GölPuan kazanmak veya kullanmak için kasada okutun</span>
            </div>

            <p className="text-[11px] text-muted-foreground leading-snug px-2">
              GölBOX QR kredi kartı değildir. Hesabınızı kasada tanıtır ve avantajlarınızı aktarır.
            </p>
          </div>
        )}

        {/* 4. ACTIVE COUPONS OR STAFF SIMULATION BUTTON */}
        {activeCoupons.length > 0 && (
          <div className="w-full max-w-[340px] space-y-2">
            <p className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Aktif Özel Kuponların
            </p>
            {activeCoupons.slice(0, 2).map((coupon) => (
              <CouponPass key={coupon.claimId} coupon={coupon} compact />
            ))}
          </div>
        )}

        {/* DEMO ACTION: SIMULATE STAFF SCANNED AT REGISTER (PRD SECTIONS 30-34, 131-134) */}
        <div className="pt-2">
          <button
            onClick={() => {
              setStaffStep("VERIFIED")
              setShowStaffModal(true)
            }}
            className="flex items-center gap-2 rounded-2xl border border-amber-400/50 bg-amber-400/10 px-4 py-2.5 text-xs font-black text-amber-700 dark:text-amber-300 hover:bg-amber-400/20 active:scale-95 transition"
          >
            <ShieldCheck className="size-4 text-amber-500" />
            <span>Kasada QR Okutuldu (Personel Ekranı Simülasyonu)</span>
          </button>
        </div>
      </div>

      {/* 5. STAFF REGISTER SCANNER SIMULATION MODAL (SECTIONS 131 - 134) */}
      {showStaffModal && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-card p-6 text-foreground shadow-2xl border border-border space-y-4">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="size-5 text-primary" />
                <div>
                  <h3 className="text-xs font-black text-foreground">GölBOX Kasa POS Ekranı</h3>
                  <p className="text-[10px] text-muted-foreground font-extrabold">Şube Personel Arayüzü</p>
                </div>
              </div>
              <button
                onClick={() => setShowStaffModal(false)}
                className="rounded-xl p-1 text-muted-foreground hover:bg-accent"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* STEP 1: VERIFIED SCREEN (SECTION 131) */}
            {staffStep === "VERIFIED" && (
              <div className="space-y-4 text-center">
                <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 p-4 space-y-1">
                  <span className="text-xs font-black text-emerald-800 dark:text-emerald-200 flex items-center justify-center gap-1">
                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" /> QR Doğrulandı ✓
                  </span>
                  <h4 className="text-lg font-black text-emerald-950 dark:text-emerald-100 font-mono">
                    #{effectiveOrder.orderNumber}
                  </h4>
                  <span className="inline-block rounded-lg bg-emerald-600 text-white px-2 py-0.5 text-[10px] font-black">
                    Sipariş Hazır
                  </span>
                </div>

                <div className="rounded-2xl border border-border p-3 text-left space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Müşteri:</span>
                    <span className="font-bold text-foreground">{displayName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sipariş Tutarı:</span>
                    <span className="font-black text-foreground">₺{effectiveOrder.totalAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ödeme Durumu:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">Ödeme Bekliyor</span>
                  </div>
                  <div className="flex justify-between border-t border-border/40 pt-1.5">
                    <span className="text-muted-foreground">Mevcut GölPuan:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">{points} GP</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => {
                      setStaffStep("POINTS_USED")
                      showToast("500 GölPuan indirim olarak uygulandı (-₺50).")
                    }}
                    className="flex-1 rounded-2xl bg-amber-400 py-3 text-xs font-black text-amber-950 shadow-md hover:bg-amber-300"
                  >
                    GölPuan Kullan (500 GP)
                  </button>
                  <button
                    onClick={() => {
                      setStaffStep("PAID")
                      showToast("Kasada ödeme alındı.")
                    }}
                    className="flex-1 rounded-2xl bg-primary py-3 text-xs font-black text-primary-foreground shadow-md hover:bg-primary/90"
                  >
                    Ödeme Al (₺{effectiveOrder.totalAmount})
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: POINTS USED (SECTION 132) */}
            {staffStep === "POINTS_USED" && (
              <div className="space-y-4 text-center">
                <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 p-4 space-y-1">
                  <span className="text-xs font-black text-amber-800 dark:text-amber-200 flex items-center justify-center gap-1">
                    <Coins className="size-4 text-amber-500" /> GölPuan Kullanıldı ✓
                  </span>
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
                    500 GölPuan → <strong className="text-emerald-600 font-extrabold">-₺50</strong>
                  </p>
                </div>

                <div className="rounded-2xl border border-border p-3 text-left space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sipariş Toplamı:</span>
                    <span>₺{effectiveOrder.totalAmount}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>GölPuan İndirimi:</span>
                    <span>-₺50</span>
                  </div>
                  <div className="flex justify-between border-t border-border/40 pt-2 text-sm font-black">
                    <span>Kalan Tutar:</span>
                    <span className="text-primary">₺{effectiveOrder.totalAmount - 50}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setStaffStep("PAID")
                    showToast("Kalan tutar kasada tahsil edildi.")
                  }}
                  className="w-full rounded-2xl bg-primary py-3.5 text-xs font-black text-primary-foreground shadow-md hover:bg-primary/90"
                >
                  Ödeme Al (Kalan ₺{effectiveOrder.totalAmount - 50})
                </button>
              </div>
            )}

            {/* STEP 3: PAID (SECTION 133) */}
            {staffStep === "PAID" && (
              <div className="space-y-4 text-center">
                <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 p-4 space-y-1">
                  <span className="text-xs font-black text-emerald-800 dark:text-emerald-200 flex items-center justify-center gap-1">
                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" /> Ödeme Alındı ✓
                  </span>
                  <p className="text-xs font-bold text-emerald-900 dark:text-emerald-100">
                    Kart / Nakit Tahsilat Başarılı
                  </p>
                </div>

                <button
                  onClick={() => {
                    setStaffStep("COMPLETED")
                    showToast("Sipariş teslim edildi, müşteri hesabına +45 GölPuan aktarıldı.")
                  }}
                  className="w-full rounded-2xl bg-emerald-600 py-3.5 text-xs font-black text-white shadow-md hover:bg-emerald-700"
                >
                  Siparişi Teslim Et
                </button>
              </div>
            )}

            {/* STEP 4: COMPLETED (SECTION 134) */}
            {staffStep === "COMPLETED" && (
              <div className="space-y-4 text-center">
                <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-300 dark:border-indigo-800 p-4 space-y-1">
                  <span className="text-xs font-black text-indigo-800 dark:text-indigo-200 flex items-center justify-center gap-1">
                    <Award className="size-4 text-indigo-600 dark:text-indigo-400" /> Sipariş Tamamlandı ✓
                  </span>
                  <h4 className="text-base font-black text-indigo-950 dark:text-indigo-100 font-mono">
                    #{effectiveOrder.orderNumber}
                  </h4>
                  <p className="text-xs text-indigo-800 dark:text-indigo-300">
                    Müşteriye teslim edildi.
                  </p>
                </div>

                <div className="rounded-2xl bg-amber-100 dark:bg-amber-950/60 p-3 text-amber-900 dark:text-amber-200 text-xs font-black">
                  ⭐ Müşteriye Yeni Kazanılan +45 GölPuan Yüklendi!
                </div>

                <button
                  onClick={() => setShowStaffModal(false)}
                  className="w-full rounded-2xl bg-primary py-3 text-xs font-black text-primary-foreground shadow-md"
                >
                  Kapat
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </Screen>
  )
}
