"use client"

import { Clock, AlertTriangle, QrCode, CheckCircle2 } from "lucide-react"
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
  const nowMs = Date.now()
  const expMs = coupon.expiresAt ? new Date(coupon.expiresAt).getTime() : 0
  const isDateExpired = expMs > 0 && expMs < nowMs

  const used = coupon.status === "Redeemed"
  const cancelled = coupon.status === "Cancelled"
  const expired = coupon.isExpired || coupon.status === "Expired" || isDateExpired
  const active = coupon.status === "Claimed" && !expired && !cancelled

  // Calculate actual days remaining dynamically
  const daysRemaining = expMs > 0 ? Math.ceil((expMs - nowMs) / (1000 * 3600 * 24)) : coupon.daysRemaining
  const isExpiringSoon = active && daysRemaining <= 3 && daysRemaining >= 0

  const label = used
    ? "Kullanıldı"
    : cancelled
    ? "İptal Edildi"
    : expired
    ? "Süresi Doldu"
    : isExpiringSoon
    ? `Son ${daysRemaining > 0 ? `${daysRemaining} Gün` : "Saatler"}`
    : "Kullanılabilir"

  const personalized = coupon.personalizedFor || (coupon.holderName ? `${coupon.holderName}'ya özel` : "Kişiye özel ikram")

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border bg-card transition-all ${
        compact ? "p-4" : "p-5"
      } ${
        used || expired
          ? "border-border/60 opacity-60 bg-muted/30"
          : isExpiringSoon
          ? "border-amber-400/80 shadow-xs dark:border-amber-600/80"
          : "border-emerald-600/30 shadow-xs hover:border-emerald-600/50"
      }`}
    >
      {/* Top Banner Accent */}
      {!used && !expired && (
        <div
          className={`absolute left-0 top-0 h-1 w-full ${
            isExpiringSoon ? "bg-amber-500" : "bg-emerald-600"
          }`}
        />
      )}

      {/* Header Info */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-800 dark:text-emerald-300">
            {personalized}
          </span>
          <h3 className="mt-1 font-sans text-base font-extrabold leading-snug tracking-tight text-foreground">
            {coupon.rewardTitle}
          </h3>
          {!compact && coupon.rewardDescription ? (
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{coupon.rewardDescription}</p>
          ) : null}
        </div>

        {/* Status Badge */}
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-wide ${
            used
              ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              : expired
              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300"
              : isExpiringSoon
              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-200"
              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200"
          }`}
        >
          {isExpiringSoon && <AlertTriangle className="size-3 text-amber-600" />}
          {used && <CheckCircle2 className="size-3 text-slate-500" />}
          {label}
        </span>
      </div>

      {/* 3-Day Expiration Warning Notice */}
      {isExpiringSoon && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-2.5 text-xs font-semibold text-amber-800 dark:text-amber-200">
          <Clock className="size-4 shrink-0 text-amber-600 animate-pulse" />
          <span>Süreniz dolmak üzere! İkramınızı Şehitkamil Kitap Kafeler'de kullanmayı unutmayın.</span>
        </div>
      )}

      {/* Ticket Pass Code Container */}
      <div className="mt-3.5 flex items-center justify-between rounded-xl border border-dashed border-emerald-600/30 bg-muted/30 px-3.5 py-2.5">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Kasada Gösterilecek Kod</p>
          <p className="mt-0.5 font-mono text-base font-extrabold tracking-widest text-foreground">{coupon.redeemCode}</p>
        </div>
        <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 border border-emerald-500/20">
          <QrCode className="size-5" />
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
        <span>{used ? `Kullanım: ${formatDate(coupon.redeemedAt || "")}` : `Son Gün: ${formatDate(coupon.expiresAt)}`}</span>
        {active && !isExpiringSoon ? (
          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
            <Clock className="size-3" />
            {daysRemaining} Gün Kaldı
          </span>
        ) : null}
      </div>
    </article>
  )
}

export function isActiveCoupon(coupon: ClaimedReward) {
  const nowMs = Date.now()
  const expMs = coupon.expiresAt ? new Date(coupon.expiresAt).getTime() : 0
  const isDateExpired = expMs > 0 && expMs < nowMs
  return coupon.status === "Claimed" && !coupon.isExpired && !isDateExpired
}
