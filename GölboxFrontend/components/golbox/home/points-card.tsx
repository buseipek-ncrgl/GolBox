"use client"

import { GPValue } from "@/components/golbox/gp-value"
import type { Reward } from "@/lib/golbox-context"
import { nextCatalogReward } from "@/lib/home-priority"

export function GuestPointsCard({ onLogin }: { onLogin: () => void }) {
  return (
    <section aria-label="GölPuan">
      <article className="rounded-[18px] bg-[color:var(--color-brand-900)] px-4 py-3.5 text-white">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">GölPuan</p>
        <h2 className="mt-1 line-clamp-2 text-[15px] font-semibold leading-snug">GölPuan kazanmaya başla</h2>
        <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-white/80">
          Şehitkamil+ hesabınla puan kazan, kuponlarını kullan.
        </p>
        <button
          type="button"
          onClick={onLogin}
          className="mt-3 inline-flex min-h-11 items-center rounded-[14px] bg-white px-4 text-sm font-semibold text-[color:var(--color-brand-900)]"
        >
          Giriş yap
        </button>
      </article>
    </section>
  )
}

export function PointsCard({
  isLoggedIn,
  points,
  rewards,
  onOpenCatalog,
  onEarn,
  onLogin,
}: {
  isLoggedIn: boolean
  points: number
  rewards: Reward[]
  onOpenCatalog: () => void
  onEarn: () => void
  onLogin: () => void
}) {
  if (!isLoggedIn) {
    return <GuestPointsCard onLogin={onLogin} />
  }

  const next = nextCatalogReward(points, rewards)
  const remaining = next ? Math.max(0, next.requiredPoints - points) : 0
  const progress = next ? Math.max(0, Math.min(1, points / next.requiredPoints)) : 0
  const copy = next
    ? remaining === 0
      ? `${next.title} alabilirsin.`
      : `${remaining} GP daha kazan, ${next.title} al.`
    : "Katalog ödülleri GölPuan ile alınır."

  return (
    <section aria-label="GölPuan bakiyen">
      <article className="rounded-[18px] bg-[color:var(--color-brand-900)] px-4 py-4 text-white">
        <button type="button" onClick={onOpenCatalog} className="block w-full text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">GölPuan</p>
          <p className="mt-1.5 font-serif text-[2rem] leading-none">
            <GPValue amount={points} />
          </p>
          <p className="mt-2 line-clamp-2 text-[13px] leading-snug text-white/85">{copy}</p>
          {next ? (
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-white/80 transition-[width] duration-700"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          ) : null}
        </button>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onEarn}
            className="min-h-11 flex-1 rounded-[14px] border border-white/20 text-sm font-semibold text-white"
          >
            Puan kazan
          </button>
          <button
            type="button"
            onClick={onOpenCatalog}
            className="min-h-11 flex-1 rounded-[14px] bg-white text-sm font-semibold text-[color:var(--color-brand-900)]"
          >
            Kataloğu aç
          </button>
        </div>
      </article>
    </section>
  )
}
