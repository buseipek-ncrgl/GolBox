"use client"

import { Home, MapPin, QrCode, User } from "lucide-react"
import type { TabId } from "@/lib/golbox-data"

const items: { id: TabId; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Ana Sayfa", icon: Home },
  { id: "map", label: "Harita", icon: MapPin },
  { id: "qr", label: "QR", icon: QrCode },
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
      className="relative z-20 shrink-0 border-t border-border/80 bg-background/92 pb-[max(0.7rem,env(safe-area-inset-bottom))] backdrop-blur-xl"
    >
      <ul className="grid grid-cols-4 items-end px-2 pt-2">
        {items.map((item) => {
          const isActive = active === item.id
          const isCenter = item.id === "qr"
          const Icon = item.icon

          if (isCenter) {
            return (
              <li key={item.id} className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => onChange(item.id)}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                  className={`-mt-7 flex size-14 items-center justify-center rounded-full text-primary-foreground shadow-[0_14px_32px_-12px_rgba(29,95,96,0.95)] transition-transform active:scale-95 ${
                    isActive ? "bg-primary" : "bg-foreground"
                  }`}
                >
                  <Icon className="size-6" strokeWidth={2.1} />
                </button>
                <span
                  className={`mt-1.5 text-[10px] font-medium ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </span>
              </li>
            )
          }

          return (
            <li key={item.id} className="flex">
              <button
                type="button"
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
