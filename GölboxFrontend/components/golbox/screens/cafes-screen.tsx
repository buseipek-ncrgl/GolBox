import { useState, useMemo } from "react"
import { CafeCover } from "@/components/golbox/cafe-cover"
import { MapPin, Search } from "lucide-react"
import { useGolbox } from "@/lib/golbox-context"

export function CafesScreen({
  onOpenCafe,
  embedded = false,
}: {
  onOpenCafe: (id: string) => void
  embedded?: boolean
}) {
  const { cafes: liveCafes, cafesLoadState, refreshData } = useGolbox()
  const [searchQuery, setSearchQuery] = useState("")

  const cards = liveCafes.map((cafe) => ({
    id: cafe.id,
    name: cafe.name,
    category: cafe.categoryName || "Kitap Kafe",
    meta: cafe.address,
    imageUrl: cafe.imageUrl,
    badge: cafe.isActive === false ? "Kapalı" : "Açık",
  }))

  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return cards
    const q = searchQuery.toLowerCase().trim()
    return cards.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.meta && c.meta.toLowerCase().includes(q)),
    )
  }, [cards, searchQuery])

  return (
    <div className={`space-y-5 px-5 pb-6 ${embedded ? "pt-2" : "gol-fade-up pt-3"}`}>
      {!embedded && (
        <header className="space-y-1">
          <h1 className="font-serif text-2xl text-foreground">Göl Kafeler</h1>
          <p className="text-sm text-muted-foreground">Şubeleri ve menüyü keşfet.</p>
        </header>
      )}

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Kafe veya şube ara..."
          className="w-full rounded-2xl border border-input bg-card px-4 py-2.5 pl-10 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <Search className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-2.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Temizle
          </button>
        )}
      </div>

      {cafesLoadState === "error" ? (
        <div className="gol-card flex flex-col items-center gap-2 border-dashed px-6 py-10 text-center">
          <Search className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">Kafeler yüklenemedi.</p>
          <p className="text-xs text-muted-foreground">Bağlantıyı kontrol edip tekrar deneyin.</p>
          <button
            type="button"
            onClick={() => void refreshData()}
            className="mt-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
          >
            Tekrar dene
          </button>
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="gol-card flex flex-col items-center gap-2 border-dashed px-6 py-10 text-center">
          <Search className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            {searchQuery ? "Kafe bulunamadı" : "Henüz yayınlanmış kafe bulunmuyor."}
          </p>
          <p className="text-xs text-muted-foreground">
            {searchQuery
              ? `"${searchQuery}" ile eşleşen kafe yok.`
              : "Yeni tesisler yayınlandığında burada görünür."}
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {filteredCards.map((cafe) => (
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
      )}
    </div>
  )
}
