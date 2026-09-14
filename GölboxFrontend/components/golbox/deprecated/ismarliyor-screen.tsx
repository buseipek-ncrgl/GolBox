"use client"

import { WaitingTreats } from "@/components/golbox/deprecated/waiting-treats"
import type { TabId } from "@/lib/golbox-data"

export function IsmarliyorScreen({
  onNavigate,
  onExploreCafes,
}: {
  onNavigate: (tab: TabId) => void
  onExploreCafes?: () => void
}) {
  return (
    <div className="gol-fade-up space-y-5 px-5 pb-6 pt-3">
      <header className="space-y-1">
        <h1 className="font-serif text-2xl text-foreground">Ismarlıyor</h1>
        <p className="text-sm text-muted-foreground">
          Seni bekleyen ikramlar. Saha kutusu ve katalog ödülü buradan ayrıdır.
        </p>
      </header>
      <WaitingTreats
        onShowQr={() => onNavigate("qr")}
        onExploreCafes={onExploreCafes ?? (() => onNavigate("home"))}
      />
    </div>
  )
}
