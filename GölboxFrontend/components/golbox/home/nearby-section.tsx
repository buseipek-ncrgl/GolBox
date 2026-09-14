"use client"

import { ChevronRight } from "lucide-react"
import { CafeCover } from "@/components/golbox/cafe-cover"
import { HomeSectionHeader } from "@/components/golbox/home-section-header"
import { InlineError } from "@/components/golbox/inline-error"
import { SectionSkeleton } from "@/components/golbox/section-skeleton"
import { StatusChip } from "@/components/golbox/status-chip"
import type { Cafe } from "@/lib/golbox-context"
import { formatDistance, metersBetween } from "@/lib/golbox-geo"

export function NearbyPlaceCard({
  cafe,
  distanceMeters,
  onOpen,
}: {
  cafe: Cafe
  distanceMeters?: number
  onOpen: (id: string) => void
}) {
  const open = cafe.isActive !== false
  return (
    <button
      type="button"
      onClick={() => onOpen(cafe.id)}
      className="gol-press gol-card flex w-full items-center gap-3 p-3 text-left"
    >
      <CafeCover name={cafe.name} imageUrl={cafe.imageUrl} className="size-16 shrink-0 rounded-[14px]" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{cafe.name}</p>
        <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
          {Number.isFinite(distanceMeters) ? formatDistance(distanceMeters!) : cafe.address}
        </p>
        <div className="mt-1.5">
          <StatusChip tone={open ? "success" : "neutral"}>{open ? "Açık" : "Kapalı"}</StatusChip>
        </div>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </button>
  )
}

export function NearbySection({
  cafes,
  origin,
  ready,
  error,
  onRetry,
  onOpen,
  onSeeAll,
}: {
  cafes: Cafe[]
  origin: { lat: number; lng: number }
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

  if (error && cafes.length === 0) {
    return (
      <section aria-label="Yakınında" className="space-y-3">
        <HomeSectionHeader title="Yakınında" tone="utility" />
        <InlineError message="Yakındaki yerler yüklenemedi." onRetry={onRetry} />
      </section>
    )
  }

  if (cafes.length === 0) return null

  const ranked = cafes
    .map((cafe) => {
      const lat = Number(cafe.latitude)
      const lng = Number(cafe.longitude)
      const distanceMeters =
        Number.isFinite(lat) && Number.isFinite(lng) ? metersBetween(origin, { lat, lng }) : undefined
      return { cafe, distanceMeters }
    })
    .sort((a, b) => (a.distanceMeters ?? Number.POSITIVE_INFINITY) - (b.distanceMeters ?? Number.POSITIVE_INFINITY))
    .slice(0, 3)

  return (
    <section aria-label="Yakınında" className="space-y-3">
      <HomeSectionHeader title="Yakınında" actionLabel="Tümü" onAction={onSeeAll} tone="utility" />
      <div className="space-y-2">
        {ranked.map(({ cafe, distanceMeters }) => (
          <NearbyPlaceCard key={cafe.id} cafe={cafe} distanceMeters={distanceMeters} onOpen={onOpen} />
        ))}
      </div>
    </section>
  )
}
