"use client"

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
      className="w-[11.5rem] shrink-0 overflow-hidden rounded-[var(--gol-radius-lg)] border border-border bg-card text-left"
    >
      <div className="relative h-24 bg-[color:var(--color-brand-900)]">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {item.categoryLabel}
        </p>
        <p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-foreground">{item.title}</p>
        {item.meta ? <p className="mt-1 text-[12px] text-muted-foreground">{item.meta}</p> : null}
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
      <HomeSectionHeader title="Şehitkamil’de gündem" actionLabel="Tümü" onAction={onSeeAll} />
      <div className="-mx-5">
        <div className="no-scrollbar flex gap-3 overflow-x-auto px-5">
          {items.map((item) => (
            <AgendaCard key={item.id} item={item} onOpen={onOpen} />
          ))}
        </div>
      </div>
    </section>
  )
}
