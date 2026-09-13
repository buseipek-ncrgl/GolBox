"use client"

import { useCallback, useEffect, useState } from "react"
import { Screen } from "@/components/golbox/screen"
import { AppHeader } from "@/components/golbox/app-header"
import { CaptureOverlay } from "@/components/golbox/capture-overlay"
import { LoginRequiredSheet } from "@/components/golbox/login-required-sheet"
import { LocationPermissionSheet } from "@/components/golbox/location-permission-sheet"
import { RewardsScreen } from "@/components/golbox/screens/rewards-screen"
import { HomeHeroCarousel } from "@/components/golbox/home/home-hero-carousel"
import { PersonalPrioritySection } from "@/components/golbox/home/personal-priority-section"
import { PointsCard } from "@/components/golbox/home/points-card"
import { QuickActions, type QuickActionId } from "@/components/golbox/home/quick-actions"
import { CityAgendaSection } from "@/components/golbox/home/city-agenda-section"
import { NearbySection } from "@/components/golbox/home/nearby-section"
import { EarnPointsSection } from "@/components/golbox/home/earn-points-section"
import {
  ActivityDetailSheet,
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
  mayorFromList,
  resolveContentCta,
  upcomingEventFromList,
  type CityContentItem,
} from "@/lib/city-content"
import {
  fetchAgendaContent,
  fetchHeroContent,
  fetchMyNotifications,
  fetchPublicActivities,
  fetchPublicActivity,
  joinPublicActivity,
  markNotificationRead,
  type CitizenNotification,
  type PublicActivity,
} from "@/lib/city-content-api"
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
  | { type: "activity"; activityId: string }
  | { type: "earn" }
  | { type: "location" }
  | null

type RewardsTab = "catalog" | "cart" | "coupons"

