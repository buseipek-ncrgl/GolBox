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
      className="group relative flex w-full items-center gap-3 rounded-[18px] border border-border/70 bg-card p-3 text-left shadow-none transition-all duration-200 hover:border-primary/30 hover:shadow-xs active:scale-[0.98]"
    >
      <CafeCover name={place.name} imageUrl={place.coverImageUrl} className="size-14 shrink-0 rounded-xl overflow-hidden" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
          {place.name}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
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
      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
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
      <section aria-label="Yakınında" className="space-y-2.5">
        <HomeSectionHeader title="Yakınında" tone="utility" />
        <SectionSkeleton lines={2} />
      </section>
    )
  }

  if (error && places.length === 0) {
    return (
      <section aria-label="Yakınında" className="space-y-2.5">
        <HomeSectionHeader title="Yakınında" tone="utility" />
        <InlineError message="Yakındaki tesisler yüklenemedi." onRetry={onRetry} />
      </section>
    )
  }

  if (places.length === 0) return null

  return (
    <section aria-label="Yakınında" className="space-y-2.5">
      <HomeSectionHeader title="Yakınında" actionLabel="Tümü" onAction={onSeeAll} tone="utility" />
      <div className="space-y-2">
        {places.slice(0, 3).map((place) => (
          <NearbyPlaceCard key={place.id} place={place} onOpen={onOpen} />
        ))}
      </div>
    </section>
  )
}

