"use client"

import { useCallback, useEffect, useState } from "react"
import QRCode from "qrcode"
import { Screen } from "@/components/golbox/screen"
import { RefreshCw, ScanLine, WifiOff } from "lucide-react"
import { CouponPass, isActiveCoupon } from "@/components/golbox/coupon-pass"
import { LoginScreen } from "@/components/golbox/screens/login-screen"
import { QrGuestState } from "@/components/golbox/login-required-card"
import { GPValue } from "@/components/golbox/gp-value"
import { API_BASE_URL } from "@/lib/api-config"
import { useGolbox } from "@/lib/golbox-context"

export function QrScreen() {
  const { user, token, claimedRewards } = useGolbox()
  const [secondsLeft, setSecondsLeft] = useState(30)
  const [showLogin, setShowLogin] = useState(false)
  const [qrImage, setQrImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [offline, setOffline] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [loading, setLoading] = useState(false)
  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : ""
  const points = user?.pointsBalance ?? 0
  const activeCoupons = claimedRewards.filter(isActiveCoupon)

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
      const res = await fetch(`${API_BASE_URL}/qr/generate-dynamic`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) {
        setSessionExpired(true)
        setQrImage(null)
        return
      }
      const json = await res.json()
      const qrToken = json?.data?.qrToken as string | undefined
      const expires = Number(json?.data?.expiresInSeconds) || 30
      if (!res.ok || !json?.success || !qrToken) {
        setQrImage(null)
        setError("Kasa kodu oluşturulamadı.")
        return
      }
      const dataUrl = await QRCode.toDataURL(qrToken, {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 320,
        color: { dark: "#1d5f60", light: "#ffffff" },
      })
      setQrImage(dataUrl)
      setSecondsLeft(expires)
    } catch {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setOffline(true)
      } else {
        setError("Kasa kodu oluşturulamadı.")
      }
      setQrImage(null)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (!token) return
    void loadQr()
  }, [token, loadQr])

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
    return <LoginScreen onClose={() => setShowLogin(false)} closeLabel="QR’a dön" />
  }

  if (!token || sessionExpired) {
    return (
      <Screen fill className="justify-center gap-4">
        <QrGuestState onLogin={() => {
          setSessionExpired(false)
          setShowLogin(true)
        }} />
      </Screen>
    )
  }

  return (
    <Screen fill>
      <header className="space-y-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Kasa</p>
        <h1 className="font-serif text-2xl text-foreground">QR&apos;ın</h1>
        <p className="text-sm text-muted-foreground">Kasada göster. Kod 30 saniyede bir yenilenir.</p>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 py-4">
        <div className="gol-card w-full max-w-[300px] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-card-foreground">{displayName}</p>
              <p className="text-xs text-muted-foreground">Kasa kodu</p>
            </div>
            <span className="rounded-full bg-secondary px-2.5 py-1 text-sm font-semibold">
              <GPValue amount={points} className="text-sm" />
            </span>
          </div>

          <div className="mt-5 rounded-2xl bg-background p-4 relative min-h-[220px] flex items-center justify-center">
            {offline ? (
              <div className="flex flex-col items-center gap-2 px-2 text-center">
                <WifiOff className="size-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">Çevrimdışısınız</p>
                <p className="text-xs text-muted-foreground">Bağlantı gelince kasa kodunu yenileyin.</p>
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
              <img
                src={qrImage}
                alt="Kişisel kasa QR kodu"
                className="aspect-square w-full rounded-xl"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{loading ? "Kod hazırlanıyor..." : "Kod bekleniyor"}</p>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <RefreshCw className="size-3.5 text-primary" />
              <span>Yenilenme süresi</span>
            </div>
            <span className="font-mono font-bold text-primary">{secondsLeft}s</span>
          </div>
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-primary transition-all duration-1000 linear"
              style={{ width: `${(secondsLeft / 30) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm text-secondary-foreground">
          <ScanLine className="size-4" />
          Kasada bu kodu gösterin
        </div>

        {activeCoupons.length > 0 ? (
          <div className="w-full max-w-[300px] space-y-3">
            <p className="text-center text-xs text-muted-foreground">
              Aktif kişiye özel kuponların. Katalog kuponu saha kutusu ve Ismarlıyor ile karışmaz.
            </p>
            {activeCoupons.slice(0, 2).map((coupon) => (
              <CouponPass key={coupon.claimId} coupon={coupon} compact />
            ))}
          </div>
        ) : null}
      </div>
    </Screen>
  )
}
