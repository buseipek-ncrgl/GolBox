"use client"

import { useState } from "react"
import type { TabId } from "@/lib/golbox-data"
import { useGolbox } from "@/lib/golbox-context"
import { AppHeader } from "@/components/golbox/app-header"
import { BottomNav } from "@/components/golbox/bottom-nav"
import { CafeDetailSheet } from "@/components/golbox/cafe-detail-sheet"
import { NotificationsSheet } from "@/components/golbox/home/home-sheets"
import { HomeScreen } from "@/components/golbox/screens/home-screen"
import { ProfileScreen } from "@/components/golbox/screens/profile-screen"
import { QrScreen } from "@/components/golbox/screens/qr-screen"
import { RewardsScreen } from "@/components/golbox/screens/rewards-screen"
import { MenuScreen } from "@/components/golbox/screens/menu-screen"
import { LoginScreen } from "@/components/golbox/screens/login-screen"
import { SplashScreen } from "@/components/golbox/screens/splash-screen"
import { BranchesScreen } from "@/components/golbox/screens/branches-screen"
import { CampaignsScreen } from "@/components/golbox/screens/campaigns-screen"
import { EventsScreen } from "@/components/golbox/screens/events-screen"
import { MissionsScreen } from "@/components/golbox/screens/missions-screen"
import { OrdersHistoryScreen } from "@/components/golbox/screens/orders-history-screen"
import { CartScreen } from "@/components/golbox/screens/cart-screen"
import { useEffect } from "react"
import { InAppNotificationToast } from "@/components/golbox/notifications/in-app-notification-toast"
import { fetchMyNotifications, type CitizenNotification } from "@/lib/city-content-api"

