"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import { createPortal } from "react-dom"
import {
  ArrowLeft,
  Search,
  MapPin,
  Navigation,
  Heart,
  Check,
  Clock,
  Coffee,
  Info,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Wifi,
  Car,
  Accessibility,
  Store,
  Compass,
  X,
  Building2,
  Phone
} from "lucide-react"
import { useGolbox, type SelectedBranch } from "@/lib/golbox-context"
import { useGolToast } from "@/components/golbox/gol-toast"
import { useCitizenLocation } from "@/lib/use-citizen-location"
import { BranchDetailScreen, type BranchData } from "./branch-detail-screen"

export const GOLBOX_BRANCHES_CATALOG: BranchData[] = [
  {
    id: "33333333-3333-3333-3333-333333333333",
    name: "Şehitkamil Kitap Kafe",
    shortAddress: "İncilipınar Mah. Muammer Aksoy Bulv., Şehitkamil",
    fullAddress: "İncilipınar Mah. Muammer Aksoy Bulv. No:12, Şehitkamil / Gaziantep",
    city: "Gaziantep",
    district: "Şehitkamil",
    latitude: 37.0662,
    longitude: 37.3781,
    distanceMeters: 500,
    isOpen: true,
    closesAt: "23:00",
    pickupStatus: "ACCEPTING",
    estimatedMin: 5,
    estimatedMax: 8,
    phone: "0342 320 00 01",
    imageUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80",
    workingHours: {
      "Pazartesi": "07:30 – 23:00",
      "Salı": "07:30 – 23:00",
      "Çarşamba": "07:30 – 23:00",
      "Perşembe": "07:30 – 23:00",
      "Cuma": "07:30 – 23:00",
      "Cumartesi": "08:00 – 23:00",
      "Pazar": "08:00 – 22:30"
    },
    features: ["Wi-Fi", "Açık Alan", "Çalışma Alanı", "Erişilebilir Giriş", "Otopark"]
  },
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "GölBOX Test Şubesi 2",
    shortAddress: "Atatürk Mah. 15. Sok., Şehitkamil",
    fullAddress: "Atatürk Mah. 15. Sok. No:4, Şehitkamil / Gaziantep",
    city: "Gaziantep",
    district: "Şehitkamil",
    latitude: 37.0352,
    longitude: 37.3182,
    distanceMeters: 1200,
    isOpen: true,
    closesAt: "23:00",
    pickupStatus: "ACCEPTING",
    estimatedMin: 8,
    estimatedMax: 12,
    phone: "0342 320 00 02",
    imageUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&auto=format&fit=crop&q=80",
    workingHours: {
      "Pazartesi": "07:30 – 23:00",
      "Salı": "07:30 – 23:00",
      "Çarşamba": "07:30 – 23:00",
      "Perşembe": "07:30 – 23:00",
      "Cuma": "07:30 – 23:00",
      "Cumartesi": "08:00 – 23:00",
      "Pazar": "09:00 – 22:00"
    },
    features: ["Wi-Fi", "Açık Alan", "Çalışma Alanı", "Erişilebilir Giriş"]
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "GölBOX Test Şubesi 3",
    shortAddress: "Dülük Mah. 1. Sok., Şehitkamil",
    fullAddress: "Dülük Mah. 1. Sok. No:8, Şehitkamil / Gaziantep",
    city: "Gaziantep",
    district: "Şehitkamil",
    latitude: 37.1085,
    longitude: 37.3450,
    distanceMeters: 3100,
    isOpen: true,
    closesAt: "23:00",
    pickupStatus: "ACCEPTING",
    estimatedMin: 10,
    estimatedMax: 15,
    phone: "0342 320 00 03",
    imageUrl: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=600&auto=format&fit=crop&q=80",
    workingHours: {
      "Pazartesi": "07:30 – 23:00",
      "Salı": "07:30 – 23:00",
      "Çarşamba": "07:30 – 23:00",
      "Perşembe": "07:30 – 23:00",
      "Cuma": "07:30 – 23:00",
      "Cumartesi": "09:00 – 23:00",
      "Pazar": "09:00 – 22:00"
    },
    features: ["Açık Alan", "Manzara", "Erişilebilir Giriş", "Otopark"]
  }
]

