"use client"

import React, { useState, useMemo } from "react"
import { createPortal } from "react-dom"
import {
  ArrowLeft,
  Heart,
  Plus,
  Minus,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Check,
  Bookmark,
  X
} from "lucide-react"
import { useGolbox, type MenuItem } from "@/lib/golbox-context"
import { useGolToast } from "@/components/golbox/gol-toast"

export interface OptionItem {
  id: string
  name: string
  detail?: string
  priceDelta: number
  isDefault?: boolean
  isAvailable?: boolean
}

export interface OptionGroupData {
  id: string
  name: string
  selectionType: "SINGLE" | "MULTIPLE"
  isRequired: boolean
  minSelection: number
  maxSelection: number
  options: OptionItem[]
}

const DEFAULT_SIZE_GROUP: OptionGroupData = {
  id: "grp-size",
  name: "Boyunu Seç",
  selectionType: "SINGLE",
  isRequired: true,
  minSelection: 1,
  maxSelection: 1,
  options: [
    { id: "sz-small", name: "Küçük", detail: "250 ml", priceDelta: 0, isDefault: true, isAvailable: true },
    { id: "sz-medium", name: "Orta", detail: "350 ml", priceDelta: 10, isAvailable: true },
    { id: "sz-large", name: "Büyük", detail: "450 ml", priceDelta: 18, isAvailable: true }
  ]
}

const DEFAULT_MILK_GROUP: OptionGroupData = {
  id: "grp-milk",
  name: "Süt Tercihi",
  selectionType: "SINGLE",
  isRequired: false,
  minSelection: 0,
  maxSelection: 1,
  options: [
    { id: "ml-full", name: "Tam Yağlı Süt", detail: "Klasik lezzet", priceDelta: 0, isDefault: true, isAvailable: true },
    { id: "ml-oat", name: "Yulaf Sütü", detail: "Bitkisel tercih", priceDelta: 12, isAvailable: true },
    { id: "ml-lactose", name: "Laktozsuz Süt", detail: "Hafif içim", priceDelta: 8, isAvailable: true },
    { id: "ml-almond", name: "Badem Sütü", detail: "Fındıksı aroma", priceDelta: 14, isAvailable: true }
  ]
}

const DEFAULT_ESPRESSO_GROUP: OptionGroupData = {
  id: "grp-espresso",
  name: "Espresso Miktarı",
  selectionType: "SINGLE",
  isRequired: false,
  minSelection: 0,
  maxSelection: 1,
  options: [
    { id: "esp-single", name: "Standart 1 Shot", priceDelta: 0, isDefault: true, isAvailable: true },
    { id: "esp-double", name: "Çift Shot (+12 TL)", priceDelta: 12, isAvailable: true },
    { id: "esp-triple", name: "Ekstra Yoğun 3 Shot (+20 TL)", priceDelta: 20, isAvailable: true }
  ]
}

const DEFAULT_SYRUP_GROUP: OptionGroupData = {
  id: "grp-syrup",
  name: "Aroma & Şurup",
  selectionType: "MULTIPLE",
  isRequired: false,
  minSelection: 0,
  maxSelection: 3,
  options: [
    { id: "srp-vanilla", name: "Vanilya Şurubu", priceDelta: 10, isAvailable: true },
    { id: "srp-caramel", name: "Karamel Şurubu", priceDelta: 10, isAvailable: true },
    { id: "srp-hazelnut", name: "Fındık Şurubu", priceDelta: 10, isAvailable: true }
  ]
}

const DEFAULT_ICE_GROUP: OptionGroupData = {
  id: "grp-ice",
  name: "Buz Seviyesi",
  selectionType: "SINGLE",
  isRequired: false,
  minSelection: 0,
  maxSelection: 1,
  options: [
    { id: "ice-low", name: "Az Buz", priceDelta: 0, isAvailable: true },
    { id: "ice-normal", name: "Standart Buz", priceDelta: 0, isDefault: true, isAvailable: true },
    { id: "ice-high", name: "Bol Buz", priceDelta: 0, isAvailable: true }
  ]
}

