"use client"

import type { ReactNode } from "react"
import { ArrowRight, Gift, QrCode, Ticket, Calendar } from "lucide-react"
import { GPValue } from "@/components/golbox/gp-value"
import { HomeSectionHeader } from "@/components/golbox/home-section-header"
import { formatDistance } from "@/lib/golbox-geo"
import type { PersonalPriority } from "@/lib/home-priority"

function PriorityFrame({
  label,
  title,
  meta,
  cta,
  accent = "primary",
  onAction,
}: {
  label: string
  title: string
  meta?: ReactNode
  cta: string
  accent?: "primary" | "gold"
  onAction: () => void
}) {
  return (
    <article className="group relative overflow-hidden rounded-[18px] border border-border/70 bg-card p-4 shadow-xs transition-all hover:border-primary/30 hover:shadow-sm">
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${accent === "gold" ? "bg-[color:var(--color-gold)]" : "bg-primary"}`} />
      <div className="pl-1">
        <span className="inline-block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <h3 className="mt-1 text-base font-semibold leading-snug tracking-tight text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
        {meta ? <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{meta}</p> : null}
        <button
          type="button"
          onClick={onAction}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline focus-visible:outline-none"
        >
          <span>{cta}</span>
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </article>
  )
}

export function PersonalPriorityCard({
  item,
  onShowQr,
  onMap,
  onCollect,
  onCoupons,
  onEvent,
}: {
  item: PersonalPriority
  onShowQr: () => void
  onMap: () => void
  onCollect: (id: string) => void
  onCoupons: () => void
  onEvent: () => void
}) {
  if (item.kind === "golbox") {
    return (
      <PriorityFrame
        label="GölBox Saha Hediyesi"
        title="Yakınında bir hediye var"
        meta={
          <>
            {formatDistance(item.distanceMeters)}
            {" · "}
            <GPValue amount={item.pointsGranted} signed className="text-xs" />
          </>
        }
        cta={item.inRange ? "Hediyeni al" : "Haritada gör"}
        accent="gold"
        onAction={() => (item.inRange ? onCollect(item.id) : onMap())}
      />
    )
  }

  if (item.kind === "coupon") {
    return (
      <PriorityFrame
        label="Kuponlarım"
        title={item.title}
        meta={`${item.daysRemaining} gün geçerli`}
        cta="Kuponu gör"
        accent="primary"
        onAction={onCoupons}
      />
    )
  }

  return (
    <PriorityFrame
      label={item.content.categoryLabel}
      title={item.title}
      meta={item.meta}
      cta="Detayı gör"
      accent="primary"
      onAction={onEvent}
    />
  )
}

export function PersonalPrioritySection({
  item,
  ...actions
}: {
  item: PersonalPriority | null
} & Omit<Parameters<typeof PersonalPriorityCard>[0], "item">) {
  if (!item) return null
  return (
    <section aria-label="Senin için" className="space-y-2">
      <HomeSectionHeader title="Senin için" tone="utility" />
      <PersonalPriorityCard item={item} {...actions} />
    </section>
  )
}

