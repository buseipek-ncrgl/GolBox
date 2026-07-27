"use client"

import { Check, Clock, Coffee } from "lucide-react"
import { activePreps, type TabId } from "@/lib/golbox-data"

export function IsmarliyorScreen({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  return (
    <div className="gol-fade-up space-y-5 px-5 pb-6 pt-3">
      <header className="space-y-1">
        <h1 className="font-serif text-2xl text-foreground">Ismarlıyor</h1>
        <p className="text-sm text-muted-foreground">Seni bekleyen ikramlar.</p>
      </header>

      {activePreps.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
            <Coffee className="size-6" />
          </div>
          <p className="text-sm text-muted-foreground">
            Şu an seni bekleyen bir ikram yok.
          </p>
          <button
            onClick={() => onNavigate("cafes")}
            className="mt-1 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background"
          >
            Göl Kafeleri keşfet
          </button>
        </div>
      ) : (
        <ul className="space-y-4">
          {activePreps.map((prep) => (
            <li
              key={prep.id}
              className="overflow-hidden rounded-3xl border border-border bg-card"
            >
              <div className="flex items-center gap-2 border-b border-border bg-secondary/50 px-4 py-3">
                <span
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    prep.status === "hazir"
                      ? "bg-primary text-primary-foreground"
                      : "bg-accent text-accent-foreground"
                  }`}
                >
                  {prep.status === "hazir" ? (
                    <>
                      <Check className="size-3.5" /> Hazır
                    </>
                  ) : (
                    <>
                      <Clock className="size-3.5" /> Hazırlanıyor
                    </>
                  )}
                </span>
                <span className="ml-auto text-sm font-medium text-card-foreground">{prep.cafe}</span>
              </div>
              <div className="space-y-3 p-4">
                <p className="text-sm text-muted-foreground">{prep.note}</p>
                <ul className="flex flex-wrap gap-2">
                  {prep.items.map((it) => (
                    <li
                      key={it}
                      className="rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground"
                    >
                      {it}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => onNavigate("qr")}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground"
                >
                  Kasada QR&apos;ını göster
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