const DEFAULT_EXTRAS_GROUP: OptionGroupData = {
  id: "grp-extras",
  name: "Ekstralar & Topping",
  selectionType: "MULTIPLE",
  isRequired: false,
  minSelection: 0,
  maxSelection: 3,
  options: [
    { id: "ext-cream", name: "Krema Dokunuşu", priceDelta: 8, isAvailable: true },
    { id: "ext-caramel-sauce", name: "Karamel Sos Gezdirmesi", priceDelta: 8, isAvailable: true },
    { id: "ext-choco-sauce", name: "Çikolata Sos", priceDelta: 10, isAvailable: true }
  ]
}

export function ProductDetailScreen({
  product,
  onClose,
  onAddToCartSuccess,
}: {
  product: MenuItem & {
    studentPrice?: number
    isNew?: boolean
    isPopular?: boolean
    badge?: string
    intensity?: number
    sweetness?: number
    milkiness?: number
    ingredients?: string
    allergenInfo?: string
    nutritionInfo?: string
  }
  onClose: () => void
  onAddToCartSuccess?: (details: {
    product: MenuItem
    quantity: number
    totalPrice: number
    configurationSummary: string
  }) => void
}) {
  const { token, favorites, toggleFavorite, saveCustomConfiguration, cafes, addToFoodCart } = useGolbox()
  const showToast = useGolToast()

  // DYNAMIC PRODUCT PAIRINGS LIST ("Bunun Yanına İyi Gider")
  const pairingsList = useMemo(() => {
    const allMenuItems = cafes.flatMap((c) => c.menuItems || [])
    if (product.pairingProductIds && product.pairingProductIds.length > 0) {
      const ids = new Set(product.pairingProductIds)
      return allMenuItems.filter((m) => ids.has(m.id) && m.id !== product.id)
    }
    const isBeverage =
      !product.name.toLowerCase().includes("cheesecake") &&
      !product.name.toLowerCase().includes("simit") &&
      !product.name.toLowerCase().includes("kruvasan") &&
      !product.name.toLowerCase().includes("tatlı")
    if (isBeverage) {
      return allMenuItems
        .filter(
          (m) =>
            m.id !== product.id &&
            (m.name.toLowerCase().includes("cheesecake") ||
              m.name.toLowerCase().includes("kruvasan") ||
              m.name.toLowerCase().includes("cookie") ||
              m.name.toLowerCase().includes("tatlı"))
        )
        .slice(0, 4)
    } else {
      return allMenuItems
        .filter(
          (m) =>
            m.id !== product.id &&
            (m.name.toLowerCase().includes("latte") ||
              m.name.toLowerCase().includes("kahve") ||
              m.name.toLowerCase().includes("filtre") ||
              m.name.toLowerCase().includes("americano"))
        )
        .slice(0, 4)
    }
  }, [cafes, product.id, product.name, product.pairingProductIds])

  // CUSTOMIZATION SELECTIONS STATE
  const [selectedSize, setSelectedSize] = useState<OptionItem>(DEFAULT_SIZE_GROUP.options[0])
  const [selectedMilk, setSelectedMilk] = useState<OptionItem>(DEFAULT_MILK_GROUP.options[0])
  const [selectedEspresso, setSelectedEspresso] = useState<OptionItem>(DEFAULT_ESPRESSO_GROUP.options[0])
  const [selectedSyrups, setSelectedSyrups] = useState<OptionItem[]>([])
  const [selectedIce, setSelectedIce] = useState<OptionItem>(DEFAULT_ICE_GROUP.options[1])
  const [selectedExtras, setSelectedExtras] = useState<OptionItem[]>([])
  const [quantity, setQuantity] = useState<number>(1)

  // ACCORDIONS & SAVED CONFIG MODAL
  const [openAccordion, setOpenAccordion] = useState<string | null>(null)
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false)
  const [recipeName, setRecipeName] = useState<string>("")
  const [isAddingToCart, setIsAddingToCart] = useState<boolean>(false)

  const isFavorite = favorites.includes(product.id)
  const isColdDrink = product.name.toLowerCase().includes("iced") || product.name.toLowerCase().includes("soğuk") || product.name.toLowerCase().includes("cold")
  const isCustomizable = !product.name.toLowerCase().includes("simit") && !product.name.toLowerCase().includes("su")

  // DYNAMIC CALCULATED LIVE PRICE
  const unitExtra = useMemo(() => {
    if (!isCustomizable) return 0
    let extra = selectedSize.priceDelta + selectedMilk.priceDelta + selectedEspresso.priceDelta + (isColdDrink ? selectedIce.priceDelta : 0)
    extra += selectedSyrups.reduce((a, b) => a + b.priceDelta, 0)
    extra += selectedExtras.reduce((a, b) => a + b.priceDelta, 0)
    return extra
  }, [isCustomizable, selectedSize, selectedMilk, selectedEspresso, isColdDrink, selectedIce, selectedSyrups, selectedExtras])

  const basePrice = product.studentPrice && token ? product.studentPrice : product.price
  const unitPrice = basePrice + unitExtra
  const totalPrice = unitPrice * quantity

  // CUSTOMIZATION SUMMARY TEXT
  const configurationSummary = useMemo(() => {
    if (!isCustomizable) return "Standart Paket"
    const parts = [selectedSize.name, selectedMilk.name]
    if (selectedEspresso.priceDelta > 0) parts.push(selectedEspresso.name)
    if (selectedSyrups.length > 0) parts.push(selectedSyrups.map(s => s.name).join(", "))
    if (isColdDrink) parts.push(selectedIce.name)
    if (selectedExtras.length > 0) parts.push(selectedExtras.map(e => e.name).join(", "))
    return parts.join(" · ")
  }, [isCustomizable, selectedSize, selectedMilk, selectedEspresso, selectedSyrups, isColdDrink, selectedIce, selectedExtras])

  // ADD TO CART HANDLER WITH DOUBLE TAP PROTECTION
  const handleAddToCart = () => {
    if (isAddingToCart) return
    setIsAddingToCart(true)

    setTimeout(() => {
      setIsAddingToCart(false)
      showToast(`${product.name} (${configurationSummary}) sepete eklendi!`)
      if (onAddToCartSuccess) {
        onAddToCartSuccess({
          product,
          quantity,
          totalPrice,
          configurationSummary
        })
      }
      onClose()
    }, 300)
  }

  // SAVE CUSTOM CONFIGURATION HANDLER
  const handleSaveRecipe = (e: React.FormEvent) => {
    e.preventDefault()
    saveCustomConfiguration(recipeName || `${product.name} Reçetem`, product.id, configurationSummary)
    setShowSaveModal(false)
    setRecipeName("")
    showToast("Reçeteniz Benim GölBOX'ım alanına kaydedildi!")
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background overflow-y-auto animate-in fade-in duration-200 no-scrollbar">
      {/* 1. PAGE HEADER */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/40 bg-background/95 px-4 py-3 backdrop-blur-md">
        <button
          onClick={onClose}
          className="flex size-9 items-center justify-center rounded-xl border border-border/80 bg-card text-foreground shadow-2xs hover:bg-accent transition active:scale-95 cursor-pointer"
          aria-label="Geri Dön"
        >
          <ArrowLeft className="size-4" />
        </button>

        <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
          Ürün Detayı
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleFavorite(product.id)
          }}
          className="flex size-9 items-center justify-center rounded-xl border border-border/80 bg-card shadow-2xs hover:bg-accent transition active:scale-95 cursor-pointer"
          aria-label={isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"}
        >
          <Heart className={`size-4 ${isFavorite ? "fill-rose-500 text-rose-500" : "text-foreground/70"}`} />
        </button>
      </header>

      {/* MAIN SCROLL CONTENT */}
      <div className="flex-1 space-y-4 px-4 pt-3 pb-36 max-w-xl mx-auto w-full">
        {/* 2. PRODUCT HERO IMAGE & MAX 1 BADGE OVERLAY */}
        <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl bg-muted border border-border/60 shadow-xs">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="size-full object-cover"
          />

          {product.badge && (
            <span className="absolute left-3 top-3 rounded-md bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-950 shadow-2xs">
              {product.badge}
            </span>
          )}
        </div>

        {/* 3. PRODUCT TITLE, DESCRIPTION & PRICE */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground">{product.name}</h1>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                {product.description || "GölBOX mutfağından taze hazırlanmış özel lezzet."}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border/50 pt-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                {isCustomizable ? "Başlangıç Fiyatı" : "Birim Fiyat"}
              </p>
              <div className="flex items-center gap-2">
                {product.studentPrice ? (
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400">₺{product.studentPrice}</span>
                    <span className="text-xs font-medium text-muted-foreground line-through">₺{product.price}</span>
                  </div>
                ) : (
                  <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400">₺{product.price}</span>
                )}
              </div>
            </div>

            {/* SAVE CONFIGURATION BUTTON */}
            {isCustomizable && (
              <button
                onClick={() => setShowSaveModal(true)}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-700/30 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 transition active:scale-95 cursor-pointer"
              >
                <Bookmark className="size-3.5" /> Tercihleri Kaydet
              </button>
            )}
          </div>
        </div>

        {/* 4. "KAHVENİ TANI" MINIMAL TASTE PROFILE */}
        {isCustomizable && (
          <div className="rounded-2xl border border-border/80 bg-card p-3.5 shadow-2xs space-y-2">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Kahveni Tanı
            </h3>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-accent/60 p-2">
                <p className="text-[10px] font-medium text-muted-foreground">Yoğunluk</p>
                <p className="text-xs font-bold text-foreground mt-0.5">●●●○○</p>
              </div>
              <div className="rounded-xl bg-accent/60 p-2">
                <p className="text-[10px] font-medium text-muted-foreground">Tatlılık</p>
                <p className="text-xs font-bold text-foreground mt-0.5">●●○○○</p>
              </div>
              <div className="rounded-xl bg-accent/60 p-2">
                <p className="text-[10px] font-medium text-muted-foreground">Süt Dengesi</p>
                <p className="text-xs font-bold text-foreground mt-0.5">●●●●○</p>
              </div>
            </div>
          </div>
        )}

        {/* 5. DATA-DRIVEN CUSTOMIZATION GROUPS */}
        {isCustomizable && (
          <div className="space-y-4 pt-1">
            <h2 className="text-sm font-bold text-foreground border-b border-border/60 pb-2">
              Kahveni Kendine Göre Hazırla
            </h2>

            {/* GROUP 1: BOYUT SEÇİMİ */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Boyut <span className="text-emerald-600 font-normal text-[11px] lowercase">(zorunlu)</span>
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {DEFAULT_SIZE_GROUP.options.map((opt) => {
                  const isChecked = selectedSize.id === opt.id
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedSize(opt)}
                      className={`flex flex-col items-center justify-center rounded-2xl border p-2.5 transition-all cursor-pointer ${
                        isChecked
                          ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 font-bold"
                          : "border-border bg-card text-muted-foreground hover:bg-accent/60"
                      }`}
                    >
                      <span className="text-xs">{opt.name}</span>
                      <span className="text-[10px] opacity-75 mt-0.5">{opt.detail}</span>
                      {opt.priceDelta > 0 && (
                        <span className="mt-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">+₺{opt.priceDelta}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* GROUP 2: SÜT TERCİHİ */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Süt Tercihi
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {DEFAULT_MILK_GROUP.options.map((opt) => {
                  const isChecked = selectedMilk.id === opt.id
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedMilk(opt)}
                      className={`flex items-center justify-between rounded-2xl border p-2.5 text-left transition-all cursor-pointer ${
                        isChecked
                          ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 font-bold"
                          : "border-border bg-card text-muted-foreground hover:bg-accent/60"
                      }`}
                    >
                      <div>
                        <p className="text-xs">{opt.name}</p>
                        <p className="text-[10px] opacity-75">{opt.detail}</p>
                      </div>
                      <div className="text-right">
                        {opt.priceDelta > 0 ? (
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">+₺{opt.priceDelta}</span>
                        ) : (
                          <span className="text-[10px] font-semibold text-muted-foreground">Ücretsiz</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* GROUP 3: ESPRESSO MİKTARI */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Espresso Miktarı
              </h3>
              <div className="space-y-1.5">
                {DEFAULT_ESPRESSO_GROUP.options.map((opt) => {
                  const isChecked = selectedEspresso.id === opt.id
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedEspresso(opt)}
                      className={`flex w-full items-center justify-between rounded-2xl border p-2.5 text-xs font-semibold transition-all cursor-pointer ${
                        isChecked
                          ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 font-bold"
                          : "border-border bg-card text-muted-foreground hover:bg-accent/60"
                      }`}
                    >
                      <span>{opt.name}</span>
                      {isChecked && <Check className="size-4 text-emerald-600 dark:text-emerald-400" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* GROUP 4: AROMA & ŞURUP */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Aroma & Şurup
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {DEFAULT_SYRUP_GROUP.options.map((opt) => {
                  const isChecked = selectedSyrups.some((s) => s.id === opt.id)
                  return (
                    <button
                      key={opt.id}
                      onClick={() =>
                        setSelectedSyrups((prev) =>
                          isChecked ? prev.filter((s) => s.id !== opt.id) : [...prev, opt]
                        )
                      }
                      className={`flex flex-col items-center justify-center rounded-2xl border p-2.5 text-center transition-all cursor-pointer ${
                        isChecked
                          ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 font-bold"
                          : "border-border bg-card text-muted-foreground hover:bg-accent/60"
                      }`}
                    >
                      <span className="text-xs">{opt.name}</span>
                      <span className="mt-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">+₺{opt.priceDelta}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* GROUP 5: BUZ SEVİYESİ (COLD DRINKS ONLY) */}
            {isColdDrink && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Buz Seviyesi
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {DEFAULT_ICE_GROUP.options.map((opt) => {
                    const isChecked = selectedIce.id === opt.id
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setSelectedIce(opt)}
                        className={`flex items-center justify-center rounded-2xl border p-2.5 text-xs font-bold transition-all cursor-pointer ${
                          isChecked
                            ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 font-bold"
                            : "border-border bg-card text-muted-foreground hover:bg-accent/60"
                        }`}
                      >
                        {opt.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* GROUP 6: EKSTRALAR & TOPPING */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Ekstralar & Topping
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {DEFAULT_EXTRAS_GROUP.options.map((opt) => {
                  const isChecked = selectedExtras.some((e) => e.id === opt.id)
                  return (
                    <button
                      key={opt.id}
                      onClick={() =>
                        setSelectedExtras((prev) =>
                          isChecked ? prev.filter((e) => e.id !== opt.id) : [...prev, opt]
                        )
                      }
                      className={`flex items-center justify-between rounded-2xl border p-2.5 text-xs font-bold transition-all cursor-pointer ${
                        isChecked
                          ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 font-bold"
                          : "border-border bg-card text-muted-foreground hover:bg-accent/60"
                      }`}
                    >
                      <span>{opt.name}</span>
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">+₺{opt.priceDelta}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* 6. ACCORDIONS: İÇİNDEKİLER & ALERJEN BİLGİSİ (ONLY IF DATA EXISTS) */}
        {(product.ingredients || product.allergenInfo) && (
          <div className="space-y-2 pt-2 border-t border-border/60">
            {product.ingredients && (
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setOpenAccordion(openAccordion === "ing" ? null : "ing")}
                  className="flex w-full items-center justify-between p-3 text-xs font-bold text-foreground hover:bg-accent/60 transition cursor-pointer"
                >
                  <span>İçindekiler</span>
                  <ChevronDown className={`size-4 transition-transform ${openAccordion === "ing" ? "rotate-180" : ""}`} />
                </button>
                {openAccordion === "ing" && (
                  <div className="p-3 pt-0 text-xs text-muted-foreground leading-relaxed border-t border-border/40">
                    {product.ingredients}
                  </div>
                )}
              </div>
            )}

            {product.allergenInfo && (
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setOpenAccordion(openAccordion === "all" ? null : "all")}
                  className="flex w-full items-center justify-between p-3 text-xs font-bold text-foreground hover:bg-accent/60 transition cursor-pointer"
                >
                  <span>Alerjen Bilgisi</span>
                  <ChevronDown className={`size-4 transition-transform ${openAccordion === "all" ? "rotate-180" : ""}`} />
                </button>
                {openAccordion === "all" && (
                  <div className="p-3 pt-0 text-xs text-muted-foreground leading-relaxed border-t border-border/40">
                    {product.allergenInfo}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 7. "BUNUN YANINA İYİ GİDER" (PRODUCT PAIRINGS / RECOMMENDATIONS) */}
        {pairingsList.length > 0 && (
          <div className="space-y-2.5 pt-3 border-t border-border/60">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Bunun Yanına İyi Gider ☕✨
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {pairingsList.map((pairItem) => (
                <div
                  key={pairItem.id}
                  className="flex w-40 shrink-0 flex-col justify-between rounded-2xl border border-border bg-card p-2.5 shadow-2xs space-y-2"
                >
                  <div className="aspect-square w-full overflow-hidden rounded-xl bg-muted">
                    <img
                      src={pairItem.imageUrl || "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&q=80"}
                      alt={pairItem.name}
                      className="size-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground truncate">{pairItem.name}</h4>
                    <p className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 mt-0.5">
                      ₺{pairItem.price}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      addToFoodCart(pairItem, 1, "Standart", pairItem.price)
                      showToast(`${pairItem.name} sepete eklendi!`)
                    }}
                    className="flex w-full items-center justify-center gap-1 rounded-xl bg-emerald-700 py-1.5 text-[11px] font-bold text-white shadow-2xs hover:bg-emerald-800 transition active:scale-95 cursor-pointer"
                  >
                    <Plus className="size-3" /> Ekle
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 7. STICKY BOTTOM ADD TO CART BAR */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3.5 backdrop-blur-md shadow-xl">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          {/* QUANTITY STEPPER */}
          <div className="flex items-center gap-2 rounded-2xl bg-accent/60 p-1 shrink-0 border border-border">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="flex size-8 items-center justify-center rounded-xl bg-card text-foreground font-bold shadow-2xs active:scale-95 transition cursor-pointer"
              aria-label="Adedi azalt"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="w-5 text-center text-xs font-extrabold text-foreground">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="flex size-8 items-center justify-center rounded-xl bg-card text-foreground font-bold shadow-2xs active:scale-95 transition cursor-pointer"
              aria-label="Adedi artır"
            >
              <Plus className="size-3.5" />
            </button>
          </div>

          {/* ADD TO CART BUTTON WITH DOUBLE-TAP PROTECTION */}
          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            className="flex-1 flex items-center justify-between gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-800 active:scale-98 transition cursor-pointer disabled:opacity-50"
          >
            <div className="text-left">
              <p className="text-[10px] font-medium opacity-80">Toplam Tutar</p>
              <p className="text-sm font-extrabold">₺{totalPrice}</p>
            </div>
            <span className="flex items-center gap-1 text-xs font-extrabold">
              {isAddingToCart ? "Ekleniyor..." : "Sepete Ekle"} <ChevronRight className="size-4" />
            </span>
          </button>
        </div>
      </div>

      {/* SAVE CONFIGURATION MODAL */}
      {showSaveModal && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleSaveRecipe} className="w-full max-w-sm rounded-3xl bg-card p-5 shadow-2xl border border-border text-foreground">
            <div className="flex items-center justify-between mb-3 border-b border-border/60 pb-2">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Bookmark className="size-4 text-emerald-600" /> Tercihlerimi Kaydet
              </h3>
              <button type="button" onClick={() => setShowSaveModal(false)} className="rounded-xl p-1 text-muted-foreground hover:bg-accent">
                <X className="size-5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Bu kahve tercihinizi kaydederek tek tıkla sipariş verebilirsiniz.</p>
            <div className="mt-3">
              <label className="block text-[10px] font-extrabold text-muted-foreground mb-1 uppercase tracking-wider">Reçete Adı</label>
              <input
                type="text"
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                placeholder="Örn: Favori Latte'm"
                required
                className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
              />
            </div>
            <div className="mt-3 rounded-xl bg-accent/60 p-2.5 text-[11px] text-muted-foreground">
              <span className="font-bold text-foreground">Seçimler:</span> {configurationSummary}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="flex-1 rounded-xl border border-border bg-card py-2 text-xs font-bold text-foreground cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-emerald-700 py-2 text-xs font-bold text-white shadow-2xs hover:bg-emerald-800 transition cursor-pointer"
              >
                Kaydet
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}
    </div>
  )
}
