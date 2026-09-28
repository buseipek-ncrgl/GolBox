"use client"

import { useCallback, useEffect, useState } from "react"
import { Screen } from "@/components/golbox/screen"
import { AppHeader } from "@/components/golbox/app-header"
import { CaptureOverlay } from "@/components/golbox/capture-overlay"
import { LoginRequiredSheet } from "@/components/golbox/login-required-sheet"
import { LocationPermissionSheet } from "@/components/golbox/location-permission-sheet"
import { RewardsScreen } from "@/components/golbox/screens/rewards-screen"
import { IsmarliyorCard } from "@/components/golbox/home/ismarliyor-card"
import { HediyeAviCard } from "@/components/golbox/home/hediye-avi-card"
import { HomeHeroCarousel } from "@/components/golbox/home/home-hero-carousel"
import { QuickActions, type QuickActionId } from "@/components/golbox/home/quick-actions"
import {
  AgendaDetailSheet,
  AgendaListSheet,
  EarnInfoSheet,
  MayorMessageSheet,
  NotificationsSheet,
} from "@/components/golbox/home/home-sheets"
import { isActiveCoupon } from "@/components/golbox/coupon-pass"
import { GPValue } from "@/components/golbox/gp-value"
import { InlineError } from "@/components/golbox/inline-error"
import { SectionSkeleton } from "@/components/golbox/section-skeleton"
import {
  DEFAULT_HERO_NEWS,
  mayorFromList,
  resolveContentCta,
  resolveNotificationTarget,
  upcomingEventFromList,
  type CityContentItem,
} from "@/lib/city-content"
import {
  fetchAgendaContent,
  fetchHeroContent,
  fetchMyNotifications,
  fetchPublicActivities,
  markNotificationRead,
  type CitizenNotification,
} from "@/lib/city-content-api"
import { fetchNearbyPlaces } from "@/lib/places-api"
import type { PlaceNearbyItem } from "@/lib/places"
import { selectPersonalPriority } from "@/lib/home-priority"
import { useGolbox } from "@/lib/golbox-context"
import { useCitizenLocation } from "@/lib/use-citizen-location"
import { useCaptureSession } from "@/lib/use-capture-session"
import type { TabId } from "@/lib/golbox-data"

type HomeSheet =
  | { type: "mayor"; item: CityContentItem }
  | { type: "agenda-item"; item: CityContentItem }
  | { type: "agenda-list" }
  | { type: "notifications" }
  | { type: "earn" }
  | { type: "location" }
  | null

type RewardsTab = "catalog" | "cart" | "coupons"

