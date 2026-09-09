"use client"

import { useState } from "react"
import { Signal, Wifi, BatteryFull } from "lucide-react"
import type { TabId } from "@/lib/golbox-data"
import { BottomNav } from "@/components/golbox/bottom-nav"
import { CafeDetailSheet } from "@/components/golbox/cafe-detail-sheet"
import { HomeScreen } from "@/components/golbox/screens/home-screen"
import { CafesScreen } from "@/components/golbox/screens/cafes-screen"
import { QrScreen } from "@/components/golbox/screens/qr-screen"
import { IsmarliyorScreen } from "@/components/golbox/screens/ismarliyor-screen"
import { ProfileScreen } from "@/components/golbox/screens/profile-screen"

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
  const [openCafe, setOpenCafe] = useState<string | null>(null)

  const goto = (next: TabId) => {
    setOpenCafe(null)
    setTab(next)
  }

  return (
    <div className="relative flex h-full flex-col">
      <StatusBar />

      <main className="no-scrollbar flex-1 overflow-y-auto">
        {tab === "home" && <HomeScreen onNavigate={goto} onOpenCafe={setOpenCafe} />}
        {tab === "cafes" && <CafesScreen onOpenCafe={setOpenCafe} />}
        {tab === "qr" && <QrScreen />}
        {tab === "ismarliyor" && <IsmarliyorScreen onNavigate={goto} />}
        {tab === "profile" && <ProfileScreen />}
      </main>

      <BottomNav active={tab} onChange={goto} />

      {openCafe && <CafeDetailSheet cafeId={openCafe} onClose={() => setOpenCafe(null)} />}
    </div>
  )
}
