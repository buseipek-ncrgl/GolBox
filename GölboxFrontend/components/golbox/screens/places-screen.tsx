"use client"

import { useEffect, useMemo, useState } from "react"
import { Search } from "lucide-react"
import { CafeCover } from "@/components/golbox/cafe-cover"
import { EmptyState } from "@/components/golbox/empty-state"
import { InlineError } from "@/components/golbox/inline-error"
import { SectionSkeleton } from "@/components/golbox/section-skeleton"
import { StatusChip } from "@/components/golbox/status-chip"
import { fetchPlaces } from "@/lib/places-api"
import {
  PLACE_CATEGORY_CHIPS,
  categoryLabel,
  openStatusLabel,
  type PlaceListItem,
} from "@/lib/places"
import { formatDistance } from "@/lib/golbox-geo"
import { useCitizenLocation } from "@/lib/use-citizen-location"

export function PlacesScreen({
  onOpenPlace,
  embedded = false,
}: {
  onOpenPlace: (id: string) => void
  embedded?: boolean
}) {
  const { origin, usingFallback } = useCitizenLocation()
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<(typeof PLACE_CATEGORY_CHIPS)[number]["id"]>("all")
  const [openNow, setOpenNow] = useState(false)
  const [items, setItems] = useState<PlaceListItem[]>([])
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(false)

  const load = async () => {
    setError(false)
    try {
      const page = await fetchPlaces({
        category: category === "all" ? undefined : category,
        search,
        lat: origin.lat,
        lng: origin.lng,
        openNow,
        pageSize: 40,
      })
      setItems(page.items)
    } catch {
      setItems([])
      setError(true)
    } finally {
      setReady(true)
    }
  }

  useEffect(() => {
    setReady(false)
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, openNow, origin.lat, origin.lng])

  const chips = useMemo(() => PLACE_CATEGORY_CHIPS, [])

  return (
    <div className={`space-y-4 px-5 pb-6 ${embedded ? "pt-2" : "gol-fade-up pt-3"}`}>
      {!embedded && (
        <header className="space-y-1">
          <h1 className="font-serif text-2xl text-foreground">Tesisler</h1>
          <p className="text-sm text-muted-foreground">Şehitkamil’de belediye yerleri.</p>
        </header>
      )}

      {usingFallback ? (
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Konum izni olmadan tesisleri görüntüleyebilirsin. Mesafe sıralaması için konum izni ver.
        </p>
      ) : null}

      <div className="relative">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void load()
          }}
          placeholder="Tesis, mahalle veya ilçe ara"
          className="min-h-11 w-full rounded-2xl border border-input bg-card px-4 py-2.5 pl-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <Search className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
      </div>

      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
        {chips.map((chip) => {
          const active = category === chip.id
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => setCategory(chip.id)}
              className={`min-h-11 shrink-0 rounded-full px-3.5 text-[13px] font-semibold ${
                active ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
              }`}
            >
              {chip.label}
            </button>
          )
        })}
      </div>

      <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-foreground">
        <input
          type="checkbox"
          checked={openNow}
          onChange={(e) => setOpenNow(e.target.checked)}
          className="size-4 accent-[color:var(--color-brand-700,#1d5f60)]"
        />
        Şu an açık
      </label>

      {!ready ? (
        <SectionSkeleton lines={4} />
      ) : error ? (
        <InlineError message="Tesisler yüklenemedi." onRetry={() => void load()} />
      ) : items.length === 0 ? (
        <EmptyState title="Henüz yayınlanmış tesis bulunmuyor." />
      ) : (
        <ul className="space-y-2">
          {items.map((place) => (
            <li key={place.id}>
              <button
                type="button"
                onClick={() => onOpenPlace(place.id)}
                className="gol-press gol-card flex w-full items-center gap-3 p-3 text-left"
              >
                <CafeCover
                  name={place.name}
                  imageUrl={place.coverImageUrl}
                  className="size-16 shrink-0 rounded-[14px]"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {categoryLabel(place.category)}
                  </span>
                  <span className="mt-0.5 block truncate text-sm font-semibold text-foreground">{place.name}</span>
                  <span className="mt-0.5 block truncate text-[12px] text-muted-foreground">
                    {Number.isFinite(place.distanceMeters ?? NaN)
                      ? formatDistance(place.distanceMeters!)
                      : place.addressSummary || ""}
                  </span>
                  <span className="mt-1.5 inline-flex">
                    <StatusChip tone={place.openStatus === "Open" ? "success" : "neutral"}>
                      {openStatusLabel(place.openStatus)}
                    </StatusChip>
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
