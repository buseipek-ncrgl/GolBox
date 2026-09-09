"use client"

import { useEffect, useMemo, useState } from "react"
import { MapPin, Navigation } from "lucide-react"
import { useGolbox } from "@/lib/golbox-context"
import { LoginScreen } from "@/components/golbox/screens/login-screen"
import { CaptureOverlay } from "@/components/golbox/capture-overlay"

const SEHITKAMIL = { lat: 37.0662, lng: 37.3781 }

function osmEmbed(lat: number, lng: number) {
  const pad = 0.012
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - pad}%2C${lat - pad}%2C${lng + pad}%2C${lat + pad}&layer=mapnik&marker=${lat}%2C${lng}`
}

function formatDistance(meters: number) {
  if (!Number.isFinite(meters)) return "—"
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

export function MapScreen() {
  const { fieldDrops, loadNearbyFieldDrops, captureFieldDrop, token, loading } = useGolbox()
  const [origin, setOrigin] = useState(SEHITKAMIL)
  const [usingFallback, setUsingFallback] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showLogin, setShowLogin] = useState(false)
  const [capturedIds, setCapturedIds] = useState<string[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [pendingDropId, setPendingDropId] = useState<string | null>(null)

  useEffect(() => {
    if (token) setShowLogin(false)
  }, [token])

  useEffect(() => {
    let cancelled = false
    if (!navigator.geolocation) {
      loadNearbyFieldDrops(SEHITKAMIL.lat, SEHITKAMIL.lng)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setOrigin(next)
        setUsingFallback(false)
        loadNearbyFieldDrops(next.lat, next.lng)
      },
      () => {
        if (cancelled) return
        setOrigin(SEHITKAMIL)
        setUsingFallback(true)
        loadNearbyFieldDrops(SEHITKAMIL.lat, SEHITKAMIL.lng)
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
    return () => {
      cancelled = true
    }
  }, [loadNearbyFieldDrops])

  useEffect(() => {
    const tick = window.setInterval(() => {
      loadNearbyFieldDrops(origin.lat, origin.lng)
    }, 20000)
    return () => window.clearInterval(tick)
  }, [loadNearbyFieldDrops, origin.lat, origin.lng])

  const selected = useMemo(
    () => fieldDrops.find((d) => d.id === selectedId) ?? fieldDrops[0] ?? null,
    [fieldDrops, selectedId]
  )

  const mapLat = selected ? Number(selected.latitude) : origin.lat
  const mapLng = selected ? Number(selected.longitude) : origin.lng

  const pendingDrop = useMemo(
    () => fieldDrops.find((d) => d.id === pendingDropId) ?? null,
    [fieldDrops, pendingDropId]
  )

  const openCapture = (dropId: string) => {
    if (!token) {
      setShowLogin(true)
      return
    }
    setPendingDropId(dropId)
  }

  const confirmCapture = async () => {
    if (!pendingDrop) return
    setBusyId(pendingDrop.id)
    const ok = await captureFieldDrop(pendingDrop.id, origin.lat, origin.lng)
    if (ok) {
      setCapturedIds((prev) => (prev.includes(pendingDrop.id) ? prev : [...prev, pendingDrop.id]))
      setPendingDropId(null)
    }
    setBusyId(null)
  }

  if (showLogin && !token) {
    return <LoginScreen onClose={() => setShowLogin(false)} />
  }

  return (
    <div className="gol-fade-up flex h-full flex-col px-5 pb-4 pt-3">
      <header className="mb-3 space-y-1">
        <h1 className="font-serif text-2xl text-foreground">Saha haritası</h1>
        <p className="text-sm text-muted-foreground">
          {usingFallback
            ? "Konum alınamadı. Şehitkamil merkezi kullanılıyor. Yarıçap içinde Al çalışır."
            : "Yarıçapa girince Al. Dışarıda veya ikinci kez alınmaz."}
        </p>
      </header>

      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        <iframe
          title="Saha hediyeleri haritası"
          src={osmEmbed(mapLat, mapLng)}
          className="h-52 w-full border-0"
        />
      </div>

      <ul className="mt-4 flex-1 space-y-2 overflow-y-auto pb-2">
        {fieldDrops.length === 0 ? (
          <li className="rounded-3xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            Yakında yayında saha hediyesi yok.
          </li>
        ) : (
          fieldDrops.map((drop) => {
            const active = (selected?.id ?? "") === drop.id
            const already = capturedIds.includes(drop.id)
            const remaining = Math.max(0, Number(drop.distanceMeters) - Number(drop.radiusMeters))
            return (
              <li key={drop.id}>
                <div
                  className={`rounded-3xl border p-4 ${
                    active ? "border-primary bg-card" : "border-border bg-card"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(drop.id)}
                    className="flex w-full items-start gap-3 text-left"
                  >
                    <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
                      <MapPin className="size-5" strokeWidth={2} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-card-foreground">{drop.title}</span>
                      <span className="mt-0.5 line-clamp-2 block text-sm text-muted-foreground">
                        {drop.description}
                      </span>
                      <span className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Navigation className="size-3.5" />
                        {formatDistance(Number(drop.distanceMeters))}
                        <span>· {drop.radiusMeters} m yarıçap</span>
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-accent/20 px-2.5 py-1 text-xs font-semibold text-accent-foreground">
                      +{drop.pointsGranted} GP
                    </span>
                  </button>
                  <div className="mt-3">
                    {already ? (
                      <p className="text-sm font-medium text-primary">Toplandı</p>
                    ) : drop.inRange ? (
                      <button
                        type="button"
                        disabled={loading || busyId === drop.id}
                        onClick={() => openCapture(drop.id)}
                        className="w-full rounded-2xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                      >
                        {busyId === drop.id ? "Alınıyor..." : token ? "Al" : "Giriş yap ve al"}
                      </button>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Henüz yeterince yakın değilsiniz. Kalan yaklaşık {Math.ceil(remaining)} m.
                      </p>
                    )}
                  </div>
                </div>
              </li>
            )
          })
        )}
      </ul>

      {pendingDrop && (
        <CaptureOverlay
          drop={pendingDrop}
          busy={busyId === pendingDrop.id}
          onConfirm={confirmCapture}
          onClose={() => setPendingDropId(null)}
        />
      )}
    </div>
  )
}