export function BranchesScreen({
  onBack,
  onSelectBranchSuccess,
  onNavigateToMenu
}: {
  onBack: () => void
  onSelectBranchSuccess?: (branch: SelectedBranch) => void
  onNavigateToMenu?: () => void
}) {
  const { selectedBranch, setSelectedBranch, foodCart, cafes } = useGolbox()
  const showToast = useGolToast()
  const { origin, usingFallback } = useCitizenLocation()

  const [search, setSearch] = useState("")
  const [favoriteBranchIds, setFavoriteBranchIds] = useState<string[]>(["33333333-3333-3333-3333-333333333333"])
  const [activeDetailBranch, setActiveDetailBranch] = useState<BranchData | null>(null)

  const [highlightedBranchId, setHighlightedBranchId] = useState<string | null>(selectedBranch.id)
  const [pendingBranchToSelect, setPendingBranchToSelect] = useState<BranchData | null>(null)
  const [showLocationHelper, setShowLocationHelper] = useState(usingFallback)
  const [mapFailed, setMapFailed] = useState(false)

  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  // DYNAMIC BRANCHES FROM BACKEND / CONTEXT
  const allBranchesList: BranchData[] = useMemo(() => {
    if (cafes && cafes.length > 0) {
      return cafes.filter((c) => c.isActive !== false).map((c, idx) => {
        const fallback = GOLBOX_BRANCHES_CATALOG.find((b) => b.id === c.id) || GOLBOX_BRANCHES_CATALOG[idx % GOLBOX_BRANCHES_CATALOG.length]
        return {
          id: c.id,
          name: c.name,
          shortAddress: c.address || fallback?.shortAddress || "Şehitkamil / Gaziantep",
          fullAddress: c.address || fallback?.fullAddress || "Şehitkamil / Gaziantep",
          city: "Gaziantep",
          district: "Şehitkamil",
          latitude: c.latitude || fallback?.latitude || 37.0662,
          longitude: c.longitude || fallback?.longitude || 37.3781,
          distanceMeters: fallback?.distanceMeters || (idx + 1) * 600,
          isOpen: c.isOpen !== false,
          closesAt: "23:00",
          pickupStatus: "ACCEPTING",
          estimatedMin: 5,
          estimatedMax: 10,
          phone: "0342 320 00 01",
          imageUrl: c.imageUrl || fallback?.imageUrl || "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&q=80",
          workingHours: fallback?.workingHours || { "Pazartesi": "07:30 – 23:00" },
          features: fallback?.features || ["Wi-Fi", "Gel-Al", "Çalışma Alanı"]
        }
      })
    }
    return GOLBOX_BRANCHES_CATALOG
  }, [cafes])

  // FILTER BRANCHES BASED ON SEARCH QUERY
  const filteredBranches = allBranchesList.filter((branch) => {
    const q = search.toLowerCase().trim()
    if (!q) return true
    return (
      branch.name.toLowerCase().includes(q) ||
      branch.shortAddress.toLowerCase().includes(q) ||
      branch.district.toLowerCase().includes(q) ||
      branch.city.toLowerCase().includes(q)
    )
  })

  // HANDLER: SELECT BRANCH WITH CART CONFLICT CHECK (PRD SECTIONS 50, 57-64)
  const handleRequestBranchSelection = (branch: BranchData) => {
    if (foodCart.length > 0 && selectedBranch.id !== branch.id) {
      setPendingBranchToSelect(branch)
      return
    }

    commitBranchSelection(branch)
  }

  const commitBranchSelection = (branch: BranchData) => {
    const newSelected: SelectedBranch = {
      id: branch.id,
      name: branch.name,
      address: branch.fullAddress,
      latitude: branch.latitude,
      longitude: branch.longitude,
      isOpen: branch.isOpen,
      closesAt: branch.closesAt,
      pickupStatus: branch.pickupStatus,
      estimatedMin: branch.estimatedMin,
      estimatedMax: branch.estimatedMax
    }

    setSelectedBranch(newSelected)
    showToast(`${branch.name} seçildi ✓`)
    if (onSelectBranchSuccess) {
      onSelectBranchSuccess(newSelected)
    } else {
      onBack()
    }
  }

  // HANDLER: TOGGLE FAVORITE BRANCH (PRD SECTION 27)
  const handleToggleFavoriteBranch = (e: React.MouseEvent, branchId: string, branchName: string) => {
    e.stopPropagation()
    const isFav = favoriteBranchIds.includes(branchId)
    if (isFav) {
      setFavoriteBranchIds((prev) => prev.filter((id) => id !== branchId))
      showToast(`${branchName} favorilerden çıkarıldı.`)
    } else {
      setFavoriteBranchIds((prev) => [...prev, branchId])
      showToast(`${branchName} favorilerine eklendi! ♥`)
    }
  }

  // HANDLER: OPEN NATIVE MAPS FOR DIRECTIONS (PRD SECTIONS 34-35)
  const handleOpenDirections = (e: React.MouseEvent, branch: BranchData) => {
    e.stopPropagation()
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${branch.latitude},${branch.longitude}`
    window.open(mapsUrl, "_blank")
  }

  // HANDLER: SCROLL TO CARD WHEN MARKER CLICKED (PRD SECTION 8)
  const handleMarkerClick = (branchId: string) => {
    setHighlightedBranchId(branchId)
    const cardEl = cardRefs.current[branchId]
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }

  // IF BRANCH DETAIL SCREEN IS ACTIVE
  if (activeDetailBranch) {
    return (
      <BranchDetailScreen
        branch={activeDetailBranch}
        isFavorite={favoriteBranchIds.includes(activeDetailBranch.id)}
        isSelected={selectedBranch.id === activeDetailBranch.id}
        onBack={() => setActiveDetailBranch(null)}
        onToggleFavorite={(name: string) => {
          const isFav = favoriteBranchIds.includes(activeDetailBranch.id)
          if (isFav) {
            setFavoriteBranchIds((prev) => prev.filter((id) => id !== activeDetailBranch.id))
            showToast(`${name} favorilerden çıkarıldı.`)
          } else {
            setFavoriteBranchIds((prev) => [...prev, activeDetailBranch.id])
            showToast(`${name} favorilerine eklendi! ♥`)
          }
        }}
        onSelectBranch={() => {
          handleRequestBranchSelection(activeDetailBranch)
          setActiveDetailBranch(null)
        }}
        onNavigateToMenu={() => {
          commitBranchSelection(activeDetailBranch)
          setActiveDetailBranch(null)
          if (onNavigateToMenu) onNavigateToMenu()
        }}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-background overflow-y-auto no-scrollbar animate-in fade-in duration-200">
      {/* 1. HEADER (PRD SECTION 2 & 128) */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/40 bg-background/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            aria-label="Geri Dön"
            className="flex size-9 items-center justify-center rounded-xl border border-border/80 bg-card text-foreground shadow-2xs hover:bg-accent transition active:scale-95"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div>
            <h1 className="text-base font-black text-foreground">GölBOX Şubeleri</h1>
            <p className="text-[10px] text-muted-foreground font-semibold">Harita, Gel-Al Durumu & Şube Seçimi</p>
          </div>
        </div>
      </header>

      <div className="flex-1 space-y-4 px-4 py-3 pb-28 max-w-lg mx-auto w-full">
        {/* 2. SEARCH BAR (PRD SECTION 17 - 19) */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Şube, il veya ilçe ara..."
            className="w-full rounded-2xl border border-border bg-card px-4 py-3 pl-10 pr-10 text-xs font-bold text-foreground placeholder:text-muted-foreground shadow-2xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
          <Search className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* 3. EMBEDDED OPENSTREETMAP CONTAINER (REAL MAP TILES) */}
        {(() => {
          const activeBranchData = allBranchesList.find((b) => b.id === (highlightedBranchId || selectedBranch.id)) || allBranchesList[0]
          const mapLat = activeBranchData.latitude || 37.0662
          const mapLng = activeBranchData.longitude || 37.3781
          const bbox = `${mapLng - 0.015}%2C${mapLat - 0.012}%2C${mapLng + 0.015}%2C${mapLat + 0.012}`
          const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${mapLat}%2C${mapLng}`

          return (
            <div className="relative h-60 w-full overflow-hidden rounded-3xl border border-border/80 bg-slate-900 shadow-md">
              <iframe
                title="OpenStreetMap GölBOX Şubeleri"
                src={osmUrl}
                className="size-full border-0 rounded-3xl"
                loading="lazy"
              />
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-xl bg-background/90 backdrop-blur-md px-3 py-1.5 border border-border/60 shadow-md text-xs font-black text-foreground">
                <MapPin className="size-4 text-emerald-600 animate-bounce" />
                <span>{activeBranchData.name}</span>
              </div>
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between rounded-xl bg-slate-950/85 px-3 py-1.5 backdrop-blur-md border border-slate-800 text-[10px] font-bold text-slate-200">
                <span className="flex items-center gap-1">
                  <Compass className="size-3.5 text-emerald-400" /> OpenStreetMap Canlı Şube Haritası (Gaziantep)
                </span>
                <span className="text-emerald-400 font-extrabold">{filteredBranches.length} Şube</span>
              </div>
            </div>
          )
        })()}

        {/* 4. LOCATION HELPER PROMPT BANNER (PRD SECTION 15 - 16) */}
        {showLocationHelper && (
          <div className="rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/50 p-3 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-xl bg-amber-400 text-amber-950 shrink-0 font-black">
                <Navigation className="size-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-amber-900 dark:text-amber-200">
                  Sana en yakın GölBOX'ları gösterelim
                </h4>
                <p className="text-[10px] text-amber-800 dark:text-amber-300 mt-0.5">
                  Konumunu kullanarak şubeleri sana olan uzaklıklarına göre sıralayabiliriz.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1 shrink-0">
              <button
                onClick={() => {
                  setShowLocationHelper(false)
                  showToast("Konum servisleri sorgulanıyor...")
                }}
                className="rounded-xl bg-primary px-3 py-1.5 text-[10px] font-black text-primary-foreground shadow-2xs hover:bg-primary/90 active:scale-95"
              >
                Konumumu Kullan
              </button>
              <button
                onClick={() => setShowLocationHelper(false)}
                className="text-[10px] font-bold text-muted-foreground hover:underline text-center"
              >
                Şimdi Değil
              </button>
            </div>
          </div>
        )}

        {/* 5. LIST SECTION HEADER (PRD SECTION 30 - 31) */}
        <div className="flex items-center justify-between pt-1">
          <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Building2 className="size-3.5 text-primary" />
            {!usingFallback ? "Yakındaki GölBOX'lar" : "GölBOX Şubeleri"}
          </h2>
          <span className="text-[11px] font-bold text-muted-foreground bg-accent px-2 py-0.5 rounded-lg">
            {filteredBranches.length} Şube Bulundu
          </span>
        </div>

        {/* 6. SEARCH EMPTY STATE (PRD SECTION 20) */}
        {filteredBranches.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-8 text-center space-y-2">
            <Store className="mx-auto size-10 text-muted-foreground" />
            <h3 className="text-sm font-black text-foreground">Aradığın GölBOX'ı bulamadık</h3>
            <p className="text-xs text-muted-foreground">
              Şube adını veya ilçeyi kontrol ederek tekrar deneyebilirsin.
            </p>
            <button
              onClick={() => setSearch("")}
              className="mt-2 rounded-xl bg-primary px-4 py-2 text-xs font-black text-primary-foreground shadow"
            >
              Tüm Şubeleri Göster
            </button>
          </div>
        ) : (
          /* 7. BRANCH CARDS LIST (PRD SECTIONS 21 - 29) */
          <div className="space-y-3">
            {filteredBranches.map((branch) => {
              const isSelected = selectedBranch.id === branch.id
              const isFavorite = favoriteBranchIds.includes(branch.id)
              const isHighlighted = highlightedBranchId === branch.id

              return (
                <div
                  key={branch.id}
                  ref={(el) => {
                    cardRefs.current[branch.id] = el
                  }}
                  onClick={() => setActiveDetailBranch(branch)}
                  className={`cursor-pointer rounded-3xl border p-5 shadow-2xs space-y-3 transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/40 shadow-md"
                      : isHighlighted
                      ? "border-primary/60 bg-primary/5 ring-1 ring-primary/30"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  {/* CARD HEADER WITH FAVORITE HEART */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-foreground">{branch.name}</h3>
                        {isSelected && (
                          <span className="rounded-md bg-primary px-2 py-0.5 text-[9px] font-black text-primary-foreground">
                            Seçili
                          </span>
                        )}
                        {isFavorite && (
                          <span className="rounded-md bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 text-[9px] font-black">
                            Favorim ♥
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-medium mt-0.5">{branch.shortAddress}</p>
                    </div>

                    <button
                      onClick={(e) => handleToggleFavoriteBranch(e, branch.id, branch.name)}
                      aria-label="Favorilere ekle/çıkar"
                      className="rounded-xl p-1.5 text-muted-foreground hover:bg-accent transition active:scale-95"
                    >
                      <Heart
                        className={`size-4.5 transition ${
                          isFavorite ? "fill-rose-500 text-rose-500" : "text-muted-foreground hover:text-rose-500"
                        }`}
                      />
                    </button>
                  </div>

                  {/* BRANCH STATUS & METRICS ROW */}
                  <div className="flex flex-wrap items-center gap-2 text-xs border-t border-b border-border/40 py-2.5">
                    {/* DISTANCE BADGE */}
                    {!usingFallback && branch.distanceMeters && (
                      <span className="inline-flex items-center gap-1 font-bold text-foreground bg-accent px-2.5 py-1 rounded-xl text-[11px]">
                        <Navigation className="size-3 text-primary" />
                        {(branch.distanceMeters / 1000).toFixed(1)} km
                      </span>
                    )}

                    {/* STORE OPEN STATUS */}
                    {branch.isOpen ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                        Açık · {branch.closesAt}'a kadar
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950 px-2.5 py-1 rounded-xl border border-rose-200 dark:border-rose-800">
                        <span className="size-2 rounded-full bg-rose-500" />
                        Kapalı
                      </span>
                    )}

                    {/* PICKUP STATUS */}
                    {branch.pickupStatus === "ACCEPTING" ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-slate-800 dark:text-slate-200 bg-secondary px-2.5 py-1 rounded-xl">
                        <Coffee className="size-3.5 text-primary" />
                        Gel-Al aktif · {branch.estimatedMin}–{branch.estimatedMax} dk
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-2.5 py-1 rounded-xl border border-amber-300 dark:border-amber-800">
                        <AlertTriangle className="size-3 text-amber-500" />
                        Gel-Al geçici olarak duraklatıldı
                      </span>
                    )}
                  </div>

                  {/* ACTION BUTTONS: BU ŞUBEYİ SEÇ vs YOL TARİFİ (PRD SECTION 25) */}
                  <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleRequestBranchSelection(branch)}
                      className={`flex-1 flex items-center justify-center gap-1.5 rounded-2xl py-3 text-xs font-black shadow-2xs transition active:scale-95 ${
                        isSelected
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="size-4" strokeWidth={3} />
                          <span>Seçili GölBOX</span>
                        </>
                      ) : (
                        <span>Bu Şubeyi Seç</span>
                      )}
                    </button>

                    <button
                      onClick={(e) => handleOpenDirections(e, branch)}
                      className="flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-card px-4 py-3 text-xs font-bold text-foreground hover:bg-accent active:scale-95 transition"
                    >
                      <Navigation className="size-3.5 text-primary" />
                      <span>Yol Tarifi</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 8. CART CONFLICT VALIDATION MODAL (PRD SECTIONS 50, 57 - 64) */}
      {pendingBranchToSelect && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-card p-6 text-foreground shadow-2xl border border-border space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 font-black shrink-0">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-foreground">Şubeyi değiştirmek istiyor musun?</h3>
                <p className="text-[11px] text-muted-foreground font-semibold">Sepetinde {foodCart.length} ürün bulunuyor.</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed rounded-2xl bg-accent p-3">
              Sepetindeki ürünler <strong>{selectedBranch.name}</strong> için hazırlanmış. Yeni şubede (<strong>{pendingBranchToSelect.name}</strong>) fiyat veya stok durumu değişebilir.
            </p>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  const target = pendingBranchToSelect
                  setPendingBranchToSelect(null)
                  commitBranchSelection(target)
                }}
                className="w-full rounded-2xl bg-amber-500 py-3 text-xs font-black text-amber-950 shadow-md hover:bg-amber-400 active:scale-95 transition"
              >
                Şubeyi Değiştir ve Kontrol Et
              </button>
              <button
                onClick={() => setPendingBranchToSelect(null)}
                className="w-full rounded-2xl border border-border bg-card py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground active:scale-95"
              >
                Mevcut Şubede Kal ({selectedBranch.name})
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
