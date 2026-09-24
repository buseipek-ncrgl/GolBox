"use client"

import { Gift, MapPin, Navigation, Compass, Sparkles } from "lucide-react"
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
  const [showMapCanvas, setShowMapCanvas] = useState(false)

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
    return <LoginScreen onClose={() => capture.setShowLogin(false)} closeLabel="Geri dön" />
  }

  return (
    <Screen fill className="space-y-4 pb-12">
      <header className="space-y-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Konum Rehberi</p>
        <h1 className="font-serif text-2xl font-bold text-foreground">Saha & Tesisler</h1>
        <p className="text-xs text-muted-foreground">
          {usingFallback
            ? "Mesafe ve konum takibi için cihazınızın konum iznini aktif tutun."
            : layer === "golbox"
              ? "Yakınınızdaki 3D saha kutuları. 500m yarıçapa girince kamera ile toplayabilirsiniz."
              : "Şehitkamil belediye tesisleri ve kitap kafeler."}
        </p>
      </header>

      {/* Layer Toggle Tabs */}
      <div className="flex gap-2" role="tablist" aria-label="Harita katmanı">
        <button
          type="button"
          role="tab"
          aria-selected={layer === "golbox"}
          onClick={() => {
            onLayerChange("golbox")
            setShowMapCanvas(false)
          }}
          className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-2xl text-xs font-bold transition-all ${
            layer === "golbox" ? "bg-primary text-primary-foreground shadow-2xs" : "bg-secondary text-foreground"
          }`}
        >
          <Gift className="size-4" />
          Saha Hediyeleri
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={layer === "places"}
          onClick={() => onLayerChange("places")}
          className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-2xl text-xs font-bold transition-all ${
            layer === "places" ? "bg-primary text-primary-foreground shadow-2xs" : "bg-secondary text-foreground"
          }`}
        >
          <MapPin className="size-4" />
          Tesisler
        </button>
      </div>

      {/* Map Canvas (Shown for Places OR when user clicks Show Map for GolBox) */}
      {(layer === "places" || showMapCanvas) && (
        <div className="rounded-[22px] border border-border/70 overflow-hidden shadow-xs">
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
      )}

      {/* GolBox Field Drops View: Clean Radar Guidance (No forced map canvas) */}
      {layer === "golbox" ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="size-4 text-primary" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">Yakındaki Hediyeler</h2>
            </div>
            <button
              type="button"
              onClick={() => setShowMapCanvas((prev) => !prev)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              {showMapCanvas ? "Haritayı Gizle" : "Haritada Göster"}
            </button>
          </div>

          <ul className="space-y-2.5">
            {fieldDrops.length === 0 ? (
              <li className="rounded-[20px] border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                Yakınınızda henüz yayınlanmış saha hediyesi bulunmuyor.
              </li>
            ) : (
              fieldDrops.map((drop) => {
                const active = (selected?.id ?? "") === drop.id
                const already = capture.capturedIds.includes(drop.id)
                const remaining = Math.max(0, Number(drop.distanceMeters) - Number(drop.radiusMeters))
                return (
                  <li key={drop.id}>
                    <div className={`rounded-[22px] border p-4 shadow-2xs transition-all ${
                      active ? "border-primary bg-primary/5" : "border-border/70 bg-card"
                    }`}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(drop.id)}
                        className="flex w-full items-start gap-3.5 text-left"
                      >
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[color:var(--color-brand-900)] to-primary text-white shadow-2xs">
                          <Gift className="size-5.5" strokeWidth={2} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-bold text-foreground text-sm">{drop.title}</span>
                          <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                            {drop.description}
                          </span>
                          <span className="mt-2 flex items-center gap-2 text-xs font-semibold text-primary">
                            <Navigation className="size-3.5" />
                            {formatDistance(Number(drop.distanceMeters))} mesafede
                            <span className="text-muted-foreground font-normal">· {drop.radiusMeters} m yarıçap</span>
                          </span>
                        </span>
                        <span className="shrink-0 rounded-full bg-[color:var(--color-gold)]/20 px-2.5 py-1 text-xs font-bold text-[color:var(--color-gold)]">
                          +{drop.pointsGranted} GP
                        </span>
                      </button>
                      
                      <div className="mt-3 border-t border-border/40 pt-2.5">
                        {already ? (
                          <p className="text-xs font-bold text-primary flex items-center gap-1">
                            <Sparkles className="size-3.5" />
                            Bu Hediye Toplandı
                          </p>
                        ) : drop.inRange ? (
                          <button
                            type="button"
                            disabled={capture.loading || capture.busyId === drop.id}
                            onClick={() => capture.openCapture(drop.id)}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-2xs transition-all hover:bg-primary/95 active:scale-95"
                          >
                            <Sparkles className="size-4" />
                            {capture.busyId === drop.id ? "Toplanıyor..." : capture.token ? "3D Kamera ile Topla" : "Giriş yap ve Al"}
                          </button>
                        ) : (
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              Hediyeyi almak için kalan mesafe: <span className="font-bold text-foreground">{Math.ceil(remaining)} m</span>
                            </p>
                            <button
                              type="button"
                              onClick={() => setShowMapCanvas(true)}
                              className="text-xs font-bold text-primary hover:underline"
                            >
                              Yol Tarifi
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      ) : (
        /* Places List View */
        <ul className="space-y-2 overflow-y-auto pb-2">
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
                  className="flex w-full items-start gap-3.5 rounded-[20px] border border-border/70 bg-card p-4 text-left shadow-2xs transition-all hover:border-primary/30"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                    <MapPin className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {categoryLabel(place.category)}
                    </span>
                    <span className="block font-bold text-foreground text-sm mt-0.5">{place.name}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {place.addressSummary || openStatusLabel(place.openStatus)}
                    </span>
                  </span>
                </button>
              </li>
            ))
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
