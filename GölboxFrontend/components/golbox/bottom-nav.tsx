"use client"

import { Home, MapPin, QrCode, User } from "lucide-react"
import type { TabId } from "@/lib/golbox-data"
import { cn } from "@/lib/utils"

const items: { id: TabId; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Ana", icon: Home },
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
      className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-4 pb-[max(0.7rem,env(safe-area-inset-bottom))]"
    >
      <ul className="pointer-events-auto mx-auto flex max-w-[22rem] items-center justify-between rounded-[22px] border border-border bg-background/92 p-1.5 shadow-[0_4px_20px_rgba(20,40,35,0.06)]">
        {items.map((item) => {
          const isActive = active === item.id
          const isQr = item.id === "qr"
          const Icon = item.icon
          return (
            <li key={item.id} className="flex flex-1 justify-center">
              <button
                type="button"
                onClick={() => onChange(item.id)}
                aria-label={item.id === "home" ? "Ana Sayfa" : item.label}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-[16px] px-2 py-1.5 text-[11px] font-semibold transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground",
                  isQr && !isActive ? "text-primary" : null,
                )}
              >
                <Icon className="size-[1.15rem]" strokeWidth={isActive || isQr ? 2.2 : 1.9} />
                <span>{item.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
