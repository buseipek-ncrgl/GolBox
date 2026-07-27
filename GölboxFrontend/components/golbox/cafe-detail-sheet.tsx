"use client"

import Image from "next/image"
import { useState } from "react"
import { Check, MapPin, Plus, Sparkles, X } from "lucide-react"
import { cafes } from "@/lib/golbox-data"
import { useGolToast } from "@/components/golbox/gol-toast"

export function CafeDetailSheet({ cafeId, onClose }: { cafeId: string; onClose: () => void }) {
  const cafe = cafes.find((c) => c.id === cafeId)
  const notify = useGolToast()
  const [prep, setPrep] = useState<string[]>([])

  if (!cafe) return null

  const toggle = (name: string) => {
    const alreadyAdded = prep.includes(name)
    setPrep((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    )
    if (!alreadyAdded) notify(`${name} hazırlığa eklendi`)
  }

  return (
    <div className="absolute inset-0 z-40">
      <button
        aria-label="Kapat"
        onClick={onClose}
        className="gol-fade absolute inset-0 bg-foreground/40 backdrop-blur-[2px]"
      />
      <div className="gol-sheet-up absolute inset-x-0 bottom-0 top-10 flex flex-col overflow-hidden rounded-t-[2rem] bg-background">
        {/* görsel başlık */}
        <div className="relative h-44 w-full shrink-0">
          <Image
            src={cafe.image || "/placeholder.svg"}
            alt={`${cafe.name} iç mekan`}
            fill
            sizes="420px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-background/85 text-foreground backdrop-blur"
          >
            <X className="size-5" />
          </button>
          <div className="absolute inset-x-5 bottom-3">
            <p className="font-serif text-2xl text-foreground">{cafe.name}</p>
            <p className="text-sm text-muted-foreground">{cafe.category}</p>
          </div>
        </div>

        <div className="no-scrollbar flex-1 space-y-6 overflow-y-auto px-5 pb-40 pt-5">
          {/* konum + durum */}
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
              <MapPin className="size-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-card-foreground">{cafe.address}</p>
              <p className="text-xs text-muted-foreground">
                {cafe.distance} · {cafe.walk}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                cafe.open ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {cafe.open ? `Açık · ${cafe.closeAt}` : "Kapalı"}
            </span>
          </div>

          {/* kampanya (tek, öne çıkan) */}
          {cafe.campaign && (
            <div className="flex items-start gap-3 rounded-2xl bg-accent/20 p-4">
              <Sparkles className="mt-0.5 size-5 shrink-0 text-accent-foreground" />
              <p className="text-sm font-medium text-accent-foreground">{cafe.campaign}</p>
            </div>
          )}

          {/* Hazırlık Alanı — sipariş değil, kasadaki işlemi hızlandırır */}
          <section className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Hazırlık Alanı</h3>
              <p className="text-xs text-muted-foreground">
                Seçtiklerin kasada seni bekler. Sipariş gönderilmez, ödeme QR ile yapılır.
              </p>
            </div>

            {cafe.menu.map((group) => (
              <div key={group.section} className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {group.section}
                </p>
                <ul className="overflow-hidden rounded-2xl border border-border bg-card">
                  {group.items.map((item) => {
                    const active = prep.includes(item.name)
                    return (
                      <li
                        key={item.name}
                        className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-card-foreground">
                            {item.name}
                          </p>
                          <p className="text-xs text-muted-foreground">{item.price}</p>
                        </div>
                        <button
                          onClick={() => toggle(item.name)}
                          aria-pressed={active}
                          aria-label={`${item.name} hazırlığa ekle`}
                          className={`flex size-8 items-center justify-center rounded-full transition-colors ${
                            active
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-secondary-foreground"
                          }`}
                        >
                          {active ? <Check className="size-4" /> : <Plus className="size-4" />}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </section>
        </div>

        {/* alt eylem */}
        {prep.length > 0 && (
          <div className="gol-fade absolute inset-x-0 bottom-0 border-t border-border bg-background/95 px-5 py-4 backdrop-blur">
            <button
              onClick={() => {
                notify("Hazırlığın kaydedildi · kasada QR yeter")
                onClose()
              }}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground"
            >
              {prep.length} ürün hazır · Kasada QR göster
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
