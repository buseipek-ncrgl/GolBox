"use client"

import { BookOpen, Coins, MapPin, Ticket } from "lucide-react"
import { HomeSectionHeader } from "@/components/golbox/home-section-header"

export type QuickActionId = "coupons" | "places" | "cafes" | "events" | "earn"

export interface QuickActionItem {
  id: QuickActionId
  title: string
  description: string
  icon: "ticket" | "places" | "calendar" | "coins"
}

const ICONS = {
  ticket: Ticket,
  places: MapPin,
  calendar: BookOpen,
  coins: Coins,
}

export const defaultQuickActions: QuickActionItem[] = [
  { id: "places", title: "Tesisler", description: "Belediye yerlerini keşfet", icon: "places" },
  { id: "events", title: "Etkinlikler", description: "Şehirde neler var?", icon: "calendar" },
  { id: "coupons", title: "Kuponlarım", description: "Aktif kuponlarını gör", icon: "ticket" },
  { id: "earn", title: "GölPuan Kazan", description: "Kazanç yollarını gör", icon: "coins" },
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
      className="gol-press flex h-full min-h-[5.5rem] flex-col items-start rounded-[16px] border border-border bg-card p-3 text-left shadow-none max-[360px]:min-h-[5.25rem]"
    >
      <span className="flex size-8 items-center justify-center rounded-[10px] bg-secondary text-primary">
        <Icon className="size-4" strokeWidth={1.8} />
      </span>
      <p className="mt-2 text-[15px] font-semibold leading-tight text-foreground max-[360px]:text-sm">
        {item.title}
      </p>
      <p className="mt-0.5 line-clamp-1 text-[12px] leading-snug text-muted-foreground">{item.description}</p>
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
          description: couponCount > 0 ? `${couponCount} aktif kupon` : "Aktif kuponlarını gör",
        }
      : item,
  )

  return (
    <section aria-label="Hızlı erişim" className="space-y-3">
      <HomeSectionHeader title="Hızlı erişim" tone="utility" />
      <div className="grid grid-cols-2 auto-rows-fr gap-3">
        {resolved.map((item) => (
          <QuickActionCard key={item.id} item={item} onSelect={onSelect} />
        ))}
      </div>
    </section>
  )
}
