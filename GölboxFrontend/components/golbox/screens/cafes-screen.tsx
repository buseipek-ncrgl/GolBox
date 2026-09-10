"use client"

import { CafeCover } from "@/components/golbox/cafe-cover"
import { MapPin } from "lucide-react"
import { cafes as mockCafes } from "@/lib/golbox-data"
import { useGolbox } from "@/lib/golbox-context"

export function CafesScreen({
  onOpenCafe,
  embedded = false,
}: {
  onOpenCafe: (id: string) => void
  embedded?: boolean
}) {
  const { cafes: liveCafes } = useGolbox()
  const cards =
    liveCafes.length > 0
      ? liveCafes.map((cafe) => ({
          id: cafe.id,
          name: cafe.name,
          category: cafe.categoryName || "Kitap Kafe",
          meta: cafe.address,
          imageUrl: cafe.imageUrl,
          badge: cafe.isActive === false ? "Kapalı" : "Açık",
        }))
      : mockCafes.map((cafe) => ({
          id: cafe.id,
          name: cafe.name,
          category: cafe.category,
          meta: `${cafe.distance} · ${cafe.walk}`,
          imageUrl: undefined as string | undefined,
          badge: cafe.open ? `Açık · ${cafe.closeAt}` : "Kapalı",
        }))

  return (
    <div className={`space-y-5 px-5 pb-6 ${embedded ? "pt-2" : "gol-fade-up pt-3"}`}>
      {!embedded && (
        <header className="space-y-1">
          <h1 className="font-serif text-2xl text-foreground">Göl Kafeler</h1>
          <p className="text-sm text-muted-foreground">Şubeleri ve menüyü keşfet.</p>
        </header>
      )}

      <ul className="space-y-4">
        {cards.map((cafe) => (
          <li key={cafe.id}>
            <button
              type="button"
              onClick={() => onOpenCafe(cafe.id)}
              className="gol-card group block w-full text-left"
            >
              <CafeCover name={cafe.name} imageUrl={cafe.imageUrl} className="h-40 w-full" />
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-card-foreground">{cafe.name}</p>
                    <p className="text-sm text-muted-foreground">{cafe.category}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground">
                    {cafe.badge}
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="size-3.5" /> {cafe.meta}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
