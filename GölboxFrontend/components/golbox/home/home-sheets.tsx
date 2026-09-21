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

export function NotificationsSheet({
  isLoggedIn,
  items,
  loading,
  onClose,
  onLogin,
  onOpen,
  onMarkAllRead,
}: {
  isLoggedIn: boolean
  items: CitizenNotification[]
  loading?: boolean
  onClose: () => void
  onLogin: () => void
  onOpen: (item: CitizenNotification) => void
  onMarkAllRead?: () => void
}) {
  return (
    <OverlaySheet title="Bildirimler" onClose={onClose}>
      {isLoggedIn && items.length > 0 && onMarkAllRead ? (
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={onMarkAllRead}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Tümünü okundu işaretle
          </button>
        </div>
      ) : null}
      {!isLoggedIn ? (
        <EmptyState
          title="Bildirimler hesabına bağlı."
          description="Giriş yapınca kişisel bildirimlerin bu listede durur."
          action={
            <button
              type="button"
              onClick={onLogin}
              className="min-h-11 rounded-[14px] bg-primary px-5 text-sm font-semibold text-primary-foreground"
            >
              Giriş yap
            </button>
          }
        />
      ) : loading ? (
        <p className="text-sm text-muted-foreground">Bildirimler yükleniyor…</p>
      ) : items.length === 0 ? (
        <EmptyState title="Yeni bildirimin yok." />
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onOpen(item)}
                className="gol-card flex w-full gap-3 p-3 text-left"
              >
                <span
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${item.isRead ? "bg-transparent" : "bg-[color:var(--color-danger)]"}`}
                  aria-hidden
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">{item.title}</span>
                  <span className="mt-0.5 line-clamp-2 text-[13px] text-muted-foreground">{item.body}</span>
                  <span className="mt-1 block text-[12px] text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
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
        GölPuan sadakat puanıdır. Katalog kuponu, saha hediyesi ve Ismarlıyor ikramı ayrı kanallardır.
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
