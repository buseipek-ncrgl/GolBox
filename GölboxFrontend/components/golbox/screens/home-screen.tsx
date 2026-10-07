"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Coffee,
  ShoppingBag,
  QrCode,
  Coins,
  ChevronRight,
  RotateCcw,
  Award,
  Zap,
  Flame,
  Utensils,
  Clock,
  Calendar
} from "lucide-react"
import { Screen } from "@/components/golbox/screen"
import { AppHeader } from "@/components/golbox/app-header"
import { HomeHeroCarousel } from "@/components/golbox/home/home-hero-carousel"
import { NotificationsSheet } from "@/components/golbox/home/home-sheets"
import { InlineError } from "@/components/golbox/inline-error"
import { SectionSkeleton } from "@/components/golbox/section-skeleton"
import { DEFAULT_HERO_NEWS, type CityContentItem } from "@/lib/city-content"
import { fetchHeroContent, type CitizenNotification } from "@/lib/city-content-api"
import { createPortal } from "react-dom"
import { useGolbox } from "@/lib/golbox-context"
import type { TabId } from "@/lib/golbox-data"
import { ActiveOrderScreen } from "@/components/golbox/screens/active-order-screen"
import { IsmarliyorCard } from "@/components/golbox/home/ismarliyor-card"
import { API_BASE_URL } from "@/lib/api-config"

interface FeaturedMission {
  id: string
  title: string
  description: string
  shortDescription?: string
  category?: string
  pointsReward: number
  currentProgress: number
  targetProgress: number
  isCompleted: boolean
}

