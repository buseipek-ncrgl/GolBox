"use client"

import { useEffect, useState } from "react"
import { QrCode, X, CheckCircle2, MapPin, ShieldCheck, Clock } from "lucide-react"

export interface QrUsageItem {
  id: string
  title: string
  sourceType: "GolPuan" | "Ismarliyor" | "GiftHunt"
  redeemCode: string
  facilities: string[]
  expiresAtText?: string
}

export function QrUsageModal({
  item,
  onClose,
}: {
  item: QrUsageItem
  onClose: () => void
}) {
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes anti-reuse timer

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const timeFormatted = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`

  const sourceLabel =
    item.sourceType === "Ismarliyor"
      ? "Ismarlıyor'dan kazandın"
      : item.sourceType === "GiftHunt"
      ? "Hediye Avı'ndan kazandın"
      : "GölPuan ile aldın"

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-t-[28px] border border-border bg-card p-6 shadow-2xl sm:rounded-[28px] space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <QrCode className="size-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-foreground">Ödül Kullanım QR Kodu</h2>
              <p className="text-[11px] font-semibold text-primary">{sourceLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="flex size-8 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Item Title & Security Timer */}
        <div className="text-center space-y-1">
          <h3 className="font-serif text-xl font-bold text-foreground">{item.title}</h3>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <Clock className="size-3.5" />
            <span>Kalan Süre: {timeFormatted}</span>
          </div>
        </div>

        {/* QR Code Canvas Mock */}
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/30 bg-white p-5 shadow-inner">
          <div className="relative flex size-48 items-center justify-center rounded-xl bg-slate-950 p-3 shadow-md">
            {/* SVG QR Code Pattern */}
            <svg viewBox="0 0 100 100" className="size-full fill-white">
              {/* Corner position squares */}
              <rect x="5" y="5" width="25" height="25" fill="none" stroke="white" strokeWidth="4" />
              <rect x="10" y="10" width="15" height="15" fill="white" />
              
              <rect x="70" y="5" width="25" height="25" fill="none" stroke="white" strokeWidth="4" />
              <rect x="75" y="10" width="15" height="15" fill="white" />
              
              <rect x="5" y="70" width="25" height="25" fill="none" stroke="white" strokeWidth="4" />
              <rect x="10" y="75" width="15" height="15" fill="white" />

              {/* Data dots pattern */}
              <rect x="35" y="10" width="6" height="6" />
              <rect x="45" y="10" width="6" height="6" />
              <rect x="55" y="10" width="6" height="6" />
              
              <rect x="10" y="35" width="6" height="6" />
              <rect x="20" y="35" width="6" height="6" />
              <rect x="35" y="35" width="6" height="6" />
              <rect x="45" y="35" width="16" height="16" fill="#1d5f60" />
              <rect x="70" y="35" width="6" height="6" />

              <rect x="35" y="55" width="6" height="6" />
              <rect x="55" y="55" width="6" height="6" />
              <rect x="75" y="55" width="6" height="6" />

              <rect x="35" y="75" width="6" height="6" />
              <rect x="45" y="75" width="6" height="6" />
              <rect x="65" y="75" width="16" height="16" />
            </svg>
          </div>

          <div className="mt-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Kasada Okutulacak Kod</p>
            <p className="font-mono text-xl font-bold tracking-[0.2em] text-slate-900">{item.redeemCode}</p>
          </div>
        </div>

        {/* Valid Facilities */}
        <div className="rounded-2xl bg-secondary/70 p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <MapPin className="size-3.5 text-primary" />
            <span>Geçerli Tesisler</span>
          </div>
          <ul className="grid grid-cols-1 gap-1 text-xs text-muted-foreground">
            {item.facilities.map((fac, idx) => (
              <li key={idx} className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3 text-emerald-600 shrink-0" />
                <span className="font-medium text-foreground/90">{fac}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Security Info & Close Button */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="size-4 text-emerald-600" />
            <span>Tek kullanımlık güvenli kod</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-2xs hover:bg-primary/90"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  )
}
