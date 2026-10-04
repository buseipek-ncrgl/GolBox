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
  Zap,
  GraduationCap,
  Coffee,
  Check,
  Flame,
  Info,
  Award,
  Bookmark,
  Share2,
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
  const { token, favorites, toggleFavorite, saveCustomConfiguration } = useGolbox()
  const showToast = useGolToast()

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

  // DYNAMIC CALCULATED LIVE PRICE (SECTION 10 & 36)
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

  // CUSTOMIZATION SUMMARY TEXT (SECTION 86)
  const configurationSummary = useMemo(() => {
    if (!isCustomizable) return "Standart Paket"
    const parts = [selectedSize.name, selectedMilk.name]
    if (selectedEspresso.priceDelta > 0) parts.push(selectedEspresso.name)
    if (selectedSyrups.length > 0) parts.push(selectedSyrups.map(s => s.name).join(", "))
    if (isColdDrink) parts.push(selectedIce.name)
    if (selectedExtras.length > 0) parts.push(selectedExtras.map(e => e.name).join(", "))
    return parts.join(" · ")
  }, [isCustomizable, selectedSize, selectedMilk, selectedEspresso, selectedSyrups, isColdDrink, selectedIce, selectedExtras])

  // ADD TO CART HANDLER (SECTION 39 & 92)
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
    }, 400)
  }

  // SAVE CUSTOM CONFIGURATION HANDLER (SECTION 51 & 52)
  const handleSaveRecipe = (e: React.FormEvent) => {
    e.preventDefault()
    saveCustomConfiguration(recipeName || `${product.name} Reçetem`, product.id, configurationSummary)
    setShowSaveModal(false)
    setRecipeName("")
    showToast("Reçeteniz Benim GölBOX'ım alanına kaydedildi! ⭐")
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background overflow-y-auto animate-in fade-in duration-200 no-scrollbar">
      {/* 1. UPPER NAVIGATION (SECTION 4) */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/40 bg-background/95 px-4 py-3 backdrop-blur-md">
        <button
          onClick={onClose}
          className="flex size-10 items-center justify-center rounded-2xl border border-border/80 bg-card text-foreground shadow-2xs hover:bg-accent transition active:scale-95"
          aria-label="Geri Dön"
        >
          <ArrowLeft className="size-5" />
        </button>

        <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
          GölBOX Ürün Detayı
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleFavorite(product.id)
          }}
          className="flex size-10 items-center justify-center rounded-2xl border border-border/80 bg-card shadow-2xs hover:bg-accent transition active:scale-95"
          aria-label="Favorilere Ekle"
        >
          <Heart className={`size-5 ${isFavorite ? "fill-rose-500 text-rose-500" : "text-foreground/70"}`} />
        </button>
      </header>

      {/* MAIN SCROLL CONTENT */}
      <div className="flex-1 space-y-5 px-4 pt-3 pb-36 max-w-2xl mx-auto w-full">
        {/* 2. LARGE HERO IMAGE & BADGES (SECTION 5 & 11) */}
        <div className="relative aspect-4/3 w-full overflow-hidden rounded-3xl bg-muted border border-border/60 shadow-md">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="size-full object-cover"
          />

          {/* BADGES OVERLAY */}
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {product.badge && (
              <span className="rounded-xl bg-amber-400 px-2.5 py-1 text-[10px] font-black text-amber-950 shadow-sm">
                {product.badge}
              </span>
            )}
            {product.isNew && (
              <span className="rounded-xl bg-emerald-600 px-2.5 py-1 text-[10px] font-black text-white shadow-sm">
                YENİ
              </span>
            )}
            {product.isPopular && (
              <span className="rounded-xl bg-rose-600 px-2.5 py-1 text-[10px] font-black text-white shadow-sm">
                ÇOK SEVİLEN
              </span>
            )}
          </div>
        </div>

        {/* 3. PRODUCT TITLE, DESCRIPTION & PRICE (SECTION 7, 9 & 10) */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-xl font-black tracking-tight text-foreground">{product.name}</h1>
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
                    <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">₺{product.studentPrice}</span>
                    <span className="text-sm font-semibold text-muted-foreground line-through">₺{product.price}</span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 text-[10px] font-black text-emerald-700 dark:text-emerald-300">
                      <Sparkles className="size-3.5 text-amber-500" /> ÖZEL İNDİRİM
                    </span>
                  </div>
                ) : (
                  <span className="text-xl font-black text-primary">₺{product.price}</span>
                )}
              </div>
            </div>

            {/* SAVE RECIPE BUTTON (SECTION 51 & 52) */}
            {isCustomizable && (
              <button
                onClick={() => setShowSaveModal(true)}
                className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-extrabold text-primary hover:bg-primary/20 transition active:scale-95"
              >
                <Bookmark className="size-4" /> Reçetemi Kaydet
              </button>
            )}
          </div>
        </div>

        {/* 4. "KAHVENİ TANI" LEZZET PROFİLİ (SECTION 79) */}
        {isCustomizable && (
          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs space-y-2.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="size-4 text-amber-500 fill-amber-400" /> Kahveni Tanı
            </h3>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-accent p-2">
                <p className="text-[10px] font-bold text-muted-foreground">Yoğunluk</p>
                <p className="text-xs font-black text-foreground mt-0.5">●●●○○</p>
              </div>
              <div className="rounded-xl bg-accent p-2">
                <p className="text-[10px] font-bold text-muted-foreground">Tatlılık</p>
                <p className="text-xs font-black text-foreground mt-0.5">●●○○○</p>
              </div>
              <div className="rounded-xl bg-accent p-2">
                <p className="text-[10px] font-bold text-muted-foreground">Süt Dengesi</p>
                <p className="text-xs font-black text-foreground mt-0.5">●●●●○</p>
              </div>
            </div>
          </div>
        )}

        {/* 5. DATA-DRIVEN CUSTOMIZATION GROUPS (SECTION 12 - 35 & 85) */}
        {isCustomizable && (
          <div className="space-y-5 pt-2">
            <h2 className="text-base font-black tracking-tight text-foreground border-b border-border/60 pb-2">
              Kahveni Kendine Göre Hazırla
            </h2>

            {/* GROUP 1: BOY SEÇİMİ (SECTION 14 & 15) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider">
                  1. Boyunu Seç <span className="text-rose-500">*</span>
                </h3>
                <span className="text-[10px] font-bold text-muted-foreground">Zorunlu</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {DEFAULT_SIZE_GROUP.options.map((opt) => {
                  const isChecked = selectedSize.id === opt.id
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedSize(opt)}
                      className={`flex flex-col items-center justify-center rounded-2xl border p-3 transition-all ${
                        isChecked
                          ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30 text-primary"
                          : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      <span className="text-xs font-black">{opt.name}</span>
                      <span className="text-[10px] opacity-80 mt-0.5">{opt.detail}</span>
                      {opt.priceDelta > 0 && (
                        <span className="mt-1 text-[10px] font-extrabold text-primary">+₺{opt.priceDelta}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* GROUP 2: SÜT SEÇİMİ (SECTION 17) */}
            <div className="space-y-2">
              <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider">
                2. Süt Tercihi
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {DEFAULT_MILK_GROUP.options.map((opt) => {
                  const isChecked = selectedMilk.id === opt.id
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedMilk(opt)}
                      className={`flex items-center justify-between rounded-2xl border p-3 text-left transition-all ${
                        isChecked
                          ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30 text-primary"
                          : "border-border bg-card text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      <div>
                        <p className="text-xs font-extrabold">{opt.name}</p>
                        <p className="text-[10px] opacity-75">{opt.detail}</p>
                      </div>
                      <div className="text-right">
                        {opt.priceDelta > 0 ? (
                          <span className="text-xs font-black text-primary">+₺{opt.priceDelta}</span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Ücretsiz</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* GROUP 3: ESPRESSO SHOT (SECTION 19) */}
            <div className="space-y-2">
              <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider">
                3. Espresso Miktarı
              </h3>
              <div className="space-y-1.5">
                {DEFAULT_ESPRESSO_GROUP.options.map((opt) => {
                  const isChecked = selectedEspresso.id === opt.id
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedEspresso(opt)}
                      className={`flex w-full items-center justify-between rounded-2xl border p-3 text-xs font-extrabold transition-all ${
                        isChecked
                          ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/30"
                          : "border-border bg-card text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      <span>{opt.name}</span>
                      {isChecked && <Check className="size-4 text-primary" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* GROUP 4: AROMA & ŞURUP (SECTION 21) */}
            <div className="space-y-2">
              <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider">
                4. Aroma & Şurup (İsteğe Bağlı)
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
                      className={`flex flex-col items-center justify-center rounded-2xl border p-3 text-center transition-all ${
                        isChecked
                          ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/30 font-black"
                          : "border-border bg-card text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      <span className="text-xs">{opt.name}</span>
                      <span className="mt-1 text-[10px] font-extrabold text-primary">+₺{opt.priceDelta}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* GROUP 5: BUZ SEVİYESİ (COLD DRINKS ONLY - SECTION 24) */}
            {isColdDrink && (
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider">
                  5. Buz Seviyesi
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {DEFAULT_ICE_GROUP.options.map((opt) => {
                    const isChecked = selectedIce.id === opt.id
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setSelectedIce(opt)}
                        className={`flex items-center justify-center rounded-2xl border p-3 text-xs font-extrabold transition-all ${
                          isChecked
                            ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/30"
                            : "border-border bg-card text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        {opt.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* GROUP 6: EKSTRALAR & TOPPING (SECTION 27 & 28) */}
            <div className="space-y-2">
              <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider">
                6. Ekstralar & Topping
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
                      className={`flex items-center justify-between rounded-2xl border p-3 text-xs font-extrabold transition-all ${
                        isChecked
                          ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/30"
                          : "border-border bg-card text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      <span>{opt.name}</span>
                      <span className="text-[11px] font-black text-primary">+₺{opt.priceDelta}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* 6. ACCORDIONS: İÇİNDEKİLER, ALERJEN & BESİN DEDERLERİ (SECTION 43, 44, 46, 48) */}
        <div className="space-y-2 pt-3 border-t border-border/60">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <button
              onClick={() => setOpenAccordion(openAccordion === "ing" ? null : "ing")}
              className="flex w-full items-center justify-between p-3.5 text-xs font-extrabold text-foreground hover:bg-accent transition"
            >
              <span>İçindekiler</span>
              <ChevronDown className={`size-4 transition-transform ${openAccordion === "ing" ? "rotate-180" : ""}`} />
            </button>
            {openAccordion === "ing" && (
              <div className="p-3.5 pt-0 text-xs text-muted-foreground leading-relaxed border-t border-border/40">
                {product.ingredients || "%100 Arabica espresso çekirdekleri, günlük taze süt, süzme su, buz."}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <button
              onClick={() => setOpenAccordion(openAccordion === "all" ? null : "all")}
              className="flex w-full items-center justify-between p-3.5 text-xs font-extrabold text-foreground hover:bg-accent transition"
            >
              <span>Alerjen Bilgisi</span>
              <ChevronDown className={`size-4 transition-transform ${openAccordion === "all" ? "rotate-180" : ""}`} />
            </button>
            {openAccordion === "all" && (
              <div className="p-3.5 pt-0 text-xs text-muted-foreground leading-relaxed border-t border-border/40">
                {product.allergenInfo || "Süt ve süt ürünleri (laktoz) içerir. Çapraz bulaşma riski mevcuttur."}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <button
              onClick={() => setOpenAccordion(openAccordion === "nut" ? null : "nut")}
              className="flex w-full items-center justify-between p-3.5 text-xs font-extrabold text-foreground hover:bg-accent transition"
            >
              <span>Besin Değerleri (Yaklaşık)</span>
              <ChevronDown className={`size-4 transition-transform ${openAccordion === "nut" ? "rotate-180" : ""}`} />
            </button>
            {openAccordion === "nut" && (
              <div className="p-3.5 pt-0 text-xs text-muted-foreground leading-relaxed border-t border-border/40">
                {product.nutritionInfo || "180 kcal · 6g Protein · 18g Karbonhidrat · 7g Yağ"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 7. STICKY BOTTOM ADD TO CART BAR (SECTION 38, 39, 42 & 92) */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 p-4 backdrop-blur-md shadow-2xl">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          {/* QUANTITY STEPPER (SECTION 42) */}
          <div className="flex items-center gap-2 rounded-2xl bg-accent p-1.5 shrink-0 border border-border">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="flex size-9 items-center justify-center rounded-xl bg-card text-foreground font-bold shadow-xs active:scale-95 transition"
              aria-label="Adet Azalt"
            >
              <Minus className="size-4" />
            </button>
            <span className="w-6 text-center text-sm font-black text-foreground">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="flex size-9 items-center justify-center rounded-xl bg-card text-foreground font-bold shadow-xs active:scale-95 transition"
              aria-label="Adet Artır"
            >
              <Plus className="size-4" />
            </button>
          </div>

          {/* ADD TO CART BUTTON WITH DOUBLE TAP PROTECTION */}
          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            className="flex-1 flex items-center justify-between gap-2 rounded-2xl bg-primary px-5 py-4 text-xs font-black text-primary-foreground shadow-lg hover:opacity-95 active:scale-98 transition disabled:opacity-50"
          >
            <div className="text-left">
              <p className="text-[10px] uppercase font-bold opacity-80">Toplam Tutar</p>
              <p className="text-base font-black">₺{totalPrice}</p>
            </div>
            <span className="flex items-center gap-1 text-sm font-black">
              {isAddingToCart ? "Ekleniyor..." : "Sepete Ekle"} <ChevronRight className="size-5" />
            </span>
          </button>
        </div>
      </div>

      {/* SAVE CONFIGURATION MODAL */}
      {showSaveModal && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleSaveRecipe} className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-2xl border border-border text-foreground">
            <div className="flex items-center justify-between mb-3 border-b border-border/60 pb-2">
              <h3 className="text-base font-black text-foreground flex items-center gap-2">
                <Bookmark className="size-5 text-primary" /> Reçetemi Kaydet
              </h3>
              <button type="button" onClick={() => setShowSaveModal(false)} className="rounded-xl p-1.5 text-muted-foreground hover:bg-accent">
                <X className="size-5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Bu özel kahve kombinasyonuna bir isim vererek kaydedin.</p>
            <div className="mt-4">
              <label className="block text-[11px] font-extrabold text-muted-foreground mb-1 uppercase tracking-wider">Reçete Adı</label>
              <input
                type="text"
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                placeholder="Örn: Sabah Latte'm"
                required
                className="w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="mt-4 rounded-xl bg-accent p-3 text-[11px] text-muted-foreground">
              <span className="font-extrabold text-foreground">Kombinasyon:</span> {configurationSummary}
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="flex-1 rounded-xl border border-border bg-card py-2.5 text-xs font-bold text-foreground"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow"
              >
                Kaydet ⭐
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}
    </div>
  )
}
