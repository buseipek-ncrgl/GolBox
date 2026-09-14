"use client"

import { ChevronRight } from "lucide-react"
import { CafeCover } from "@/components/golbox/cafe-cover"
import { HomeSectionHeader } from "@/components/golbox/home-section-header"
import { InlineError } from "@/components/golbox/inline-error"
import { SectionSkeleton } from "@/components/golbox/section-skeleton"
import { StatusChip } from "@/components/golbox/status-chip"
import { formatDistance } from "@/lib/golbox-geo"
import { categoryLabel, openStatusLabel, type PlaceNearbyItem } from "@/lib/places"

export function NearbyPlaceCard({
  place,
  onOpen,
}: {
  place: PlaceNearbyItem
  onOpen: (id: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(place.id)}
      className="gol-press gol-card flex w-full items-center gap-3 p-3 text-left"
    >
      <CafeCover name={place.name} imageUrl={place.coverImageUrl} className="size-16 shrink-0 rounded-[14px]" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{place.name}</p>
        <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
          {categoryLabel(place.category)}
          {Number.isFinite(place.distanceMeters)
            ? ` · ${formatDistance(place.distanceMeters)}`
            : ""}
          {place.addressSummary ? ` · ${place.addressSummary}` : ""}
        </p>
        <div className="mt-1.5">
          <StatusChip tone={place.openStatus === "Open" ? "success" : "neutral"}>
            {openStatusLabel(place.openStatus)}
          </StatusChip>
        </div>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </button>
  )
}

export function NearbySection({
  places,
  ready,
  error,
  onRetry,
  onOpen,
  onSeeAll,
}: {
  places: PlaceNearbyItem[]
  ready: boolean
  error: boolean
  onRetry: () => void
  onOpen: (id: string) => void
  onSeeAll: () => void
}) {
  if (!ready) {
    return (
      <section aria-label="Yakınında" className="space-y-3">
        <HomeSectionHeader title="Yakınında" tone="utility" />
        <SectionSkeleton lines={2} />
      </section>
    )
  }

  if (error && places.length === 0) {
    return (
      <section aria-label="Yakınında" className="space-y-3">
        <HomeSectionHeader title="Yakınında" tone="utility" />
        <InlineError message="Yakındaki tesisler yüklenemedi." onRetry={onRetry} />
      </section>
    )
  }

  if (places.length === 0) return null

  return (
    <section aria-label="Yakınında" className="space-y-3">
      <HomeSectionHeader title="Yakınında" actionLabel="Tümü" onAction={onSeeAll} tone="utility" />
      <div className="space-y-2">
        {places.slice(0, 3).map((place) => (
          <NearbyPlaceCard key={place.id} place={place} onOpen={onOpen} />
        ))}
      </div>
    </section>
  )
}
