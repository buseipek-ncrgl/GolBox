"use client"

import React from "react"
import { Coffee } from "lucide-react"

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onComplete()
    }, 1500)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-emerald-950 p-6 text-white text-center">
      <div className="relative mb-6 flex size-24 items-center justify-center rounded-full bg-emerald-900 border-2 border-emerald-500 shadow-2xl animate-pulse">
        <Coffee className="size-12 text-emerald-300" strokeWidth={2} />
      </div>
      <h1 className="font-serif text-4xl font-extrabold tracking-wider text-white">GölBOX</h1>
      <p className="mt-1 text-xs font-bold tracking-widest text-emerald-400 uppercase">Şehitkamil Belediyesi</p>
      <p className="mt-4 max-w-xs text-xs text-emerald-200/80 leading-relaxed font-medium">
        Kahveni seç, GölPuan kazan, sıra beklemeden Gel-Al.
      </p>

      <div className="mt-10 flex flex-col items-center gap-2">
        <div className="size-6 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent"></div>
        <span className="text-[11px] font-semibold text-emerald-300">Oturum kontrol ediliyor...</span>
      </div>
    </div>
  )
}
