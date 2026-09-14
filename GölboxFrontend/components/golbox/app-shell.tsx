"use client"

import { useState } from "react"
import { Signal, Wifi, BatteryFull } from "lucide-react"
import type { TabId } from "@/lib/golbox-data"
import { BottomNav } from "@/components/golbox/bottom-nav"
import { CafeDetailSheet } from "@/components/golbox/cafe-detail-sheet"
import { PlacesOverlay } from "@/components/golbox/places-overlay"
import { PlaceDetailSheet } from "@/components/golbox/place-detail-sheet"
import { ActivityOverlay } from "@/components/golbox/home/home-sheets"
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
  const [placeId, setPlaceId] = useState<string | null>(null)
  const [showPlaces, setShowPlaces] = useState(false)
  const [activityId, setActivityId] = useState<string | null>(null)
  const [mapLayer, setMapLayer] = useState<"places" | "golbox">("golbox")
  const [mapFocusPlaceId, setMapFocusPlaceId] = useState<string | null>(null)

  const goto = (next: TabId) => {
    setCafeId(null)
    setPlaceId(null)
    setShowPlaces(false)
    setActivityId(null)
    if (next === "map") {
      setMapLayer("golbox")
      setMapFocusPlaceId(null)
    }
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
            onOpenPlace={setPlaceId}
            onOpenPlaces={() => setShowPlaces(true)}
            onOpenActivity={setActivityId}
          />
        )}
        {tab === "qr" && <QrScreen />}
        {tab === "map" && (
          <MapScreen
            layer={mapLayer}
            onLayerChange={setMapLayer}
            focusPlaceId={mapFocusPlaceId}
            onOpenPlace={setPlaceId}
          />
        )}
        {tab === "profile" && <ProfileScreen />}
      </main>

      <BottomNav active={tab} onChange={goto} />

      {showPlaces && (
        <PlacesOverlay onOpenPlace={setPlaceId} onClose={() => setShowPlaces(false)} />
      )}
      {placeId && (
        <PlaceDetailSheet
          placeId={placeId}
          onClose={() => setPlaceId(null)}
          onOpenCafe={setCafeId}
          onOpenActivity={setActivityId}
          onOpenMap={(place) => {
            setPlaceId(null)
            setShowPlaces(false)
            setActivityId(null)
            setMapFocusPlaceId(place.id)
            setMapLayer("places")
            setTab("map")
          }}
        />
      )}
      {activityId && (
        <ActivityOverlay
          activityId={activityId}
          onClose={() => setActivityId(null)}
          onOpenPlace={(id) => {
            setActivityId(null)
            setPlaceId(id)
          }}
        />
      )}
      {cafeId && <CafeDetailSheet cafeId={cafeId} onClose={() => setCafeId(null)} />}
    </div>
  )
}
