"use client"

import { useEffect, useState } from "react"
import { CityImage } from "@/components/golbox/city-image"
import { OverlaySheet } from "@/components/golbox/overlay-sheet"
import { EmptyState } from "@/components/golbox/empty-state"
import { GPValue } from "@/components/golbox/gp-value"
import { LoginRequiredSheet } from "@/components/golbox/login-required-sheet"
import { useGolToast } from "@/components/golbox/gol-toast"
import type { CityContentItem } from "@/lib/city-content"
import {
  fetchPublicActivity,
  joinPublicActivity,
  type CitizenNotification,
  type PublicActivity,
} from "@/lib/city-content-api"
import { useGolbox } from "@/lib/golbox-context"

export function MayorMessageSheet({
  item,
  onClose,
}: {
  item: CityContentItem
  onClose: () => void
}) {
  return (
    <OverlaySheet title="Başkan’dan" onClose={onClose}>
      <div className="h-40 overflow-hidden rounded-[var(--gol-radius-lg)] bg-[color:var(--color-brand-900)]">
        <CityImage
          src={item.imageUrl}
          alt=""
          focus={item.imageFocus ?? "center 22%"}
          className="h-full w-full opacity-90"
        />
      </div>
      <p className="mt-4 font-serif text-2xl leading-snug text-foreground">{item.title}</p>
      <p className="mt-2 text-sm font-semibold text-foreground">{item.personName}</p>
      <p className="text-sm text-muted-foreground">{item.personTitle}</p>
      {item.body
        ?.split("\n")
        .filter(Boolean)
        .map((paragraph) => (
          <p key={paragraph} className="mt-4 text-[15px] leading-relaxed text-foreground">
            {paragraph}
          </p>
        ))}
    </OverlaySheet>
  )
}

export function AgendaDetailSheet({
  item,
  onClose,
}: {
  item: CityContentItem
  onClose: () => void
}) {
  return (
    <OverlaySheet title={item.categoryLabel} onClose={onClose}>
      <div className="h-40 overflow-hidden rounded-[var(--gol-radius-lg)] bg-[color:var(--color-brand-900)]">
        <CityImage
          src={item.imageUrl}
          alt=""
          focus={item.imageFocus ?? "center"}
          className="h-full w-full"
        />
      </div>
      <h3 className="mt-4 font-serif text-2xl leading-snug text-foreground">{item.title}</h3>
      {item.meta ? <p className="mt-1 text-sm text-muted-foreground">{item.meta}</p> : null}
      <p className="mt-3 text-[15px] leading-relaxed text-foreground">{item.body || item.subtitle}</p>
    </OverlaySheet>
  )
}

