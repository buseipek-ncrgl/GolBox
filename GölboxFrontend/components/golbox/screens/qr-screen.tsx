"use client"

import { useEffect, useMemo, useState } from "react"
import { Screen } from "@/components/golbox/screen"
import { RefreshCw, ScanLine } from "lucide-react"
import { CouponPass, isActiveCoupon } from "@/components/golbox/coupon-pass"
import { LoginScreen } from "@/components/golbox/screens/login-screen"
import { GPValue } from "@/components/golbox/gp-value"
import { useGolbox } from "@/lib/golbox-context"

function useMatrix(seed: string, size = 21) {
  return useMemo(() => {
    let h = 0
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
    const rand = () => {
      h = (h * 1103515245 + 12345) & 0x7fffffff
      return h / 0x7fffffff
    }
    const grid: boolean[][] = []
    for (let r = 0; r < size; r++) {
      const row: boolean[] = []
      for (let c = 0; c < size; c++) row.push(rand() > 0.5)
      grid.push(row)
    }
    const stamp = (or: number, oc: number) => {
      for (let r = 0; r < 7; r++)
        for (let c = 0; c < 7; c++) {
          const edge = r === 0 || r === 6 || c === 0 || c === 6
          const core = r >= 2 && r <= 4 && c >= 2 && c <= 4
          grid[or + r][oc + c] = edge || core
        }
    }
    stamp(0, 0)
    stamp(0, size - 7)
    stamp(size - 7, 0)
    return grid
  }, [seed, size])
}

export function QrScreen() {
  const { user, token, claimedRewards } = useGolbox()
  const [secondsLeft, setSecondsLeft] = useState(30)
  const [showLogin, setShowLogin] = useState(false)
  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : ""
  const points = user?.pointsBalance ?? 0

  // 30-Second TOTP Auto Refresh Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 30 : prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const currentSeed = useMemo(() => {
    const baseId = user?.id ? user.id.replace(/-/g, "").slice(0, 8).toUpperCase() : "GUEST"
    const step = Math.floor(Date.now() / 30000)
    return `GB-${baseId}-${step}`
  }, [user?.id, secondsLeft === 30])

  const matrix = useMatrix(currentSeed)
  const activeCoupons = claimedRewards.filter(isActiveCoupon)

  if (showLogin && !token) {
    return <LoginScreen onClose={() => setShowLogin(false)} closeLabel="QR’a dön" />
  }

  if (!token) {
    return (
      <Screen>
        <header className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Kasa</p>
          <h1 className="font-serif text-2xl text-foreground">QR’ın</h1>
          <p className="text-sm text-muted-foreground">Kişisel kasa kodu giriş yaptıktan sonra üretilir.</p>
        </header>
        <div className="gol-card px-5 py-6 text-center">
          <ScanLine className="mx-auto size-6 text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Kasada göstermek ve kupon kullanmak için Şehitkamil+ hesabın gerekir.</p>
          <button
            type="button"
            onClick={() => setShowLogin(true)}
            className="mt-4 min-h-11 w-full rounded-[14px] bg-primary text-sm font-semibold text-primary-foreground"
          >
            Giriş yap
          </button>
        </div>
      </Screen>
    )
  }

  return (
    <Screen fill>
      <header className="space-y-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Kasa</p>
        <h1 className="font-serif text-2xl text-foreground">QR&apos;ın</h1>
        <p className="text-sm text-muted-foreground">
          Dinamik Güvenli QR. 30 saniyede bir otomatik yenilenir.
        </p>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 py-4">
        <div className="gol-card w-full max-w-[300px] p-6 shadow-[0_24px_60px_-40px_rgba(29,95,96,0.8)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-card-foreground">{displayName}</p>
              <p className="text-xs text-muted-foreground font-mono">{currentSeed.slice(0, 15)}...</p>
            </div>
            <span className="rounded-full bg-secondary px-2.5 py-1 text-sm font-semibold">
              <GPValue amount={points} className="text-sm" />
            </span>
          </div>

          <div className="mt-5 rounded-2xl bg-background p-4 relative">
            <div
              className="grid aspect-square w-full gap-[2px]"
              style={{ gridTemplateColumns: `repeat(${matrix.length}, minmax(0, 1fr))` }}
              role="img"
              aria-label="Kişisel Dinamik GölBox QR kodu"
            >
              {matrix.flatMap((row, r) =>
                row.map((on, c) => (
                  <span
                    key={`${r}-${c}`}
                    className={on ? "rounded-[1px] bg-primary" : "bg-transparent"}
                  />
                )),
              )}
            </div>
          </div>

          {/* 30s TOTP Countdown Bar */}
          <div className="mt-4 flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <RefreshCw className="size-3.5 animate-spin text-primary" style={{ animationDuration: '4s' }} />
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
