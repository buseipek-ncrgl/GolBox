"use client"

import { ArrowRight, Coins, Sparkles } from "lucide-react"
import { GPValue } from "@/components/golbox/gp-value"
import type { Reward } from "@/lib/golbox-context"
import { nextCatalogReward } from "@/lib/home-priority"

export function GuestPointsCard({ onLogin }: { onLogin: () => void }) {
  return (
    <section aria-label="GölPuan">
      <article className="relative overflow-hidden rounded-[20px] border border-border/70 bg-gradient-to-br from-card via-card to-secondary/30 p-4 shadow-sm transition-all hover:border-primary/20">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/80 px-2.5 py-1 text-[11px] font-semibold tracking-wider text-primary uppercase">
              <Coins className="size-3.5" strokeWidth={2} />
              GölPuan
            </span>
            <h2 className="mt-2.5 text-base font-semibold tracking-tight text-foreground">GölPuan kazanmaya başla</h2>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              Şehitkamil dijital hesabınla etkinliklerden puan kazan, ödül kuponlarını hemen kullan.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogin}
          className="mt-3.5 inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/95 active:scale-[0.98]"
        >
          <span>Giriş yap</span>
          <ArrowRight className="size-3.5" />
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
      <article className="relative overflow-hidden rounded-[22px] border border-border/60 bg-gradient-to-br from-[color:var(--color-brand-900)] to-[color:var(--color-brand-700)] p-4 text-white shadow-md">
        {/* Decorative subtle background elements */}
        <div aria-hidden className="pointer-events-none absolute -right-8 -top-8 size-36 rounded-full bg-accent/15 blur-2xl" />
        
        <div className="relative flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold tracking-wider text-white/90 uppercase backdrop-blur-md">
            <Coins className="size-3.5 text-[color:var(--color-gold)]" strokeWidth={2} />
            GölPuan Bakiyen
          </span>
          <span className="text-[11px] font-medium text-white/70">Şehitkamil</span>
        </div>

        <div className="relative mt-3.5 flex items-baseline gap-2">
          <span className="font-serif text-3xl font-bold tracking-tight text-white">
            <GPValue amount={points} />
          </span>
        </div>

        {next ? (
          <div className="relative mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-white/80">
              <span className="truncate font-medium">
                {remaining === 0 ? `${next.title} almaya hazır!` : `${next.title} için ${remaining} GP kaldı`}
              </span>
              <span className="shrink-0 text-[11px] font-semibold text-[color:var(--color-gold)]">
                %{Math.round(progress * 100)}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[color:var(--color-gold)] to-amber-300 transition-all duration-700 shadow-sm"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="relative mt-2 text-xs text-white/70">Katalog ödüllerini GölPuan ile hemen alabilirsiniz.</p>
        )}

        <div className="relative mt-4 flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={onOpenCatalog}
            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-white px-3.5 py-1.5 text-xs font-semibold text-[color:var(--color-brand-900)] shadow-sm transition-all hover:bg-white/95 active:scale-[0.98]"
          >
            <span>Kataloğu aç</span>
            <ArrowRight className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onEarn}
            className="inline-flex min-h-9 items-center justify-center gap-1 rounded-xl bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-[0.98]"
          >
            <Sparkles className="size-3.5 text-[color:var(--color-gold)]" />
            <span>Puan kazan</span>
          </button>
        </div>
      </article>
    </section>
  )
}
