"use client"

import React, { useState } from "react"
import { createPortal } from "react-dom"
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Clock,
  Sparkles,
  Coffee,
  MapPin,
  Calendar,
  Zap,
  ChevronRight,
  X,
  Flame,
  Check,
  Building2,
  Info,
  Gift,
  Coins,
  ShieldCheck
} from "lucide-react"
import { useGolbox } from "@/lib/golbox-context"
import { useGolToast } from "@/components/golbox/gol-toast"

export interface MissionData {
  id: string
  title: string
  shortDescription: string
  fullDescription: string
  category: "Keşif" | "Etkinlik" | "Şube" | "GölBOX" | "Topluluk"
  missionType: "ORDER_COMPLETED" | "EVENT_ATTENDED" | "DISTINCT_BRANCH" | "DISTINCT_CATEGORY" | "FIRST_ORDER"
  currentProgress: number
  targetProgress: number
  pointsGranted: number
  validUntil: string
  status: "IN_PROGRESS" | "COMPLETED" | "EXPIRED"
  completedAt?: string
  howToCompleteSteps: string[]
  ctaType: "MENU" | "EVENTS" | "BRANCHES" | "POINTS"
  progressHistory?: { label: string; date: string }[]
}

export const GOLBOX_MISSIONS_CATALOG: MissionData[] = [
  {
    id: "ms-1",
    title: "Şehirde Aktif Ol",
    shortDescription: "Bu ay 2 farklı belediye etkinliğine veya atölyesine katıl.",
    fullDescription: "Şehitkamil Belediyesi tarafından düzenlenen gençlik, teknoloji veya kültür etkinliklerine kayıt ol, etkinlik günü GölBOX QR kodunla check-in yap ve katılımını doğrula.",
    category: "Etkinlik",
    missionType: "EVENT_ATTENDED",
    currentProgress: 1,
    targetProgress: 2,
    pointsGranted: 200,
    validUntil: "31 Ekim 2026",
    status: "IN_PROGRESS",
    howToCompleteSteps: [
      "Etkinlikler bölümünden sana uygun bir atölye veya etkinlik seç.",
      "Etkinliğe ücretsiz kayıt ol.",
      "Etkinlik günü kasada/girişte GölBOX QR kodunla check-in yap.",
      "Doğrulanmış katılım göreve anında yansır."
    ],
    ctaType: "EVENTS",
    progressHistory: [
      { label: "Gençlik Teknoloji ve Yapay Zekâ Atölyesi", date: "04 Ekim 2026" }
    ]
  },
  {
    id: "ms-2",
    title: "GölBOX Kaşifi",
    shortDescription: "2 farklı GölBOX şubesini ziyaret et ve sipariş ver.",
    fullDescription: "Farklı lokasyonlardaki GölBOX Kitap Kafelerimizi keşfet! İki ayrı GölBOX şubesinden Gel-Al sipariş ver veya QR ile kasadan işlem yap.",
    category: "Şube",
    missionType: "DISTINCT_BRANCH",
    currentProgress: 1,
    targetProgress: 2,
    pointsGranted: 100,
    validUntil: "25 Ekim 2026",
    status: "IN_PROGRESS",
    howToCompleteSteps: [
      "Şubeler ekranından yakındaki farklı bir GölBOX şubesi seç.",
      "Seçtiğin yeni şubeden en az 1 içecek siparişi ver.",
      "İkinci şube siparişin onaylandığında 100 GölPuan otomatik tanımlanır."
    ],
    ctaType: "BRANCHES",
    progressHistory: [
      { label: "GölBOX Üniversite Şubesi", date: "02 Ekim 2026" }
    ]
  },
  {
    id: "ms-3",
    title: "Yeni Tatlar",
    shortDescription: "2 farklı içecek kategorisinden ürün dene.",
    fullDescription: "Sıcak Kahveler ve Soğuk Kahveler kategorilerinden en az birer adet farklı lezzet deneyimle.",
    category: "Keşif",
    missionType: "DISTINCT_CATEGORY",
    currentProgress: 0,
    targetProgress: 2,
    pointsGranted: 75,
    validUntil: "30 Ekim 2026",
    status: "IN_PROGRESS",
    howToCompleteSteps: [
      "Menü ekranından Sıcak ve Soğuk kahve kategorilerini incele.",
      "Her iki kategoriden de 1'er ürün siparişi ver.",
      "Farklı kategoriler tamamlandığında ödülün hesabına yansır."
    ],
    ctaType: "MENU"
  },
  {
    id: "ms-4",
    title: "Haftalık Kahve Molası",
    shortDescription: "Bu hafta 3 farklı günde GölBOX siparişi ver.",
    fullDescription: "Hafta boyunca 3 ayrı takvim gününde GölBOX şubelerimizden kahve siparişi vererek haftalık görevi tamamla.",
    category: "GölBOX",
    missionType: "ORDER_COMPLETED",
    currentProgress: 2,
    targetProgress: 3,
    pointsGranted: 150,
    validUntil: "12 Ekim 2026",
    status: "IN_PROGRESS",
    howToCompleteSteps: [
      "Hafta içinde 3 farklı günde en az 1 kahve siparişi ver.",
      "Üçüncü gün siparişinde +150 GölPuan hesabına aktarılır."
    ],
    ctaType: "MENU",
    progressHistory: [
      { label: "Pazartesi Siparişi", date: "29 Eylül 2026" },
      { label: "Çarşamba Siparişi", date: "01 Ekim 2026" }
    ]
  },
  {
    id: "ms-5",
    title: "GölBOX'a Hoş Geldin",
    shortDescription: "İlk GölBOX siparişini tamamla.",
    fullDescription: "Uygulama üzerinden veya kasadan vereceğin ilk siparişinle Hoş Geldin görevini tamamla ve +50 GölPuan kazan.",
    category: "GölBOX",
    missionType: "FIRST_ORDER",
    currentProgress: 1,
    targetProgress: 1,
    pointsGranted: 50,
    validUntil: "Tamamlandı",
    status: "COMPLETED",
    completedAt: "25 Eylül 2026",
    howToCompleteSteps: ["İlk siparişini başarıyla tamamla."],
    ctaType: "POINTS"
  }
]

