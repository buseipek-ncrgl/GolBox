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
      className="pointer-events-none absolute inset-x-0 bottom-0 z-20 border-t border-border/70 bg-background/96 px-2 pt-1 shadow-[0_-1px_12px_rgba(20,40,35,0.04)] pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      <ul className="pointer-events-auto mx-auto flex h-16 max-w-[24rem] items-center justify-between">
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
                  "flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-full px-2.5 py-1 text-[11px] font-medium focus-visible:ring-2 focus-visible:ring-primary/40",
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                  isQr && !isActive ? "text-primary" : null,
                )}
              >
                <Icon
                  className={cn("size-5", isQr && !isActive ? "size-[1.35rem]" : null)}
                  strokeWidth={isActive || isQr ? 2.1 : 1.8}
                />
                <span className="leading-none">{item.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
