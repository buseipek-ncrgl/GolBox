"use client"

import React, { useEffect } from "react"
import { Bell, Coffee, Calendar, Award, Coins, ChevronRight, X } from "lucide-react"
import type { CitizenNotification } from "@/lib/city-content-api"

export function InAppNotificationToast({
  notification,
  onOpen,
  onDismiss,
}: {
  notification: CitizenNotification
  onOpen: () => void
  onDismiss: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss()
    }, 6000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  let icon = <Bell className="size-4 text-primary" />
  let borderClass = "border-primary/40"

  if (notification.entityType === "ORDER" || notification.type.startsWith("ORDER_")) {
    icon = <Coffee className="size-4 text-emerald-600" />
    borderClass = "border-emerald-500/60 bg-emerald-50 dark:bg-emerald-950/80"
  } else if (notification.entityType === "EVENT" || notification.type.startsWith("EVENT_")) {
    icon = <Calendar className="size-4 text-sky-600" />
    borderClass = "border-sky-500/60 bg-sky-50 dark:bg-sky-950/80"
  } else if (notification.entityType === "MISSION" || notification.type.startsWith("MISSION_")) {
    icon = <Award className="size-4 text-amber-600" />
    borderClass = "border-amber-500/60 bg-amber-50 dark:bg-amber-950/80"
  }

  return (
    <div
      onClick={onOpen}
      className={`fixed top-16 inset-x-4 z-[120] max-w-lg mx-auto flex items-start justify-between gap-3 rounded-2xl border ${borderClass} p-3.5 shadow-xl backdrop-blur-md cursor-pointer animate-in slide-in-from-top duration-300`}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="flex size-9 items-center justify-center rounded-xl bg-background/80 shrink-0 mt-0.5 shadow-2xs">
          {icon}
        </div>
        <div className="min-w-0">
          <span className="text-[9px] font-black uppercase text-primary tracking-wider">
            Yeni Bildirim
          </span>
          <h4 className="truncate text-xs font-black text-foreground">{notification.title}</h4>
          <p className="line-clamp-1 text-[11px] text-muted-foreground font-medium mt-0.5">
            {notification.body}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 pt-1">
        <span className="text-xs font-black text-primary flex items-center gap-0.5">
          <span>Gör</span>
          <ChevronRight className="size-3.5" />
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDismiss()
          }}
          aria-label="Kapat"
          className="flex size-6 items-center justify-center rounded-full bg-accent text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
