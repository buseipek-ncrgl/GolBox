"use client"

import { useState } from "react"
import { ArrowRight, Gift, MapPin, QrCode } from "lucide-react"
import { UserCard } from "@/components/golbox/user-card"
import { WaitingTreats } from "@/components/golbox/waiting-treats"
import { CaptureOverlay } from "@/components/golbox/capture-overlay"
import { CafeCover } from "@/components/golbox/cafe-cover"
import { LoginScreen } from "@/components/golbox/screens/login-screen"
import { RewardsScreen } from "@/components/golbox/screens/rewards-screen"
import { activity, cafes as mockCafes, type TabId } from "@/lib/golbox-data"
import { useGolbox } from "@/lib/golbox-context"
import { formatDistance } from "@/lib/golbox-geo"
import { useCitizenLocation } from "@/lib/use-citizen-location"
import { useCaptureSession } from "@/lib/use-capture-session"

export function HomeScreen({
  onNavigate,
  onOpenCafe,
  onOpenCafes,
}: {
  onNavigate: (tab: TabId) => void
  onOpenCafe: (id: string) => void
  onOpenCafes: () => void
}) {
  const { fieldDrops, token, pointTransactions, cafes: liveCafes } = useGolbox()
  const { origin, usingFallback } = useCitizenLocation()
  const capture = useCaptureSession(origin, fieldDrops)
  const [showRewards, setShowRewards] = useState(false)

  const nearbyDrop = fieldDrops[0] ?? null
  const already = nearbyDrop ? capture.capturedIds.includes(nearbyDrop.id) : false
  const remaining = nearbyDrop
    ? Math.max(0, Number(nearbyDrop.distanceMeters) - Number(nearbyDrop.radiusMeters))
    : 0

  const nearestLive = liveCafes[0]
  const nearestMock = mockCafes[0]
  const cafeCard = nearestLive
    ? {
        id: nearestLive.id,
        name: nearestLive.name,
        meta: nearestLive.address,
        imageUrl: nearestLive.imageUrl,
        badge: nearestLive.isActive === false ? "Kapalı" : "Açık",
      }
    : {
        id: nearestMock.id,
        name: nearestMock.name,
        meta: `${nearestMock.distance} · ${nearestMock.walk}`,
        imageUrl: undefined as string | undefined,
        badge: nearestMock.open ? `Açık · ${nearestMock.closeAt}` : "Kapalı",
      }

  const recentMoves =
    token && pointTransactions.length > 0
      ? pointTransactions.slice(0, 3).map((pt) => ({
          id: pt.id,
          label: pt.description || "GölPuan",
          when: new Date(pt.createdDate).toLocaleString("tr-TR", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          }),
          value: `${pt.amount > 0 ? "+" : ""}${pt.amount}`,
          kind: pt.amount >= 0 ? "earn" : "spend",
        }))
      : activity.slice(0, 3)

  if (showRewards) {
    return <RewardsScreen onClose={() => setShowRewards(false)} closeLabel="Ana sayfaya dön" />
  }

  if (capture.showLogin && !capture.token) {
    return <LoginScreen onClose={() => capture.setShowLogin(false)} closeLabel="Ana sayfaya dön" />
  }

  return (
    <div className="gol-fade-up space-y-6 px-5 pb-8 pt-3">
      <UserCard onOpenCatalog={() => setShowRewards(true)} />

      <section aria-label="Yakındaki saha hediyesi" className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Saha kutusu
            </p>
            <h2 className="mt-1 font-serif text-2xl leading-none text-foreground">Yakındaki hediye</h2>
          </div>
          <button type="button" onClick={() => onNavigate("map")} className="text-sm font-medium text-primary">
            Harita
          </button>
        </div>

        {nearbyDrop ? (
          <article className="overflow-hidden rounded-[1.75rem] border border-border bg-card">
            <div className="relative h-36 bg-gradient-to-br from-primary via-[#1d5f60] to-[#0b1f20]">
              {nearbyDrop.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={nearbyDrop.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55" />
              ) : (
                <div
                  aria-hidden
                  className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(212,160,23,0.28),transparent_42%)]"
                />
              )}
              <div className="absolute inset-5 flex items-end justify-between">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-white/12 text-white">
                  <Gift className="size-6" strokeWidth={1.8} />
                </span>
                <span className="rounded-full bg-accent/90 px-2.5 py-1 text-xs font-semibold text-accent-foreground">
                  +{nearbyDrop.pointsGranted} GP
                </span>
              </div>
            </div>
            <div className="space-y-3 p-4">
              <div>
                <p className="font-semibold text-card-foreground">{nearbyDrop.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDistance(Number(nearbyDrop.distanceMeters))}
                  {nearbyDrop.inRange ? " · yarıçap içindesiniz" : ""}
                  {usingFallback ? " · Şehitkamil merkezi" : ""}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  Kamera ile al. Katalog ödülü ve Ismarlıyor buradan ayrıdır.
                </p>
              </div>
              {already ? (
                <p className="text-sm font-medium text-primary">Toplandı</p>
              ) : nearbyDrop.inRange ? (
                <button
                  type="button"
                  disabled={capture.loading || capture.busyId === nearbyDrop.id}
                  onClick={() => capture.openCapture(nearbyDrop.id)}
                  className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {capture.busyId === nearbyDrop.id
                    ? "Alınıyor..."
                    : capture.token
                      ? "Kamerayı aç ve al"
                      : "Giriş yap ve al"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate("map")}
                  className="w-full rounded-full bg-secondary py-3 text-sm font-semibold text-secondary-foreground"
                >
                  Henüz yakın değilsiniz · kalan {Math.ceil(remaining)} m
                </button>
              )}
            </div>
          </article>
        ) : (
          <p className="rounded-[1.75rem] border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            Yakında yayında saha hediyesi yok.
          </p>
        )}
      </section>

      <section aria-label="Ismarlıyor" className="space-y-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Ismarlıyor</p>
          <h2 className="mt-1 font-serif text-2xl leading-none text-foreground">Seni bekleyen</h2>
        </div>
        <WaitingTreats compact onShowQr={() => onNavigate("qr")} onExploreCafes={onOpenCafes} />
      </section>

      <section aria-label="Sana en yakın şube" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Sana en yakın</h2>
          <button type="button" onClick={onOpenCafes} className="text-sm font-medium text-primary">
            Tümü
          </button>
        </div>
        <button
          type="button"
          onClick={() => onOpenCafe(cafeCard.id)}
          className="group block w-full overflow-hidden rounded-[1.75rem] border border-border bg-card text-left"
        >
          <CafeCover name={cafeCard.name} imageUrl={cafeCard.imageUrl} className="h-36 w-full" />
          <div className="flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-card-foreground">{cafeCard.name}</p>
              <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-3.5" /> {cafeCard.meta}
              </p>
            </div>
            <span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
              {cafeCard.badge}
            </span>
          </div>
        </button>
      </section>

      <section aria-label="Son hareketler" className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Son hareketler</h2>
        <ul className="divide-y divide-border overflow-hidden rounded-[1.75rem] border border-border bg-card">
          {recentMoves.map((row) => (
            <li key={row.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-card-foreground">{row.label}</p>
                <p className="text-xs text-muted-foreground">{row.when}</p>
              </div>
              <span
                className={
                  row.kind === "earn"
                    ? "font-serif text-base text-accent-foreground"
                    : "font-serif text-base text-muted-foreground"
                }
              >
                {row.value}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <button
        type="button"
        onClick={() => onNavigate("qr")}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3.5 text-sm font-semibold text-background"
      >
        <QrCode className="size-4.5" strokeWidth={2.2} />
        QR&apos;ımı göster
        <ArrowRight className="size-4" />
      </button>

      {capture.pendingDrop && (
        <CaptureOverlay
          drop={capture.pendingDrop}
          busy={capture.busyId === capture.pendingDrop.id}
          onConfirm={capture.confirmCapture}
          onClose={capture.closeCapture}
        />
      )}
    </div>
  )
}
