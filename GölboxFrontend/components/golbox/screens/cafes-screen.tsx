"use client"

import Image from "next/image"
import { MapPin } from "lucide-react"
import { cafes } from "@/lib/golbox-data"

export function CafesScreen({ onOpenCafe }: { onOpenCafe: (id: string) => void }) {
  return (
    <div className="gol-fade-up space-y-5 px-5 pb-6 pt-3">
      <header className="space-y-1">
        <h1 className="font-serif text-2xl text-foreground">Göl Kafeler</h1>
        <p className="text-sm text-muted-foreground">Şubeleri ve menüyü keşfet.</p>
      </header>

      <ul className="space-y-4">
        {cafes.map((cafe) => (
          <li key={cafe.id}>
            <button
              onClick={() => onOpenCafe(cafe.id)}
              className="group block w-full overflow-hidden rounded-3xl border border-border bg-card text-left"
            >
              <div className="relative h-40 w-full">
                <Image
                  src={cafe.image || "/placeholder.svg"}
                  alt={`${cafe.name} iç mekan`}
                  fill
                  sizes="420px"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <span
                  className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-medium backdrop-blur ${
                    cafe.open
                      ? "bg-background/85 text-foreground"
                      : "bg-foreground/70 text-background"
                  }`}
                >
                  {cafe.open ? `Açık · ${cafe.closeAt}` : "Kapalı"}
                </span>
                {cafe.campaign && (
                  <span className="absolute bottom-3 left-3 rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-accent-foreground">
                    Fırsat var
                  </span>
                )}
              </div>
              <div className="p-4">
                <p className="font-semibold text-card-foreground">{cafe.name}</p>
                <p className="text-sm text-muted-foreground">{cafe.category}</p>
                <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="size-3.5" /> {cafe.distance} · {cafe.walk}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
