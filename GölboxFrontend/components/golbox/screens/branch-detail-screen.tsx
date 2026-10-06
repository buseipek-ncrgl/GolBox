"use client"

import React, { useState } from "react"
import {
  ArrowLeft,
  Heart,
  MapPin,
  Navigation,
  Check,
  Clock,
  Coffee,
  AlertTriangle,
  Wifi,
  Car,
  Accessibility,
  Store,
  Phone,
  Sparkles,
  ChevronRight
} from "lucide-react"

export interface BranchData {
  id: string
  name: string
  shortAddress: string
  fullAddress: string
  city: string
  district: string
  latitude: number
  longitude: number
  distanceMeters?: number
  isOpen: boolean
  closesAt: string
  opensAt?: string
  pickupStatus: "ACCEPTING" | "PAUSED" | "CLOSED"
  estimatedMin: number
  estimatedMax: number
  phone: string
  imageUrl: string
  workingHours: { [key: string]: string }
  features: string[]
  isFavorite?: boolean
}

export function BranchDetailScreen({
  branch,
  isFavorite = false,
  isSelected = false,
  onBack,
  onToggleFavorite,
  onSelectBranch,
  onNavigateToMenu
}: {
  branch: BranchData
  isFavorite?: boolean
  isSelected?: boolean
  onBack: () => void
  onToggleFavorite: (name: string) => void
  onSelectBranch: () => void
  onNavigateToMenu: () => void
}) {
  const currentDayName = new Intl.DateTimeFormat("tr-TR", { weekday: "long" }).format(new Date())

  const handleDirections = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${branch.latitude},${branch.longitude}`
    window.open(url, "_blank")
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background overflow-y-auto no-scrollbar animate-in fade-in duration-200">
      {/* 1. HEADER (PRD SECTION 37) */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/40 bg-background/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            aria-label="Geri Dön"
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-card text-foreground shadow-2xs hover:bg-accent transition active:scale-95"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base font-black text-foreground truncate">{branch.name}</h1>
            <p className="text-[10px] text-muted-foreground font-semibold truncate">{branch.district} / {branch.city}</p>
          </div>
        </div>

        <button
          onClick={() => onToggleFavorite(branch.name)}
          aria-label="Favorilere ekle/çıkar"
          className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-card text-foreground shadow-2xs hover:bg-accent transition active:scale-95"
        >
          <Heart className={`size-4.5 transition ${isFavorite ? "fill-rose-500 text-rose-500" : "text-muted-foreground hover:text-rose-500"}`} />
        </button>
      </header>

      {/* 2. HERO IMAGE (PRD SECTION 38 - 39) */}
      <div className="relative h-52 w-full overflow-hidden bg-slate-900 shrink-0">
        <img
          src={branch.imageUrl}
          alt={branch.name}
          className="size-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <span className="rounded-2xl bg-black/60 px-3 py-1.5 text-xs font-black text-white backdrop-blur-md border border-white/20">
            {branch.name}
          </span>
          {isSelected && (
            <span className="rounded-2xl bg-primary px-3 py-1.5 text-xs font-black text-primary-foreground shadow-lg flex items-center gap-1">
              <Check className="size-3.5" strokeWidth={3} />
              Seçili Şuben
            </span>
          )}
        </div>
      </div>

      {/* MAIN CONTENT CONTAINER */}
      <div className="flex-1 space-y-4 px-4 py-4 pb-32 max-w-lg mx-auto w-full">
        {/* 3. KEY BADGES ROW (PRD SECTION 37) */}
        <div className="flex flex-wrap items-center gap-2">
          {branch.isOpen ? (
            <span className="inline-flex items-center gap-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-3 py-1.5 text-xs font-black text-emerald-800 dark:text-emerald-200">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              Açık · {branch.closesAt}'a kadar
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 px-3 py-1.5 text-xs font-black text-rose-800 dark:text-rose-200">
              <span className="size-2 rounded-full bg-rose-500" />
              Kapalı
            </span>
          )}

          {branch.pickupStatus === "ACCEPTING" ? (
            <span className="inline-flex items-center gap-1.5 rounded-2xl bg-secondary border border-border px-3 py-1.5 text-xs font-black text-foreground">
              <Coffee className="size-3.5 text-primary" />
              Gel-Al aktif · {branch.estimatedMin}–{branch.estimatedMax} dk
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 px-3 py-1.5 text-xs font-black text-amber-800 dark:text-amber-200">
              <AlertTriangle className="size-3.5 text-amber-500" />
              Gel-Al Geçici Duraklatıldı
            </span>
          )}
        </div>

        {/* 4. ADDRESS SECTION (PRD SECTIONS 41 - 43) */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
            <MapPin className="size-4 text-primary" />
            <span>Adres & Konum</span>
          </div>

          <p className="text-xs font-bold text-foreground leading-relaxed">
            {branch.fullAddress}
          </p>

          <button
            onClick={handleDirections}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-secondary py-3 text-xs font-black text-foreground hover:bg-accent transition active:scale-95"
          >
            <Navigation className="size-4 text-primary" />
            <span>Yol Tarifi Al (Google / Apple Maps)</span>
          </button>
        </div>

        {/* 5. GEL-AL DETAY & MENÜYE GİT (PRD SECTIONS 46 - 49) */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
            <div className="flex items-center gap-2">
              <Coffee className="size-4 text-primary" />
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Gel-Al Sipariş Durumu</h3>
            </div>
            {branch.pickupStatus === "ACCEPTING" ? (
              <span className="rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-black">
                Sipariş Alıyor ✓
              </span>
            ) : (
              <span className="rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-0.5 text-[10px] font-black">
                Geçici Olarak Kapalı
              </span>
            )}
          </div>

          {branch.pickupStatus === "ACCEPTING" ? (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground leading-snug">
                Bu şubemiz şu anda Gel-Al siparişi kabul etmektedir. Tahmini hazırlanma süresi <strong>{branch.estimatedMin}–{branch.estimatedMax} dakikadır</strong>.
              </p>

              <button
                onClick={onNavigateToMenu}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-xs font-black text-primary-foreground shadow-md hover:bg-primary/90 transition active:scale-95"
              >
                <Coffee className="size-4" />
                <span>Bu Şubenin Menüsünü Gör</span>
                <ChevronRight className="size-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-snug rounded-2xl bg-amber-50 dark:bg-amber-950/40 p-3 border border-amber-200 dark:border-amber-800">
                Bu GölBOX kısa bir süre için yeni Gel-Al siparişlerini duraklatmıştır. Diğer yakındaki şubelerimizden sipariş verebilirsiniz.
              </p>
              <button
                onClick={onBack}
                className="w-full rounded-2xl border border-border bg-card py-3 text-xs font-black text-foreground hover:bg-accent"
              >
                Diğer Şubelere Bak
              </button>
            </div>
          )}
        </div>

        {/* 6. WORKING HOURS SECTION (PRD SECTIONS 73 - 74) */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
            <Clock className="size-4 text-primary" />
            <span>Haftalık Çalışma Saatleri</span>
          </div>

          <div className="space-y-2 text-xs">
            {Object.entries(branch.workingHours).map(([day, hours]) => {
              const isToday = day.toLowerCase() === currentDayName.toLowerCase()
              return (
                <div
                  key={day}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 transition ${
                    isToday
                      ? "bg-primary/10 font-black text-primary border border-primary/20"
                      : "text-muted-foreground"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {isToday && <Sparkles className="size-3 text-amber-500" />}
                    {day} {isToday && "(Bugün)"}
                  </span>
                  <span className="font-mono font-bold text-foreground">{hours}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* 7. FEATURES GRID (PRD SECTIONS 77 - 78) */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
            <Store className="size-4 text-primary" />
            <span>Şube Özellikleri</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {branch.features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 rounded-2xl bg-accent/60 p-3 font-bold text-foreground">
                <Check className="size-4 text-emerald-600 shrink-0" strokeWidth={3} />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 8. PHONE / CONTACT (PRD SECTION 79) */}
        <div className="rounded-3xl border border-border bg-card p-4 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-2xl bg-secondary text-primary">
              <Phone className="size-4" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Şube İletişim</span>
              <p className="text-xs font-mono font-bold text-foreground">{branch.phone}</p>
            </div>
          </div>

          <a
            href={`tel:${branch.phone.replace(/\s+/g, "")}`}
            className="rounded-xl bg-primary/10 border border-primary/20 px-3 py-2 text-xs font-black text-primary hover:bg-primary/20"
          >
            Şubeyi Ara
          </a>
        </div>
      </div>

      {/* 9. STICKY BOTTOM PRIMARY CTA (PRD SECTION 51) */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-4 backdrop-blur-md">
        <div className="max-w-lg mx-auto">
          <button
            onClick={onSelectBranch}
            className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-xs font-black shadow-md transition active:scale-95 ${
              isSelected
                ? "bg-emerald-600 text-white"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {isSelected ? (
              <>
                <Check className="size-4" strokeWidth={3} />
                <span>Seçili GölBOX Şuben</span>
              </>
            ) : (
              <span>Bu Şubeyi Seç</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
