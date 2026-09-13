"use client"

import { CityImage } from "@/components/golbox/city-image"
import { OverlaySheet } from "@/components/golbox/overlay-sheet"
import { EmptyState } from "@/components/golbox/empty-state"
import type { CityContentItem } from "@/lib/city-content"

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
  onClose,
  onLogin,
}: {
  isLoggedIn: boolean
  onClose: () => void
  onLogin: () => void
}) {
  return (
    <OverlaySheet title="Bildirimler" onClose={onClose}>
      <EmptyState
        title={isLoggedIn ? "Henüz bildirimin yok." : "Bildirimler hesabına bağlı."}
        description={
          isLoggedIn
            ? "Belediye duyuruları ve kişisel hatırlatmalar burada görünecek."
            : "Giriş yapınca kişisel bildirimlerin bu listede durur."
        }
        action={
          !isLoggedIn ? (
            <button
              type="button"
              onClick={onLogin}
              className="min-h-11 rounded-[14px] bg-primary px-5 text-sm font-semibold text-primary-foreground"
            >
              Giriş yap
            </button>
          ) : null
        }
      />
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
