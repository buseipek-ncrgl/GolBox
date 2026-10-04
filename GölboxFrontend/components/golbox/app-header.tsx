"use client"

import { Bell, Coins, User, MapPin, ChevronDown } from "lucide-react"
import { GPValue } from "@/components/golbox/gp-value"
import { cn } from "@/lib/utils"

function greetingForHour(hour: number) {
  if (hour < 12) return "Günaydın"
  if (hour < 18) return "İyi günler"
  return "İyi akşamlar"
}

export function AppHeader({
  firstName,
  pointsBalance,
  onOpenPoints,
  onNotifications,
  onProfile,
  onOpenBranches,
  selectedBranchName,
  unreadCount = 0,
  showGreeting = true,
  className,
}: {
  firstName?: string
  pointsBalance?: number
  onOpenPoints?: () => void
  onNotifications: () => void
  onProfile: () => void
  onOpenBranches?: () => void
  selectedBranchName?: string
  unreadCount?: number
  showGreeting?: boolean
  className?: string
}) {
  const greeting = greetingForHour(new Date().getHours())
  const line = firstName ? `${greeting}, ${firstName}` : greeting
  const initial = firstName?.charAt(0)

  return (
    <header className={cn("flex items-center justify-between gap-2 py-1.5", className)}>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-emerald-600" />
          <span className="text-[10px] font-extrabold tracking-widest text-muted-foreground uppercase">
            T.C. Şehitkamil Belediyesi
          </span>
        </div>
        <div className="flex items-center gap-2">
          <h1 className="mt-0.5 font-serif text-xl font-bold tracking-tight text-foreground shrink-0">
            GölBOX
          </h1>
          {onOpenBranches && (
            <button
              type="button"
              onClick={onOpenBranches}
              aria-label="Şube Değiştir"
              className="mt-0.5 inline-flex items-center gap-1 rounded-xl bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-extrabold text-primary hover:bg-primary/20 transition truncate max-w-[160px] active:scale-95 cursor-pointer"
            >
              <MapPin className="size-3 text-primary shrink-0" />
              <span className="truncate">{selectedBranchName || "Şube Seç"}</span>
              <ChevronDown className="size-3 text-primary shrink-0 ml-0.5" />
            </button>
          )}
        </div>
        {showGreeting && <p className="truncate text-xs font-medium text-muted-foreground">{line}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {typeof pointsBalance === "number" && onOpenPoints ? (
          <button
            type="button"
            onClick={onOpenPoints}
            aria-label={`GölPuan bakiyesi: ${pointsBalance} GP`}
            className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-[color:var(--color-gold)]/35 bg-card px-2.5 text-xs font-bold text-foreground shadow-2xs transition-all hover:bg-secondary/60 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <Coins className="size-3.5 text-[color:var(--color-gold)]" strokeWidth={2.5} />
            <span className="whitespace-nowrap"><GPValue amount={pointsBalance} /></span>
          </button>
        ) : null}

        <button
          type="button"
          onClick={onNotifications}
          aria-label={unreadCount > 0 ? `Bildirimler, ${unreadCount} okunmamış` : "Bildirimler"}
          className="relative flex size-11 items-center justify-center rounded-xl border border-border/60 bg-card text-foreground shadow-2xs transition-all hover:bg-secondary/50 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <Bell className="size-4 text-foreground/80" strokeWidth={2} />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-[color:var(--color-danger)] text-[9px] font-bold text-white shadow-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </button>

        <button
          type="button"
          onClick={onProfile}
          aria-label={firstName ? "Profil" : "Giriş veya profil"}
          className="flex size-11 items-center justify-center rounded-xl border border-primary/20 bg-gradient-to-br from-primary to-[color:var(--color-brand-900)] text-primary-foreground shadow-2xs transition-all hover:opacity-95 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {initial ? (
            <span className="text-sm font-bold tracking-tight">{initial}</span>
          ) : (
            <User className="size-4" strokeWidth={2} />
          )}
        </button>
      </div>
    </header>
  )
}