export function HomeScreen({
  onNavigate,
  onOpenCafe,
  onOpenPlace,
  onOpenPlaces,
  onOpenActivity,
  hideHeader = false,
}: {
  onNavigate: (tab: TabId) => void
  onOpenCafe: (id: string) => void
  onOpenPlace: (id: string) => void
  onOpenPlaces: () => void
  onOpenActivity: (id: string) => void
  hideHeader?: boolean
}) {
  const {
    token,
    user,
    fieldDrops,
    pointTransactions,
    orders,
    rewards,
    claimedRewards,
    publicSettings,
    unreadCount,
    refreshUnreadCount,
  } = useGolbox()
  const { origin, permission } = useCitizenLocation()
  const capture = useCaptureSession(origin, fieldDrops)
  const [showRewards, setShowRewards] = useState(false)
  const [rewardsTab, setRewardsTab] = useState<RewardsTab>("catalog")
  const [sheet, setSheet] = useState<HomeSheet>(null)
  const [heroItems, setHeroItems] = useState<CityContentItem[]>(DEFAULT_HERO_NEWS)
  const [agendaItems, setAgendaItems] = useState<CityContentItem[]>([])
  const [heroError, setHeroError] = useState(false)
  const [agendaError, setAgendaError] = useState(false)
  const [heroLoading, setHeroLoading] = useState(true)
  const [notifications, setNotifications] = useState<CitizenNotification[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [upcomingEvent, setUpcomingEvent] = useState<CityContentItem | null>(null)

  const isLoggedIn = Boolean(token)

  const loadHomeContent = useCallback(async () => {
    setHeroLoading(true)
    setHeroError(false)
    setAgendaError(false)
    try {
      const hero = await fetchHeroContent(token)
      setHeroItems(hero && hero.length > 0 ? hero : DEFAULT_HERO_NEWS)
    } catch {
      setHeroItems(DEFAULT_HERO_NEWS)
      setHeroError(false)
    } finally {
      setHeroLoading(false)
    }

    try {
      const agenda = await fetchAgendaContent(token, 1, 12)
      setAgendaItems(agenda.items)
    } catch {
      setAgendaItems([])
      setAgendaError(true)
    }
  }, [token])

  useEffect(() => {
    void loadHomeContent()
  }, [loadHomeContent])

  const nearbyDrop = fieldDrops.find((drop) => !capture.capturedIds.includes(drop.id)) ?? null

  const openRewards = (tab: RewardsTab) => {
    onNavigate("rewards")
  }

  const applyNavAction = (action: ReturnType<typeof resolveContentCta>) => {
    if (action.kind === "cafe") {
      if (action.cafeId) onOpenCafe(action.cafeId)
      else onOpenPlaces()
      return
    }
    if (action.kind === "place") {
      if (action.placeId) onOpenPlace(action.placeId)
      else onOpenPlaces()
      return
    }
    if (action.kind === "catalog") {
      onNavigate("rewards")
      return
    }
    if (action.kind === "coupons") {
      onNavigate("rewards")
      return
    }
    if (action.kind === "map") {
      onNavigate("map")
      return
    }
    if (action.kind === "qr") {
      onNavigate("rewards")
      return
    }
    if (action.kind === "profile") {
      onNavigate("profile")
      return
    }
    if (action.kind === "earn") {
      onNavigate("rewards")
      return
    }
    if (action.kind === "external") {
      window.open(action.url, "_blank", "noopener,noreferrer")
      return
    }
    if (action.kind === "activity") {
      onOpenActivity(action.activityId)
    }
  }

  const openContent = (item: CityContentItem) => {
    const action = resolveContentCta(item)
    if (action.kind === "mayor") {
      setSheet({ type: "mayor", item: mayorFromList([item, ...heroItems, ...agendaItems]) ?? item })
      return
    }
    if (action.kind === "detail") {
      setSheet({ type: "agenda-item", item })
      return
    }
    applyNavAction(action)
  }

  const handleQuickAction = (id: QuickActionId) => {
    if (id === "events") {
      onNavigate("events")
      return
    }
    if (id === "places") {
      onNavigate("map")
      return
    }
    if (id === "notifications") {
      setSheet({ type: "notifications" })
      return
    }
    if (id === "golpuan") {
      onNavigate("rewards")
      return
    }
  }

  const collectDrop = (id: string) => {
    if (permission === "denied") {
      setSheet({ type: "location" })
      return
    }
    capture.openCapture(id)
  }

  useEffect(() => {
    if (sheet?.type !== "notifications" || !token) return
    let cancelled = false
    setNotificationsLoading(true)
    void fetchMyNotifications(token)
      .then((page) => {
        if (!cancelled) setNotifications(page.items)
      })
      .catch(() => {
        if (!cancelled) setNotifications([])
      })
      .finally(() => {
        if (!cancelled) setNotificationsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [sheet, token])

  const handleNotificationOpen = async (item: CitizenNotification) => {
    if (token && !item.isRead) {
      try {
        await markNotificationRead(token, item.id)
        setNotifications((current) => current.map((row) => (row.id === item.id ? { ...row, isRead: true } : row)))
        await refreshUnreadCount()
      } catch {
        /* keep list usable */
      }
    }
    const action = resolveNotificationTarget(item.targetType, item.targetId)
    setSheet(null)
    if (action.kind === "content") {
      const found = [...heroItems, ...agendaItems].find((row) => row.id === action.contentId)
      if (found) openContent(found)
      return
    }
    if (action.kind === "detail" || action.kind === "mayor" || action.kind === "none") return
    applyNavAction(action)
  }

  if (showRewards) {
    return (
      <RewardsScreen
        onClose={() => setShowRewards(false)}
        closeLabel="Ana sayfaya dön"
        initialTab={rewardsTab}
      />
    )
  }

  return (
    <Screen className="space-y-5 pb-8">
      {!hideHeader ? (
        <AppHeader
          firstName={user?.firstName}
          pointsBalance={isLoggedIn ? (user?.pointsBalance ?? 0) : undefined}
          onOpenPoints={() => openRewards("catalog")}
          unreadCount={unreadCount}
          onNotifications={() => setSheet({ type: "notifications" })}
          onProfile={() => onNavigate("profile")}
        />
      ) : null}

      {/* 1. Kayan Hero / Duyurular */}
      {heroError ? (
        <InlineError message="Duyurular yüklenemedi." onRetry={() => void loadHomeContent()} />
      ) : heroLoading ? (
        <SectionSkeleton lines={1} />
      ) : (
        <HomeHeroCarousel items={heroItems} onOpen={openContent} />
      )}

      {/* 2. Ismarlıyor Kampanyası */}
      <IsmarliyorCard />

      {/* 3. Hediye Avı */}
      <HediyeAviCard
        drop={nearbyDrop}
        onCollect={(id) => {
          if (!isLoggedIn) {
            capture.setShowLogin(true)
            return
          }
          collectDrop(id)
        }}
        onOpenMap={() => onNavigate("menu")}
      />

      {/* 4. Hızlı Erişim - 4 Adet Sabit */}
      <QuickActions onSelect={handleQuickAction} />

      <div aria-hidden className="h-2" />

      {capture.showLogin && !capture.token && (
        <LoginRequiredSheet onClose={() => capture.setShowLogin(false)} closeLabel="Ana sayfaya dön" />
      )}
      {capture.pendingDrop && (
        <CaptureOverlay
          drop={capture.pendingDrop}
          busy={capture.busyId === capture.pendingDrop.id}
          onConfirm={capture.confirmCapture}
          onClose={capture.closeCapture}
        />
      )}
      {sheet?.type === "mayor" && <MayorMessageSheet item={sheet.item} onClose={() => setSheet(null)} />}
      {sheet?.type === "agenda-item" && <AgendaDetailSheet item={sheet.item} onClose={() => setSheet(null)} />}
      {sheet?.type === "agenda-list" && (
        <AgendaListSheet
          items={agendaItems}
          onClose={() => setSheet(null)}
          onOpen={(item) => {
            setSheet(null)
            openContent(item)
          }}
        />
      )}
      {sheet?.type === "notifications" && (
        <NotificationsSheet
          isLoggedIn={isLoggedIn}
          items={notifications}
          loading={notificationsLoading}
          onClose={() => setSheet(null)}
          onLogin={() => {
            setSheet(null)
            capture.setShowLogin(true)
          }}
          onOpen={(item) => void handleNotificationOpen(item)}
        />
      )}
      {sheet?.type === "earn" && (
        <EarnInfoSheet
          onClose={() => setSheet(null)}
          onQr={() => onNavigate("rewards")}
          onMap={() => onNavigate("map")}
        />
      )}
      {sheet?.type === "location" && (
        <LocationPermissionSheet
          onClose={() => setSheet(null)}
          onContinueWithout={() => setSheet(null)}
        />
      )}
    </Screen>
  )
}
