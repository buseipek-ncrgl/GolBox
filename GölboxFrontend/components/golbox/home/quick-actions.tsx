"use client"

import { Calendar, Coins, MapPin, Bell } from "lucide-react"
import { HomeSectionHeader } from "@/components/golbox/home-section-header"

export type QuickActionId = "events" | "places" | "notifications" | "golpuan"

export interface QuickActionItem {
  id: QuickActionId
  title: string
  description: string
  icon: "calendar" | "places" | "bell" | "coins"
}

const ICONS = {
  calendar: Calendar,
  places: MapPin,
  bell: Bell,
  coins: Coins,
}

export const defaultQuickActions: QuickActionItem[] = [
  { id: "events", title: "Etkinlikler", description: "Şehirdeki tüm etkinlikler", icon: "calendar" },
  { id: "places", title: "Tesisler", description: "Belediye tesisleri & kafeler", icon: "places" },
  { id: "notifications", title: "Bildirimler", description: "Duyuru ve mesajların", icon: "bell" },
  { id: "golpuan", title: "GölPuan", description: "Ödül kataloğunu keşfet", icon: "coins" },
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
      className="group relative flex h-full min-h-[5.75rem] flex-col justify-between rounded-[18px] border border-border/70 bg-card p-3.5 text-left shadow-none transition-all duration-200 hover:border-primary/30 hover:bg-card hover:shadow-sm active:scale-[0.98]"
    >
      <div className="flex w-full items-start justify-between">
        <span className="flex size-9 items-center justify-center rounded-xl bg-secondary/80 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="size-4" strokeWidth={2} />
        </span>
      </div>

      <div>
        <p className="mt-2 text-sm font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
          {item.title}
        </p>
        <p className="mt-0.5 line-clamp-1 text-[11px] leading-snug text-muted-foreground">{item.description}</p>
      </div>
    </button>
  )
}

export function QuickActions({
  items = defaultQuickActions,
  onSelect,
}: {
  items?: QuickActionItem[]
  onSelect: (id: QuickActionId) => void
}) {
  return (
    <section aria-label="Hızlı erişim" className="space-y-2.5">
      <HomeSectionHeader title="Hızlı erişim" tone="utility" />
      <div className="grid grid-cols-2 auto-rows-fr gap-2.5">
        {items.map((item) => (
          <QuickActionCard key={item.id} item={item} onSelect={onSelect} />
        ))}
      </div>
    </section>
  )
}

