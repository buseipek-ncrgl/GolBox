"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Coffee,
  ShoppingBag,
  QrCode,
  Coins,
  Sparkles,
  ChevronRight,
  GraduationCap,
  RotateCcw,
  Heart,
  Award,
  Zap,
  Flame,
  Utensils,
  MapPin,
  Clock,
  CheckCircle2,
  Bell,
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

export function HomeScreen({
  onNavigate,
  onOpenCafe,
  onOpenCampaigns,
  onOpenEvents,
  onOpenMissions,
  hideHeader = false,
}: {
  onNavigate: (tab: TabId) => void
  onOpenCafe: (id: string) => void
  onOpenCampaigns?: () => void
  onOpenEvents?: () => void
  onOpenMissions?: () => void
  hideHeader?: boolean
}) {
  const { token, user, unreadCount, orders, cafes, favorites, toggleFavorite } = useGolbox()
  const [showActiveOrderScreen, setShowActiveOrderScreen] = useState(false)
  const [heroItems, setHeroItems] = useState<CityContentItem[]>(DEFAULT_HERO_NEWS)
  const [heroError, setHeroError] = useState(false)
  const [heroLoading, setHeroLoading] = useState(true)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<CitizenNotification[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)

  const isLoggedIn = Boolean(token)
  const activeOrders = orders.filter(
    (o) =>
      o.status !== "Completed" &&
      o.status !== "Cancelled" &&
      o.status !== "COMPLETED" &&
      o.status !== "CANCELLED" &&
      o.status !== "NO_SHOW"
  )
  const latestActiveOrder = activeOrders.length > 0 ? activeOrders[0] : null
  const selectedBranch = cafes.length > 0 ? cafes[0] : { name: "Şehitkamil Kitap Kafe", address: "Atatürk Mah. Bulvar No:42" }

  const isOrderReady = latestActiveOrder?.status === "READY" || latestActiveOrder?.status === "Ready"

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

  return (
    <Screen className="space-y-4 pb-36">
      {!hideHeader ? (
        <AppHeader
          firstName={user?.firstName}
          pointsBalance={isLoggedIn ? (user?.pointsBalance ?? 0) : undefined}
          onOpenPoints={() => onNavigate("golpuan")}
          unreadCount={unreadCount}
          onNotifications={() => setShowNotifications(true)}
          onProfile={() => onNavigate("profile")}
          showGreeting={false}
        />
      ) : null}

      {/* 1. AKTİF SİPARİŞ KARTI (TOP PRIORITY WHEN EXISTS - DYNAMIC STATE) */}
      {latestActiveOrder && (
        <div
          onClick={() => (isOrderReady ? onNavigate("qr") : setShowActiveOrderScreen(true))}
          className={`cursor-pointer rounded-2xl border-2 p-4 shadow-sm transition hover:scale-[1.01] ${
            isOrderReady
              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50"
              : "border-blue-500/40 bg-blue-50 dark:bg-blue-950/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                isOrderReady
                  ? "bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 animate-pulse"
                  : "bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100"
              }`}
            >
              <Coffee className="size-3.5" />
              {isOrderReady ? "SİPARİŞİN HAZIR!" : `SİPARİŞ #${latestActiveOrder.collectionCode || "GB1028"}`}
            </span>
            <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
              <Clock className="size-3.5" /> {isOrderReady ? "Teslim Alabilirsiniz" : "Tahmini: ~4-6 dk"}
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-foreground">
                {isOrderReady
                  ? "Kahven Hazır! QR Göster Teslim Al"
                  : latestActiveOrder.status === "Pending" || latestActiveOrder.status === "PENDING"
                  ? "Sipariş Alındı"
                  : "Kahven Hazırlanıyor..."}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {latestActiveOrder.cafeName || selectedBranch.name} · Kasa Kodu: {latestActiveOrder.collectionCode}
              </p>
            </div>
            <button
              className={`flex items-center gap-1 rounded-xl px-3.5 py-1.5 text-xs font-bold text-white shadow transition ${
                isOrderReady ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isOrderReady ? (
                <>
                  <QrCode className="size-4" /> QR'ımı Göster
                </>
              ) : (
                <>
                  Takip Et <ChevronRight className="size-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 2. KARŞILAMA + ŞUBE (UNIFIED CLEAN HEADER) */}
      <div className="flex items-start justify-between pt-1">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            <MapPin className="size-3.5" /> Gaziantep Şehitkamil Belediyesi
          </div>
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-foreground mt-0.5">
            Merhaba {user ? user.firstName : "Değerli Üyemiz"}
          </h1>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">Bugün GölBOX'ta ne içmek istersin?</p>
        </div>
      </div>

      {/* GEL-AL ANA AKSİYON BUTONU */}
      <button
        onClick={() => onNavigate("menu")}
        className="group flex w-full items-center justify-center gap-2.5 rounded-2xl bg-emerald-700 dark:bg-emerald-600 py-4 text-center text-base font-black text-white shadow-lg transition hover:bg-emerald-800 active:scale-[0.99]"
      >
        <ShoppingBag className="size-5 transition group-hover:scale-110" />
        Gel-Al Sipariş Ver
        <ChevronRight className="size-5" />
      </button>

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

      {/* 4. KAMPANYALAR & FIRSATLAR (TOP PRIORITY HERO CAROUSEL) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-foreground">
            <Zap className="size-4 text-amber-500 fill-amber-500" />
            Kampanyalar & Fırsatlar
          </h2>
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            Öne Çıkanlar
          </span>
        </div>
        {heroError ? (
          <InlineError message="Kampanyalar yüklenemedi." onRetry={() => void loadHomeContent()} />
        ) : heroLoading ? (
          <SectionSkeleton lines={1} />
        ) : (
          <HomeHeroCarousel items={heroItems} onOpen={() => onNavigate("menu")} />
        )}
      </div>

      {/* 5. GÖLPUAN ÖZET KARTI & İLERLEME (SECTION 14 & 15) */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-900 to-emerald-950 p-4.5 text-white shadow-md border border-emerald-700/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-full bg-white/15 font-bold text-base border border-white/20">
              {user ? user.firstName.charAt(0) : "A"}
            </div>
            <div>
              <p className="text-[10px] font-semibold text-emerald-200 uppercase tracking-wider">Mevcut GölPuanınız</p>
              <h2 className="text-base font-extrabold text-white">{user ? `${user.firstName} ${user.lastName}` : "Ahmet Yılmaz"}</h2>
            </div>
          </div>
          <div className="text-right">
            <span className="flex items-center justify-end gap-1 text-[9px] font-black text-amber-300 tracking-widest uppercase">
              <Coins className="size-3" /> GÖLPUAN
            </span>
            <p className="text-2.5xl font-black text-amber-400">{user ? user.pointsBalance : 340}</p>
          </div>
        </div>

        <div className="mt-3.5">
          <div className="flex justify-between text-[11px] font-semibold text-emerald-100 mb-1.5">
            <span>{user ? user.pointsBalance : 340} / 1.000 GölPuan</span>
            <span>Bir sonraki ödülüne 660 puan kaldı.</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/30 p-0.5">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500" style={{ width: `${Math.min(100, ((user?.pointsBalance ?? 340) / 1000) * 100)}%` }} />
          </div>
        </div>

        <div className="mt-3 flex justify-end">
          <button
            onClick={() => onNavigate("golpuan")}
            className="flex items-center gap-1 rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/25 active:scale-95 transition"
          >
            Ödülleri Gör <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>

      {/* 6. KASADA QR HIZLI ERİŞİM (SECTION 16) */}
      <div
        onClick={() => onNavigate("qr")}
        className="flex cursor-pointer items-center justify-between rounded-2xl border border-border bg-card p-3.5 shadow-xs transition hover:border-primary/40 hover:bg-accent/40"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
            <QrCode className="size-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-foreground">Kasada QR'ını göster, GölPuan kazan.</h3>
            <p className="text-[11px] text-muted-foreground">Fiziksel kasalarda anında puan yükletmek için tıkla.</p>
          </div>
        </div>
        <ChevronRight className="size-5 text-emerald-600 dark:text-emerald-400" />
      </div>

      {/* 7. HIZLI MENÜ KATEGORİLERİ (SECTION 19) */}
      <div>
        <h2 className="flex items-center gap-1.5 mb-2 text-sm font-extrabold text-foreground">
          <Zap className="size-4 text-emerald-600" /> Hızlı Kategoriler
        </h2>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button onClick={() => onNavigate("menu")} className="flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground hover:bg-accent">
            <Coffee className="size-4 text-emerald-600" /> Sıcak Kahveler
          </button>
          <button onClick={() => onNavigate("menu")} className="flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground hover:bg-accent">
            <Flame className="size-4 text-sky-500" /> Soğuk Kahveler
          </button>
          <button onClick={() => onNavigate("menu")} className="flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground hover:bg-accent">
            <Sparkles className="size-4 text-amber-500" /> Tatlılar
          </button>
          <button onClick={() => onNavigate("menu")} className="flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground hover:bg-accent">
            <Utensils className="size-4 text-orange-500" /> Atıştırmalıklar
          </button>
        </div>
      </div>

      {/* 8. SON SİPARİŞ / TEKRAR SİPARİŞ (SECTION 21) */}
      <div>
        <h2 className="flex items-center gap-1.5 mb-2 text-sm font-extrabold text-foreground">
          <RotateCcw className="size-4 text-emerald-600" />
          Son Sipariş / Tekrar Sipariş
        </h2>
        <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="size-14 overflow-hidden rounded-xl bg-muted shrink-0">
              <img
                src="https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&auto=format&fit=crop&q=60"
                alt="Iced Latte"
                className="size-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-foreground">Iced Vanilla Latte</h3>
              <p className="text-[11px] text-muted-foreground">Büyük Boy · Yulaf Sütü · Ekstra Shot</p>
              <p className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 mt-0.5">70 TL</p>
            </div>
          </div>
          <button onClick={() => onNavigate("menu")} className="flex items-center gap-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3.5 py-2 text-xs font-extrabold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100">
            + Tekrar Al
          </button>
        </div>
      </div>

      {/* 9. FAVORİLERİN (SECTION 20) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-foreground">
            <Heart className="size-4 text-rose-500 fill-rose-500" />
            Favorilerin
          </h2>
          {favorites.length > 0 && (
            <button onClick={() => onNavigate("menu")} className="text-[11px] font-bold text-primary hover:underline">
              Tümünü Gör ({favorites.length})
            </button>
          )}
        </div>

        {favorites.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-xs">
            <Heart className="mx-auto size-9 text-muted-foreground/30" />
            <h3 className="mt-2 text-xs font-extrabold text-foreground">Henüz favori ürünün yok</h3>
            <p className="mt-1 text-[11px] text-muted-foreground">Favori ürünlerini eklediğinde burada hızlı erişim için görebilirsin.</p>
            <button
              onClick={() => onNavigate("menu")}
              className="mt-3.5 inline-flex items-center gap-1 rounded-xl bg-primary px-4 py-2 text-xs font-extrabold text-primary-foreground hover:opacity-90 shadow-sm"
            >
              Menüyü Keşfet <ChevronRight className="size-4" />
            </button>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: "m-1", name: "GölBOX Özel Filtre Kahve", price: 35, imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=60" },
              { id: "m-2", name: "Karamel Macchiato", price: 65, imageUrl: "https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=400&auto=format&fit=crop&q=60" },
              { id: "m-3", name: "Caffè Latte", price: 55, imageUrl: "https://images.unsplash.com/photo-1534778101976-62847782c213?w=400&auto=format&fit=crop&q=60" },
              { id: "m-4", name: "Iced Vanilla Latte", price: 70, imageUrl: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&auto=format&fit=crop&q=60" },
              { id: "m-5", name: "GölBOX Iced Cold Brew", price: 60, imageUrl: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&auto=format&fit=crop&q=60" },
              { id: "m-6", name: "Bergamotlu Siyah Çay", price: 25, imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=60" },
              { id: "m-7", name: "Belçika Çikolatalı Cheesecake", price: 85, imageUrl: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&auto=format&fit=crop&q=60" }
            ].filter(p => favorites.includes(p.id)).map((p) => (
              <div
                key={p.id}
                onClick={() => onNavigate("menu")}
                className="group flex w-40 shrink-0 flex-col justify-between rounded-2xl border border-border bg-card p-2.5 shadow-xs transition hover:border-primary/40 hover:shadow-md cursor-pointer"
              >
                <div className="relative size-full aspect-square overflow-hidden rounded-xl bg-muted mb-2">
                  <img src={p.imageUrl} alt={p.name} className="size-full object-cover group-hover:scale-105 transition" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(p.id)
                    }}
                    className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-xs hover:scale-110 transition"
                  >
                    <Heart className="size-4 fill-rose-500 text-rose-500" />
                  </button>
                </div>
                <div>
                  <h3 className="truncate text-xs font-black text-foreground">{p.name}</h3>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs font-black text-primary">₺{p.price}</span>
                    <span className="rounded-lg bg-primary/10 p-1 text-primary">
                      <ChevronRight className="size-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 10. HAFTALIK GÖL GÖREV & GENÇ FIRSATLAR (SECTION 25 & 26) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-foreground">
            <Award className="size-4 text-blue-600" />
            Haftalık GölGörev
          </h2>
          {onOpenMissions && (
            <button onClick={onOpenMissions} className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5">
              <span>Tüm Görevler</span>
              <ChevronRight className="size-3.5" />
            </button>
          )}
        </div>
        <div
          onClick={onOpenMissions}
          className="cursor-pointer rounded-2xl border border-border bg-card p-4 shadow-xs hover:border-primary/40 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              <Award className="size-3" /> HAFTALIK GÖREV
            </span>
            <span className="text-xs font-black text-amber-600 dark:text-amber-400">+150 GP</span>
          </div>
          <h3 className="mt-1.5 text-xs font-bold text-foreground group-hover:text-primary transition-colors">Bu Hafta 3 Kahve Al</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">GölBOX Kitap Kafelerden 3 adet kahve siparişi ver, 150 GölPuan kazan.</p>
          <div className="mt-2.5">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1 font-semibold">
              <span>İlerleme: 2 / 3 tamamlandı</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">%66</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: "66%" }} />
            </div>
          </div>
          <div className="mt-3 flex justify-end border-t border-border/40 pt-2">
            <span className="text-xs font-black text-primary flex items-center gap-1">
              <span>Görevi Gör</span>
              <ChevronRight className="size-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* 11. REGISTERED UPCOMING EVENT BANNER (PRD SECTION 5) */}
      <div className="rounded-2xl border border-amber-400/40 bg-gradient-to-br from-slate-900 to-slate-950 p-4 text-white shadow-md space-y-2">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 text-amber-950 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
            Yarın Etkinliğin Var 👋
          </span>
          <span className="text-[10px] font-bold text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-md">
            Kayıtlısın ✓
          </span>
        </div>

        <div>
          <h3 className="text-sm font-black text-white">Gençlik Teknoloji ve Yapay Zekâ Atölyesi</h3>
          <p className="text-[11px] text-slate-300 mt-0.5">18 Ekim 2026 · 14:00 – Gölbaşı Gençlik Merkezi</p>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-slate-800">
          <span className="text-[11px] font-bold text-amber-400">+100 GölPuan Katılım Ödülü</span>
          {onOpenEvents && (
            <button
              onClick={onOpenEvents}
              className="flex items-center gap-1 rounded-xl bg-amber-400 px-3 py-1.5 text-xs font-black text-amber-950 shadow-2xs hover:bg-amber-300 transition active:scale-95"
            >
              <span>Etkinliği Gör</span>
              <ChevronRight className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 12. ETKİNLİKLER SECTION (PRD SECTION 4, 72-74) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-foreground">
            <Calendar className="size-4 text-primary" /> Şehirde Etkinlikler & Atölyeler
          </h2>
          {onOpenEvents && (
            <button onClick={onOpenEvents} className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5">
              <span>Tümünü Gör</span>
              <ChevronRight className="size-3.5" />
            </button>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-primary tracking-wider">Teknoloji & Eğitim</span>
              <h3 className="text-xs font-black text-foreground mt-0.5">Gençlik Teknoloji ve Yapay Zekâ Atölyesi</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">18 Ekim · 14:00 | Gölbaşı Gençlik Merkezi</p>
            </div>
            <span className="rounded-xl bg-amber-400/20 border border-amber-400/30 text-amber-700 dark:text-amber-300 px-2 py-1 text-[10px] font-black shrink-0">
              +100 GP
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-border/40 pt-2 text-xs">
            <span className="text-[10px] text-muted-foreground font-semibold">12 kişilik kontenjan kaldı</span>
            {onOpenEvents && (
              <button
                onClick={onOpenEvents}
                className="font-bold text-primary hover:underline flex items-center gap-1"
              >
                <span>İncele & Kayıt Ol</span>
                <ChevronRight className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 11. SEÇİLİ ŞUBE KARTI (SECTION 12) */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
        <h2 className="flex items-center gap-1.5 text-xs font-extrabold text-foreground">
          <MapPin className="size-4 text-emerald-600" /> Teslim Alınacak GölBOX Şubesi
        </h2>
        <p className="mt-1 text-sm font-black text-emerald-700 dark:text-emerald-400">{selectedBranch.name}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{selectedBranch.address}</p>
        <div className="mt-2.5 flex gap-2">
          <span className="flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
            <Clock className="size-3" /> Açık · 07:30 - 23:00
          </span>
          <span className="flex items-center gap-1 rounded-md bg-emerald-100 dark:bg-emerald-950 px-2.5 py-1 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="size-3" /> Gel-Al Aktif
          </span>
        </div>
      </div>

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
