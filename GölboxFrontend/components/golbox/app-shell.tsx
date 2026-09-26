"use client"

import { useState } from "react"
import type { TabId } from "@/lib/golbox-data"
import { useGolbox } from "@/lib/golbox-context"
import { AppHeader } from "@/components/golbox/app-header"
import { BottomNav } from "@/components/golbox/bottom-nav"
import { CafeDetailSheet } from "@/components/golbox/cafe-detail-sheet"
import { PlacesOverlay } from "@/components/golbox/places-overlay"
import { PlaceDetailSheet } from "@/components/golbox/place-detail-sheet"
import { ActivityOverlay, NotificationsSheet } from "@/components/golbox/home/home-sheets"
import { HomeScreen } from "@/components/golbox/screens/home-screen"
import { ProfileScreen } from "@/components/golbox/screens/profile-screen"
import { MapScreen } from "@/components/golbox/screens/map-screen"
import { EventsScreen } from "@/components/golbox/screens/events-screen"
import { ReelsScreen } from "@/components/golbox/screens/reels-screen"
import { MoreScreen } from "@/components/golbox/screens/more-screen"
import { RewardsScreen } from "@/components/golbox/screens/rewards-screen"
import { ApplicationsScreen } from "@/components/golbox/screens/applications-screen"
import { MenuScreen } from "@/components/golbox/screens/menu-screen"
import { LoginScreen } from "@/components/golbox/screens/login-screen"
import { fetchMyNotifications, markNotificationRead, type CitizenNotification } from "@/lib/city-content-api"

export function AppShell() {
  const { token, user, unreadCount, refreshUnreadCount, sessionReady } = useGolbox()
  const [tab, setTab] = useState<TabId>("home")
  const [cafeId, setCafeId] = useState<string | null>(null)
  const [placeId, setPlaceId] = useState<string | null>(null)
  const [showPlaces, setShowPlaces] = useState(false)
  const [activityId, setActivityId] = useState<string | null>(null)
  const [showCoupons, setShowCoupons] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<CitizenNotification[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [mapLayer, setMapLayer] = useState<"places" | "golbox">("golbox")
  const [mapFocusPlaceId, setMapFocusPlaceId] = useState<string | null>(null)

  // Direct login screen when unauthenticated (no guest mode)
  if (sessionReady && !token) {
    return (
      <div className="relative flex h-full flex-col justify-center p-5 bg-background">
        <LoginScreen />
      </div>
    )
  }

  const goto = (next: TabId) => {
    setCafeId(null)
    setPlaceId(null)
    setShowPlaces(false)
    setActivityId(null)
    setShowCoupons(false)
    if (next === "map") {
      setMapLayer("golbox")
      setMapFocusPlaceId(null)
    }
    setTab(next)
  }

  const handleOpenNotifications = async () => {
    setShowNotifications(true)
    if (!token) return
    setNotificationsLoading(true)
    try {
      const page = await fetchMyNotifications(token)
      setNotifications(page.items)
    } catch {
      setNotifications([])
    } finally {
      setNotificationsLoading(false)
    }
  }

  return (
    <div className="relative flex h-full flex-col [--gol-dock:7.5rem]">
      {/* Global Persistent Header across all tabs */}
      <div className="px-5 pt-2">
        <AppHeader
          firstName={user?.firstName}
          pointsBalance={token ? (user?.pointsBalance ?? 0) : undefined}
          onOpenPoints={() => goto("rewards")}
          unreadCount={unreadCount}
          onNotifications={() => void handleOpenNotifications()}
          onProfile={() => goto("profile")}
        />
      </div>

      <main className="no-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        {tab === "home" && (
          <HomeScreen
            onNavigate={goto}
            onOpenCafe={setCafeId}
            onOpenPlace={setPlaceId}
            onOpenPlaces={() => {
              setMapLayer("places")
              goto("map")
            }}
            onOpenActivity={setActivityId}
            hideHeader
          />
        )}
        {tab === "events" && <EventsScreen onOpenActivity={setActivityId} />}
        {(tab === "media" || tab === "reels") && <ReelsScreen />}
        {tab === "applications" && <ApplicationsScreen onNavigate={goto} />}
        {tab === "rewards" && <RewardsScreen />}
        {(tab === "menu" || tab === "more") && (
          <MenuScreen
            onNavigate={goto}
            onOpenCoupons={() => setShowCoupons(true)}
          />
        )}
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

      {showNotifications && (
        <NotificationsSheet
          isLoggedIn={Boolean(token)}
          items={notifications}
          loading={notificationsLoading}
          onClose={() => setShowNotifications(false)}
          onLogin={() => {
            setShowNotifications(false)
            goto("profile")
          }}
          onOpen={() => setShowNotifications(false)}
        />
      )}
      {showCoupons && (
        <RewardsScreen
          initialTab="coupons"
          onClose={() => setShowCoupons(false)}
          closeLabel="Geri Dön"
        />
      )}
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
