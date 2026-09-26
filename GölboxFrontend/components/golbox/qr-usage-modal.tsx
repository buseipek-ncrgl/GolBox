"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import QRCode from "qrcode"
import { QrCode, X, CheckCircle2, MapPin, ShieldCheck, Clock, ExternalLink } from "lucide-react"
import type { Cafe } from "@/lib/golbox-context"

export type QrUsageFacility = Pick<
  Cafe,
  "id" | "name" | "address" | "isActive" | "latitude" | "longitude"
>

export interface QrUsageItem {
  id: string
  title: string
  sourceType: "GolPuan" | "Ismarliyor" | "GiftHunt"
  redeemCode: string
  facilities: QrUsageFacility[]
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
  const [qrDataUrl, setQrDataUrl] = useState("")

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (timeLeft === 0) onClose()
  }, [onClose, timeLeft])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  useEffect(() => {
    let active = true
    void QRCode.toDataURL(item.redeemCode, {
      width: 384,
      margin: 1,
      color: { dark: "#102a2b", light: "#ffffff" },
      errorCorrectionLevel: "M",
    }).then((dataUrl) => {
      if (active) setQrDataUrl(dataUrl)
    }).catch(() => {
      if (active) setQrDataUrl("")
    })
    return () => {
      active = false
    }
  }, [item.redeemCode])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const timeFormatted = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`

  const sourceLabel =
    item.sourceType === "Ismarliyor"
      ? "Ismarlıyor'dan kazandın"
      : item.sourceType === "GiftHunt"
      ? "Hediye Avı'ndan kazandın"
      : "GölPuan ile aldın"

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-2 sm:items-center sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reward-qr-title"
        className="relative max-h-[calc(100dvh-1rem)] w-full max-w-md space-y-3 overflow-y-auto overscroll-contain rounded-[28px] border border-border bg-card p-4 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:space-y-4 sm:p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <QrCode className="size-5" />
            </div>
            <div>
              <h2 id="reward-qr-title" className="font-serif text-lg font-bold text-foreground">Ödül Kullanım QR Kodu</h2>
              <p className="text-[11px] font-semibold text-primary">{sourceLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="flex size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Item Title & Security Timer */}
        <div className="text-center space-y-1">
          <h3 className="font-serif text-xl font-bold text-foreground">{item.title}</h3>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <Clock className="size-3.5" />
            <span>Görünürlük Süresi: {timeFormatted}</span>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/30 bg-white p-5 shadow-inner">
          <div className="relative flex size-40 items-center justify-center rounded-xl bg-white p-2 shadow-md sm:size-48">
            {qrDataUrl ? (
              <Image
                src={qrDataUrl}
                alt={`${item.title} için kullanım QR kodu`}
                width={192}
                height={192}
                unoptimized
                className="size-full rounded-lg"
              />
            ) : (
              <div className="size-40 animate-pulse rounded-lg bg-secondary" aria-label="QR kodu hazırlanıyor" />
            )}
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
            {item.facilities.map((facility) => (
              <li key={facility.id} className="flex items-start gap-1.5 rounded-xl bg-card/70 p-2">
                <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-emerald-600" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-foreground/90">{facility.name}</span>
                    {typeof facility.isActive === "boolean" ? (
                      <span className={facility.isActive ? "text-[10px] font-bold text-emerald-700" : "text-[10px] font-bold text-red-700"}>
                        {facility.isActive ? "Açık" : "Kapalı"}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{facility.address}</p>
                  {typeof facility.latitude === "number" && typeof facility.longitude === "number" ? (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${facility.latitude},${facility.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex min-h-11 items-center gap-1 rounded-lg text-[10px] font-semibold text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      Haritada Gör
                      <ExternalLink className="size-2.5" />
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Security Info & Close Button */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="size-4 text-emerald-600" />
            <span>Kod 5 dakika sonra otomatik gizlenir</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-2xs hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
