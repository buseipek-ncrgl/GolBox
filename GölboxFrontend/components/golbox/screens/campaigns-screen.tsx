"use client"

import React, { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import {
  ArrowLeft,
  Sparkles,
  Tag,
  Clock,
  Coffee,
  ChevronRight,
  Info,
  Check,
  Zap,
  Gift,
  Award,
  Calendar,
  MapPin,
  X,
  Store,
  Flame
} from "lucide-react"
import { useGolbox } from "@/lib/golbox-context"
import { useGolToast } from "@/components/golbox/gol-toast"
import { fetchPublicCampaigns } from "@/lib/city-content-api"

export interface CampaignData {
  id: string
  title: string
  shortDescription: string
  fullDescription: string
  imageUrl: string
  campaignType: "POINT_MULTIPLIER" | "BONUS_POINTS" | "PERCENTAGE_DISCOUNT" | "BUNDLE" | "YOUTH_OFFER" | "ANNOUNCEMENT"
  badgeText: string
  validUntil: string
  targetAudience: "ALL" | "GOLBOX_YOUTH" | "GOLBOX_MEMBERS" | "NEW_USERS"
  isPersonalized?: boolean
  isEndingSoon?: boolean
  applicableProducts: string[]
  applicableBranches: string[]
  howToUseSteps: string[]
}

export const DEMO_CAMPAIGNS: CampaignData[] = [
  {
    id: "cmp-1",
    title: "Latte'de 2X GölPuan",
    shortDescription: "Bu hafta tüm Latte siparişlerinde iki kat GölPuan kazan.",
    fullDescription: "Şehitkamil GölBOX şubelerimizden vereceğiniz tüm Iced Vanilla Latte, Caramel Latte ve Klasik Latte siparişlerinde normal puanın tam 2 katı GölPuan hesabınıza anında tanımlanır.",
    imageUrl: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80",
    campaignType: "POINT_MULTIPLIER",
    badgeText: "2X GölPuan",
    validUntil: "11 Ekim 2026",
    targetAudience: "ALL",
    isPersonalized: true,
    applicableProducts: ["Iced Vanilla Latte", "Caramel Latte", "Flat White"],
    applicableBranches: ["Tüm GölBOX Şubeleri"],
    howToUseSteps: [
      "GölBOX QR'ını kasada göster veya uygulama üzerinden Gel-Al sipariş ver.",
      "Kampanyaya uygun Latte ürününü sepetine ekle.",
      "Siparişini tamamla.",
      "İki kat GölPuan anında hesabına yüklensin!"
    ]
  },
  {
    id: "cmp-2",
    title: "GölBOX Üyelerine Özel %15 Fırsat",
    shortDescription: "Tüm üyelerimize özel sıcak içeceklerde %15 indirim.",
    fullDescription: "GölBOX üyelerine özel olarak tüm sıcak kahve ve çay çeşitlerinde anında %15 fiyat avantajı uygulanır.",
    imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80",
    campaignType: "YOUTH_OFFER",
    badgeText: "Özel Fırsat %15",
    validUntil: "31 Ekim 2026",
    targetAudience: "GOLBOX_MEMBERS",
    applicableProducts: ["GölBOX Filtre Kahve", "Flat White", "Türk Kahvesi"],
    applicableBranches: ["Tüm Şubelerde Geçerli"],
    howToUseSteps: [
      "Profilinden üyelik durumunun aktif olduğunu kontrol et.",
      "Kasada GölBOX QR kodunu tarat.",
      "%15 indirim kasada otomatik uygulansın."
    ]
  },
  {
    id: "cmp-3",
    title: "Filtre Kahve Alana +50 Bonus GP",
    shortDescription: "Günün ilk filtre kahvesinde +50 ekstra GölPuan hediye!",
    fullDescription: "GölBOX taze çekilmiş %100 Arabica Filtre Kahve siparişlerinizde normal puana ek olarak +50 bonus GölPuan hediye ediyoruz.",
    imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80",
    campaignType: "BONUS_POINTS",
    badgeText: "+50 Bonus GP",
    validUntil: "08 Ekim 2026",
    targetAudience: "ALL",
    isEndingSoon: true,
    applicableProducts: ["GölBOX Özel Filtre Kahve"],
    applicableBranches: ["Tüm GölBOX Şubeleri"],
    howToUseSteps: [
      "Filtre kahve siparişini sepetine ekle.",
      "Siparişi şubeye ilet.",
      "+50 Bonus GölPuan bakiyene anında eklensin."
    ]
  },
  {
    id: "cmp-4",
    title: "Kahveni Tatlıyla Tamamla Fırsatı",
    shortDescription: "Kahve yanına seçeceğin Belçika Çikolatalı Cheesecake ikilisinde özel fiyat!",
    fullDescription: "Herhangi bir büyük boy soğuk veya sıcak kahve alışverişinde Belçika Çikolatalı Cheesecake ₺85 yerine özel avantajlı fiyatla sepetinizde.",
    imageUrl: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600&auto=format&fit=crop&q=80",
    campaignType: "BUNDLE",
    badgeText: "Kahve + Tatlı Menü",
    validUntil: "15 Ekim 2026",
    targetAudience: "ALL",
    applicableProducts: ["Iced Vanilla Latte", "Belçika Çikolatalı Cheesecake"],
    applicableBranches: ["Tüm GölBOX Şubeleri"],
    howToUseSteps: [
      "Menüden 1 adet büyük boy kahve ve 1 adet Belçika Çikolatalı Cheesecake seç.",
      "Sepetinde indirimli paket fiyatı otomatik olarak tanımlanacaktır."
    ]
  }
]

export function CampaignsScreen({
  onBack,
  onNavigateToMenu
}: {
  onBack: () => void
  onNavigateToMenu: () => void
}) {
  const { user } = useGolbox()
  const showToast = useGolToast()

  const [selectedCampaign, setSelectedCampaign] = useState<CampaignData | null>(null)
  const [activeTab, setActiveTab] = useState<"all" | "personalized" | "youth">("all")
  const [campaigns, setCampaigns] = useState<CampaignData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetchPublicCampaigns().then(({ items }) => {
      if (!active) return
      setCampaigns(items.map((item) => ({
        id: item.id,
        title: item.title,
        shortDescription: item.description,
        fullDescription: item.description,
        imageUrl: item.imageUrl || "/placeholder.jpg",
        campaignType: "ANNOUNCEMENT",
        badgeText: "Kampanya",
        validUntil: new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(item.endDate)),
        targetAudience: item.targetUserGroup === "HighSchool" || item.targetUserGroup === "University" ? "GOLBOX_YOUTH" : "ALL",
        isPersonalized: item.targetUserGroup !== "All",
        isEndingSoon: new Date(item.endDate).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000,
        applicableProducts: item.menuItemName ? [item.menuItemName] : [],
        applicableBranches: [item.cafeName || "Tüm GölBOX şubeleri"],
        howToUseSteps: item.menuItemName
          ? ["Kampanya detaylarını inceleyin.", `${item.menuItemName} ürününü menüden seçin.`, "Siparişinizi uygulama veya şube üzerinden tamamlayın."]
          : ["Kampanya detaylarını inceleyin.", "Geçerlilik tarihleri içinde ilgili şubeyi ziyaret edin."]
      })))
    }).catch(() => { if (active) setCampaigns([]) }).finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [])

  const filteredCampaigns = campaigns.filter((c) => {
    if (activeTab === "personalized") return c.isPersonalized
    if (activeTab === "youth") return c.targetAudience === "GOLBOX_YOUTH"
    return true
  })

  // CAMPAIGN DETAIL MODAL
  if (selectedCampaign) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-background overflow-y-auto no-scrollbar animate-in fade-in duration-200">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/40 bg-background/95 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedCampaign(null)}
              aria-label="Geri Dön"
              className="flex size-9 items-center justify-center rounded-xl border border-border/80 bg-card text-foreground shadow-2xs hover:bg-accent transition active:scale-95"
            >
              <ArrowLeft className="size-4" />
            </button>
            <h1 className="text-base font-black text-foreground">Kampanya Detayı</h1>
          </div>
        </header>

        <div className="relative h-56 w-full overflow-hidden bg-slate-900 shrink-0">
          <img
            src={selectedCampaign.imageUrl}
            alt={selectedCampaign.title}
            className="size-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <span className={`absolute bottom-4 left-4 rounded-xl px-3.5 py-1.5 text-xs font-black shadow-md border ${
            selectedCampaign.campaignType === "POINT_MULTIPLIER" || selectedCampaign.campaignType === "BONUS_POINTS"
              ? "bg-[color:var(--color-gold)] text-amber-950 border-amber-300"
              : "bg-primary text-primary-foreground border-primary/40"
          }`}>
            {selectedCampaign.badgeText}
          </span>
        </div>

        <div className="flex-1 space-y-4 px-4 py-5 pb-32 max-w-lg mx-auto w-full">
          <div>
            <h2 className="text-lg font-black text-foreground tracking-tight">{selectedCampaign.title}</h2>
            <p className="text-xs font-semibold text-primary mt-1 flex items-center gap-1.5">
              <Calendar className="size-3.5" /> Son Gün: {selectedCampaign.validUntil}
            </p>
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 shadow-2xs space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Info className="size-3.5 text-primary" /> Kampanya Açıklaması
            </h3>
            <p className="text-xs text-foreground leading-relaxed font-medium">
              {selectedCampaign.fullDescription}
            </p>
          </div>

          {/* HOW TO USE STEPS */}
          <div className="rounded-3xl border border-border bg-card p-5 shadow-2xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Zap className="size-3.5 text-amber-500" /> Nasıl Kullanılır?
            </h3>
            <div className="space-y-2.5">
              {selectedCampaign.howToUseSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs">
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground font-black text-[11px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-foreground font-medium leading-snug pt-0.5">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* APPLICABLE PRODUCTS & BRANCHES */}
          <div className="rounded-3xl border border-border bg-card p-5 shadow-2xs space-y-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">Geçerli Ürünler</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {selectedCampaign.applicableProducts.map((p, i) => (
                  <span key={i} className="rounded-xl bg-accent px-2.5 py-1 text-xs font-extrabold text-foreground">
                    {p}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t border-border/40 pt-2.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">Geçerli Şubeler</span>
              <p className="text-xs font-bold text-foreground mt-0.5">{selectedCampaign.applicableBranches.join(", ")}</p>
            </div>
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-4 backdrop-blur-md">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => {
                setSelectedCampaign(null)
                onNavigateToMenu()
              }}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-xs font-black text-primary-foreground shadow-md hover:bg-primary/90 transition active:scale-95"
            >
              <Coffee className="size-4" />
              <span>Menüde Gör & Sipariş Ver</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-background overflow-y-auto no-scrollbar animate-in fade-in duration-200">
      {/* 1. HEADER */}
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
            <h1 className="text-base font-black text-foreground">Kampanyalar & Fırsatlar</h1>
            <p className="text-[10px] text-muted-foreground font-semibold">GölPuan & Üyelik Avantajları</p>
          </div>
        </div>
      </header>

      <div className="flex-1 space-y-4 px-4 py-4 pb-28 max-w-lg mx-auto w-full">
        {/* 2. TABS */}
        <div className="flex rounded-2xl bg-accent p-1">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition ${
              activeTab === "all" ? "bg-primary text-primary-foreground shadow-2xs" : "text-muted-foreground"
            }`}
          >
            Tüm Kampanyalar ({campaigns.length})
          </button>
          <button
            onClick={() => setActiveTab("personalized")}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition ${
              activeTab === "personalized" ? "bg-primary text-primary-foreground shadow-2xs" : "text-muted-foreground"
            }`}
          >
            Sana Özel
          </button>
          <button
            onClick={() => setActiveTab("youth")}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition ${
              activeTab === "youth" ? "bg-primary text-primary-foreground shadow-2xs" : "text-muted-foreground"
            }`}
          >
            Özel Fırsatlar
          </button>
        </div>

        {/* 3. CAMPAIGN CARDS LIST */}
        <div className="space-y-4">
          {isLoading && <div className="rounded-2xl border border-border bg-card p-5 text-center text-xs font-semibold text-muted-foreground">Kampanyalar yükleniyor</div>}
          {!isLoading && filteredCampaigns.length === 0 && <div className="rounded-2xl border border-border bg-card p-5 text-center"><p className="text-sm font-bold text-foreground">Aktif kampanya bulunmuyor</p><p className="mt-1 text-xs text-muted-foreground">Yeni kampanyalar yayımlandığında burada görüntülenecek.</p></div>}
          {filteredCampaigns.map((cmp) => (
            <div
              key={cmp.id}
              onClick={() => setSelectedCampaign(cmp)}
              className="cursor-pointer overflow-hidden rounded-3xl border border-border bg-card shadow-2xs hover:border-primary/40 transition group"
            >
              <div className="relative h-44 w-full bg-slate-900">
                <img
                  src={cmp.imageUrl}
                  alt={cmp.title}
                  className="size-full object-cover group-hover:scale-105 transition duration-300 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className={`rounded-xl px-3 py-1 text-xs font-black shadow-2xs border ${
                    cmp.campaignType === "POINT_MULTIPLIER" || cmp.campaignType === "BONUS_POINTS"
                      ? "bg-[color:var(--color-gold)]/20 border-[color:var(--color-gold)]/40 text-[color:var(--color-gold)]"
                      : "bg-primary/90 text-primary-foreground border-primary/30"
                  }`}>
                    {cmp.badgeText}
                  </span>
                  {cmp.isEndingSoon && (
                    <span className="rounded-xl bg-card/90 text-foreground border border-border px-2.5 py-1 text-[10px] font-bold shadow-2xs backdrop-blur-xs flex items-center gap-1">
                      <Clock className="size-3 text-primary" /> Son Günler
                    </span>
                  )}
                </div>

                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-base font-black text-white leading-tight">{cmp.title}</h3>
                  <p className="text-xs text-slate-200 font-medium mt-0.5 line-clamp-1">{cmp.shortDescription}</p>
                </div>
              </div>

              <div className="p-4 flex items-center justify-between border-t border-border/40 text-xs">
                <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3.5 text-primary" /> {cmp.validUntil} tarihine kadar geçerli
                </span>

                <span className="font-black text-primary flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>Kampanyayı Gör</span>
                  <ChevronRight className="size-4" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
