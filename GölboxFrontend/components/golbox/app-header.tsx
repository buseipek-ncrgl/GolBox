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
  const title = firstName ? `${greeting}, ${firstName}` : greeting
  const initial = (firstName || "Ş").charAt(0)

  return (
    <header className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden
            className="flex size-7 items-center justify-center rounded-[8px] bg-primary font-serif text-sm leading-none text-primary-foreground"
          >
            +
          </span>
          <p className="truncate text-[15px] font-semibold tracking-tight text-foreground">Şehitkamil+</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onNotifications}
            aria-label={unreadCount > 0 ? `Bildirimler, ${unreadCount} okunmamış` : "Bildirimler"}
            className="relative flex size-11 items-center justify-center rounded-full text-foreground"
          >
            <Bell className="size-5" strokeWidth={1.8} />
            {unreadCount > 0 ? (
              <span className="absolute right-2 top-2 size-2 rounded-full bg-[color:var(--color-danger)]" />
            ) : null}
          </button>
          <button
            type="button"
            onClick={onProfile}
            aria-label="Profil"
            className="flex size-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
          >
            {firstName ? (
              <span className="text-sm font-semibold">{initial}</span>
            ) : (
              <User className="size-5" strokeWidth={1.8} />
            )}
          </button>
        </div>
      </div>
      <div>
        <h1 className="font-serif text-[1.85rem] leading-[1.1] tracking-tight text-foreground">{title}</h1>
        <p className="mt-1 hidden text-sm text-muted-foreground min-[360px]:block">
          Şehitkamil’de bugün sana özel olanlar
        </p>
      </div>
    </header>
  )
}
