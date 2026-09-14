"use client"

import { useEffect, useState } from "react"
import { MapPin, Navigation, Phone, Globe } from "lucide-react"
import { CafeCover } from "@/components/golbox/cafe-cover"
import { EmptyState } from "@/components/golbox/empty-state"
import { StatusChip } from "@/components/golbox/status-chip"
import { fetchPlaceDetail } from "@/lib/places-api"
import {
  DAY_LABELS,
  amenityLabel,
  categoryLabel,
  geoUrl,
  mapsDirectionsUrl,
  openStatusLabel,
  type PlaceDetail,
} from "@/lib/places"
import { formatDistance } from "@/lib/golbox-geo"
import { useCitizenLocation } from "@/lib/use-citizen-location"

export function PlaceDetailSheet({
  placeId,
  onClose,
  onOpenCafe,
  onOpenMap,
  onOpenActivity,
}: {
  placeId: string
  onClose: () => void
  onOpenCafe?: (id: string) => void
  onOpenMap?: (place: PlaceDetail) => void
  onOpenActivity?: (id: string) => void
}) {
  const { origin } = useCitizenLocation()
  const [place, setPlace] = useState<PlaceDetail | null>(null)
  const [error, setError] = useState(false)
  const [imageIndex, setImageIndex] = useState(0)

  useEffect(() => {
    let cancelled = false
    setError(false)
    setPlace(null)
    void fetchPlaceDetail(placeId, origin)
      .then((item) => {
        if (!cancelled) setPlace(item)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [placeId, origin.lat, origin.lng])

  const gallery = place
    ? (place.images.length > 0 ? place.images.map((i) => i.imageUrl) : place.coverImageUrl ? [place.coverImageUrl] : [])
    : []
  const lat = Number(place?.latitude)
  const lng = Number(place?.longitude)
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng)

  return (
    <div className="absolute inset-0 z-50">
      <button type="button" aria-label="Kapat" onClick={onClose} className="absolute inset-0 bg-foreground/40" />
      <div className="gol-sheet-up absolute inset-x-0 bottom-0 top-10 flex flex-col overflow-hidden rounded-t-[2rem] bg-background">
        <div className="flex items-center justify-between px-5 pt-4">
          <p className="font-serif text-xl text-foreground">Tesis</p>
          <button
            type="button"
            onClick={onClose}
            className="flex size-11 items-center justify-center rounded-full bg-secondary text-sm font-semibold"
          >
            Kapat
          </button>
        </div>
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-8 pt-3">
          {error ? (
            <EmptyState title="Tesisler yüklenemedi." />
          ) : !place ? (
            <p className="text-sm text-muted-foreground">Yükleniyor…</p>
          ) : (
            <>
              <div className="overflow-hidden rounded-[1.25rem] bg-secondary">
                <CafeCover name={place.name} imageUrl={gallery[imageIndex]} className="h-44 w-full" />
              </div>
              {gallery.length > 1 ? (
                <div className="mt-2 flex gap-2 overflow-x-auto">
                  {gallery.map((url, index) => (
                    <button
                      key={url + index}
                      type="button"
                      onClick={() => setImageIndex(index)}
                      className={`size-11 overflow-hidden rounded-xl ${index === imageIndex ? "ring-2 ring-primary" : ""}`}
                    >
                      <CafeCover name="" imageUrl={url} className="size-11" />
                    </button>
                  ))}
                </div>
              ) : null}

              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {categoryLabel(place.category)}
              </p>
              <h2 className="mt-1 font-serif text-2xl text-foreground">{place.name}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusChip tone={place.openStatus === "Open" ? "success" : "neutral"}>
                  {openStatusLabel(place.openStatus)}
                </StatusChip>
                {Number.isFinite(place.distanceMeters ?? NaN) ? (
                  <span className="text-[12px] text-muted-foreground">{formatDistance(place.distanceMeters!)}</span>
                ) : null}
              </div>

              {place.address || place.addressSummary ? (
                <p className="mt-3 text-sm text-muted-foreground">{place.address || place.addressSummary}</p>
              ) : null}

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={!hasCoords}
                  onClick={() => place && onOpenMap?.(place)}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-secondary px-3 text-sm font-semibold text-foreground disabled:opacity-50"
                >
                  <MapPin className="size-4" />
                  Haritada Gör
                </button>
                <a
                  href={hasCoords ? mapsDirectionsUrl(lat, lng, place.name) : undefined}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-3 text-sm font-semibold text-primary-foreground ${hasCoords ? "" : "pointer-events-none opacity-50"}`}
                >
                  <Navigation className="size-4" />
                  Yol Tarifi
                </a>
              </div>
              {hasCoords ? (
                <a href={geoUrl(lat, lng, place.name)} className="mt-2 block text-center text-[12px] font-medium text-muted-foreground">
                  Cihaz haritasında aç
                </a>
              ) : null}

              {place.description || place.shortDescription ? (
                <p className="mt-5 text-[15px] leading-relaxed text-foreground">
                  {place.description || place.shortDescription}
                </p>
              ) : null}

              {place.openingHours.length > 0 ? (
                <section className="mt-6">
                  <h3 className="text-sm font-semibold text-foreground">Çalışma saatleri</h3>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {place.openingHours
                      .slice()
                      .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                      .map((hour) => (
                        <li key={hour.dayOfWeek} className="flex justify-between">
                          <span>{DAY_LABELS[hour.dayOfWeek] ?? hour.dayOfWeek}</span>
                          <span>
                            {hour.isClosed
                              ? "Kapalı"
                              : hour.openTime && hour.closeTime
                                ? `${hour.openTime} – ${hour.closeTime}`
                                : "—"}
                          </span>
                        </li>
                      ))}
                  </ul>
                </section>
              ) : null}

              {(place.phone || place.email || place.websiteUrl) && (
                <section className="mt-6 space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">İletişim</h3>
                  {place.phone ? (
                    <a href={`tel:${place.phone}`} className="flex min-h-11 items-center gap-2 text-sm text-foreground">
                      <Phone className="size-4" /> {place.phone}
                    </a>
                  ) : null}
                  {place.websiteUrl ? (
                    <a href={place.websiteUrl} target="_blank" rel="noreferrer" className="flex min-h-11 items-center gap-2 text-sm text-primary">
                      <Globe className="size-4" /> Web sitesi
                    </a>
                  ) : null}
                  {place.email ? <p className="text-sm text-muted-foreground">{place.email}</p> : null}
                </section>
              )}

              {place.amenities.length > 0 || place.wheelchairAccessible != null || place.accessibleToilet != null ? (
                <section className="mt-6">
                  <h3 className="text-sm font-semibold text-foreground">Olanaklar</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {place.amenities.map((id) => (
                      <StatusChip key={id} tone="neutral">{amenityLabel(id)}</StatusChip>
                    ))}
                    {place.wheelchairAccessible === true ? <StatusChip tone="neutral">Tekerlekli sandalye</StatusChip> : null}
                    {place.accessibleToilet === true ? <StatusChip tone="neutral">Erişilebilir WC</StatusChip> : null}
                  </div>
                </section>
              ) : null}

              {place.upcomingEvents.length > 0 ? (
                <section className="mt-6">
                  <h3 className="text-sm font-semibold text-foreground">Yaklaşan etkinlikler</h3>
                  <ul className="mt-2 space-y-2">
                    {place.upcomingEvents.map((event) => (
                      <li key={event.id}>
                        <button
                          type="button"
                          onClick={() => onOpenActivity?.(event.id)}
                          className="gol-card w-full p-3 text-left"
                        >
                          <span className="block text-sm font-semibold text-foreground">{event.title}</span>
                          <span className="text-[12px] text-muted-foreground">
                            {new Date(event.startDate).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {place.cafeId && onOpenCafe ? (
                <button
                  type="button"
                  onClick={() => onOpenCafe(place.cafeId!)}
                  className="mt-6 min-h-11 w-full rounded-2xl bg-primary text-sm font-semibold text-primary-foreground"
                >
                  Menüyü Gör
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
