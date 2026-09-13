"use client"

import { BookOpen, Coffee, Coins, Ticket } from "lucide-react"
import { HomeSectionHeader } from "@/components/golbox/home-section-header"

export type QuickActionId = "coupons" | "cafes" | "events" | "earn"

export interface QuickActionItem {
  id: QuickActionId
  title: string
  description: string
  icon: "ticket" | "coffee" | "calendar" | "coins"
}

const ICONS = {
  ticket: Ticket,
  coffee: Coffee,
  calendar: BookOpen,
  coins: Coins,
}

export const defaultQuickActions: QuickActionItem[] = [
  { id: "coupons", title: "Kuponlarım", description: "Katalog kuponların", icon: "ticket" },
  { id: "cafes", title: "Göl Kafeler", description: "Yakındaki kafeleri gör", icon: "coffee" },
  { id: "events", title: "Etkinlikler", description: "Şehirde neler var?", icon: "calendar" },
  { id: "earn", title: "GölPuan kazan", description: "Kazanç yollarını keşfet", icon: "coins" },
]

export function QuickActionCard({
  item,
  onSelect,
}: {
  item: QuickActionItem
  onSelect: (id: QuickActionId) => void
}) {
  const Icon = ICONS[item.icon]
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      className="gol-card flex min-h-[5.5rem] flex-col items-start p-3.5 text-left"
    >
      <Icon className="size-5 text-primary" strokeWidth={1.8} />
      <p className="mt-2 text-sm font-semibold text-foreground">{item.title}</p>
      <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{item.description}</p>
    </button>
  )
}

export function QuickActions({
  items = defaultQuickActions,
  couponCount,
  onSelect,
}: {
  items?: QuickActionItem[]
  couponCount?: number
  onSelect: (id: QuickActionId) => void
}) {
  const resolved = items.map((item) =>
    item.id === "coupons" && typeof couponCount === "number"
      ? {
          ...item,
          description: couponCount > 0 ? `${couponCount} aktif kupon` : item.description,
        }
      : item,
  )

  return (
    <section aria-label="Hızlı erişim" className="space-y-3">
      <HomeSectionHeader title="Hızlı erişim" />
      <div className="grid grid-cols-2 gap-3">
        {resolved.map((item) => (
          <QuickActionCard key={item.id} item={item} onSelect={onSelect} />
        ))}
      </div>
    </section>
  )
}