export function MissionsScreen({
  onBack,
  onNavigateToMenu,
  onNavigateToEvents,
  onNavigateToBranches
}: {
  onBack: () => void
  onNavigateToMenu: () => void
  onNavigateToEvents?: () => void
  onNavigateToBranches?: () => void
}) {
  const { user } = useGolbox()
  const showToast = useGolToast()

  const [activeTab, setActiveTab] = useState<"active" | "completed">("active")
  const [selectedMission, setSelectedMission] = useState<MissionData | null>(null)

  const activeMissions = GOLBOX_MISSIONS_CATALOG.filter((m) => m.status === "IN_PROGRESS")
  const completedMissions = GOLBOX_MISSIONS_CATALOG.filter((m) => m.status === "COMPLETED")

  const handleCtaClick = (ctaType: MissionData["ctaType"]) => {
    setSelectedMission(null)
    if (ctaType === "EVENTS" && onNavigateToEvents) {
      onNavigateToEvents()
    } else if (ctaType === "BRANCHES" && onNavigateToBranches) {
      onNavigateToBranches()
    } else {
      onNavigateToMenu()
    }
  }

  // MISSION DETAIL MODAL SCREEN (PRD SECTIONS 38-44)
  if (selectedMission) {
    const isCompleted = selectedMission.status === "COMPLETED"
    const pct = Math.min(100, Math.round((selectedMission.currentProgress / selectedMission.targetProgress) * 100))

    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-background overflow-y-auto no-scrollbar animate-in fade-in duration-200">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/40 bg-background/95 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedMission(null)}
              aria-label="Geri Dön"
              className="flex size-9 items-center justify-center rounded-xl border border-border/80 bg-card text-foreground shadow-2xs hover:bg-accent transition active:scale-95"
            >
              <ArrowLeft className="size-4" />
            </button>
            <h1 className="text-base font-black text-foreground">Görev Detayı</h1>
          </div>
        </header>

        <div className="flex-1 space-y-4 px-4 py-5 pb-32 max-w-lg mx-auto w-full">
          {/* HEADER HERO BADGE */}
          <div className="rounded-3xl border border-amber-400/40 bg-gradient-to-br from-slate-900 to-slate-950 p-6 text-white shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="rounded-xl bg-amber-400 text-amber-950 px-3 py-1 text-[10px] font-black uppercase tracking-wider">
                {selectedMission.category} Görevi
              </span>
              <span className="rounded-xl bg-amber-400/20 border border-amber-400/30 text-amber-300 px-3 py-1 text-xs font-black">
                +{selectedMission.pointsGranted} GP Ödül
              </span>
            </div>

            <div>
              <h2 className="text-lg font-black text-white">{selectedMission.title}</h2>
              <p className="text-xs text-slate-300 font-medium mt-1 leading-relaxed">{selectedMission.shortDescription}</p>
            </div>

            {/* PROGRESS BAR */}
            <div className="pt-2 space-y-1.5">
              <div className="flex justify-between text-xs font-black">
                <span className="text-slate-300">İlerleme: {selectedMission.currentProgress} / {selectedMission.targetProgress}</span>
                <span className="text-amber-400">%{pct}</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800 p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="rounded-3xl border border-border bg-card p-5 shadow-2xs space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Info className="size-3.5 text-primary" /> Görev Hakkında
            </h3>
            <p className="text-xs text-foreground leading-relaxed font-medium">
              {selectedMission.fullDescription}
            </p>
          </div>

          {/* PROGRESS HISTORY LIST IF AVAILABLE */}
          {selectedMission.progressHistory && selectedMission.progressHistory.length > 0 && (
            <div className="rounded-3xl border border-border bg-card p-5 shadow-2xs space-y-2.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-600" /> Tamamlanan Adımlar
              </h3>
              <div className="space-y-1.5 text-xs">
                {selectedMission.progressHistory.map((step, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl bg-accent/60 p-2.5 font-semibold text-foreground">
                    <span className="flex items-center gap-2">
                      <Check className="size-3.5 text-emerald-600 shrink-0" strokeWidth={3} />
                      <span>{step.label}</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground">{step.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* HOW TO COMPLETE STEPS (PRD SECTION 40) */}
          <div className="rounded-3xl border border-border bg-card p-5 shadow-2xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Zap className="size-3.5 text-amber-500" /> Nasıl Tamamlanır?
            </h3>
            <div className="space-y-2.5">
              {selectedMission.howToCompleteSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs">
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground font-black text-[11px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-foreground font-medium leading-snug pt-0.5">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BOTTOM STICKY CTA */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-4 backdrop-blur-md">
          <div className="max-w-lg mx-auto">
            {isCompleted ? (
              <div className="rounded-2xl bg-emerald-100 dark:bg-emerald-950 p-3.5 text-center text-xs font-black text-emerald-800 dark:text-emerald-200 flex items-center justify-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span>Görev Tamamlandı! +{selectedMission.pointsGranted} GölPuan Yüklendi ✓</span>
              </div>
            ) : (
              <button
                onClick={() => handleCtaClick(selectedMission.ctaType)}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-xs font-black text-primary-foreground shadow-md hover:bg-primary/90 transition active:scale-95"
              >
                {selectedMission.ctaType === "EVENTS" && <span>Etkinlikleri Keşfet ➔</span>}
                {selectedMission.ctaType === "BRANCHES" && <span>Şubeleri Gör ➔</span>}
                {selectedMission.ctaType === "MENU" && <span>Menüden Sipariş Ver ➔</span>}
                {selectedMission.ctaType === "POINTS" && <span>GölPuanlarımı Gör ➔</span>}
              </button>
            )}
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
            <h1 className="text-base font-black text-foreground">GölBOX Görevler Merkezi</h1>
            <p className="text-[10px] text-muted-foreground font-semibold">GölBOX'ı keşfet, etkinliklere katıl ve puanlar kazan</p>
          </div>
        </div>
      </header>

      <div className="flex-1 space-y-4 px-4 py-4 pb-28 max-w-lg mx-auto w-full">
        {/* 2. SUB-TABS: AKTİF vs TAMAMLANANLAR */}
        <div className="flex rounded-2xl bg-secondary dark:bg-slate-800 p-1 border border-border/40">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 py-2.5 text-xs font-black rounded-xl transition ${
              activeTab === "active" ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/70 hover:text-foreground font-bold"
            }`}
          >
            Aktif Görevler ({activeMissions.length})
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`flex-1 py-2.5 text-xs font-black rounded-xl transition ${
              activeTab === "completed" ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/70 hover:text-foreground font-bold"
            }`}
          >
            Tamamlananlar ({completedMissions.length})
          </button>
        </div>

        {/* 3. ACTIVE MISSIONS LIST */}
        {activeTab === "active" && (
          <div className="space-y-3 pt-1">
            {activeMissions.map((ms) => {
              const pct = Math.min(100, Math.round((ms.currentProgress / ms.targetProgress) * 100))
              return (
                <div
                  key={ms.id}
                  onClick={() => setSelectedMission(ms)}
                  className="cursor-pointer rounded-3xl border border-border bg-card p-5 shadow-2xs hover:border-primary/40 transition space-y-3 group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="rounded-md bg-secondary dark:bg-slate-800 border border-border/50 px-2 py-0.5 text-[9px] font-black uppercase text-foreground/80">
                        {ms.category} Görevi
                      </span>
                      <h3 className="text-sm font-black text-foreground group-hover:text-primary transition-colors mt-1">
                        {ms.title}
                      </h3>
                      <p className="text-xs text-muted-foreground font-medium mt-0.5 line-clamp-1">{ms.shortDescription}</p>
                    </div>

                    <span className="rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 px-2.5 py-1 text-xs font-black shrink-0">
                      +{ms.pointsGranted} GP
                    </span>
                  </div>

                  {/* PROGRESS BAR */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-muted-foreground">
                      <span>{ms.currentProgress} / {ms.targetProgress} adımı tamamlandı</span>
                      <span className="text-primary font-black">%{pct}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border/40 pt-2.5 text-xs">
                    <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                      <Clock className="size-3.5 text-primary" /> Son Gün: {ms.validUntil}
                    </span>

                    <span className="font-black text-primary flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      <span>Detayları Gör</span>
                      <ChevronRight className="size-4" />
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 4. COMPLETED MISSIONS LIST */}
        {activeTab === "completed" && (
          <div className="space-y-3 pt-1">
            {completedMissions.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border p-8 text-center space-y-2">
                <Award className="mx-auto size-10 text-muted-foreground" />
                <h3 className="text-sm font-black text-foreground">Henüz tamamlanmış bir görevin yok</h3>
                <p className="text-xs text-muted-foreground">Aktif görevleri tamamlayarak ekstra GölPuan kazanabilirsin.</p>
              </div>
            ) : (
              completedMissions.map((ms) => (
                <div
                  key={ms.id}
                  onClick={() => setSelectedMission(ms)}
                  className="cursor-pointer rounded-3xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/20 p-5 shadow-2xs space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="rounded-lg bg-emerald-600 text-white px-2 py-0.5 text-[9px] font-black">
                        ✓ Tamamlandı
                      </span>
                      <h3 className="text-sm font-black text-foreground mt-1">{ms.title}</h3>
                      <p className="text-xs text-muted-foreground font-medium mt-0.5">{ms.shortDescription}</p>
                    </div>

                    <span className="rounded-xl bg-amber-400 text-amber-950 px-2.5 py-1 text-xs font-black">
                      +{ms.pointsGranted} GP Kazandın
                    </span>
                  </div>

                  <div className="border-t border-border/40 pt-2 flex items-center justify-between text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                    <span>Tamamlanma Tarihi: {ms.completedAt}</span>
                    <span className="flex items-center gap-1">
                      <span>Detay</span>
                      <ChevronRight className="size-3.5" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