export function AppShell() {
  const { token, user, unreadCount, sessionReady, selectedBranch, refreshData } = useGolbox()
  const [showSplash, setShowSplash] = useState(true)
  const [tab, setTab] = useState<TabId>("home")
  const [cafeId, setCafeId] = useState<string | null>(null)
  const [showCoupons, setShowCoupons] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showBranches, setShowBranches] = useState(false)
  const [showCampaigns, setShowCampaigns] = useState(false)
  const [showEvents, setShowEvents] = useState(false)
  const [showMissions, setShowMissions] = useState(false)
  const [showOrders, setShowOrders] = useState(false)
  const [notifications, setNotifications] = useState<CitizenNotification[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [transientNotification, setTransientNotification] = useState<CitizenNotification | null>(null)

  // APP RESUME FOREGROUND SYNC (PRD SECTIONS 103, 218, 294)
  useEffect(() => {
    const handleResume = () => {
      if (document.visibilityState === "visible") {
        void refreshData()
      }
    }
    window.addEventListener("focus", handleResume)
    document.addEventListener("visibilitychange", handleResume)
    return () => {
      window.removeEventListener("focus", handleResume)
      document.removeEventListener("visibilitychange", handleResume)
    }
  }, [refreshData])

  // 1. SPLASH SCREEN (Section 1)
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />
  }

  // 2. AUTH GATE / LOGIN SCREEN (Section 2 & 3)
  if (sessionReady && !token) {
    return (
      <div className="relative flex h-full flex-col justify-center p-5 bg-background">
        <LoginScreen onReplaySplash={() => setShowSplash(true)} />
      </div>
    )
  }

  const goto = (next: TabId) => {
    setCafeId(null)
    setShowCoupons(false)
    setShowBranches(false)
    setShowCampaigns(false)
    setShowEvents(false)
    setShowMissions(false)
    setShowOrders(false)
    setShowNotifications(false)
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

  // DEEP LINK ROUTER ENGINE (PRD SECTIONS 41, 49, 143-145)
  const handleNotificationClick = (item: CitizenNotification) => {
    setShowNotifications(false)
    setTransientNotification(null)

    const entityType = item.entityType || ""
    const type = item.type || ""

    if (entityType === "ORDER" || type.startsWith("ORDER_")) {
      if (type === "ORDER_READY" || item.title.toLowerCase().includes("hazır") || item.body.toLowerCase().includes("hazır")) {
        goto("qr")
      } else {
        goto("home")
      }
    } else if (entityType === "EVENT" || type.startsWith("EVENT_")) {
      setShowEvents(true)
    } else if (entityType === "MISSION" || type.startsWith("MISSION_")) {
      setShowMissions(true)
    } else if (entityType === "REWARD" || type.startsWith("LOYALTY_")) {
      goto("golpuan")
    } else if (entityType === "CAMPAIGN" || type.startsWith("CAMPAIGN_")) {
      setShowCampaigns(true)
    } else {
      goto("home")
    }
  }

  return (
    <div className="relative flex h-full flex-col [--gol-dock:7.5rem]">
      {/* Global Persistent Header (Sticky at top) */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md px-5 py-2 border-b border-border/40 shadow-2xs">
        <AppHeader
          firstName={user?.firstName}
          pointsBalance={token ? (user?.pointsBalance ?? 0) : undefined}
          onOpenPoints={() => goto("golpuan")}
          unreadCount={unreadCount}
          onNotifications={() => void handleOpenNotifications()}
          onProfile={() => goto("profile")}
          onOpenBranches={() => setShowBranches(true)}
          onReplaySplash={() => setShowSplash(true)}
          selectedBranchName={selectedBranch?.name}
          showGreeting={false}
        />
      </div>

      <main className="no-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        {tab === "home" && (
          <HomeScreen
            onNavigate={goto}
            onOpenCafe={setCafeId}
            onOpenCampaigns={() => setShowCampaigns(true)}
            onOpenEvents={() => setShowEvents(true)}
            onOpenMissions={() => setShowMissions(true)}
            hideHeader
          />
        )}
        {tab === "menu" && (
          <MenuScreen
            onNavigate={goto}
            onOpenCoupons={() => setShowCoupons(true)}
          />
        )}
        {tab === "qr" && <QrScreen />}
        {tab === "golpuan" && (
          <RewardsScreen onOpenMissions={() => setShowMissions(true)} />
        )}
        {tab === "profile" && (
          <ProfileScreen
            onOpenEvents={() => setShowEvents(true)}
            onOpenMissions={() => setShowMissions(true)}
            onOpenOrders={() => setShowOrders(true)}
          />
        )}
        {tab === "cart" && (
          <CartScreen
            onClose={() => goto("home")}
            onNavigateToMenu={() => goto("menu")}
            onNavigateToQr={() => goto("qr")}
          />
        )}
      </main>

      <BottomNav active={tab} onChange={goto} />

      {showOrders && (
        <OrdersHistoryScreen
          onBack={() => setShowOrders(false)}
          onNavigateToMenu={() => {
            setShowOrders(false)
            goto("menu")
          }}
        />
      )}

      {showBranches && (
        <BranchesScreen
          onBack={() => setShowBranches(false)}
          onSelectBranchSuccess={() => setShowBranches(false)}
          onNavigateToMenu={() => {
            setShowBranches(false)
            goto("menu")
          }}
        />
      )}

      {showCampaigns && (
        <CampaignsScreen
          onBack={() => setShowCampaigns(false)}
          onNavigateToMenu={() => {
            setShowCampaigns(false)
            goto("menu")
          }}
        />
      )}

      {showEvents && (
        <EventsScreen
          onBack={() => setShowEvents(false)}
          onOpenQrScreen={() => {
            setShowEvents(false)
            goto("qr")
          }}
        />
      )}

      {showMissions && (
        <MissionsScreen
          onBack={() => setShowMissions(false)}
          onNavigateToMenu={() => {
            setShowMissions(false)
            goto("menu")
          }}
          onNavigateToEvents={() => {
            setShowMissions(false)
            setShowEvents(true)
          }}
          onNavigateToBranches={() => {
            setShowMissions(false)
            setShowBranches(true)
          }}
        />
      )}

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
          onOpen={(item) => handleNotificationClick(item)}
          onMarkAllRead={() => setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))}
        />
      )}

      {transientNotification && (
        <InAppNotificationToast
          notification={transientNotification}
          onOpen={() => handleNotificationClick(transientNotification)}
          onDismiss={() => setTransientNotification(null)}
        />
      )}

      {showCoupons && (
        <RewardsScreen
          initialTab="coupons"
          onClose={() => setShowCoupons(false)}
          closeLabel="Geri Dön"
        />
      )}
      {cafeId && <CafeDetailSheet cafeId={cafeId} onClose={() => setCafeId(null)} />}
    </div>
  )
}