export function HomeScreen({
  onNavigate,
  onOpenCampaigns,
  onOpenEvents,
  onOpenMissions,
  onOpenCoupons,
  hideHeader = false,
}: {
  onNavigate: (tab: TabId) => void
  onOpenCafe?: (id: string) => void
  onOpenCampaigns?: () => void
  onOpenEvents?: () => void
  onOpenMissions?: () => void
  onOpenCoupons?: () => void
  hideHeader?: boolean
}) {
  const { token, user, unreadCount, orders, selectedBranch } = useGolbox()
  const [showActiveOrderScreen, setShowActiveOrderScreen] = useState(false)
  const [heroItems, setHeroItems] = useState<CityContentItem[]>(DEFAULT_HERO_NEWS)
  const [heroError, setHeroError] = useState(false)
  const [heroLoading, setHeroLoading] = useState(true)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications] = useState<CitizenNotification[]>([])
  const [notificationsLoading] = useState(false)
  const [featuredMission, setFeaturedMission] = useState<FeaturedMission | null>(null)
  const [missionLoading, setMissionLoading] = useState(false)

  const isLoggedIn = Boolean(token)
  
  // Filter authoritative active order
  const activeOrders = orders.filter(
    (o) =>
      o.status !== "Completed" &&
      o.status !== "Cancelled" &&
      o.status !== "COMPLETED" &&
      o.status !== "CANCELLED" &&
      o.status !== "NO_SHOW"
  )
  const latestActiveOrder = activeOrders.length > 0 ? activeOrders[0] : null
  const isOrderReady = latestActiveOrder?.status === "READY" || latestActiveOrder?.status === "Ready"

  // Filter completed past order candidate for Reorder preview
  const pastCompletedOrders = orders.filter(
    (o) => o.status === "Completed" || o.status === "COMPLETED"
  )
  const lastOrderCandidate = pastCompletedOrders.length > 0 ? pastCompletedOrders[0] : null

  const loadHomeContent = useCallback(async () => {
    setHeroLoading(true)
    setHeroError(false)
    try {
      const hero = await fetchHeroContent(token)
      const golboxHero = hero?.filter((item) =>
        item.title.toLowerCase().includes("gölbox") ||
        item.title.toLowerCase().includes("kahve") ||
        item.title.toLowerCase().includes("puan") ||
        item.title.toLowerCase().includes("kafe")
      )
      setHeroItems(golboxHero && golboxHero.length > 0 ? golboxHero : DEFAULT_HERO_NEWS)
    } catch {
      setHeroItems(DEFAULT_HERO_NEWS)
      setHeroError(false)
    } finally {
      setHeroLoading(false)
    }
  }, [token])

  useEffect(() => {
    void loadHomeContent()
  }, [loadHomeContent])

  useEffect(() => {
    if (!token) {
      setFeaturedMission(null)
      return
    }

    let cancelled = false
    const loadFeaturedMission = async () => {
      setMissionLoading(true)
      try {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        })
        const body = await response.json()
        const rows: FeaturedMission[] = response.ok && body.success && Array.isArray(body.data) ? body.data : []
        if (!cancelled) setFeaturedMission(rows.find((mission) => !mission.isCompleted) || rows[0] || null)
      } catch {
        if (!cancelled) setFeaturedMission(null)
      } finally {
        if (!cancelled) setMissionLoading(false)
      }
    }

    void loadFeaturedMission()
    return () => { cancelled = true }
  }, [token])

  return (
    <Screen className="space-y-4.5 pb-32">
      {!hideHeader ? (
        <AppHeader
          firstName={user?.firstName}
          pointsBalance={isLoggedIn ? (user?.pointsBalance ?? 0) : undefined}
          onOpenPoints={() => onNavigate("golpuan")}
          unreadCount={unreadCount}
          onNotifications={() => setShowNotifications(true)}
          onProfile={() => onNavigate("profile")}
        />
      ) : null}

      {/* 1. GREETING */}
      <div className="pt-0.5">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          {isLoggedIn && user?.firstName ? `Merhaba ${user.firstName}` : "GölBOX'a Hoş Geldin"}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isLoggedIn
            ? "Bugün GölBOX'ta ne içmek istersin?"
            : "Menüyü keşfet ve sana en yakın GölBOX şubesinden hızlıca sipariş ver."}
        </p>
      </div>

      {/* 2. ACTIVE ORDER (HIGH DYNAMIC PRIORITY IF PRESENT) */}
      {isLoggedIn && latestActiveOrder && (
        <div
          onClick={() => (isOrderReady ? onNavigate("qr") : setShowActiveOrderScreen(true))}
          className={`cursor-pointer rounded-2xl border p-3.5 shadow-2xs transition hover:scale-[1.01] ${
            isOrderReady
              ? "border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/60"
              : "border-emerald-600/30 bg-card"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                isOrderReady
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200"
              }`}
            >
              <Coffee className="size-3" />
              {isOrderReady
                ? "SİPARİŞİN HAZIR!"
                : `SİPARİŞ #${latestActiveOrder.collectionCode || latestActiveOrder.id.substring(0, 6)}`}
            </span>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
              <Clock className="size-3" /> {isOrderReady ? "Teslim Alabilirsiniz" : "Hazırlanıyor"}
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-foreground">
                {isOrderReady
                  ? "Kahven Hazır! QR Göster Teslim Al"
                  : latestActiveOrder.status === "Pending" || latestActiveOrder.status === "PENDING"
                  ? "Sipariş İletildi"
                  : "Kahven Hazırlanıyor..."}
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {latestActiveOrder.cafeName || selectedBranch.name} · Kasa Kodu: {latestActiveOrder.collectionCode || "GB-101"}
              </p>
            </div>

            <button
              className={`flex shrink-0 items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold text-white shadow-xs transition ${
                isOrderReady ? "bg-emerald-600 hover:bg-emerald-700" : "bg-emerald-700 hover:bg-emerald-800"
              }`}
            >
              {isOrderReady ? (
                <>
                  <QrCode className="size-3.5" /> QR'ımı Göster
                </>
              ) : (
                <>
                  Siparişi Gör <ChevronRight className="size-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 3. PRIMARY GEL-AL CTA */}
      <button
        type="button"
        onClick={() => onNavigate("menu")}
        className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 dark:bg-emerald-600 py-3.5 text-center text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 active:scale-[0.99] cursor-pointer"
      >
        <ShoppingBag className="size-4.5 transition group-hover:scale-105" />
        Gel-Al Sipariş Ver
        <ChevronRight className="size-4" />
      </button>

      {/* 4. ISMARLIYOR KAMPANYASI (HIGH PRIORITY) */}
      <IsmarliyorCard onJoinSuccess={onOpenCoupons} />

      {/* 4. QUICK CATEGORIES SHORTCUTS */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-extrabold tracking-wider text-muted-foreground uppercase">
            Hızlı Kategoriler
          </h2>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
          <button
            type="button"
            onClick={() => onNavigate("menu")}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent/60 transition cursor-pointer"
          >
            <Coffee className="size-3.5 text-emerald-600 dark:text-emerald-400" /> Sıcak Kahveler
          </button>
          <button
            type="button"
            onClick={() => onNavigate("menu")}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent/60 transition cursor-pointer"
          >
            <Flame className="size-3.5 text-emerald-600 dark:text-emerald-400" /> Soğuk Kahveler
          </button>
          <button
            type="button"
            onClick={() => onNavigate("menu")}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent/60 transition cursor-pointer"
          >
            <Zap className="size-3.5 text-emerald-600 dark:text-emerald-400" /> Tatlılar
          </button>
          <button
            type="button"
            onClick={() => onNavigate("menu")}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent/60 transition cursor-pointer"
          >
            <Utensils className="size-3.5 text-emerald-600 dark:text-emerald-400" /> Atıştırmalıklar
          </button>
        </div>
      </div>

      {/* 5. LAST ORDER / REORDER (ONLY IF PREVIOUS COMPLETED ORDER CANDIDATE EXISTS) */}
      {isLoggedIn && lastOrderCandidate && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-extrabold tracking-wider text-muted-foreground uppercase">
              Son Sipariş
            </h2>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                <Coffee className="size-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground">
                  {lastOrderCandidate.items?.[0]?.menuItemName || "GölBOX Filtre Kahve"}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {lastOrderCandidate.cafeName || selectedBranch.name} · {lastOrderCandidate.totalAmount ? `₺${lastOrderCandidate.totalAmount}` : ""}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("menu")}
              className="flex items-center gap-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 transition cursor-pointer"
            >
              <RotateCcw className="size-3" /> Tekrar Al
            </button>
          </div>
        </div>
      )}

      {/* 6. GÖLPUAN SUMMARY (AUTHENTICATED ONLY, CLEAN NO REDUNDANT USERNAME) */}
      {isLoggedIn ? (
        <div className="rounded-2xl border border-emerald-800/40 bg-gradient-to-br from-emerald-800 via-emerald-900 to-emerald-950 p-4 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider">
                GölPuan Bakiyeniz
              </p>
              <div className="mt-0.5 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-amber-400">{user?.pointsBalance ?? 0}</span>
                <span className="text-xs font-bold text-amber-300">GP</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("golpuan")}
              className="flex items-center gap-1 rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/25 active:scale-95 transition cursor-pointer"
            >
              Ödülleri Gör <ChevronRight className="size-3.5" />
            </button>
          </div>

          <div className="mt-3">
            <div className="flex justify-between text-[11px] font-medium text-emerald-100 mb-1">
              <span>{user?.pointsBalance ?? 0} GP / 1.000 GP Target</span>
              <span>Sonraki ödüle {Math.max(0, 1000 - (user?.pointsBalance ?? 0))} GP kaldı</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-black/30 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300"
                style={{ width: `${Math.min(100, (((user?.pointsBalance ?? 0) / 1000) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      ) : null}

      {/* 7. KASADA QR ACTION BAR */}
      <div
        onClick={() => onNavigate(isLoggedIn ? "qr" : "profile")}
        className="flex cursor-pointer items-center justify-between rounded-2xl border border-border bg-card p-3 shadow-2xs transition hover:border-emerald-600/40 hover:bg-accent/40"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shrink-0">
            <QrCode className="size-4.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-foreground">Kasada QR'ını göster, GölPuan kazan</h3>
            <p className="text-[11px] text-muted-foreground">Fiziksel kasalarda okutup puan yükletmek için tıklayın.</p>
          </div>
        </div>
        <ChevronRight className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
      </div>

      {/* 9. CAMPAIGNS & FIRSATLAR */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-extrabold tracking-wider text-muted-foreground uppercase">
            Kampanyalar & Fırsatlar
          </h2>
          {onOpenCampaigns && (
            <button
              type="button"
              onClick={onOpenCampaigns}
              className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Tümünü Gör
            </button>
          )}
        </div>
        {heroError ? (
          <InlineError message="Kampanyalar yüklenemedi." onRetry={() => void loadHomeContent()} />
        ) : heroLoading ? (
          <SectionSkeleton lines={1} />
        ) : (
          <HomeHeroCarousel items={heroItems} onOpen={() => onNavigate("menu")} />
        )}
      </div>

      {/* 9. DISCOVERY & EVENTS PREVIEW */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-extrabold tracking-wider text-muted-foreground uppercase">
            Yaklaşan Etkinlikler
          </h2>
          {onOpenEvents && (
            <button
              type="button"
              onClick={onOpenEvents}
              className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Tümünü Gör
            </button>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 tracking-wider">
                Teknoloji & Atölye
              </span>
              <h3 className="text-xs font-bold text-foreground mt-0.5">Gençlik Yapay Zekâ Atölyesi</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <Calendar className="size-3" /> 18 Ekim · 14:00 | Gölbaşı Gençlik Merkezi
              </p>
            </div>
            <span className="rounded-lg bg-amber-400/15 text-amber-700 dark:text-amber-300 px-2 py-0.5 text-[10px] font-black shrink-0">
              +100 GP
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-border/40 pt-2 text-xs">
            <span className="text-[10px] text-muted-foreground font-medium">Sınırlı Kontenjan</span>
            {onOpenEvents && (
              <button
                type="button"
                onClick={onOpenEvents}
                className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>İncele</span>
                <ChevronRight className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 10. DISCOVERY & MISSIONS PREVIEW (AUTHENTICATED ONLY) */}
      {isLoggedIn && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-extrabold tracking-wider text-muted-foreground uppercase">
              Aktif Görev
            </h2>
            {onOpenMissions && (
              <button
                type="button"
                onClick={onOpenMissions}
                className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Tümünü Gör
              </button>
            )}
          </div>

          {missionLoading ? (
            <div className="rounded-2xl border border-border bg-card p-4 text-xs font-medium text-muted-foreground">
              Aktif görev yükleniyor...
            </div>
          ) : featuredMission ? (() => {
            const target = Math.max(1, featuredMission.targetProgress || 1)
            const progress = Math.min(target, Math.max(0, featuredMission.currentProgress || 0))
            const percent = Math.min(100, Math.round((progress / target) * 100))
            return (
              <div
                onClick={onOpenMissions}
                className="cursor-pointer rounded-2xl border border-border bg-card p-3.5 shadow-2xs hover:border-emerald-600/40 transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                    <Award className="size-3" /> {featuredMission.category || "GölBOX"} GÖREVİ
                  </span>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">+{featuredMission.pointsReward || 0} GP</span>
                </div>
                <h3 className="mt-1 text-xs font-bold text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                  {featuredMission.title}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {featuredMission.shortDescription || featuredMission.description}
                </p>
                <div className="mt-2">
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1 font-medium">
                    <span>İlerleme: {progress} / {target} tamamlandı</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">%{percent}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-emerald-600" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              </div>
            )
          })() : (
            <div className="rounded-2xl border border-dashed border-border bg-card p-4 text-xs text-muted-foreground">
              Şu anda aktif görev bulunmuyor. Yeni görevler yayınlandığında burada görünecek.
            </div>
          )}
        </div>
      )}

      {/* ACTIVE ORDER SCREEN PORTAL */}
      {showActiveOrderScreen && createPortal(
        <ActiveOrderScreen
          onClose={() => setShowActiveOrderScreen(false)}
          onNavigateToMenu={() => {
            setShowActiveOrderScreen(false)
            onNavigate("menu")
          }}
        />,
        document.body
      )}

      {showNotifications && (
        <NotificationsSheet
          isLoggedIn={isLoggedIn}
          items={notifications}
          loading={notificationsLoading}
          onClose={() => setShowNotifications(false)}
          onLogin={() => {
            setShowNotifications(false)
            onNavigate("profile")
          }}
          onOpen={() => setShowNotifications(false)}
        />
      )}
    </Screen>
  )
}
