"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowRight } from "lucide-react"
import { CityImage } from "@/components/golbox/city-image"
import type { CityContentItem } from "@/lib/city-content"
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion"
import { cn } from "@/lib/utils"

const SLIDE_GAP = 8

function slideWidth(node: HTMLElement) {
  const slide = node.querySelector("[data-hero-slide]") as HTMLElement | null
  if (!slide) return 0
  return slide.getBoundingClientRect().width + SLIDE_GAP
}

function heroCopy(item: CityContentItem) {
  const isMayor = item.type === "MayorMessage"
  return {
    category: item.categoryLabel,
    title: isMayor ? (item.personName ?? item.title) : item.title,
    support: isMayor ? item.subtitle || item.title : item.meta ?? item.subtitle,
    cta: item.ctaLabel,
    alt: `${item.categoryLabel}: ${item.title}`,
    focus: item.imageFocus ?? (isMayor ? "center 22%" : "center"),
  }
}

export function HomeHeroCard({
  item,
  priority = false,
  compact = false,
  onOpen,
}: {
  item: CityContentItem
  priority?: boolean
  compact?: boolean
  onOpen: (item: CityContentItem) => void
}) {
  const copy = heroCopy(item)

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className={cn(
        "relative block w-full overflow-hidden rounded-[22px] bg-[color:var(--color-brand-900)] text-left text-white shadow-[0_4px_20px_rgba(20,40,35,0.08)] motion-reduce:transition-none",
        compact ? "h-[11.75rem]" : "h-[12.75rem]",
        "transition-[height] duration-300",
      )}
    >
      <CityImage
        src={item.imageUrl}
        alt={copy.alt}
        priority={priority}
        focus={copy.focus}
        className="absolute inset-0 h-full w-full"
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
      <div className="relative flex h-full flex-col justify-end py-5 pl-7 pr-5">
        <span className="inline-flex w-fit items-center rounded-md bg-white/15 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-white/95 uppercase backdrop-blur-md">
          {copy.category}
        </span>
        <h3 className="mt-1.5 line-clamp-2 font-serif text-[1.35rem] font-semibold leading-[1.2] text-white">{copy.title}</h3>
        {copy.support ? (
          <p className="mt-1 line-clamp-1 text-xs text-white/80">{copy.support}</p>
        ) : null}
        <div className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-white">
          <span className="rounded-lg bg-white/20 px-2.5 py-1 backdrop-blur-md transition-colors group-hover:bg-white/30">
            {copy.cta}
          </span>
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </button>
  )
}

export function HomeHeroCarousel({
  items,
  onOpen,
  compact = false,
}: {
  items: CityContentItem[]
  onOpen: (item: CityContentItem) => void
  compact?: boolean
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const reducedMotion = usePrefersReducedMotion()
  const pauseRef = useRef(false)

  useEffect(() => {
    const node = scrollerRef.current
    if (!node) return
    const onScroll = () => {
      const width = slideWidth(node)
      if (!width) return
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
      const width = slideWidth(node)
      if (!width) return
      setIndex((prev) => {
        const next = (prev + 1) % items.length
        node.scrollTo({ left: next * width, behavior: "smooth" })
        return next
      })
    }, 4000)
    return () => window.clearInterval(tick)
  }, [items.length, reducedMotion])

  if (items.length === 0) return null

  const goTo = (next: number) => {
    const node = scrollerRef.current
    if (!node) return
    const width = slideWidth(node)
    if (!width) return
    node.scrollTo({ left: next * width, behavior: reducedMotion ? "auto" : "smooth" })
  }

  return (
    <section aria-roledescription="carousel" aria-label="Şehitkamil duyuruları" className="-mx-5">
      <div
        ref={scrollerRef}
        tabIndex={0}
        className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto [scroll-padding-inline:1.25rem] outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
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
        <div aria-hidden className="w-5 shrink-0 snap-none" />
        {items.map((item, itemIndex) => (
          <div
            key={item.id}
            data-hero-slide
            className="w-[calc(100%-2.75rem)] min-w-[calc(100%-2.75rem)] shrink-0 snap-start"
          >
            <HomeHeroCard item={item} compact={compact} priority={itemIndex === 0} onOpen={onOpen} />
          </div>
        ))}
        <div aria-hidden className="w-5 shrink-0 snap-none" />
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
