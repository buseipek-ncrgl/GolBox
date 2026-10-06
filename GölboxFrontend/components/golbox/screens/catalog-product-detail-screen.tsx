"use client"

import { useMemo, useState } from "react"
import { ArrowLeft, Bookmark, Check, Heart, Minus, Plus, ShoppingBag, Sparkles, X } from "lucide-react"
import { useGolbox, type MenuItem, type MenuOptionGroup } from "@/lib/golbox-context"
import { useGolToast } from "@/components/golbox/gol-toast"

type SelectionMap = Record<string, string[]>

function initialSelections(groups: MenuOptionGroup[]): SelectionMap {
  return Object.fromEntries(groups.map((group) => [
    group.id,
    group.isRequired && group.options[0] ? [group.options[0].id] : [],
  ]))
}

export function ProductDetailScreen({
  product,
  onClose,
  onAddToCartSuccess,
}: {
  product: MenuItem & { studentPrice?: number; isAvailable?: boolean; originalPrice?: number }
  onClose: () => void
  onAddToCartSuccess?: (details: {
    product: MenuItem
    quantity: number
    totalPrice: number
    configurationSummary: string
    selectedOptionIds?: string[]
  }) => void
}) {
  const { token, favorites, toggleFavorite, addToFoodCart } = useGolbox()
  const showToast = useGolToast()
  const groups: MenuOptionGroup[] = product.optionGroups ?? []
  const [quantity, setQuantity] = useState(1)
  const [selections, setSelections] = useState<SelectionMap>(() => initialSelections(groups))
  const [savedRecipe, setSavedRecipe] = useState(false)

  const selectedOptions = useMemo(() => {
    const ids = new Set(Object.values(selections).flat())
    return groups.flatMap((group: MenuOptionGroup) => group.options.filter((option) => ids.has(option.id)))
  }, [groups, selections])

  const unitPrice = product.price + selectedOptions.reduce((sum: number, option) => sum + option.priceModifier, 0)
  const totalPrice = unitPrice * quantity
  const summary = selectedOptions.length > 0 ? selectedOptions.map((option) => option.name).join(", ") : "Standart reçete"
  const isFavorite = favorites.includes(product.id)

  // Dynamic discount calculation from backend data
  const hasDiscount = Boolean(product.originalPrice && product.originalPrice > product.price)
  const discountPercent = hasDiscount && product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  const toggleOption = (group: MenuOptionGroup, optionId: string) => {
    setSelections((current) => {
      const selected = current[group.id] ?? []
      if (group.maxSelect === 1) return { ...current, [group.id]: [optionId] }
      const exists = selected.includes(optionId)
      if (!exists && selected.length >= group.maxSelect) {
        showToast(`En fazla ${group.maxSelect} seçim yapabilirsin.`)
        return current
      }
      return { ...current, [group.id]: exists ? selected.filter((id) => id !== optionId) : [...selected, optionId] }
    })
  }

  const add = () => {
    const incomplete = groups.find((group: MenuOptionGroup) => (selections[group.id]?.length ?? 0) < group.minSelect)
    if (incomplete) {
      showToast(`${incomplete.name} için en az ${incomplete.minSelect} seçim yapmalısın.`)
      return
    }
    const selectedOptionIds = Object.values(selections).flat()
    if (onAddToCartSuccess) {
      onAddToCartSuccess({ product, quantity, totalPrice, configurationSummary: summary, selectedOptionIds })
    } else {
      addToFoodCart(product, quantity, summary, unitPrice, selectedOptionIds)
    }
    showToast("Ürün sepete eklendi.")
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Header Bar */}
      <div className="flex h-14 items-center justify-between border-b bg-background px-4">
        <button
          onClick={onClose}
          aria-label="Geri dön"
          className="grid size-9 place-items-center rounded-full bg-muted/60 hover:bg-muted"
        >
          <ArrowLeft className="size-5 text-foreground" />
        </button>
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{product.categoryName || "GölBOX Menü"}</h2>
        <button
          onClick={() => token ? toggleFavorite(product.id) : showToast("Favorilere eklemek için giriş yapmalısın.")}
          aria-label={isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"}
          className="grid size-9 place-items-center rounded-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40"
        >
          <Heart className={`size-5 ${isFavorite ? "fill-rose-500 text-rose-500" : "text-rose-500"}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-36 pt-4">
        <div className="mx-auto max-w-xl space-y-5">
          {/* Main Hero Card Image with Dynamic Badges from Backend */}
          <div className="relative h-64 overflow-hidden rounded-3xl bg-muted shadow-md">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-emerald-900/10 text-emerald-800">
                <span className="font-serif text-2xl font-bold">{product.name}</span>
              </div>
            )}
            
            {/* Dynamic Badges floating at top-left from Admin Config */}
            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              {product.isNew && (
                <span className="rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white shadow-md">
                  YENİ
                </span>
              )}
              {product.isPopular && (
                <span className="rounded-full bg-rose-600 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white shadow-md">
                  ÇOK SEVİLEN
                </span>
              )}
              {product.badge && (
                <span className="rounded-full bg-amber-400 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-amber-950 shadow-md">
                  {product.badge}
                </span>
              )}
              {hasDiscount && (
                <span className="rounded-full bg-rose-500 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white shadow-md">
                  %{discountPercent} İNDİRİM
                </span>
              )}
            </div>
          </div>

          {/* Title and Description */}
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-foreground">{product.name}</h1>
            <p className="text-xs leading-5 text-muted-foreground">{product.description}</p>
          </div>

          {/* Price Header & Recipe Bookmark */}
          <div className="flex items-center justify-between gap-3 border-t border-b border-border/60 py-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">BAŞLANGIÇ FİYATI</p>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                  ₺{product.price.toLocaleString("tr-TR")}
                </span>
                {product.originalPrice && product.originalPrice > product.price ? (
                  <span className="text-sm font-semibold text-muted-foreground line-through">
                    ₺{product.originalPrice.toLocaleString("tr-TR")}
                  </span>
                ) : null}
                {hasDiscount && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    <Sparkles className="size-3" /> İNDİRİMLİ
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                setSavedRecipe(!savedRecipe)
                showToast(savedRecipe ? "Özel reçeteniz kaldırıldı." : "Özel reçeteniz kayıtlı tercihlerinize eklendi.")
              }}
              className={`flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-xs font-semibold transition ${
                savedRecipe
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                  : "border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              <Bookmark className={`size-3.5 ${savedRecipe ? "fill-emerald-700 text-emerald-700" : ""}`} />
              {savedRecipe ? "Reçeteniz Saklandı" : "Özel Reçetemi Sakla"}
            </button>
          </div>

          {/* Allergen & Ingredients if available from DB */}
          {(product.ingredients || product.allergenInfo) ? (
            <div className="grid gap-3 rounded-2xl border bg-card p-4 text-xs sm:grid-cols-2">
              {product.ingredients ? (
                <div>
                  <span className="font-bold text-foreground">İçindekiler</span>
                  <p className="mt-0.5 text-muted-foreground">{product.ingredients}</p>
                </div>
              ) : null}
              {product.allergenInfo ? (
                <div>
                  <span className="font-bold text-amber-700 dark:text-amber-400">Alerjen Uyarısı</span>
                  <p className="mt-0.5 text-muted-foreground">{product.allergenInfo}</p>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Fully Dynamic Customization Option Groups from DB */}
          {groups.length > 0 && (
            <div className="space-y-6 pt-2">
              <h3 className="text-base font-extrabold text-foreground">Ürün Tercihleri & Seçenekler</h3>

              {groups.map((group: MenuOptionGroup, index: number) => {
                const isPillGrid = group.options.length <= 4

                return (
                  <section key={group.id} aria-labelledby={`group-${group.id}`} className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 id={`group-${group.id}`} className="text-xs font-bold uppercase tracking-wider text-foreground">
                        {index + 1}. {group.name.toUpperCase()} {group.isRequired ? <span className="text-rose-500">*</span> : null}
                      </h4>
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {group.isRequired ? "Zorunlu" : `Opsiyonel (Maks ${group.maxSelect})`}
                      </span>
                    </div>

                    {isPillGrid ? (
                      /* Grid Pill Layout for small option groups */
                      <div className="grid grid-cols-3 gap-2.5">
                        {group.options.map((option) => {
                          const selected = selections[group.id]?.includes(option.id) ?? false
                          return (
                            <button
                              key={option.id}
                              onClick={() => toggleOption(group, option.id)}
                              aria-pressed={selected}
                              className={`flex flex-col items-center justify-center rounded-2xl border p-3 text-center transition-all ${
                                selected
                                  ? "border-2 border-emerald-600 bg-emerald-50/80 text-emerald-950 font-bold shadow-sm dark:bg-emerald-950/60 dark:text-emerald-100"
                                  : "border-border bg-card text-foreground font-medium hover:border-emerald-300"
                              }`}
                            >
                              <span className="text-xs font-bold">{option.name}</span>
                              <span className="mt-1 text-[10px] text-muted-foreground">
                                {option.priceModifier > 0 ? `+₺${option.priceModifier}` : "Standart"}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      /* List Layout for large option groups */
                      <div className="grid gap-2">
                        {group.options.map((option) => {
                          const selected = selections[group.id]?.includes(option.id) ?? false
                          return (
                            <button
                              key={option.id}
                              onClick={() => toggleOption(group, option.id)}
                              aria-pressed={selected}
                              className={`flex min-h-12 items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                                selected
                                  ? "border-2 border-emerald-600 bg-emerald-50/80 text-emerald-950 font-bold dark:bg-emerald-950/60 dark:text-emerald-100"
                                  : "border-border bg-card hover:border-emerald-300"
                              }`}
                            >
                              <span className="flex items-center gap-3">
                                <span
                                  className={`grid size-5 place-items-center rounded-full border ${
                                    selected ? "border-emerald-600 bg-emerald-600 text-white" : "border-muted-foreground/40"
                                  }`}
                                >
                                  {selected ? <Check className="size-3 stroke-[3]" /> : null}
                                </span>
                                <span className="text-xs font-semibold">{option.name}</span>
                              </span>
                              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                {option.priceModifier > 0 ? `+₺${option.priceModifier}` : "Dahil"}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </section>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Sticky Action Bar */}
      <div className="fixed inset-x-0 bottom-0 border-t bg-background/95 p-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          {/* Quantity Counter (Standard Muted Border Styling) */}
          <div className="flex h-13 items-center rounded-2xl border border-border bg-card px-1 text-foreground shadow-2xs">
            <button
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              aria-label="Adedi azalt"
              className="grid size-10 place-items-center rounded-xl hover:bg-muted active:scale-95 transition"
            >
              <Minus className="size-4 stroke-[2.5]" />
            </button>
            <span className="w-7 text-center font-bold text-sm">{quantity}</span>
            <button
              onClick={() => setQuantity((value) => Math.min(50, value + 1))}
              aria-label="Adedi artır"
              className="grid size-10 place-items-center rounded-xl hover:bg-muted active:scale-95 transition"
            >
              <Plus className="size-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Total & Sepete Ekle Button */}
          <button
            onClick={add}
            className="flex h-13 flex-1 items-center justify-between rounded-3xl bg-emerald-800 px-6 font-extrabold text-white shadow-lg shadow-emerald-900/20 hover:bg-emerald-900 active:scale-[0.99] transition-all"
          >
            <div className="flex flex-col text-left">
              <span className="text-[10px] uppercase tracking-wider text-emerald-200">TOPLAM TUTAR</span>
              <span className="text-base font-black">₺{totalPrice.toLocaleString("tr-TR")}</span>
            </div>
            <span className="flex items-center gap-2 text-sm font-black">
              Sepete Ekle &gt;
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
