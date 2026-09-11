"use client"

import { useState } from "react"
import { Gift, MapPin } from "lucide-react"
import { Screen } from "@/components/golbox/screen"
import { UserCard } from "@/components/golbox/user-card"
import { WaitingTreats, useWaitingTreats } from "@/components/golbox/waiting-treats"
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
  const waitingTreats = useWaitingTreats()
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

  const ismarliyor = (
    <section aria-label="Ismarlıyor" className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Ismarlıyor</p>
          <h2 className="mt-1 font-serif text-[1.65rem] leading-none text-foreground">Seni bekleyen</h2>
        </div>
      </div>
      <WaitingTreats compact onShowQr={() => onNavigate("qr")} onExploreCafes={onOpenCafes} />
    </section>
  )

  const fieldDrop = (
    <section aria-label="Yakındaki saha hediyesi" className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Saha kutusu</p>
          <h2 className="mt-1 font-serif text-[1.65rem] leading-none text-foreground">Yakındaki hediye</h2>
        </div>
        <button type="button" onClick={() => onNavigate("map")} className="text-sm font-medium text-primary">
          Harita
        </button>
      </div>

      {nearbyDrop ? (
        <article className="gol-card">
          <div className="flex items-start gap-3 p-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
              <Gift className="size-5" strokeWidth={1.8} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-card-foreground">{nearbyDrop.title}</p>
                <span className="shrink-0 rounded-full bg-accent/20 px-2.5 py-1 font-serif text-xs font-semibold text-accent-foreground">
                  +{nearbyDrop.pointsGranted} GP
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatDistance(Number(nearbyDrop.distanceMeters))}
                {nearbyDrop.inRange ? " · yarıçap içindesiniz" : ""}
                {usingFallback ? " · Şehitkamil" : ""}
              </p>
            </div>
          </div>
          <div className="px-4 pb-4">
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
        <p className="gol-card border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          Yakında yayında saha hediyesi yok.
        </p>
      )}
    </section>
  )

  return (
    <Screen>
      <UserCard onOpenCatalog={() => setShowRewards(true)} />

      {/* Dynamic ordering: Active Field Drops or Waiting Treats top-prioritized */}
      {nearbyDrop && !already && fieldDrop}
      {waitingTreats.length > 0 && ismarliyor}
      {(!nearbyDrop || already) && fieldDrop}

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
          className="gol-card group block w-full text-left"
        >
          <CafeCover name={cafeCard.name} imageUrl={cafeCard.imageUrl} className="h-32 w-full" />
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

      {/* If no waiting treats, place Ismarlıyor down here */}
      {waitingTreats.length === 0 && ismarliyor}

      <section aria-label="Son hareketler" className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Son hareketler</h2>
        <ul className="gol-card divide-y divide-border">
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

      {capture.pendingDrop && (
        <CaptureOverlay
          drop={capture.pendingDrop}
          busy={capture.busyId === capture.pendingDrop.id}
          onConfirm={capture.confirmCapture}
          onClose={capture.closeCapture}
        />
      )}
    </Screen>
  )
}
