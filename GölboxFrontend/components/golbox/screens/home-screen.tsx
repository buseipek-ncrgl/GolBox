"use client"

import { useMemo, useState } from "react"
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
  AgendaDetailSheet,
  AgendaListSheet,
  EarnInfoSheet,
  MayorMessageSheet,
  NotificationsSheet,
} from "@/components/golbox/home/home-sheets"
import { isActiveCoupon } from "@/components/golbox/coupon-pass"
import { GPValue } from "@/components/golbox/gp-value"
import {
  findCityContent,
  mayorMessage,
  publishedAgendaItems,
  publishedHeroItems,
  type CityContentItem,
} from "@/lib/city-content"
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
  } = useGolbox()
  const { origin, permission } = useCitizenLocation()
  const capture = useCaptureSession(origin, fieldDrops)
  const [showRewards, setShowRewards] = useState(false)
  const [rewardsTab, setRewardsTab] = useState<RewardsTab>("catalog")
  const [sheet, setSheet] = useState<HomeSheet>(null)

  const isLoggedIn = Boolean(token)
  const heroItems = useMemo(() => publishedHeroItems(), [])
  const agendaItems = useMemo(() => publishedAgendaItems(), [])
  const nearbyDrop = fieldDrops.find((drop) => !capture.capturedIds.includes(drop.id)) ?? null
  const activeCoupons = claimedRewards.filter(isActiveCoupon)
  const priority = selectPersonalPriority({
    isLoggedIn,
    orders,
    fieldDrops,
    capturedIds: capture.capturedIds,
    claimedRewards,
  })

  const lastMove = isLoggedIn && pointTransactions[0] ? pointTransactions[0] : null

  const openContent = (item: CityContentItem) => {
    if (item.ctaTarget === "mayor" || item.type === "mayor_message") {
      setSheet({ type: "mayor", item: mayorMessage() ?? item })
      return
    }
    if (item.ctaTarget === "cafes") {
      onOpenCafes()
      return
    }
    if (item.ctaTarget === "catalog") {
      setRewardsTab("catalog")
      setShowRewards(true)
      return
    }
    if (item.ctaTarget === "map") {
      onNavigate("map")
      return
    }
    if (item.ctaTarget === "qr") {
      onNavigate("qr")
      return
    }
    setSheet({ type: "agenda-item", item: findCityContent(item.id) ?? item })
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
        onNotifications={() => setSheet({ type: "notifications" })}
        onProfile={() => onNavigate("profile")}
      />

      <HomeHeroCarousel items={heroItems} compact={Boolean(priority)} onOpen={openContent} />

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
          onOpen={(item) => setSheet({ type: "agenda-item", item })}
        />
      )}
      {sheet?.type === "notifications" && (
        <NotificationsSheet
          isLoggedIn={isLoggedIn}
          onClose={() => setSheet(null)}
          onLogin={() => {
            setSheet(null)
            capture.setShowLogin(true)
          }}
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
