"use client"

import { Coffee, Gift, Home, MapPin, QrCode, User } from "lucide-react"
import type { TabId } from "@/lib/golbox-data"

const items: { id: TabId; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Ana Sayfa", icon: Home },
  { id: "cafes", label: "Kafeler", icon: Coffee },
  { id: "qr", label: "QR", icon: QrCode },
  { id: "map", label: "Harita", icon: MapPin },
  { id: "ismarliyor", label: "Ismarlıyor", icon: Gift },
  { id: "profile", label: "Profil", icon: User },
]

export function BottomNav({
  active,
  onChange,
}: {
  active: TabId
  onChange: (tab: TabId) => void
}) {
  return (
    <nav
      aria-label="Ana gezinme"
      className="relative z-20 shrink-0 border-t border-border bg-background/90 backdrop-blur"
    >
      <ul className="flex items-stretch justify-between px-3 pb-5 pt-2.5">
        {items.map((item) => {
          const isActive = active === item.id
          const isCenter = item.id === "qr"
          const Icon = item.icon

          if (isCenter) {
            return (
              <li key={item.id} className="flex flex-1 justify-center">
                <button
                  onClick={() => onChange(item.id)}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                  className={`-mt-6 flex size-14 flex-col items-center justify-center rounded-full text-primary-foreground shadow-[0_12px_28px_-10px_rgba(29,95,96,0.9)] transition-transform active:scale-95 ${
                    isActive ? "bg-primary" : "bg-foreground"
                  }`}
                >
                  <Icon className="size-6" strokeWidth={2.1} />
                </button>
              </li>
            )
          }

          return (
            <li key={item.id} className="flex flex-1">
              <button
                onClick={() => onChange(item.id)}
                aria-current={isActive ? "page" : undefined}
                className="flex flex-1 flex-col items-center gap-1 py-1"
              >
                <Icon
                  className={`size-6 transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                  strokeWidth={isActive ? 2.3 : 1.9}
                />
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
