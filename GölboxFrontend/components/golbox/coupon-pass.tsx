"use client"

import type { ClaimedReward } from "@/lib/golbox-context"

function formatDate(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
}

export function CouponPass({
  coupon,
  compact = false,
}: {
  coupon: ClaimedReward
  compact?: boolean
}) {
  const used = coupon.status === "Redeemed"
  const cancelled = coupon.status === "Cancelled"
  const expired = coupon.isExpired || coupon.status === "Expired"
  const active = coupon.status === "Claimed" && !expired && !cancelled
  const label = used
    ? "Kullanıldı"
    : cancelled
    ? "İptal Edildi"
    : expired
    ? "Süresi Doldu"
    : "Kullanılabilir"
  const personalized = coupon.personalizedFor || (coupon.holderName ? `${coupon.holderName}'ya özel` : "Kişiye özel")

  return (
    <article
      className={`overflow-hidden rounded-[var(--gol-card)] border border-border bg-card ${
        compact ? "p-4" : "p-5"
      } ${used || expired ? "opacity-70" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {personalized}
          </p>
          <h3 className="mt-1 font-serif text-xl leading-tight text-foreground">{coupon.rewardTitle}</h3>
          {!compact && coupon.rewardDescription ? (
            <p className="mt-1 text-sm text-muted-foreground">{coupon.rewardDescription}</p>
          ) : null}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          }`}
        >
          {label}
        </span>
      </div>

      <div className="mt-4 rounded-2xl border border-dashed border-border bg-background px-4 py-3">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Kasada gösterilecek kod</p>
        <p className="mt-1 font-mono text-lg font-semibold tracking-[0.12em] text-foreground">{coupon.redeemCode}</p>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{used ? `Kullanım: ${formatDate(coupon.redeemedAt || "")}` : `Son gün: ${formatDate(coupon.expiresAt)}`}</span>
        {active ? <span>{coupon.daysRemaining} gün kaldı</span> : null}
      </div>
    </article>
  )
}

export function isActiveCoupon(coupon: ClaimedReward) {
  return coupon.status === "Claimed" && !coupon.isExpired
}
