"use client"

import { useEffect, useRef, useState } from "react"
import type { CityContentItem } from "@/lib/city-content"
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion"
import { cn } from "@/lib/utils"

export function HomeHeroCard({
  item,
  priority = false,
  onOpen,
}: {
  item: CityContentItem
  priority?: boolean
  onOpen: (item: CityContentItem) => void
}) {
  const isMayor = item.type === "mayor_message"
  const alt = `${item.categoryLabel}: ${item.title}`

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="relative block h-[210px] w-full overflow-hidden rounded-[22px] bg-[color:var(--color-brand-900)] text-left text-white shadow-[0_4px_20px_rgba(20,40,35,0.06)]"
    >
      {item.imageUrl ? (
        // Local editorial photos; keep object-cover without remote image config.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.imageUrl}
          alt={alt}
          fetchPriority={priority ? "high" : "low"}
          loading={priority ? "eager" : "lazy"}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/40 to-black/10" />
      <div className="relative flex h-full flex-col justify-end p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/85">
          {item.categoryLabel}
        </p>
        {isMayor ? (
          <>
            <h3 className="mt-1 font-serif text-[1.4rem] leading-tight text-white">{item.personName}</h3>
            <p className="mt-0.5 text-[13px] text-white/80">{item.personTitle}</p>
            <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-white/90">{item.title}</p>
          </>
        ) : (
          <>
            <h3 className="mt-1 font-serif text-[1.45rem] leading-tight text-white">{item.title}</h3>
            {item.meta ? <p className="mt-1 text-[13px] font-medium text-white/85">{item.meta}</p> : null}
            <p className="mt-1 line-clamp-2 text-sm leading-snug text-white/85">{item.subtitle}</p>
          </>
        )}
        <span className="mt-2 text-sm font-semibold text-white">{item.ctaLabel} →</span>
      </div>
    </button>
  )
}

export function HomeHeroCarousel({
  items,
  onOpen,
}: {
  items: CityContentItem[]
  onOpen: (item: CityContentItem) => void
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const reducedMotion = usePrefersReducedMotion()
  const pauseRef = useRef(false)

  useEffect(() => {
    const node = scrollerRef.current
    if (!node) return
    const onScroll = () => {
      const card = node.firstElementChild as HTMLElement | null
      if (!card) return
      const width = card.getBoundingClientRect().width + 12
      setIndex(Math.round(node.scrollLeft / width))
    }
    node.addEventListener("scroll", onScroll, { passive: true })
    return () => node.removeEventListener("scroll", onScroll)
  }, [items.length])

  useEffect(() => {
    if (reducedMotion || items.length < 2) return
    const tick = window.setInterval(() => {
      const node = scrollerRef.current
      if (!node || pauseRef.current) return
      const card = node.firstElementChild as HTMLElement | null
      if (!card) return
      const width = card.getBoundingClientRect().width + 12
      const next = (index + 1) % items.length
      node.scrollTo({ left: next * width, behavior: "smooth" })
    }, 8000)
    return () => window.clearInterval(tick)
  }, [index, items.length, reducedMotion])

  if (items.length === 0) return null

  const goTo = (next: number) => {
    const node = scrollerRef.current
    const card = node?.firstElementChild as HTMLElement | null
    if (!node || !card) return
    const width = card.getBoundingClientRect().width + 12
    node.scrollTo({ left: next * width, behavior: reducedMotion ? "auto" : "smooth" })
  }

  return (
    <section aria-roledescription="carousel" aria-label="Şehitkamil duyuruları" className="-mx-5">
      <div
        ref={scrollerRef}
        tabIndex={0}
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        onPointerDown={() => {
          pauseRef.current = true
        }}
        onPointerUp={() => {
          pauseRef.current = false
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault()
            goTo(Math.min(index + 1, items.length - 1))
          }
          if (event.key === "ArrowLeft") {
            event.preventDefault()
            goTo(Math.max(index - 1, 0))
          }
        }}
      >
        {items.map((item, itemIndex) => (
          <div key={item.id} className="w-[90%] max-[360px]:w-[92%] shrink-0 snap-start">
            <HomeHeroCard item={item} priority={itemIndex === 0} onOpen={onOpen} />
          </div>
        ))}
      </div>
      {items.length > 1 ? (
        <div className="mt-2.5 flex items-center justify-center gap-1.5">
          {items.map((item, itemIndex) => (
            <button
              key={item.id}
              type="button"
              aria-label={`${item.categoryLabel}, slayt ${itemIndex + 1}`}
              aria-current={itemIndex === index}
              onClick={() => goTo(itemIndex)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                itemIndex === index ? "w-4 bg-primary" : "w-1.5 bg-border",
              )}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
