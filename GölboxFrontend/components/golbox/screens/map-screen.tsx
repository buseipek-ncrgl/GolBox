"use client"

import { Gift, MapPin, Navigation } from "lucide-react"
import { Screen } from "@/components/golbox/screen"
import { useGolbox } from "@/lib/golbox-context"
import { LoginScreen } from "@/components/golbox/screens/login-screen"
import { CaptureOverlay } from "@/components/golbox/capture-overlay"
import { FacilityMap } from "@/components/golbox/map/facility-map"
import { EmptyState } from "@/components/golbox/empty-state"
import { InlineError } from "@/components/golbox/inline-error"
import { formatDistance } from "@/lib/golbox-geo"
import { useCitizenLocation } from "@/lib/use-citizen-location"
import { useCaptureSession } from "@/lib/use-capture-session"
import { fetchPlaces } from "@/lib/places-api"
import { categoryLabel, openStatusLabel, type PlaceListItem } from "@/lib/places"
import { useEffect, useMemo, useState } from "react"

export function MapScreen({
  layer,
  onLayerChange,
  focusPlaceId,
  onOpenPlace,
}: {
  layer: "places" | "golbox"
  onLayerChange: (layer: "places" | "golbox") => void
  focusPlaceId?: string | null
  onOpenPlace: (id: string) => void
}) {
  const { fieldDrops, token } = useGolbox()
  const { origin, usingFallback } = useCitizenLocation(20000)
  const capture = useCaptureSession(origin, fieldDrops)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [places, setPlaces] = useState<PlaceListItem[]>([])
  const [placesError, setPlacesError] = useState(false)

  useEffect(() => {
    let cancelled = false
    void fetchPlaces({ lat: origin.lat, lng: origin.lng, pageSize: 50, token })
      .then((page) => {
        if (!cancelled) {
          setPlaces(page.items)
          setPlacesError(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPlaces([])
          setPlacesError(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [origin.lat, origin.lng, token])

  const selected = useMemo(
    () => fieldDrops.find((drop) => drop.id === selectedId) ?? fieldDrops[0] ?? null,
    [fieldDrops, selectedId],
  )

  const focusPlace = places.find((place) => place.id === focusPlaceId)
  const focus =
    focusPlace && Number.isFinite(Number(focusPlace.latitude)) && Number.isFinite(Number(focusPlace.longitude))
      ? { lat: Number(focusPlace.latitude), lng: Number(focusPlace.longitude) }
      : null

  if (capture.showLogin && !capture.token) {
    return <LoginScreen onClose={() => capture.setShowLogin(false)} closeLabel="Haritaya dön" />
  }

  return (
    <Screen fill>
      <header className="mb-3 space-y-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Keşif</p>
        <h1 className="font-serif text-2xl text-foreground">Harita</h1>
        <p className="text-sm text-muted-foreground">
          {usingFallback
            ? "Konum izni olmadan tesisleri görüntüleyebilirsin. Mesafe sıralaması için konum izni ver."
            : layer === "golbox"
              ? "GölBox saha hediyeleri. Yarıçapa girince Al."
              : "Belediye tesislerini keşfet. Liste haritanın alternatifidir."}
        </p>
      </header>

      <div className="mb-3 flex gap-2" role="tablist" aria-label="Harita katmanı">
        <button
          type="button"
          role="tab"
          aria-selected={layer === "places"}
          onClick={() => onLayerChange("places")}
          className={`flex min-h-11 flex-1 items-center justify-center rounded-2xl text-sm font-semibold ${
            layer === "places" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
          }`}
        >
          Yerler
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={layer === "golbox"}
          onClick={() => onLayerChange("golbox")}
          className={`flex min-h-11 flex-1 items-center justify-center rounded-2xl text-sm font-semibold ${
            layer === "golbox" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
          }`}
        >
          GölBox
        </button>
      </div>

      <div className="gol-card overflow-hidden p-0">
        <div className="h-52 w-full">
          <FacilityMap
            layer={layer}
            places={places}
            drops={fieldDrops}
            origin={origin}
            focus={layer === "places" ? focus : selected ? { lat: Number(selected.latitude), lng: Number(selected.longitude) } : origin}
            onSelectPlace={onOpenPlace}
            onSelectDrop={setSelectedId}
          />
        </div>
      </div>

      {layer === "places" ? (
        <ul className="mt-4 flex-1 space-y-2 overflow-y-auto pb-2">
          {placesError ? (
            <li>
              <InlineError message="Tesisler yüklenemedi." onRetry={() => void fetchPlaces({ lat: origin.lat, lng: origin.lng, pageSize: 50, token }).then((p) => setPlaces(p.items))} />
            </li>
          ) : places.length === 0 ? (
            <li>
              <EmptyState title="Henüz yayınlanmış tesis bulunmuyor." />
            </li>
          ) : (
            places.map((place) => (
              <li key={place.id}>
                <button
                  type="button"
                  onClick={() => onOpenPlace(place.id)}
                  className="gol-card flex w-full items-start gap-3 p-4 text-left"
                >
                  <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
                    <MapPin className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {categoryLabel(place.category)}
                    </span>
                    <span className="block font-semibold text-foreground">{place.name}</span>
                    <span className="mt-1 text-xs text-muted-foreground">
                      {place.addressSummary || openStatusLabel(place.openStatus)}
                    </span>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : (
        <ul className="mt-4 flex-1 space-y-2 overflow-y-auto pb-2">
          {fieldDrops.length === 0 ? (
            <li className="gol-card border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              Yakında yayında saha hediyesi yok.
            </li>
          ) : (
            fieldDrops.map((drop) => {
              const active = (selected?.id ?? "") === drop.id
              const already = capture.capturedIds.includes(drop.id)
              const remaining = Math.max(0, Number(drop.distanceMeters) - Number(drop.radiusMeters))
              return (
                <li key={drop.id}>
                  <div className={`gol-card p-4 ${active ? "border-primary" : ""}`}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(drop.id)}
                      className="flex w-full items-start gap-3 text-left"
                    >
                      <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#1c2e2e] text-white">
                        <Gift className="size-5" strokeWidth={2} />
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
                          disabled={capture.loading || capture.busyId === drop.id}
                          onClick={() => capture.openCapture(drop.id)}
                          className="min-h-11 w-full rounded-2xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                        >
                          {capture.busyId === drop.id ? "Alınıyor..." : capture.token ? "Al" : "Giriş yap ve al"}
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
      )}

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
