"use client"

import { useState } from "react"
import { Signal, Wifi, BatteryFull } from "lucide-react"
import type { TabId } from "@/lib/golbox-data"
import { BottomNav } from "@/components/golbox/bottom-nav"
import { CafeDetailSheet } from "@/components/golbox/cafe-detail-sheet"
import { CafesOverlay } from "@/components/golbox/cafes-overlay"
import { HomeScreen } from "@/components/golbox/screens/home-screen"
import { QrScreen } from "@/components/golbox/screens/qr-screen"
import { ProfileScreen } from "@/components/golbox/screens/profile-screen"
import { MapScreen } from "@/components/golbox/screens/map-screen"

function StatusBar() {
  return (
    <div className="flex shrink-0 items-center justify-between px-6 pb-1 pt-3 text-xs font-semibold text-foreground">
      <span>9:41</span>
      <div className="flex items-center gap-1.5">
        <Signal className="size-3.5" />
        <Wifi className="size-3.5" />
        <BatteryFull className="size-4" />
      </div>
    </div>
  )
}

export function AppShell() {
  const [tab, setTab] = useState<TabId>("home")
  const [cafeId, setCafeId] = useState<string | null>(null)
  const [showCafes, setShowCafes] = useState(false)

  const goto = (next: TabId) => {
    setCafeId(null)
    setShowCafes(false)
    setTab(next)
  }

  return (
    <div className="relative flex h-full flex-col [--gol-dock:7.5rem]">
      <StatusBar />

      <main className="no-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        {tab === "home" && (
          <HomeScreen
            onNavigate={goto}
            onOpenCafe={setCafeId}
            onOpenCafes={() => setShowCafes(true)}
          />
        )}
        {tab === "qr" && <QrScreen />}
        {tab === "map" && <MapScreen />}
        {tab === "profile" && <ProfileScreen />}
      </main>

      <BottomNav active={tab} onChange={goto} />

      {showCafes && (
        <CafesOverlay onOpenCafe={setCafeId} onClose={() => setShowCafes(false)} />
      )}
      {cafeId && <CafeDetailSheet cafeId={cafeId} onClose={() => setCafeId(null)} />}
    </div>
  )
}
