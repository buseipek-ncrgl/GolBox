"use client"

import React, { useState } from "react"
import { Bell, Check, X, ShieldCheck, Coffee, Calendar } from "lucide-react"

export function PushPermissionPrompt({
  context = "order",
  onEnable,
  onDismiss,
}: {
  context?: "order" | "event" | "general"
  onEnable: () => void
  onDismiss: () => void
}) {
  const [granted, setGranted] = useState(false)

  const handleAllow = () => {
    setGranted(true)
    setTimeout(() => {
      onEnable()
    }, 1200)
  }

  if (granted) {
    return (
      <div className="rounded-2xl border border-emerald-400/40 bg-emerald-50 dark:bg-emerald-950/60 p-4 shadow-md space-y-2 animate-in fade-in duration-200">
        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 text-xs font-black">
          <Check className="size-4 text-emerald-600" />
          <span>Bildirim İzni Alındı!</span>
        </div>
        <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
          Siparişin hazır olduğunda telefonuna anında canlı bildirim gönderilecektir.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-amber-400/40 bg-gradient-to-br from-slate-900 to-slate-950 p-5 text-white shadow-xl space-y-3 relative overflow-hidden animate-in fade-in duration-200">
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 flex size-7 items-center justify-center rounded-full bg-white/10 text-slate-300 hover:bg-white/20 transition"
        aria-label="Kapat"
      >
        <X className="size-4" />
      </button>

      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-400 text-amber-950 font-black shrink-0">
          {context === "order" ? (
            <Coffee className="size-6" />
          ) : context === "event" ? (
            <Calendar className="size-6" />
          ) : (
            <Bell className="size-6" />
          )}
        </div>
        <div>
          <span className="rounded-md bg-amber-400/20 px-2 py-0.5 text-[9px] font-black uppercase text-amber-300 tracking-wider">
            Anlık Bildirim İzni
          </span>
          <h3 className="text-sm font-black text-white mt-0.5">
            {context === "order"
              ? "Siparişin hazır olduğunda haber verelim mi?"
              : context === "event"
              ? "Etkinlik hatırlatmalarını kaçırmayın!"
              : "GölBOX Bildirimlerini Aç"}
          </h3>
        </div>
      </div>

      <p className="text-xs text-slate-300 font-medium leading-relaxed">
        {context === "order"
          ? "Sipariş durumun 'Hazır' olduğunda sıraya girmeden ve ekranı sürekli kontrol etmeden anında telefonuna bildirim düşmesini sağlar."
          : "Kayıt olduğun etkinlikler başlamadan 24 saat önce ve yer değişikliklerinde anında bilgilendirilirsin."}
      </p>

      <div className="flex items-center justify-between pt-1 border-t border-slate-800">
        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
          <ShieldCheck className="size-3 text-amber-400" /> Cihazından dilediğin an kapatabilirsin
        </span>
        <div className="flex gap-2">
          <button
            onClick={onDismiss}
            className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/20 transition"
          >
            Şimdi Değil
          </button>
          <button
            onClick={handleAllow}
            className="rounded-xl bg-amber-400 px-4 py-1.5 text-xs font-black text-amber-950 shadow-md hover:bg-amber-300 transition active:scale-95"
          >
            Bildirimleri Aç
          </button>
        </div>
      </div>
    </div>
  )
}
