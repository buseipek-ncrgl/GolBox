"use client"

import { CityImage } from "@/components/golbox/city-image"
import type { CityContentItem } from "@/lib/city-content"
import { HomeSectionHeader } from "@/components/golbox/home-section-header"

export function AgendaCard({
  item,
  onOpen,
}: {
  item: CityContentItem
  onOpen: (item: CityContentItem) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="gol-press flex h-full w-[10.75rem] shrink-0 flex-col overflow-hidden rounded-[16px] border border-border bg-card text-left shadow-none"
    >
      <div className="relative aspect-[16/10] bg-[color:var(--color-brand-900)]">
        <CityImage
          src={item.imageUrl}
          alt={`${item.categoryLabel}: ${item.title}`}
          focus={item.imageFocus ?? "center"}
          className="absolute inset-0 h-full w-full"
        />
      </div>
      <div className="flex min-h-[5.5rem] flex-1 flex-col p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {item.categoryLabel}
        </p>
        <p className="mt-1 line-clamp-2 text-[14px] font-semibold leading-snug text-foreground">{item.title}</p>
        {item.meta ? <p className="mt-auto pt-1 text-[12px] text-muted-foreground">{item.meta}</p> : null}
      </div>
    </button>
  )
}

export function CityAgendaSection({
  items,
  onOpen,
  onSeeAll,
}: {
  items: CityContentItem[]
  onOpen: (item: CityContentItem) => void
  onSeeAll: () => void
}) {
  if (items.length === 0) return null
  return (
    <section aria-label="Şehitkamil’de gündem" className="space-y-3">
      <HomeSectionHeader title="Şehitkamil’de gündem" tone="editorial" actionLabel="Tümü" onAction={onSeeAll} />
      <div className="-mx-5">
        <div className="no-scrollbar flex items-stretch gap-3 overflow-x-auto px-5">
          {items.map((item) => (
            <AgendaCard key={item.id} item={item} onOpen={onOpen} />
          ))}
        </div>
      </div>
    </section>
  )
}
