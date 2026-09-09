"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { ArrowRight, Coffee, Gift, MapPin, QrCode } from "lucide-react"
import { UserCard } from "@/components/golbox/user-card"
import { activity, cafes, todayHighlight, type TabId } from "@/lib/golbox-data"
import { useGolbox } from "@/lib/golbox-context"

const SEHITKAMIL = { lat: 37.0662, lng: 37.3781 }

function formatDistance(meters: number) {
  if (!Number.isFinite(meters)) return "—"
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

export function HomeScreen({
  onNavigate,
  onOpenCafe,
}: {
  onNavigate: (tab: TabId) => void
  onOpenCafe: (id: string) => void
}) {
  const { fieldDrops, loadNearbyFieldDrops } = useGolbox()
  const [usingFallback, setUsingFallback] = useState(true)
  const nearest = cafes[0]
  const nearbyDrop = fieldDrops[0] ?? null

  useEffect(() => {
    if (!navigator.geolocation) {
      loadNearbyFieldDrops(SEHITKAMIL.lat, SEHITKAMIL.lng)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUsingFallback(false)
        loadNearbyFieldDrops(pos.coords.latitude, pos.coords.longitude)
      },
      () => {
        setUsingFallback(true)
        loadNearbyFieldDrops(SEHITKAMIL.lat, SEHITKAMIL.lng)
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }, [loadNearbyFieldDrops])

  return (
    <div className="gol-fade-up space-y-6 px-5 pb-6 pt-3">
      <UserCard />

      <section aria-label="Yakındaki saha hediyesi" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Yakındaki saha hediyesi</h2>
          <button onClick={() => onNavigate("map")} className="text-sm font-medium text-primary">
            Harita
          </button>
        </div>
        {nearbyDrop ? (
          <button
            type="button"
            onClick={() => onNavigate("map")}
            className="flex w-full items-center gap-3 rounded-3xl border border-border bg-card p-4 text-left"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
              <Gift className="size-6" strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-card-foreground">{nearbyDrop.title}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">
                {formatDistance(Number(nearbyDrop.distanceMeters))}
                {nearbyDrop.inRange ? " · yarıçap içindesiniz" : ""}
                {usingFallback ? " · Şehitkamil merkezi" : ""}
              </span>
              <span className="mt-1 block text-[11px] text-muted-foreground">
                Katalog ödülü ve Ismarlıyor buradan ayrıdır.
              </span>
            </span>
            <span className="shrink-0 rounded-full bg-accent/20 px-2.5 py-1 text-xs font-semibold text-accent-foreground">
              +{nearbyDrop.pointsGranted} GP
            </span>
          </button>
        ) : (
          <p className="rounded-3xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            Yakında yayında saha hediyesi yok.
          </p>
        )}
      </section>

      <section aria-label="Bugün seni bekleyen">
        <button
          onClick={() => onNavigate("qr")}
          className="group flex w-full items-center gap-4 rounded-3xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/30"
        >
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent/20 text-accent-foreground">
            <Coffee className="size-6" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {todayHighlight.kicker}
            </p>
            <p className="mt-0.5 text-pretty font-semibold leading-snug text-card-foreground">
              {todayHighlight.title}
            </p>
            <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{todayHighlight.detail}</p>
          </div>
          <ArrowRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </button>
      </section>

      <section aria-label="Sana en yakın şube" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Sana en yakın</h2>
          <button
            onClick={() => onNavigate("cafes")}
            className="text-sm font-medium text-primary"
          >
            Tümü
          </button>
        </div>
        <button
          onClick={() => onOpenCafe(nearest.id)}
          className="group block w-full overflow-hidden rounded-3xl border border-border bg-card text-left"
        >
          <div className="relative h-36 w-full">
            <Image
              src={nearest.image || "/placeholder.svg"}
              alt={`${nearest.name} iç mekan`}
              fill
              sizes="420px"
              className="object-cover"
            />
            <span className="absolute left-3 top-3 rounded-full bg-background/85 px-2.5 py-1 text-[11px] font-medium text-foreground backdrop-blur">
              {nearest.hint}
            </span>
          </div>
          <div className="flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-card-foreground">{nearest.name}</p>
              <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-3.5" /> {nearest.distance} · {nearest.walk}
              </p>
            </div>
            <span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
              {nearest.open ? `Açık · ${nearest.closeAt}` : "Kapalı"}
            </span>
          </div>
        </button>
      </section>

      <section aria-label="Son hareketler" className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Son hareketler</h2>
        <ul className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
          {activity.slice(0, 3).map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-card-foreground">{a.label}</p>
                <p className="text-xs text-muted-foreground">{a.when}</p>
              </div>
              <span
                className={
                  a.kind === "earn"
                    ? "font-serif text-base text-primary"
                    : "font-serif text-base text-muted-foreground"
                }
              >
                {a.value}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <button
        onClick={() => onNavigate("qr")}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3.5 text-sm font-semibold text-background"
      >
        <QrCode className="size-4.5" strokeWidth={2.2} />
        QR&apos;ımı göster
      </button>
    </div>
  )
}
