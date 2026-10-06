"use client"

import { Bell, User, MapPin, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export function AppHeader({
  firstName,
  onNotifications,
  onProfile,
  onOpenBranches,
  onReplaySplash,
  selectedBranchName,
  unreadCount = 0,
  className,
}: {
  firstName?: string
  pointsBalance?: number
  onOpenPoints?: () => void
  onNotifications: () => void
  onProfile: () => void
  onOpenBranches?: () => void
  onReplaySplash?: () => void
  selectedBranchName?: string
  unreadCount?: number
  showGreeting?: boolean
  className?: string
}) {
  const initial = firstName?.trim() ? firstName.trim().charAt(0).toUpperCase() : null

  return (
    <header className={cn("flex items-center justify-between gap-3 py-1", className)}>
      {/* Brand & Branch Selector */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
          <span className="text-[10px] font-extrabold tracking-widest text-muted-foreground uppercase">
            T.C. Şehitkamil Belediyesi
          </span>
        </div>

        <div className="mt-0.5 flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={onReplaySplash}
            title="Açılış ekranını (Splash) yeniden oynat"
            className="text-xl font-black tracking-tight text-foreground shrink-0 leading-none hover:text-emerald-700 transition cursor-pointer"
          >
            GölBOX
          </button>

          {onOpenBranches && (
            <button
              type="button"
              onClick={onOpenBranches}
              aria-label="Şube Değiştir"
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/80 dark:border-emerald-800/80 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/80 transition max-w-[210px] sm:max-w-xs active:scale-95 cursor-pointer shrink-0"
            >
              <MapPin className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate">{selectedBranchName || "Şube Seç"}</span>
              <ChevronRight className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0 ml-0.5" />
            </button>
          )}
        </div>
      </div>

      {/* Action Buttons: Notifications & Profile Avatar */}
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onNotifications}
          aria-label={unreadCount > 0 ? `Bildirimler, ${unreadCount} okunmamış` : "Bildirimler"}
          className="relative flex size-10 items-center justify-center rounded-xl border border-border/80 bg-card text-foreground shadow-2xs transition-all hover:bg-accent/60 active:scale-95 focus-visible:ring-2 focus-visible:ring-emerald-600/40"
        >
          <Bell className="size-4.5 text-foreground/80" strokeWidth={2} />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex size-4.5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </button>

        <button
          type="button"
          onClick={onProfile}
          aria-label={firstName ? `${firstName} profili` : "Giriş yap veya profil"}
          className="flex size-10 items-center justify-center rounded-xl border border-emerald-700/30 bg-emerald-700 text-white shadow-2xs transition-all hover:bg-emerald-800 active:scale-95 focus-visible:ring-2 focus-visible:ring-emerald-600/40"
        >
          {initial ? (
            <span className="text-sm font-bold tracking-tight">{initial}</span>
          ) : (
            <User className="size-4.5" strokeWidth={2} />
          )}
        </button>
      </div>
    </header>
  )
}

