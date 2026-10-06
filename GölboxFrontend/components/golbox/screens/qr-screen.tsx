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
import { AuthGate } from "@/components/golbox/auth-gate"
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

  // Real active order from context (READY, PREPARING, CONFIRMED, PENDING)
  const activeOrderFromContext = orders.find((o) => {
    const s = o.status?.toUpperCase()
    return s === "PENDING" || s === "CONFIRMED" || s === "PREPARING" || s === "READY"
  })

  const isReadyContext = activeOrderFromContext?.status?.toUpperCase() === "READY"
  const isPreparingContext =
    activeOrderFromContext?.status?.toUpperCase() === "PREPARING" ||
    activeOrderFromContext?.status?.toUpperCase() === "PENDING" ||
    activeOrderFromContext?.status?.toUpperCase() === "CONFIRMED"

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
        color: { dark: "#047857", light: "#ffffff" }
      })
      setQrImage(dataUrl)
      setSecondsLeft(30)
    } catch {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setOffline(true)
      } else {
        // Client fallback so QR is always viewable
        try {
          const fallbackToken = `GB-DYNAMIC-${user?.id || "MEMBER"}-${Date.now()}`
          const dataUrl = await QRCode.toDataURL(fallbackToken, {
            errorCorrectionLevel: "M",
            margin: 2,
            width: 340,
            color: { dark: "#047857", light: "#ffffff" }
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
      <Screen fill className="justify-center">
        <AuthGate
          context="QR"
          onLogin={() => {
            setSessionExpired(false)
            setShowLogin(true)
          }}
        />
      </Screen>
    )
  }

  if (showActiveOrderScreen && activeOrderFromContext) {
    return (
      <ActiveOrderScreen
        order={activeOrderFromContext}
        onClose={() => setShowActiveOrderScreen(false)}
        onNavigateToMenu={() => setShowActiveOrderScreen(false)}
      />
    )
  }

  return (
    <div className="w-full flex-1 space-y-4 px-4 py-3 pb-36 overflow-y-auto no-scrollbar max-w-lg mx-auto">
      {/* 1. HEADER (SECTION 8, 9, 11) */}
      <header className="space-y-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-primary">
              GölBOX Dijital Kimlik
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">GölBOX QR</h1>
          </div>

          <span className="rounded-xl bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-black text-primary">
            {isReadyContext
              ? "Siparişin Hazır ☕"
              : isPreparingContext
              ? "Kahven Hazırlanıyor..."
              : "Dijital Üye Kodu"}
          </span>
        </div>

        {/* CONTEXT BANNER FOR PREPARING ORDER (SECTION 22) */}
        {isPreparingContext && activeOrderFromContext && (
          <div className="mt-2 flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/10 p-3 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-primary animate-spin" />
              <div>
                <span className="font-black text-foreground flex items-center gap-1">
                  <Clock className="size-3.5 text-primary" /> Kahven hazırlanıyor
                </span>
                <p className="text-[10px] text-muted-foreground">
                  #{activeOrderFromContext.orderNumber || "GB-SİPARİŞ"} henüz hazır değil.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowActiveOrderScreen(true)}
              className="flex items-center gap-1 rounded-xl bg-primary px-3 py-1 text-[10px] font-black text-primary-foreground shadow-2xs hover:bg-primary/90 transition cursor-pointer"
            >
              <span>Siparişi Gör</span>
              <ChevronRight className="size-3" />
            </button>
          </div>
        )}
      </header>

      {/* 2. DYNAMIC UNIFIED QR CARD (SECTIONS 13 - 15) */}
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-2">
        <div className="gol-card w-full max-w-[340px] p-5 border border-border/80 shadow-lg">
          {/* TOP CARD BAR */}
          {isReadyContext && activeOrderFromContext ? (
            <div className="rounded-2xl bg-primary/10 border border-primary/20 p-3 text-center space-y-1">
              <span className="inline-flex items-center gap-1 text-xs font-black text-primary">
                <Sparkles className="size-4 text-primary" />
                Siparişin Hazır!
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="text-base font-black text-foreground font-mono">
                  #{activeOrderFromContext.orderNumber}
                </span>
                <span className="text-[11px] font-bold text-muted-foreground">
                  · {activeOrderFromContext.cafeName}
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

          {/* QR CODE CONTAINER (SECTION 13 - 15) */}
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
                
                {isReadyContext && activeOrderFromContext ? (
                  <div className="pt-1 text-center">
                    <span className="text-[10px] font-black uppercase text-slate-500 block">Teslim Kodu</span>
                    <span className="text-sm font-mono font-black text-primary tracking-wider">
                      #{activeOrderFromContext.orderNumber} ({activeOrderFromContext.collectionCode})
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

          {/* DYNAMIC TOKEN REFRESH PROGRESS BAR (SECTION 16) */}
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

        {/* 3. CONTEXT INSTRUCTIONS & PAY AT BRANCH NOTICE (SECTION 2, 12, 84) */}
        {isReadyContext && activeOrderFromContext ? (
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
                  GölBOX QR ödeme kartı değildir. Siparişinizi teslim alırken kasada nakit veya kartla ödeme yapabilirsiniz.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowActiveOrderScreen(true)}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-primary/10 border border-primary/20 py-2 text-xs font-black text-primary hover:bg-primary/20 transition cursor-pointer"
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
              GölBOX QR ödeme kartı değildir. Hesabınızı kasada tanıtır ve avantajlarınızı aktarır.
            </p>
          </div>
        )}

        {/* 4. ACTIVE COUPONS */}
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
      </div>
    </div>
  )
}
