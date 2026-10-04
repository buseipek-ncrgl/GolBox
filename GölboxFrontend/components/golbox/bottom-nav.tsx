"use client"

import { Home, Coffee, QrCode, Star, User } from "lucide-react"
import type { TabId } from "@/lib/golbox-data"
import { cn } from "@/lib/utils"

const navItems: { id: TabId; label: string; icon: typeof Home; isCenter?: boolean }[] = [
  { id: "home", label: "Ana Sayfa", icon: Home },
  { id: "menu", label: "Menü", icon: Coffee },
  { id: "qr", label: "QR", icon: QrCode, isCenter: true },
  { id: "golpuan", label: "GölPuan", icon: Star },
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
      aria-label="GölBOX Ana Gezinme"
      className="pointer-events-none absolute inset-x-0 bottom-0 z-20 border-t border-border/70 bg-background/96 px-2 pt-1.5 shadow-[0_-2px_14px_rgba(20,40,35,0.08)] backdrop-blur-md pb-[max(0.6rem,env(safe-area-inset-bottom))]"
    >
      <ul className="pointer-events-auto mx-auto flex h-14 max-w-[32rem] items-center justify-between gap-1 px-1">
        {navItems.map((item) => {
          const isActive = active === item.id
          const Icon = item.icon

          if (item.isCenter) {
            return (
              <li key={item.id} className="relative -top-3 flex justify-center">
                <button
                  type="button"
                  onClick={() => onChange(item.id)}
                  aria-label={item.label}
                  className={cn(
                    "flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform duration-200 active:scale-90 hover:scale-105",
                    isActive && "ring-4 ring-primary/30"
                  )}
                >
                  <Icon className="size-7 stroke-[2.2]" />
                </button>
              </li>
            )
          }

          return (
            <li key={item.id} className="flex flex-1 justify-center">
              <button
                type="button"
                onClick={() => onChange(item.id)}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 text-xs transition-colors",
                  isActive
                    ? "font-bold text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "size-5 transition-transform duration-200",
                    isActive && "scale-110"
                  )}
                  strokeWidth={isActive ? 2.3 : 1.8}
                />
                <span className="truncate text-[11px] leading-none">{item.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
