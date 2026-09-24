"use client"

import { ChevronRight } from "lucide-react"
import { GPValue } from "@/components/golbox/gp-value"
import { HomeSectionHeader } from "@/components/golbox/home-section-header"
import type { FieldDropNearby } from "@/lib/golbox-context"

export type EarnCard = {
  id: string
  title: string
  description: string
  points: number
  cta: string
  action: "qr" | "map"
}

export function buildEarnCards(drop?: FieldDropNearby | null, visitBonusPoints = 15): EarnCard[] {
  const cards: EarnCard[] = [
    {
      id: "visit",
      title: "Göl Kafe ziyareti",
      description: "Kasada QR kodunu okutarak anında puan kazan.",
      points: visitBonusPoints,
      cta: "QR’ı aç",
      action: "qr",
    },
  ]
  if (drop) {
    cards.push({
      id: `drop-${drop.id}`,
      title: "GölBox saha hediyesi",
      description: "Haritadaki hediyeye yaklaş ve hediyeni topla.",
      points: drop.pointsGranted,
      cta: "Haritada gör",
      action: "map",
    })
  }
  return cards
}

export function EarnPointsCard({
  card,
  onAction,
}: {
  card: EarnCard
  onAction: (action: EarnCard["action"]) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onAction(card.action)}
      className="group relative flex w-full items-center gap-3 rounded-[18px] border border-border/60 bg-card p-3.5 text-left shadow-2xs transition-all duration-200 hover:border-primary/30 hover:shadow-xs active:scale-[0.98]"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
          {card.title}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{card.description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <GPValue amount={card.points} signed className="text-xs font-semibold" />
        <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
    </button>
  )
}

export function EarnPointsSection({
  drop,
  visitBonusPoints = 15,
  onAction,
}: {
  drop?: FieldDropNearby | null
  visitBonusPoints?: number
  onAction: (action: EarnCard["action"]) => void
}) {
  const cards = buildEarnCards(drop, visitBonusPoints)
  if (cards.length === 0) return null
  return (
    <section aria-label="Şehrinde kazan" className="rounded-[22px] border border-primary/10 bg-gradient-to-br from-secondary/40 via-secondary/20 to-card p-4 space-y-3">
      <HomeSectionHeader title="Şehrinde kazan" tone="utility" />
      <div className="space-y-2">
        {cards.map((card) => (
          <EarnPointsCard key={card.id} card={card} onAction={onAction} />
        ))}
      </div>
    </section>
  )
}

