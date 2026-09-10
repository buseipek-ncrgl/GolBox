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
      <ul className="pointer-events-auto mx-auto flex max-w-[22rem] items-center justify-between gap-1 rounded-full border border-white/50 bg-background/78 p-1.5 shadow-[0_18px_40px_-24px_rgba(29,95,96,0.55)] backdrop-blur-2xl">
        {items.map((item) => {
          const isActive = active === item.id
          const Icon = item.icon
          return (
            <li key={item.id} className="flex justify-center">
              <button
                type="button"
                onClick={() => onChange(item.id)}
                aria-label={item.id === "home" ? "Ana Sayfa" : item.label}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex h-11 items-center justify-center rounded-full transition-all duration-300 ease-out",
                  isActive
                    ? "bg-primary px-4 text-primary-foreground shadow-[0_8px_18px_-10px_rgba(29,95,96,0.9)]"
                    : "w-11 text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-[1.15rem] shrink-0" strokeWidth={isActive ? 2.3 : 1.9} />
                <span
                  className={cn(
                    "overflow-hidden text-[11px] font-semibold tracking-wide",
                    isActive ? "ml-1.5 max-w-16" : "ml-0 max-w-0",
                  )}
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
