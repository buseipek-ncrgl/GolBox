"use client"

import { GPValue } from "@/components/golbox/gp-value"
import type { Reward } from "@/lib/golbox-context"
import { nextCatalogReward } from "@/lib/home-priority"

export function GuestPointsCard({ onLogin }: { onLogin: () => void }) {
  return (
    <section aria-label="GölPuan">
      <article className="rounded-[18px] border border-border bg-card px-4 py-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">GölPuan</p>
        <h2 className="mt-1 text-[15px] font-semibold leading-snug text-foreground">GölPuan kazanmaya başla</h2>
        <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-muted-foreground">
          Şehitkamil+ hesabınla puan kazan, kuponlarını kullan.
        </p>
        <button type="button" onClick={onLogin} className="mt-2 min-h-11 text-sm font-semibold text-primary">
          Giriş yap →
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

  return (
    <section aria-label="GölPuan bakiyen">
      <article className="rounded-[18px] border border-border bg-card px-4 py-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">GölPuan</p>
        <p className="mt-1.5 font-serif text-[1.75rem] leading-none">
          <GPValue amount={points} />
        </p>
        {next ? (
          <div className="mt-2 space-y-0.5">
            <p className="text-[13px] leading-snug text-muted-foreground">
              {remaining === 0 ? `${next.title} alabilirsin` : `${remaining} GP daha kazan`}
            </p>
            {remaining > 0 ? (
              <p className="text-[13px] leading-snug text-muted-foreground">{next.title} al</p>
            ) : null}
            <div className="mt-2 h-0.5 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-primary/70 transition-[width] duration-700"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="mt-2 text-[13px] leading-snug text-muted-foreground">Katalog ödülleri GölPuan ile alınır.</p>
        )}
        <div className="mt-1 flex items-center gap-4">
          <button type="button" onClick={onOpenCatalog} className="min-h-11 text-sm font-semibold text-primary">
            Kataloğu aç →
          </button>
          <button type="button" onClick={onEarn} className="min-h-11 text-sm font-medium text-muted-foreground">
            Kazan
          </button>
        </div>
      </article>
    </section>
  )
}
