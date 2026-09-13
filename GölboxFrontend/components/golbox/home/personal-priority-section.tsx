"use client"

import { ArrowRight, Gift, Ticket } from "lucide-react"
import { GPValue } from "@/components/golbox/gp-value"
import { HomeSectionHeader } from "@/components/golbox/home-section-header"
import { StatusChip } from "@/components/golbox/status-chip"
import { formatDistance } from "@/lib/golbox-geo"
import type { PersonalPriority } from "@/lib/home-priority"

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
  if (item.kind === "ismarliyor") {
    return (
      <article className="gol-card p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Ismarlıyor</p>
        <h3 className="mt-1 text-[1.05rem] font-semibold text-foreground">{item.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{item.cafe}</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <StatusChip tone={item.status === "hazir" ? "brand" : "warning"}>
            {item.status === "hazir" ? "Hazır" : "Hazırlanıyor"}
          </StatusChip>
          <button
            type="button"
            onClick={onShowQr}
            className="min-h-11 text-sm font-semibold text-primary"
          >
            QR’ımı aç →
          </button>
        </div>
      </article>
    )
  }

  if (item.kind === "golbox") {
    return (
      <article className="gol-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">GölBox</p>
            <h3 className="mt-1 text-[1.05rem] font-semibold text-foreground">Yakınında bir hediye var</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {item.title}
              {item.placeLabel ? ` · ${item.placeLabel}` : ""}
            </p>
          </div>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--gol-radius-md)] bg-secondary text-primary">
            <Gift className="size-5" strokeWidth={1.8} />
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusChip>{formatDistance(item.distanceMeters)}</StatusChip>
          <StatusChip tone="neutral">
            <GPValue amount={item.pointsGranted} signed />
          </StatusChip>
        </div>
        <button
          type="button"
          onClick={() => (item.inRange ? onCollect(item.id) : onMap())}
          className="mt-4 min-h-11 w-full rounded-[14px] bg-primary text-sm font-semibold text-primary-foreground"
        >
          {item.inRange ? "Hediyeni al" : "Haritada gör"}
        </button>
      </article>
    )
  }

  if (item.kind === "coupon") {
    return (
      <article className="gol-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Kupon</p>
            <h3 className="mt-1 text-[1.05rem] font-semibold text-foreground">{item.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{item.daysRemaining} gün kaldı</p>
          </div>
          <Ticket className="size-5 text-primary" strokeWidth={1.8} />
        </div>
        <button type="button" onClick={onCoupons} className="mt-3 min-h-11 text-sm font-semibold text-primary">
          Kuponu gör →
        </button>
      </article>
    )
  }

  return (
    <article className="gol-card p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {item.content.categoryLabel}
      </p>
      <h3 className="mt-1 text-[1.05rem] font-semibold text-foreground">{item.title}</h3>
      {item.meta ? <p className="mt-1 text-sm text-muted-foreground">{item.meta}</p> : null}
      <button
        type="button"
        onClick={onEvent}
        className="mt-3 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary"
      >
        Detayı gör <ArrowRight className="size-4" />
      </button>
    </article>
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
    <section aria-label="Senin için" className="space-y-3">
      <HomeSectionHeader title="Senin için" />
      <PersonalPriorityCard item={item} {...actions} />
    </section>
  )
}
