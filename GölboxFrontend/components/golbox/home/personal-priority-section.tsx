"use client"

import type { ReactNode } from "react"
import { GPValue } from "@/components/golbox/gp-value"
import { HomeSectionHeader } from "@/components/golbox/home-section-header"
import { formatDistance } from "@/lib/golbox-geo"
import type { PersonalPriority } from "@/lib/home-priority"

function PriorityFrame({
  label,
  title,
  meta,
  cta,
  onAction,
}: {
  label: string
  title: string
  meta?: ReactNode
  cta: string
  onAction: () => void
}) {
  return (
    <article className="rounded-[18px] border border-border bg-card px-4 py-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <h3 className="mt-1 text-[15px] font-semibold leading-snug text-foreground">{title}</h3>
      {meta ? <p className="mt-1 text-[13px] leading-snug text-muted-foreground">{meta}</p> : null}
      <button type="button" onClick={onAction} className="mt-2 min-h-11 text-sm font-semibold text-primary">
        {cta}
      </button>
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
  if (item.kind === "ismarliyor") {
    return (
      <PriorityFrame
        label="Ismarlıyor"
        title={item.title}
        meta={item.cafe}
        cta="QR’ımı aç →"
        onAction={onShowQr}
      />
    )
  }

  if (item.kind === "golbox") {
    return (
      <PriorityFrame
        label="GölBox"
        title="Yakınında bir hediye var"
        meta={
          <>
            {formatDistance(item.distanceMeters)}
            {" · "}
            <GPValue amount={item.pointsGranted} signed className="text-[13px]" />
          </>
        }
        cta={item.inRange ? "Hediyeni al →" : "Haritada gör →"}
        onAction={() => (item.inRange ? onCollect(item.id) : onMap())}
      />
    )
  }

  if (item.kind === "coupon") {
    return (
      <PriorityFrame
        label="Kupon"
        title={item.title}
        meta={`${item.daysRemaining} gün kaldı`}
        cta="Kuponu gör →"
        onAction={onCoupons}
      />
    )
  }

  return (
    <PriorityFrame
      label={item.content.categoryLabel}
      title={item.title}
      meta={item.meta}
      cta="Detayı gör →"
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
