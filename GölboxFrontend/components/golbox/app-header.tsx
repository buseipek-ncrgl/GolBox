"use client"

import { Bell, User } from "lucide-react"
import { cn } from "@/lib/utils"

function greetingForHour(hour: number) {
  if (hour < 12) return "Günaydın"
  if (hour < 18) return "İyi günler"
  return "İyi akşamlar"
}

export function AppHeader({
  firstName,
  onNotifications,
  onProfile,
  unreadCount = 0,
  className,
}: {
  firstName?: string
  onNotifications: () => void
  onProfile: () => void
  unreadCount?: number
  className?: string
}) {
  const greeting = greetingForHour(new Date().getHours())
  const line = firstName ? `${greeting}, ${firstName}` : greeting
  const initial = firstName?.charAt(0)

  return (
    <header className={cn("flex items-center justify-between gap-3 py-1", className)}>
      <div className="min-w-0">
        <p className="truncate text-lg font-semibold leading-tight tracking-tight text-foreground">Şehitkamil+</p>
        <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{line}</p>
      </div>
      <div className="flex shrink-0 items-center">
        <button
          type="button"
          onClick={onNotifications}
          aria-label={unreadCount > 0 ? `Bildirimler, ${unreadCount} okunmamış` : "Bildirimler"}
          className="relative flex size-11 items-center justify-center rounded-[14px] text-foreground focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <Bell className="size-5" strokeWidth={1.8} />
          {unreadCount > 0 ? (
            <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-[color:var(--color-danger)]" />
          ) : null}
        </button>
        <button
          type="button"
          onClick={onProfile}
          aria-label={firstName ? "Profil" : "Giriş veya profil"}
          className="flex size-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {initial ? (
            <span className="text-sm font-semibold">{initial}</span>
          ) : (
            <User className="size-5" strokeWidth={1.8} />
          )}
        </button>
      </div>
    </header>
  )
}