export function AgendaListSheet({
  items,
  onClose,
  onOpen,
}: {
  items: CityContentItem[]
  onClose: () => void
  onOpen: (item: CityContentItem) => void
}) {
  return (
    <OverlaySheet title="Şehitkamil’de gündem" onClose={onClose}>
      {items.length === 0 ? (
        <EmptyState title="Şu an yayımlanan gündem yok." />
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onOpen(item)}
                className="gol-card flex w-full gap-3 p-3 text-left"
              >
                <CityImage
                  src={item.imageUrl}
                  alt=""
                  focus={item.imageFocus ?? "center"}
                  className="size-14 shrink-0 rounded-[12px]"
                />
                <span className="min-w-0">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {item.categoryLabel}
                  </span>
                  <span className="mt-0.5 block text-sm font-semibold text-foreground">{item.title}</span>
                  {item.meta ? <span className="text-[12px] text-muted-foreground">{item.meta}</span> : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </OverlaySheet>
  )
}

import {
  Bell,
  Coffee,
  Calendar,
  Award,
  Coins,
  Sparkles,
  Zap,
  CheckCircle2,
  ChevronRight,
  Clock,
  Info,
  CheckCheck,
  Check
} from "lucide-react"

export const DEFAULT_NOTIFICATIONS: CitizenNotification[] = [
  {
    id: "not-1",
    title: "Siparişin Hazır!",
    body: "GölBOX Üniversite Şubesi'ne gelerek siparişini teslim alabilirsin. Ödemeni kasada QR ile yapacaksın.",
    type: "ORDER_READY",
    category: "TRANSACTIONAL",
    priority: "HIGH",
    entityType: "ORDER",
    entityId: "GB-1042",
    isRead: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "not-2",
    title: "Yarın Görüşüyoruz",
    body: "Gençlik Teknoloji ve Yapay Zekâ Atölyesi yarın 14:00'te Gölbaşı Gençlik Merkezi'nde başlıyor.",
    type: "EVENT_REMINDER",
    category: "PERSONAL",
    priority: "HIGH",
    entityType: "EVENT",
    entityId: "act-1",
    isRead: false,
    createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    id: "not-3",
    title: "Görevi Tamamladın!",
    body: "GölBOX Kaşifi görevini tamamladın. +100 GölPuan hesabına aktarıldı.",
    type: "MISSION_COMPLETED",
    category: "PERSONAL",
    priority: "NORMAL",
    entityType: "MISSION",
    entityId: "ms-2",
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: "not-4",
    title: "+24 GölPuan Kazandın",
    body: "Son siparişiniz başarıyla tamamlandı. Yeni bakiyeniz 340 GölPuan.",
    type: "LOYALTY_REWARD",
    category: "PERSONAL",
    priority: "NORMAL",
    entityType: "REWARD",
    entityId: "gp-102",
    isRead: true,
    createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
  },
  {
    id: "not-5",
    title: "Haftanın GölPuan Fırsatları",
    body: "Bu hafta seçili soğuk kahvelerde 2 kat GölPuan kazanma fırsatını kaçırmayın!",
    type: "CAMPAIGN_ANNOUNCEMENT",
    category: "MARKETING",
    priority: "LOW",
    entityType: "CAMPAIGN",
    entityId: "cmp-1",
    isRead: true,
    createdAt: new Date(Date.now() - 72 * 3600000).toISOString(),
  }
]

export function NotificationsSheet({
  isLoggedIn,
  items: rawItems,
  loading,
  onClose,
  onLogin,
  onOpen,
  onMarkRead,
  onMarkAllRead,
}: {
  isLoggedIn: boolean
  items: CitizenNotification[]
  loading?: boolean
  onClose: () => void
  onLogin: () => void
  onOpen: (item: CitizenNotification) => void
  onMarkRead?: (item: CitizenNotification) => void
  onMarkAllRead?: () => void
}) {
  const [filterCategory, setFilterCategory] = useState<"ALL" | "ORDER" | "EVENT" | "MISSION" | "REWARD">("ALL")
  const [notificationsList, setNotificationsList] = useState<CitizenNotification[]>([])

  useEffect(() => {
    setNotificationsList(rawItems)
  }, [rawItems])

  const filteredItems = notificationsList.filter((item) => {
    if (filterCategory === "ALL") return true
    if (filterCategory === "ORDER") return item.entityType === "ORDER" || item.type.startsWith("ORDER_")
    if (filterCategory === "EVENT") return item.entityType === "EVENT" || item.type.startsWith("EVENT_")
    if (filterCategory === "MISSION") return item.entityType === "MISSION" || item.type.startsWith("MISSION_")
    if (filterCategory === "REWARD") return item.entityType === "REWARD" || item.type.startsWith("LOYALTY_")
    return true
  })

  // Date grouping (Bugün, Dün, Daha Önce - PRD Section 65)
  const now = new Date()
  const todayItems: CitizenNotification[] = []
  const yesterdayItems: CitizenNotification[] = []
  const olderItems: CitizenNotification[] = []

  filteredItems.forEach((item) => {
    const d = new Date(item.createdAt)
    const diffHours = (now.getTime() - d.getTime()) / (1000 * 3600)
    if (diffHours < 24) {
      todayItems.push(item)
    } else if (diffHours < 48) {
      yesterdayItems.push(item)
    } else {
      olderItems.push(item)
    }
  })

  const handleMarkAllRead = () => {
    setNotificationsList((prev) => prev.map((n) => ({ ...n, isRead: true })))
    if (onMarkAllRead) onMarkAllRead()
  }

  const handleMarkRead = (item: CitizenNotification) => {
    setNotificationsList((prev) =>
      prev.map((notification) =>
        notification.id === item.id ? { ...notification, isRead: true } : notification
      )
    )
    onMarkRead?.(item)
  }

  const renderNotificationCard = (item: CitizenNotification) => {
    let icon = <Bell className="size-4 text-primary" />
    let iconBg = "bg-primary/10 border border-primary/20 text-primary"

    if (item.entityType === "ORDER" || item.type.startsWith("ORDER_")) {
      icon = <Coffee className="size-4 text-primary" />
      iconBg = "bg-primary/10 border border-primary/20 text-primary"
    } else if (item.entityType === "EVENT" || item.type.startsWith("EVENT_")) {
      icon = <Calendar className="size-4 text-primary" />
      iconBg = "bg-primary/10 border border-primary/20 text-primary"
    } else if (item.entityType === "MISSION" || item.type.startsWith("MISSION_")) {
      icon = <Award className="size-4 text-primary" />
      iconBg = "bg-primary/10 border border-primary/20 text-primary"
    } else if (item.entityType === "REWARD" || item.type.startsWith("LOYALTY_")) {
      icon = <Coins className="size-4 text-[color:var(--color-gold)]" />
      iconBg = "bg-[color:var(--color-gold)]/10 border border-[color:var(--color-gold)]/20 text-[color:var(--color-gold)]"
    } else if (item.entityType === "CAMPAIGN" || item.type.startsWith("CAMPAIGN_")) {
      icon = <Zap className="size-4 text-primary" />
      iconBg = "bg-primary/10 border border-primary/20 text-primary"
    }

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          onOpen(item)
        }}
        className={`group flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition ${
          item.isRead
            ? "border-border/60 bg-card/60 opacity-80"
            : "border-primary/40 bg-card shadow-2xs"
        }`}
      >
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${iconBg} mt-0.5`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="truncate text-xs font-bold text-foreground group-hover:text-primary transition-colors">
              {item.title}
            </h4>
            {!item.isRead ? (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation()
                  handleMarkRead(item)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation()
                    handleMarkRead(item)
                  }
                }}
                className="flex items-center gap-1 rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary hover:bg-primary/20 transition cursor-pointer"
                title="Okundu olarak işaretle"
              >
                <Check className="size-3" /> Okunmadı
              </span>
            ) : (
              <span className="text-[10px] font-medium text-muted-foreground/60">Okundu ✓</span>
            )}
          </div>
          <p className="line-clamp-2 text-xs text-muted-foreground font-medium leading-relaxed">
            {item.body}
          </p>
          <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground font-semibold">
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {new Date(item.createdAt).toLocaleString("tr-TR", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span className="flex items-center gap-0.5 text-primary font-black group-hover:translate-x-0.5 transition-transform">
              <span>İncele</span>
              <ChevronRight className="size-3" />
            </span>
          </div>
        </div>
      </button>
    )
  }

  return (
    <OverlaySheet title="Bildirim Merkezi" onClose={onClose}>
      {isLoggedIn && (
        <div className="space-y-3 mb-2">
          {/* TOP ACTION HEADER */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground">
              {notificationsList.filter((n) => !n.isRead).length} okunmamış bildirim
            </span>
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 text-xs font-black text-primary hover:underline"
            >
              <CheckCheck className="size-3.5" />
              Tümünü Okundu İşaretle
            </button>
          </div>

          {/* CATEGORY FILTER PILLS (PRD SECTION 135) */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: "ALL", label: "Tümü" },
              { id: "ORDER", label: "Siparişler" },
              { id: "EVENT", label: "Etkinlikler" },
              { id: "MISSION", label: "Görevler" },
              { id: "REWARD", label: "GölPuan" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFilterCategory(cat.id as any)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-black transition ${
                  filterCategory === cat.id
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "bg-accent text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {!isLoggedIn ? (
        <EmptyState
          title="Bildirimler hesabına bağlı."
          description="Giriş yapınca kişisel sipariş, etkinlik ve GölPuan bildirimlerin bu listede durur."
          action={
            <button
              type="button"
              onClick={onLogin}
              className="min-h-11 rounded-[14px] bg-primary px-5 text-sm font-bold text-primary-foreground shadow-md"
            >
              Giriş yap
            </button>
          }
        />
      ) : loading ? (
        <div className="space-y-3 py-4 text-center">
          <div className="mx-auto size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs font-semibold text-muted-foreground">Bildirimler yükleniyor…</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState title="Seçilen filtrede henüz bildirim yok." description="Sipariş ve etkinlik durumların burada görünecek." />
      ) : (
        <div className="space-y-4 pt-1">
          {todayItems.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground px-1">
                Bugün
              </h3>
              <div className="space-y-2">{todayItems.map(renderNotificationCard)}</div>
            </div>
          )}

          {yesterdayItems.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground px-1">
                Dün
              </h3>
              <div className="space-y-2">{yesterdayItems.map(renderNotificationCard)}</div>
            </div>
          )}

          {olderItems.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground px-1">
                Daha Önce
              </h3>
              <div className="space-y-2">{olderItems.map(renderNotificationCard)}</div>
            </div>
          )}
        </div>
      )}
    </OverlaySheet>
  )
}

export function ActivityDetailSheet({
  activity,
  isLoggedIn,
  busy,
  onClose,
  onJoin,
  onLogin,
  onOpenPlace,
}: {
  activity: PublicActivity | null
  isLoggedIn: boolean
  busy?: boolean
  onClose: () => void
  onJoin: () => void
  onLogin: () => void
  onOpenPlace?: (id: string) => void
}) {
  if (!activity) {
    return (
      <OverlaySheet title="Etkinlik" onClose={onClose}>
        <EmptyState title="Yayınlanmış etkinlik bulunmuyor." />
      </OverlaySheet>
    )
  }

  const start = new Date(activity.startDate)
  const end = new Date(activity.endDate)
  const when = `${start.toLocaleString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })} – ${end.toLocaleString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`
  const remaining =
    activity.capacity != null ? Math.max(0, activity.capacity - activity.joinedCount) : null

  return (
    <OverlaySheet title="Etkinlik" onClose={onClose}>
      <div className="h-40 overflow-hidden rounded-[var(--gol-radius-lg)] bg-[color:var(--color-brand-900)]">
        <CityImage src={activity.imageUrl} alt="" focus="center" className="h-full w-full" />
      </div>
      <h3 className="mt-4 font-serif text-2xl leading-snug text-foreground">{activity.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{when}</p>
      {activity.location && !activity.placeName ? <p className="mt-1 text-sm text-muted-foreground">{activity.location}</p> : null}
      {activity.placeName ? (
        <div className="gol-card mt-4 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Mekan</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{activity.placeName}</p>
          {activity.placeAddress ? <p className="mt-0.5 text-[13px] text-muted-foreground">{activity.placeAddress}</p> : null}
          {activity.placeId && onOpenPlace ? (
            <button
              type="button"
              onClick={() => onOpenPlace(activity.placeId!)}
              className="mt-2 min-h-11 text-sm font-semibold text-primary"
            >
              Tesisi gör
            </button>
          ) : null}
        </div>
      ) : null}
      <p className="mt-3 text-[15px] leading-relaxed text-foreground">{activity.description}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-[12px] font-semibold text-muted-foreground">
        {remaining != null ? <span>Kalan kontenjan: {remaining}</span> : null}
        {activity.rewardPoints > 0 ? (
          <span>
            Kazanım: <GPValue amount={activity.rewardPoints} signed className="text-[12px]" />
          </span>
        ) : null}
      </div>
      {activity.isJoined ? (
        <p className="mt-5 min-h-11 text-sm font-semibold text-primary">Katıldın</p>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={isLoggedIn ? onJoin : onLogin}
          className="mt-5 min-h-11 w-full rounded-[14px] bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {isLoggedIn ? "Katıl" : "Katılmak için giriş yap"}
        </button>
      )}
    </OverlaySheet>
  )
}

export function EarnInfoSheet({
  onClose,
  onQr,
  onMap,
}: {
  onClose: () => void
  onQr: () => void
  onMap: () => void
}) {
  return (
    <OverlaySheet title="GölPuan nasıl kazanılır?" onClose={onClose}>
      <p className="text-sm leading-relaxed text-muted-foreground">
        GölPuan sadakat puanıdır. Katalog kuponları ve Ismarlıyor ikramları ayrı hak türleridir.
      </p>
      <ul className="mt-5 space-y-3">
        <li className="gol-card p-4">
          <p className="text-sm font-semibold text-foreground">Göl Kafe ziyareti</p>
          <p className="mt-1 text-sm text-muted-foreground">Kasada QR okutulunca ziyaret puanı işlenir.</p>
          <button type="button" onClick={onQr} className="mt-2 min-h-11 text-sm font-semibold text-primary">
            QR’ı aç
          </button>
        </li>
        <li className="gol-card p-4">
          <p className="text-sm font-semibold text-foreground">GölBox</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Haritadaki saha kutusunu yarıçap içinde al. Bu bir katalog kuponu değildir.
          </p>
          <button type="button" onClick={onMap} className="mt-2 min-h-11 text-sm font-semibold text-primary">
            Haritayı aç
          </button>
        </li>
      </ul>
    </OverlaySheet>
  )
}

export function ActivityOverlay({
  activityId,
  onClose,
  onOpenPlace,
}: {
  activityId: string
  onClose: () => void
  onOpenPlace?: (id: string) => void
}) {
  const { token, refreshData } = useGolbox()
  const notify = useGolToast()
  const [activity, setActivity] = useState<PublicActivity | null>(null)
  const [busy, setBusy] = useState(false)
  const [showLogin, setShowLogin] = useState(false)

  useEffect(() => {
    let cancelled = false
    setActivity(null)
    void fetchPublicActivity(activityId, token)
      .then((item) => {
        if (!cancelled) setActivity(item)
      })
      .catch(() => {
        if (!cancelled) setActivity(null)
      })
    return () => {
      cancelled = true
    }
  }, [activityId, token])

  const handleJoin = async () => {
    if (!token || !activity) {
      setShowLogin(true)
      return
    }
    setBusy(true)
    try {
      await joinPublicActivity(activity.id, token)
      notify("Etkinliğe başarıyla katıldınız.")
      setActivity(await fetchPublicActivity(activity.id, token))
      await refreshData()
    } catch (err: any) {
      const msg = err?.message || ""
      if (msg.includes("already") || msg.includes("zaten")) {
        notify("Bu etkinliğe zaten katıldınız.")
      } else if (msg.includes("capacity") || msg.includes("kontenjan")) {
        notify("Etkinlik kontenjanı dolmuştur.")
      } else if (msg.includes("ended") || msg.includes("son erdi")) {
        notify("Etkinlik süresi dolmuştur.")
      } else {
        notify(msg || "Etkinliğe katılım sağlanamadı.")
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <ActivityDetailSheet
        activity={activity}
        isLoggedIn={Boolean(token)}
        busy={busy}
        onClose={onClose}
        onJoin={() => void handleJoin()}
        onLogin={() => setShowLogin(true)}
        onOpenPlace={onOpenPlace}
      />
      {showLogin && !token ? (
        <LoginRequiredSheet onClose={() => setShowLogin(false)} closeLabel="Etkinliğe dön" />
      ) : null}
    </>
  )
}
