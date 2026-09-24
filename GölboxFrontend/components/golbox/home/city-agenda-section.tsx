"use client"

import { CityImage } from "@/components/golbox/city-image"
import type { CityContentItem } from "@/lib/city-content"
import { HomeSectionHeader } from "@/components/golbox/home-section-header"
import { InlineError } from "@/components/golbox/inline-error"

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
      className="group relative flex h-full w-[11rem] shrink-0 flex-col overflow-hidden rounded-[18px] border border-border/70 bg-card text-left shadow-none transition-all duration-200 hover:border-primary/30 hover:shadow-sm active:scale-[0.98]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[color:var(--color-brand-900)]">
        <CityImage
          src={item.imageUrl}
          alt={`${item.categoryLabel}: ${item.title}`}
          focus={item.imageFocus ?? "center"}
          className="absolute inset-0 h-full w-full transition-transform duration-300 group-hover:scale-105"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
      </div>
      <div className="flex min-h-[5.5rem] flex-1 flex-col p-3">
        <span className="text-[10px] font-semibold tracking-wider text-primary uppercase">
          {item.categoryLabel}
        </span>
        <p className="mt-1 line-clamp-2 text-xs font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
          {item.title}
        </p>
        {item.meta ? <p className="mt-auto pt-1.5 text-[11px] font-medium text-muted-foreground">{item.meta}</p> : null}
      </div>
    </button>
  )
}

export function CityAgendaSection({
  items,
  onOpen,
  onSeeAll,
  error,
  onRetry,
}: {
  items: CityContentItem[]
  onOpen: (item: CityContentItem) => void
  onSeeAll: () => void
  error?: boolean
  onRetry?: () => void
}) {
  if (error) {
    return (
      <section aria-label="Şehitkamil’de gündem" className="space-y-2.5">
        <HomeSectionHeader title="Şehitkamil’de gündem" tone="editorial" />
        <InlineError message="Gündem yüklenemedi." onRetry={onRetry} />
      </section>
    )
  }
  if (items.length === 0) return null
  return (
    <section aria-label="Şehitkamil’de gündem" className="space-y-2.5">
      <HomeSectionHeader title="Şehitkamil’de gündem" tone="editorial" actionLabel="Tümü" onAction={onSeeAll} />
      <div className="-mx-5">
        <div className="no-scrollbar flex items-stretch gap-3 overflow-x-auto px-5 py-0.5">
          {items.map((item) => (
            <AgendaCard key={item.id} item={item} onOpen={onOpen} />
          ))}
        </div>
      </div>
    </section>
  )
}

