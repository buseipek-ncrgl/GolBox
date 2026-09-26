"use client"

import { Home, Tv, FileText, Gift, Grid } from "lucide-react"
import type { TabId } from "@/lib/golbox-data"
import { cn } from "@/lib/utils"

const items: { id: TabId; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Ana Sayfa", icon: Home },
  { id: "media", label: "Sosyal Medya", icon: Tv },
  { id: "applications", label: "Başvuru", icon: FileText },
  { id: "rewards", label: "Ödüllerim", icon: Gift },
  { id: "menu", label: "Menü", icon: Grid },
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
      className="pointer-events-none absolute inset-x-0 bottom-0 z-20 border-t border-border/70 bg-background/96 px-2 pt-1.5 shadow-[0_-2px_14px_rgba(20,40,35,0.08)] backdrop-blur-md pb-[max(0.6rem,env(safe-area-inset-bottom))]"
    >
      <ul className="pointer-events-auto mx-auto flex h-13 max-w-[32rem] items-center justify-between gap-1">
        {items.map((item) => {
          const isActive =
            active === item.id ||
            (item.id === "media" && active === "reels") ||
            (item.id === "menu" && (active === "more" || active === "events" || active === "profile" || active === "map"))
          const Icon = item.icon

          return (
            <li key={item.id} className="flex justify-center">
              <button
                type="button"
                onClick={() => onChange(item.id)}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex min-h-11 items-center justify-center gap-1.5 rounded-full py-2 transition-all duration-300 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary/40",
                  isActive
                    ? "bg-primary px-3.5 text-primary-foreground shadow-2xs font-bold"
                    : "px-2.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "size-4.5 shrink-0 transition-transform duration-200",
                    isActive && "scale-105"
                  )}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                {isActive && (
                  <span className="truncate text-xs font-bold leading-none tracking-tight animate-in fade-in slide-in-from-left-1 duration-200">
                    {item.label}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
