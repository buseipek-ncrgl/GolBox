"use client"

import { Bell, Coins, User, QrCode } from "lucide-react"
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
  onOpenQr,
  onNotifications,
  onProfile,
  unreadCount = 0,
  className,
}: {
  firstName?: string
  pointsBalance?: number
  onOpenPoints?: () => void
  onOpenQr?: () => void
  onNotifications: () => void
  onProfile: () => void
  unreadCount?: number
  className?: string
}) {
  const greeting = greetingForHour(new Date().getHours())
  const line = firstName ? `${greeting}, ${firstName}` : greeting
  const initial = firstName?.charAt(0)

  return (
    <header className={cn("flex items-center justify-between gap-3 py-1.5", className)}>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-primary" />
          <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
            T.C. Şehitkamil Belediyesi
          </span>
        </div>
        <h1 className="mt-0.5 truncate font-serif text-xl font-bold tracking-tight text-foreground">
          GölBox <span className="text-xs font-sans font-semibold text-primary">PLUS</span>
        </h1>
        <p className="truncate text-xs font-medium text-muted-foreground">{line}</p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {typeof pointsBalance === "number" && onOpenPoints ? (
          <button
            type="button"
            onClick={onOpenPoints}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[color:var(--color-gold)]/40 bg-gradient-to-r from-[color:var(--color-brand-900)] to-[color:var(--color-brand-700)] px-3 text-xs font-bold text-white shadow-2xs transition-all hover:opacity-95 active:scale-95"
          >
            <Coins className="size-3.5 text-[color:var(--color-gold)]" strokeWidth={2.5} />
            <span><GPValue amount={pointsBalance} /></span>
          </button>
        ) : null}

        {onOpenQr ? (
          <button
            type="button"
            onClick={onOpenQr}
            aria-label="Kasa QR Kodu"
            title="Kasa QR Kodunu Aç"
            className="flex size-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary shadow-2xs transition-all hover:bg-primary/20 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <QrCode className="size-4.5" strokeWidth={2.2} />
          </button>
        ) : null}

        <button
          type="button"
          onClick={onNotifications}
          aria-label={unreadCount > 0 ? `Bildirimler, ${unreadCount} okunmamış` : "Bildirimler"}
          className="relative flex size-10 items-center justify-center rounded-xl border border-border/60 bg-card text-foreground shadow-2xs transition-all hover:bg-secondary/50 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary/40"
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
          className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-gradient-to-br from-primary to-[color:var(--color-brand-900)] text-primary-foreground shadow-2xs transition-all hover:opacity-95 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary/40"
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


