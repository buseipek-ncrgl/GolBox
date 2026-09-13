"use client"

import { ArrowRight } from "lucide-react"
import { GPValue } from "@/components/golbox/gp-value"
import { HomeSectionHeader } from "@/components/golbox/home-section-header"
import { VISIT_BONUS_POINTS } from "@/lib/city-content"
import type { FieldDropNearby } from "@/lib/golbox-context"

export type EarnCard = {
  id: string
  title: string
  description: string
  points: number
  cta: string
  action: "qr" | "map"
}

export function buildEarnCards(drop?: FieldDropNearby | null): EarnCard[] {
  const cards: EarnCard[] = [
    {
      id: "visit",
      title: "Göl Kafe ziyareti",
      description: "Kasada QR’ını göster.",
      points: VISIT_BONUS_POINTS,
      cta: "QR’ı aç",
      action: "qr",
    },
  ]
  if (drop) {
    cards.push({
      id: `drop-${drop.id}`,
      title: "GölBox saha hediyesi",
      description: "Haritadaki kutuyu yarıçap içinde al.",
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
      className="gol-card flex w-full items-center gap-3 px-4 py-3.5 text-left"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{card.title}</p>
        <p className="mt-0.5 text-[12px] text-muted-foreground">{card.description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <GPValue amount={card.points} signed className="text-sm" />
        <ArrowRight className="size-4 text-muted-foreground" />
      </div>
    </button>
  )
}

export function EarnPointsSection({
  drop,
  onAction,
}: {
  drop?: FieldDropNearby | null
  onAction: (action: EarnCard["action"]) => void
}) {
  const cards = buildEarnCards(drop)
  if (cards.length === 0) return null
  return (
    <section aria-label="Şehrinde kazan" className="space-y-3">
      <HomeSectionHeader title="Şehrinde kazan" />
      <div className="space-y-2">
        {cards.map((card) => (
          <EarnPointsCard key={card.id} card={card} onAction={onAction} />
        ))}
      </div>
    </section>
  )
}
