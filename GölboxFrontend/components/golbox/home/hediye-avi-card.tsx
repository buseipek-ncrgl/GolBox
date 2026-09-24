"use client"

import { Compass, Gift, Navigation, Sparkles, MapPin } from "lucide-react"
import type { FieldDropNearby } from "@/lib/golbox-context"

export function HediyeAviCard({
  drop,
  onCollect,
  onOpenMap,
}: {
  drop?: FieldDropNearby | null
  onCollect: (id: string) => void
  onOpenMap: () => void
}) {
  return (
    <section aria-label="Hediye Avı" className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Compass className="size-4 text-[color:var(--color-gold)]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">Hediye Avı</h2>
        </div>
        <button
          type="button"
          onClick={onOpenMap}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
        >
          <MapPin className="size-3" />
          Haritada Gör
        </button>
      </div>

      <div className="relative overflow-hidden rounded-[22px] border border-[color:var(--color-gold)]/30 bg-gradient-to-br from-card via-card to-[color:var(--color-gold)]/10 p-4 shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--color-gold)]/15 text-[color:var(--color-gold)] shadow-2xs">
              <Gift className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--color-gold)]/20 px-2 py-0.5 text-[10px] font-bold text-[color:var(--color-gold)]">
                  <Sparkles className="size-3" />
                  3D AR Kamera
                </span>
              </div>
              <h3 className="mt-1 font-serif text-sm font-bold text-foreground">
                {drop?.title || "Şehitkamil Gençlik Parkı 3D Kahve Hediyesi"}
              </h3>
            </div>
          </div>
        </div>

        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
          {drop?.description || "Atatürk Mah. Gençlik Parkı İçinde Süzülen 3D Pipetli Soğuk Kahve Bardağı. Noktaya yaklaş ve AR kamerayla topla."}
        </p>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/50 pt-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Navigation className="size-3.5 text-primary" />
            <span>Yaklaşık 180m mesafede</span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (drop?.id) onCollect(drop.id)
              else onCollect("drop-1")
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[color:var(--color-gold)] px-3.5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-[color:var(--color-gold)]/90 transition-all active:scale-95"
          >
            <Sparkles className="size-3.5" />
            Hediye Avına Başla
          </button>
        </div>
      </div>
    </section>
  )
}
