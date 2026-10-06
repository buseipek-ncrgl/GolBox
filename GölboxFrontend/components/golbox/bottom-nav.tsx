"use client"

import { Home, Coffee, QrCode, Star, ShoppingBag } from "lucide-react"
import type { TabId } from "@/lib/golbox-data"
import { useGolbox } from "@/lib/golbox-context"
import { cn } from "@/lib/utils"

const navItems: { id: TabId; label: string; icon: typeof Home; isCenter?: boolean }[] = [
  { id: "home", label: "Ana Sayfa", icon: Home },
  { id: "menu", label: "Menü", icon: Coffee },
  { id: "qr", label: "QR", icon: QrCode, isCenter: true },
  { id: "golpuan", label: "GölPuan", icon: Star },
  { id: "cart", label: "Sepetim", icon: ShoppingBag },
]

export function BottomNav({
  active,
  onChange,
}: {
  active: TabId
  onChange: (tab: TabId) => void
}) {
  const { foodCart } = useGolbox()
  const cartCount = foodCart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <nav
      aria-label="GölBOX Ana Gezinme"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 px-2 pt-1.5 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur-md pb-[max(0.6rem,env(safe-area-inset-bottom))]"
    >
      <ul className="pointer-events-auto mx-auto flex h-14 max-w-[32rem] items-center justify-between gap-1 px-1">
        {navItems.map((item) => {
          const isActive = active === item.id
          const Icon = item.icon

          if (item.isCenter) {
            return (
              <li key={item.id} className="relative -top-3.5 flex justify-center shrink-0">
                <button
                  type="button"
                  onClick={() => onChange(item.id)}
                  aria-label={item.label}
                  className={cn(
                    "flex size-14 items-center justify-center rounded-full bg-emerald-700 text-white shadow-lg transition-transform duration-200 active:scale-90 hover:scale-105 hover:bg-emerald-800",
                    isActive && "ring-4 ring-emerald-600/30"
                  )}
                >
                  <Icon className="size-6.5 stroke-[2.2]" />
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
                  "relative flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 text-xs transition-colors cursor-pointer",
                  isActive
                    ? "font-bold text-emerald-700 dark:text-emerald-400"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="relative">
                  <Icon
                    className={cn(
                      "size-5 transition-transform duration-200",
                      isActive && "scale-110 text-emerald-700 dark:text-emerald-400"
                    )}
                    strokeWidth={isActive ? 2.4 : 1.8}
                  />
                  {item.id === "cart" && cartCount > 0 ? (
                    <span className="absolute -right-2.5 -top-1.5 flex min-w-[1.125rem] h-4.5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-extrabold text-white shadow-xs">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  ) : null}
                </div>
                <span className="truncate text-[11px] leading-none">{item.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
