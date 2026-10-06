"use client"

import React, { useState } from "react"
import { GolboxBrandLogo } from "@/components/golbox/golbox-brand-logo"
import { ChevronRight, ChevronLeft } from "lucide-react"

interface RealisticOnboardingSlide {
  id: number
  imageUrl: string
  badge: string
  headline: string
  description: string
  buttonText: string
}

const REALISTIC_SLIDES: RealisticOnboardingSlide[] = [
  {
    id: 0,
    imageUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=85",
    badge: "T.C. ŞEHİTKAMİL BELEDİYESİ GÖLBOX",
    headline: "Her Yudumda Bir Hikâye.",
    description: "Özenle seçilmiş kahveleri keşfet, favorini seç ve kahve deneyimini yanında taşı.",
    buttonText: "Kahveni Keşfet",
  },
  {
    id: 1,
    imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=85",
    badge: "SIRA BEKLEMEDEN GEL-AL",
    headline: "Taze Hazırlanan Lezzetler.",
    description: "Şehitkamil sosyal tesislerinde kasa sırası beklemeden siparişini ver, baristanın taze hazırladığı kahveni anında teslim al.",
    buttonText: "Gel-Al Siparişi Dene",
  },
  {
    id: 2,
    imageUrl: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1200&q=85",
    badge: "GÖLPUAN SADAKAT PROGRAMI",
    headline: "Ayrıcalıklı Kahve Deneyimi.",
    description: "Tesislerimizde harcadıkça GölPuan topla, üyelere özel indirimler ve sürpriz ikramların tadını çıkar.",
    buttonText: "GölBOX'a Başla",
  },
]

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const slide = REALISTIC_SLIDES[currentSlide]

  const handleNext = () => {
    if (currentSlide < REALISTIC_SLIDES.length - 1) {
      setCurrentSlide((prev) => prev + 1)
    } else {
      onComplete()
    }
  }

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-neutral-950 text-white overflow-hidden select-none">
      {/* 1. CINEMATIC BACKGROUND PHOTOGRAPHY */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          key={slide.imageUrl}
          src={slide.imageUrl}
          alt="Coffee shop lifestyle background"
          className="size-full object-cover object-center scale-105 transition-all duration-700 ease-out filter brightness-[0.82]"
        />
        {/* Soft Multi-stage Gradient Overlays for optimal text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-neutral-950/40" />
        <div className="absolute inset-0 bg-neutral-950/20 backdrop-blur-[1px]" />
      </div>

      {/* 2. TOP BRANDING BAR */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-6">
        <div className="flex items-center gap-3">
          <GolboxBrandLogo size={46} className="drop-shadow-lg" />
          <div className="flex flex-col">
            <span className="font-serif text-base font-black tracking-widest text-white leading-none">
              GölBOX
            </span>
            <span className="text-[9px] font-bold tracking-widest text-neutral-400 uppercase mt-0.5">
              Şehitkamil
            </span>
          </div>
        </div>

        <button
          onClick={onComplete}
          className="rounded-full border border-white/20 bg-black/40 px-4 py-1.5 text-xs font-semibold tracking-wide text-neutral-200 hover:bg-black/60 hover:text-white transition active:scale-95 cursor-pointer backdrop-blur-md"
        >
          Atla
        </button>
      </div>

      {/* 3. LOWER CONTENT SECTION */}
      <div className="relative z-10 flex flex-col px-6 pb-8 pt-20 max-w-md mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 key={currentSlide}">
        {/* BADGE */}
        <div className="mb-3">
          <span className="inline-block rounded-full border border-emerald-500/30 bg-emerald-950/80 px-3.5 py-1 text-[9.5px] font-black uppercase tracking-widest text-emerald-400 backdrop-blur-md">
            {slide.badge}
          </span>
        </div>

        {/* HEADLINE */}
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-[1.15] drop-shadow-md">
          {slide.headline}
        </h1>

        {/* DESCRIPTION */}
        <p className="mt-3 text-sm text-neutral-300 leading-relaxed font-normal max-w-xs drop-shadow-xs">
          {slide.description}
        </p>

        {/* 3-DOT PAGINATION INDICATORS */}
        <div className="mt-7 flex items-center gap-2">
          {REALISTIC_SLIDES.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Slayt ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentSlide
                  ? "w-8 bg-emerald-500 shadow-md shadow-emerald-500/40"
                  : "w-2 bg-white/30 hover:bg-white/60"
              }`}
            />
          ))}
        </div>

        {/* PRIMARY ACTION BUTTON */}
        <div className="mt-6 flex items-center gap-3">
          {currentSlide > 0 && (
            <button
              onClick={handlePrev}
              aria-label="Önceki slayt"
              className="flex size-14 items-center justify-center rounded-2xl border border-white/20 bg-black/40 text-neutral-200 hover:bg-black/60 transition active:scale-95 cursor-pointer backdrop-blur-md shrink-0"
            >
              <ChevronLeft className="size-5" />
            </button>
          )}

          <button
            onClick={handleNext}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 px-6 text-sm font-extrabold text-white shadow-xl shadow-emerald-950/60 hover:bg-emerald-500 active:scale-[0.98] transition cursor-pointer"
          >
            <span>{slide.buttonText}</span>
            <ChevronRight className="size-4 stroke-[2.5]" />
          </button>
        </div>

        {/* SECONDARY TEXT LINK */}
        <div className="mt-4 text-center">
          <button
            onClick={onComplete}
            className="text-xs font-semibold text-neutral-400 hover:text-white transition cursor-pointer"
          >
            Zaten hesabın var mı? <span className="text-emerald-400 font-bold underline">Giriş Yap</span>
          </button>
        </div>
      </div>
    </div>
  )
}
