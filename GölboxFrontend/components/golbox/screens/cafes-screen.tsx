"use client"

import Image from "next/image"
import { MapPin } from "lucide-react"
import { useGolbox } from "@/lib/golbox-context"

export function CafesScreen({ onOpenCafe }: { onOpenCafe: (id: string) => void }) {
  const { cafes } = useGolbox()

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
                <img
                  src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&auto=format&fit=crop&q=60"
                  alt={`${cafe.name}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  className="transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <span
                  className="absolute right-3 top-3 rounded-full bg-background/85 px-2.5 py-1 text-[11px] font-medium text-foreground backdrop-blur"
                >
                  Açık · 22:00
                </span>
              </div>
              <div className="p-4">
                <p className="font-semibold text-card-foreground">{cafe.name}</p>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="size-3.5" /> {cafe.address}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