export function HomeScreen({
  onNavigate,
  onOpenCafe,
  onOpenCafes,
}: {
  onNavigate: (tab: TabId) => void
  onOpenCafe: (id: string) => void
  onOpenCafes: () => void
}) {
  const {
    token,
    user,
    fieldDrops,
    pointTransactions,
    cafes,
    orders,
    rewards,
    claimedRewards,
    sessionReady,
    sessionError,
    refreshData,
    publicSettings,
    unreadCount,
    refreshUnreadCount,
  } = useGolbox()
  const { origin, permission } = useCitizenLocation()
  const capture = useCaptureSession(origin, fieldDrops)
  const [showRewards, setShowRewards] = useState(false)
  const [rewardsTab, setRewardsTab] = useState<RewardsTab>("catalog")
  const [sheet, setSheet] = useState<HomeSheet>(null)
  const [heroItems, setHeroItems] = useState<CityContentItem[]>([])
  const [agendaItems, setAgendaItems] = useState<CityContentItem[]>([])
  const [heroError, setHeroError] = useState(false)
  const [agendaError, setAgendaError] = useState(false)
  const [heroLoading, setHeroLoading] = useState(true)
  const [notifications, setNotifications] = useState<CitizenNotification[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [activity, setActivity] = useState<PublicActivity | null>(null)
  const [activityBusy, setActivityBusy] = useState(false)
  const [upcomingEvent, setUpcomingEvent] = useState<CityContentItem | null>(null)

  const isLoggedIn = Boolean(token)

  const loadHomeContent = useCallback(async () => {
    setHeroLoading(true)
    setHeroError(false)
    setAgendaError(false)
    try {
      const hero = await fetchHeroContent(token)
      setHeroItems(hero)
    } catch {
      setHeroItems([])
      setHeroError(true)
    } finally {
      setHeroLoading(false)
    }

    let upcoming: CityContentItem | null = null
    try {
      const agenda = await fetchAgendaContent(token, 1, 12)
      setAgendaItems(agenda.items)
      upcoming = upcomingEventFromList(agenda.items)
    } catch {
      setAgendaItems([])
      setAgendaError(true)
    }

    try {
      const activities = await fetchPublicActivities(token, 1, 8)
      const first = activities.items[0]
      if (!upcoming && first) {
        upcoming = {
          id: first.id,
          type: "EventPromo",
          title: first.title,
          subtitle: first.location,
          body: first.description,
          imageUrl: first.imageUrl || undefined,
          ctaLabel: "Etkinliği gör",
          ctaType: "Activity",
          ctaTarget: first.id,
          startAt: first.startDate,
          endAt: first.endDate,
          priority: 1,
          isPublished: true,
          categoryLabel: "Etkinlik",
          activityId: first.id,
        }
      }
    } catch {
      /* priority event is optional */
    }
    setUpcomingEvent(upcoming)
  }, [token])

  useEffect(() => {
    void loadHomeContent()
  }, [loadHomeContent])

  const nearbyDrop = fieldDrops.find((drop) => !capture.capturedIds.includes(drop.id)) ?? null
  const activeCoupons = claimedRewards.filter(isActiveCoupon)
  const priority = selectPersonalPriority({
    isLoggedIn,
    orders,
    fieldDrops,
    capturedIds: capture.capturedIds,
    claimedRewards,
    upcomingEvent,
  })

  const lastMove = isLoggedIn && pointTransactions[0] ? pointTransactions[0] : null

  const openContent = (item: CityContentItem) => {
    const action = resolveContentCta(item)
    if (action.kind === "mayor") {
      setSheet({ type: "mayor", item: mayorFromList([item, ...heroItems, ...agendaItems]) ?? item })
      return
    }
    if (action.kind === "cafe") {
      if (action.cafeId) onOpenCafe(action.cafeId)
      else onOpenCafes()
      return
    }
    if (action.kind === "catalog") {
      setRewardsTab("catalog")
      setShowRewards(true)
      return
    }
    if (action.kind === "map") {
      onNavigate("map")
      return
    }
    if (action.kind === "qr") {
      onNavigate("qr")
      return
    }
    if (action.kind === "profile") {
      onNavigate("profile")
      return
    }
    if (action.kind === "earn") {
      setSheet({ type: "earn" })
      return
    }
    if (action.kind === "external") {
      window.open(action.url, "_blank", "noopener,noreferrer")
      return
    }
    if (action.kind === "activity") {
      setSheet({ type: "activity", activityId: action.activityId })
      return
    }
    setSheet({ type: "agenda-item", item })
  }

  const openRewards = (tab: RewardsTab) => {
    if (tab !== "catalog" && !isLoggedIn) {
      capture.setShowLogin(true)
      return
    }
    setRewardsTab(tab)
    setShowRewards(true)
  }

  const handleQuickAction = (id: QuickActionId) => {
    if (id === "coupons") {
      openRewards("coupons")
      return
    }
    if (id === "cafes") {
      onOpenCafes()
      return
    }
    if (id === "events") {
      setSheet({ type: "agenda-list" })
      return
    }
    setSheet({ type: "earn" })
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

  useEffect(() => {
    if (sheet?.type !== "activity") {
      setActivity(null)
      return
    }
    let cancelled = false
    void fetchPublicActivity(sheet.activityId, token)
      .then((item) => {
        if (!cancelled) setActivity(item)
      })
      .catch(() => {
        if (!cancelled) setActivity(null)
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
    if (item.targetType === "Activity" && item.targetId) {
      setSheet({ type: "activity", activityId: item.targetId })
      return
    }
    if (item.targetType === "Content" && item.targetId) {
      const found = [...heroItems, ...agendaItems].find((row) => row.id === item.targetId)
      if (found) {
        openContent(found)
        return
      }
    }
    if (item.targetType === "Cafe" && item.targetId) {
      onOpenCafe(item.targetId)
      return
    }
  }

  const handleJoinActivity = async () => {
    if (!token || !activity) {
      capture.setShowLogin(true)
      return
    }
    setActivityBusy(true)
    try {
      await joinPublicActivity(activity.id, token)
      setActivity(await fetchPublicActivity(activity.id, token))
      await refreshData()
    } catch {
      /* join error stays on current sheet */
    } finally {
      setActivityBusy(false)
    }
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
    <Screen className="space-y-6">
      <AppHeader
        firstName={user?.firstName}
        unreadCount={unreadCount}
        onNotifications={() => setSheet({ type: "notifications" })}
        onProfile={() => onNavigate("profile")}
      />

      {heroError ? (
        <InlineError message="Duyurular yüklenemedi." onRetry={() => void loadHomeContent()} />
      ) : heroLoading ? (
        <SectionSkeleton lines={1} />
      ) : (
        <HomeHeroCarousel items={heroItems} compact={Boolean(priority)} onOpen={openContent} />
      )}

      <PersonalPrioritySection
        item={priority}
        onShowQr={() => onNavigate("qr")}
        onMap={() => onNavigate("map")}
        onCollect={collectDrop}
        onCoupons={() => openRewards("coupons")}
        onEvent={() => priority?.kind === "event" && openContent(priority.content)}
      />

      <PointsCard
        isLoggedIn={isLoggedIn}
        points={user?.pointsBalance ?? 0}
        rewards={rewards}
        onOpenCatalog={() => openRewards("catalog")}
        onEarn={() => setSheet({ type: "earn" })}
        onLogin={() => capture.setShowLogin(true)}
      />

      <QuickActions couponCount={isLoggedIn ? activeCoupons.length : undefined} onSelect={handleQuickAction} />

      <CityAgendaSection
        items={agendaItems}
        error={agendaError}
        onRetry={() => void loadHomeContent()}
        onOpen={openContent}
        onSeeAll={() => setSheet({ type: "agenda-list" })}
      />

      <NearbySection
        cafes={cafes}
        origin={origin}
        ready={sessionReady}
        error={sessionError}
        onRetry={() => void refreshData()}
        onOpen={onOpenCafe}
        onSeeAll={onOpenCafes}
      />

      <EarnPointsSection
        drop={isLoggedIn ? nearbyDrop : null}
        visitBonusPoints={publicSettings.visitBonusPoints}
        onAction={(action) => onNavigate(action)}
      />

      {lastMove ? (
        <button
          type="button"
          onClick={() => onNavigate("profile")}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <span className="min-w-0">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Son işlem
            </span>
            <span className="mt-0.5 block truncate text-sm text-foreground">
              {lastMove.description || "GölPuan"}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-2 text-sm font-semibold text-primary">
            <GPValue amount={lastMove.amount} signed className="text-sm" />
            Tümü
          </span>
        </button>
      ) : null}

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
            const action = resolveContentCta(item)
            if (action.kind === "activity") setSheet({ type: "activity", activityId: action.activityId })
            else setSheet({ type: "agenda-item", item })
          }}
        />
      )}
      {sheet?.type === "activity" && (
        <ActivityDetailSheet
          activity={activity}
          isLoggedIn={isLoggedIn}
          busy={activityBusy}
          onClose={() => setSheet(null)}
          onJoin={() => void handleJoinActivity()}
          onLogin={() => {
            setSheet(null)
            capture.setShowLogin(true)
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
          onQr={() => onNavigate("qr")}
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
