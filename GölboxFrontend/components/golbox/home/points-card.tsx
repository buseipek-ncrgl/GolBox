"use client"

import { GPValue } from "@/components/golbox/gp-value"
import type { Reward } from "@/lib/golbox-context"
import { nextCatalogReward } from "@/lib/home-priority"

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
    return (
      <section aria-label="GölPuan">
        <article className="rounded-[var(--gol-radius-xl)] bg-[color:var(--color-brand-900)] px-5 py-5 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">GölPuan</p>
          <h2 className="mt-2 font-serif text-[1.7rem] leading-tight">GölPuan kazanmaya başla</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/80">
            Şehitkamil+ hesabınla GölPuan kazan, kuponlarını kullan, sana özel fırsatları gör.
          </p>
          <button
            type="button"
            onClick={onLogin}
            className="mt-4 min-h-11 rounded-[14px] bg-white px-4 text-sm font-semibold text-[color:var(--color-brand-900)]"
          >
            Giriş yap
          </button>
        </article>
      </section>
    )
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
      <article className="rounded-[var(--gol-radius-xl)] bg-[color:var(--color-brand-900)] px-5 py-5 text-white">
        <button type="button" onClick={onOpenCatalog} className="block w-full text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">GölPuan</p>
          <p className="mt-2 font-serif text-[2.4rem] leading-none">
            <GPValue amount={points} />
          </p>
          <p className="mt-3 text-sm leading-relaxed text-white/85">{copy}</p>
          {next ? (
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-white/80 transition-[width] duration-700"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          ) : null}
        </button>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onEarn}
            className="min-h-11 rounded-[14px] bg-white/10 text-sm font-semibold text-white"
          >
            Puan kazan
          </button>
          <button
            type="button"
            onClick={onOpenCatalog}
            className="min-h-11 rounded-[14px] bg-white text-sm font-semibold text-[color:var(--color-brand-900)]"
          >
            Kataloğu aç
          </button>
        </div>
      </article>
    </section>
  )
}
