"use client"

import { Camera, MapPin, Sparkles, AlertCircle } from "lucide-react"
import { GPValue } from "@/components/golbox/gp-value"
import { formatDistance } from "@/lib/golbox-geo"
import type { FieldDropNearby } from "@/lib/golbox-context"

const DEFAULT_DEMO_DROP: FieldDropNearby = {
  id: "demo-field-drop",
  title: "Şehitkamil Gençlik Parkı Hediyesi",
  pointsGranted: 50,
  distanceMeters: 180,
  radiusMeters: 500,
  remainingStock: 10,
  inRange: true,
  description: "Atatürk Mah. Gençlik Parkı İçinde",
  latitude: 37.0662,
  longitude: 37.3781,
}

export function GiftCollectorCard({
  drop,
  onCollect,
  onMap,
}: {
  drop: FieldDropNearby | null
  onCollect: (id: string) => void
  onMap: () => void
}) {
  const currentDrop = drop ?? DEFAULT_DEMO_DROP
  const distance = Number(currentDrop.distanceMeters) || 0
  const isWithin500m = distance <= 500

  return (
    <section aria-label="Hediye Topla">
      <div className={`relative overflow-hidden rounded-[22px] border p-4 transition-all shadow-sm ${
        isWithin500m 
          ? "border-[color:var(--color-gold)]/50 bg-gradient-to-br from-[color:var(--color-brand-900)] via-[color:var(--color-brand-700)] to-[color:var(--color-brand-900)] text-white shadow-md"
          : "border-border/80 bg-card text-foreground"
      }`}>
        {/* Decorative background glow when in range */}
        {isWithin500m ? (
          <div aria-hidden className="pointer-events-none absolute -right-10 -bottom-10 size-40 rounded-full bg-[color:var(--color-gold)]/20 blur-2xl" />
        ) : null}

        <div className="relative flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase backdrop-blur-md ${
            isWithin500m
              ? "bg-[color:var(--color-gold)] text-white"
              : "bg-secondary text-muted-foreground"
          }`}>
            <Sparkles className="size-3.5" />
            {isWithin500m ? "500m İçi · Aktif Hediye" : "500m Yarıçap Dışı"}
          </span>

          <span className={`text-xs font-semibold ${isWithin500m ? "text-white/80" : "text-muted-foreground"}`}>
            {formatDistance(distance)}
          </span>
        </div>

        <div className="relative mt-3">
          <h3 className={`font-serif text-lg font-bold tracking-tight ${isWithin500m ? "text-white" : "text-foreground"}`}>
            {currentDrop.title || "GölBox Saha Hediyesi"}
          </h3>
          <p className={`mt-1 text-xs leading-relaxed ${isWithin500m ? "text-white/80" : "text-muted-foreground"}`}>
            {isWithin500m
              ? "Kameranızı açarak süzülen 3D pipetli soğuk kahve bardağına dokunun ve hediyenizi toplayın."
              : `Hediyeyi kamerayla toplamak için noktaya 500 metreden daha yakın olmalısınız. En yakın hediye ${formatDistance(distance)} mesafede.`}
          </p>
        </div>

        <div className="relative mt-4 flex items-center gap-2.5 pt-1">
          {isWithin500m ? (
            <button
              type="button"
              onClick={() => onCollect(currentDrop.id)}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[color:var(--color-gold)] to-amber-400 px-4 py-2 text-xs font-bold text-gray-950 shadow-sm transition-all hover:opacity-95 active:scale-[0.98]"
            >
              <Camera className="size-4" />
              <span>Kamera ile Hediyeyi Al</span>
              <span className="ml-1 rounded-md bg-black/10 px-1.5 py-0.5 text-[10px]">
                +<GPValue amount={currentDrop.pointsGranted} />
              </span>
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled
                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-secondary px-3.5 py-2 text-xs font-medium text-muted-foreground opacity-70 cursor-not-allowed"
              >
                <AlertCircle className="size-4" />
                <span>Kamera Kilitli (&gt;500m)</span>
              </button>
              <button
                type="button"
                onClick={onMap}
                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-primary/20 bg-primary/10 px-3.5 py-2 text-xs font-semibold text-primary transition-all hover:bg-primary/20 active:scale-[0.98]"
              >
                <MapPin className="size-3.5" />
                <span>Haritada Gör</span>
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

