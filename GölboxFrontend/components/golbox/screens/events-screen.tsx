"use client"

import React, { useState } from "react"
import { createPortal } from "react-dom"
import {
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Search,
  CheckCircle2,
  Users,
  Award,
  ChevronRight,
  X,
  QrCode,
  AlertCircle,
  Building2,
  Info,
  Zap,
  Trash2,
  Share2,
  Check,
  Plus
} from "lucide-react"
import { useGolbox } from "@/lib/golbox-context"
import { useGolToast } from "@/components/golbox/gol-toast"
import { Screen } from "@/components/golbox/screen"

export interface FullEventItem {
  id: string
  title: string
  category: "Teknoloji" | "Kültür ve Sanat" | "Eğitim" | "Spor" | "Gençlik"
  date: string
  time: string
  venueName: string
  fullAddress: string
  latitude: number
  longitude: number
  imageUrl: string
  pointsGranted: number
  capacityTotal: number
  capacityRemaining: number
  organizer: string
  description: string
  whoCanAttend: string
  isFeatured?: boolean
  registrationRequired: boolean
}

export const GOLBOX_EVENTS_CATALOG: FullEventItem[] = [
  {
    id: "evt-1",
    title: "Gençlik Teknoloji ve Yapay Zekâ Atölyesi",
    category: "Teknoloji",
    date: "18 Ekim 2026",
    time: "14:00 – 17:00",
    venueName: "Gölbaşı Gençlik ve Kültür Merkezi",
    fullAddress: "Atatürk Mah. Gençlik Cad. No:15, Şehitkamil / Gaziantep",
    latitude: 37.068,
    longitude: 37.375,
    imageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80",
    pointsGranted: 100,
    capacityTotal: 30,
    capacityRemaining: 12,
    organizer: "Şehitkamil Belediyesi Gençlik Hizmetleri",
    description: "Yapay zekâ araçları, istem mühendisliği (prompt engineering) ve pratik uygulama geliştirmeye yönelik interaktif teknoloji atölyesi. Katılımcılara etkinlik sonunda doğrulanmış check-in ile +100 GölPuan aktarılacaktır.",
    whoCanAttend: "15-29 yaş arası tüm gençler ve üniversite öğrencileri.",
    isFeatured: true,
    registrationRequired: true
  },
  {
    id: "evt-2",
    title: "Açık Hava Gençlik Konseri ve Müzik Gecesi",
    category: "Kültür ve Sanat",
    date: "22 Ekim 2026",
    time: "19:30 – 22:00",
    venueName: "Dülükbaba Ormanlık Alanı Amfi Tiyatro",
    fullAddress: "Dülük Tabiat Parkı Etkinlik Alanı, Şehitkamil / Gaziantep",
    latitude: 37.108,
    longitude: 37.345,
    imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
    pointsGranted: 50,
    capacityTotal: 250,
    capacityRemaining: 84,
    organizer: "GölBOX & Şehitkamil Kültür Dairesi",
    description: "Yerel genç müzik gruplarının ve akustik performansların sahne alacağı açık hava konser gecesi. Sıcak kahve ve ikram stantları mevcuttur.",
    whoCanAttend: "Tüm vatandaşlarımız ve GölBOX kullanıcıları.",
    isFeatured: false,
    registrationRequired: false
  },
  {
    id: "evt-3",
    title: "Kahve Demleme ve Barista Temel Atölyesi",
    category: "Eğitim",
    date: "26 Ekim 2026",
    time: "15:00 – 17:00",
    venueName: "GölBOX Üniversite Şubesi",
    fullAddress: "Gaziantep Üniversitesi Kampüs İçi Rektörlük Yanı No:12, Şehitkamil",
    latitude: 37.035,
    longitude: 37.318,
    imageUrl: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80",
    pointsGranted: 75,
    capacityTotal: 20,
    capacityRemaining: 5,
    organizer: "GölBOX Barista Akademisi",
    description: "Profesyonel baristalar eşliğinde V60, Chemex ve Aeropress 3. nesil demleme teknikleri uygulamalı atölyesi. Katılımcılara kahve tadım kiti hediye edilir.",
    whoCanAttend: "GölBOX üyeleri ve kahve tutkunları.",
    isFeatured: false,
    registrationRequired: true
  },
  {
    id: "evt-4",
    title: "Şehitkamil Gençlik Doğa Yürüyüşü",
    category: "Spor",
    date: "01 Kasım 2026",
    time: "09:00 – 12:30",
    venueName: "Dülükbaba Ormanı Yürüyüş Parkuru",
    fullAddress: "Dülük Parkı Giriş Danışma Noktası, Şehitkamil / Gaziantep",
    latitude: 37.105,
    longitude: 37.342,
    imageUrl: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600&auto=format&fit=crop&q=80",
    pointsGranted: 60,
    capacityTotal: 100,
    capacityRemaining: 42,
    organizer: "Şehitkamil Belediyesi Spor Kulübü",
    description: "Doğa rehberi ve spor eğitmenleri eşliğinde 7 km orman içi hafif yürüyüş parkuru. Yürüyüş sonunda GölBOX ikram aracı hizmet verecektir.",
    whoCanAttend: "Her yaştan spor ve doğasever katılımına açıktır.",
    isFeatured: false,
    registrationRequired: true
  }
]

export function EventsScreen({
  onBack,
  onOpenQrScreen
}: {
  onBack?: () => void
  onOpenQrScreen?: () => void
}) {
  const { user } = useGolbox()
  const showToast = useGolToast()

  const [activeTab, setActiveTab] = useState<"discover" | "my_events">("discover")
  const [selectedCategory, setSelectedCategory] = useState<string>("Tümü")
  const [search, setSearch] = useState("")

  const [registeredEventIds, setRegisteredEventIds] = useState<string[]>(["evt-1"])
  const [checkedInEventIds, setCheckedInEventIds] = useState<string[]>([])
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<FullEventItem | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState<FullEventItem | null>(null)

  const categories = ["Tümü", "Teknoloji", "Kültür ve Sanat", "Eğitim", "Spor"]

  const filteredEvents = GOLBOX_EVENTS_CATALOG.filter((item) => {
    const matchesCat = selectedCategory === "Tümü" || item.category === selectedCategory
    const q = search.toLowerCase().trim()
    const matchesSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.venueName.toLowerCase().includes(q) ||
      item.organizer.toLowerCase().includes(q)
    return matchesCat && matchesSearch
  })

  const registeredEventsList = GOLBOX_EVENTS_CATALOG.filter((e) => registeredEventIds.includes(e.id))
  const featuredEvent = GOLBOX_EVENTS_CATALOG.find((e) => e.isFeatured)

  // HANDLER: REGISTER TO EVENT (PRD SECTIONS 57-61, 66)
  const handleRegisterToEvent = (event: FullEventItem) => {
    if (registeredEventIds.includes(event.id)) {
      showToast("Bu etkinliğe zaten kayıtlısınız.")
      return
    }

    setRegisteredEventIds((prev) => [...prev, event.id])
    setShowSuccessModal(event)
  }

  // HANDLER: CANCEL REGISTRATION (PRD SECTION 63)
  const handleCancelRegistration = (eventId: string, eventTitle: string) => {
    setRegisteredEventIds((prev) => prev.filter((id) => id !== eventId))
    showToast(`"${eventTitle}" kaydınız iptal edildi.`)
  }

  // HANDLER: SIMULATE QR CHECK-IN AT EVENT (PRD SECTIONS 13-17, 80-82)
  const handleSimulateCheckIn = (eventId: string, points: number, eventTitle: string) => {
    if (checkedInEventIds.includes(eventId)) {
      showToast("Bu etkinlik için katılım check-in işleminiz zaten yapılmıştır ✓")
      return
    }

    setCheckedInEventIds((prev) => [...prev, eventId])
    showToast(`GölBOX QR Katılım Doğrulandı! 🎉 +${points} GölPuan hesabınıza eklendi! (${eventTitle})`)
  }

  // EVENT DETAIL MODAL SCREEN (PRD SECTIONS 65-66)
  if (selectedEventForDetail) {
    const isRegistered = registeredEventIds.includes(selectedEventForDetail.id)
    const isCheckedIn = checkedInEventIds.includes(selectedEventForDetail.id)

    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-background overflow-y-auto no-scrollbar animate-in fade-in duration-200">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/40 bg-background/95 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedEventForDetail(null)}
              aria-label="Geri Dön"
              className="flex size-9 items-center justify-center rounded-xl border border-border/80 bg-card text-foreground shadow-2xs hover:bg-accent transition active:scale-95"
            >
              <X className="size-4" />
            </button>
            <h1 className="text-base font-black text-foreground">Etkinlik Detayı</h1>
          </div>
        </header>

        <div className="relative h-56 w-full overflow-hidden bg-slate-900 shrink-0">
          <img
            src={selectedEventForDetail.imageUrl}
            alt={selectedEventForDetail.title}
            className="size-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <span className="absolute bottom-4 left-4 rounded-2xl bg-primary text-primary-foreground font-black px-3.5 py-1.5 text-xs shadow-lg">
            {selectedEventForDetail.category}
          </span>
        </div>

        <div className="flex-1 space-y-4 px-4 py-5 pb-32 max-w-lg mx-auto w-full">
          <div>
            <h2 className="text-lg font-black text-foreground tracking-tight">{selectedEventForDetail.title}</h2>
            <p className="text-xs font-semibold text-primary mt-1 flex items-center gap-1.5">
              <Building2 className="size-3.5" /> Organizatör: {selectedEventForDetail.organizer}
            </p>
          </div>

          {/* KEY METRICS GRID */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-2xl bg-card border border-border p-3.5 space-y-1">
              <span className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
                <Calendar className="size-3.5 text-primary" /> Tarih & Saat
              </span>
              <p className="font-bold text-foreground">{selectedEventForDetail.date}</p>
              <p className="text-[11px] text-muted-foreground">{selectedEventForDetail.time}</p>
            </div>

            <div className="rounded-2xl bg-card border border-border p-3.5 space-y-1">
              <span className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
                <Award className="size-3.5 text-amber-500" /> Katılım Ödülü
              </span>
              <p className="font-black text-amber-600 dark:text-amber-400 text-sm">+{selectedEventForDetail.pointsGranted} GölPuan</p>
              <p className="text-[10px] text-muted-foreground leading-tight">QR Check-in sonrası verilir</p>
            </div>
          </div>

          {/* VENUE LOCATION CARD */}
          <div className="rounded-3xl border border-border bg-card p-5 shadow-2xs space-y-2.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MapPin className="size-3.5 text-primary" /> Etkinlik Mekanı
            </h3>
            <h4 className="text-xs font-black text-foreground">{selectedEventForDetail.venueName}</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{selectedEventForDetail.fullAddress}</p>

            <button
              onClick={() => {
                const url = `https://www.google.com/maps/search/?api=1&query=${selectedEventForDetail.latitude},${selectedEventForDetail.longitude}`
                window.open(url, "_blank")
              }}
              className="mt-1 w-full rounded-2xl bg-secondary py-2.5 text-xs font-bold text-foreground hover:bg-accent flex items-center justify-center gap-1.5"
            >
              <MapPin className="size-3.5 text-primary" />
              <span>Yol Tarifi Al</span>
            </button>
          </div>

          {/* CAPACITY NOTICE (PRD SECTION 55-56) */}
          <div className="rounded-2xl bg-accent/60 p-3.5 flex items-center justify-between text-xs font-bold text-foreground border border-border/40">
            <span className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              <span>Kontenjan Durumu:</span>
            </span>
            <span className="text-primary font-black">
              {selectedEventForDetail.capacityRemaining} kişilik yer kaldı (Toplam {selectedEventForDetail.capacityTotal})
            </span>
          </div>

          {/* ABOUT EVENT */}
          <div className="rounded-3xl border border-border bg-card p-5 shadow-2xs space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Info className="size-3.5 text-primary" /> Etkinlik Hakkında
            </h3>
            <p className="text-xs text-foreground leading-relaxed font-medium">
              {selectedEventForDetail.description}
            </p>
          </div>

          {/* WHO CAN ATTEND */}
          <div className="rounded-3xl border border-border bg-card p-5 shadow-2xs space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-amber-500" /> Kimler Katılabilir?
            </h3>
            <p className="text-xs text-foreground font-medium">{selectedEventForDetail.whoCanAttend}</p>
          </div>
        </div>

        {/* BOTTOM STICKY CTA */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-4 backdrop-blur-md">
          <div className="max-w-lg mx-auto">
            {isRegistered ? (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setSelectedEventForDetail(null)
                    if (onOpenQrScreen) onOpenQrScreen()
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-xs font-black text-white shadow-md hover:bg-emerald-700 active:scale-95 transition"
                >
                  <QrCode className="size-4" />
                  <span>Kayıtlısın ✓ (Check-in İçin GölBOX QR Göster)</span>
                </button>
                <button
                  onClick={() => handleCancelRegistration(selectedEventForDetail.id, selectedEventForDetail.title)}
                  className="w-full text-center text-xs font-bold text-rose-600 hover:underline py-1"
                >
                  Kaydımı İptal Et
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleRegisterToEvent(selectedEventForDetail)}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-xs font-black text-primary-foreground shadow-md hover:bg-primary/90 active:scale-95 transition"
              >
                <span>Etkinliğe Kayıt Ol 🎉</span>
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Screen className="space-y-4 pb-48 min-h-full">
      {/* 1. HEADER */}
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                aria-label="Geri Dön"
                className="flex size-9 items-center justify-center rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition"
              >
                <ArrowLeft className="size-5" />
              </button>
            )}
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-primary">
                Belediye & Gençlik Programları
              </p>
              <h1 className="font-serif text-2xl font-bold text-foreground">Etkinlikler</h1>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 text-xs font-black text-amber-900 dark:text-amber-200">
            <Award className="size-4 text-amber-500" />
            <span>GölPuan Katılım Ödüllü</span>
          </span>
        </div>

        {/* SUB-TABS: KEŞFET vs ETKİNLİKLERİM */}
        <div className="flex rounded-2xl bg-secondary dark:bg-slate-800 p-1 border border-border/40">
          <button
            onClick={() => setActiveTab("discover")}
            className={`flex-1 py-2.5 text-xs font-black rounded-xl transition ${
              activeTab === "discover" ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/70 hover:text-foreground font-bold"
            }`}
          >
            Keşfet ({GOLBOX_EVENTS_CATALOG.length})
          </button>
          <button
            onClick={() => setActiveTab("my_events")}
            className={`flex-1 py-2.5 text-xs font-black rounded-xl transition ${
              activeTab === "my_events" ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/70 hover:text-foreground font-bold"
            }`}
          >
            Etkinliklerim ({registeredEventsList.length})
          </button>
        </div>
      </header>

      {/* DISCOVER TAB */}
      {activeTab === "discover" && (
        <div className="space-y-4 pt-2">
          {/* SEARCH BAR */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Etkinlik, atölye veya mekan ara..."
              className="w-full rounded-2xl border border-border bg-card px-4 py-3 pl-10 text-xs font-bold text-foreground placeholder:text-muted-foreground shadow-2xs focus:border-primary focus:outline-none"
            />
            <Search className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
          </div>

          {/* CATEGORIES */}
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto py-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "bg-secondary dark:bg-slate-800 text-foreground/80 hover:bg-secondary/80 border border-border/50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* FEATURED EVENT HERO CARD (PRD SECTION 72-74) */}
          {featuredEvent && selectedCategory === "Tümü" && !search && (
            <div
              onClick={() => setSelectedEventForDetail(featuredEvent)}
              className="cursor-pointer overflow-hidden rounded-3xl border border-amber-400/40 bg-gradient-to-br from-slate-900 to-slate-950 p-5 text-white shadow-xl space-y-3 relative group"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-xl bg-amber-400 text-amber-950 px-3 py-1 text-[10px] font-black uppercase tracking-wider">
                  Öne Çıkan Etkinlik ⭐
                </span>
                <span className="rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-2.5 py-1 text-xs font-black">
                  +{featuredEvent.pointsGranted} GP
                </span>
              </div>

              <div>
                <h2 className="text-lg font-black text-white leading-tight group-hover:text-amber-300 transition-colors">
                  {featuredEvent.title}
                </h2>
                <p className="text-xs text-slate-300 font-medium mt-1 line-clamp-2">{featuredEvent.description}</p>
              </div>

              <div className="flex flex-wrap items-center justify-between border-t border-slate-800 pt-3 text-xs text-slate-300">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 font-bold">
                    <Calendar className="size-3.5 text-amber-400" /> {featuredEvent.date}
                  </span>
                  <span className="flex items-center gap-1 font-bold">
                    <MapPin className="size-3.5 text-amber-400" /> {featuredEvent.venueName.split(" ")[0]}
                  </span>
                </div>

                <span className="font-black text-amber-300 flex items-center gap-1">
                  <span>Detay & Katıl</span>
                  <ArrowRight className="size-3.5" />
                </span>
              </div>
            </div>
          )}

          {/* EVENTS LIST */}
          <div className="space-y-3 pb-32">
            {filteredEvents.map((evt) => {
              const isReg = registeredEventIds.includes(evt.id)
              return (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEventForDetail(evt)}
                  className="cursor-pointer rounded-3xl border border-border bg-card p-4 shadow-2xs hover:border-primary/40 transition space-y-2.5 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-primary">{evt.category}</span>
                      <h3 className="text-sm font-black text-foreground group-hover:text-primary transition-colors mt-0.5">{evt.title}</h3>
                    </div>
                    <span className="shrink-0 rounded-xl bg-amber-400/10 border border-amber-400/30 px-2.5 py-1 text-xs font-black text-amber-700 dark:text-amber-300">
                      +{evt.pointsGranted} GP
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground font-medium line-clamp-2 leading-relaxed">{evt.description}</p>

                  <div className="flex items-center justify-between border-t border-border/40 pt-2 text-xs">
                    <div className="flex items-center gap-3 text-muted-foreground font-semibold">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3.5 text-primary" /> {evt.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3.5 text-primary" /> {evt.time.split("–")[0]}
                      </span>
                    </div>

                    {isReg ? (
                      <span className="font-black text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="size-3.5" /> Kayıtlısın
                      </span>
                    ) : (
                      <span className="font-black text-primary flex items-center gap-1">
                        <span>İncele</span>
                        <ChevronRight className="size-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* MY EVENTS TAB (PRD SECTIONS 67-71) */}
      {activeTab === "my_events" && (
        <div className="space-y-4 pt-2">
          {registeredEventsList.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-8 text-center space-y-3">
              <Calendar className="mx-auto size-10 text-muted-foreground" />
              <h3 className="text-sm font-black text-foreground">Henüz kayıtlı etkinliğin bulunmuyor</h3>
              <p className="text-xs text-muted-foreground">
                Keşfet sekmesinden belediye atölye ve gençlik etkinliklerini inceleyip kayıt olabilirsin.
              </p>
              <button
                onClick={() => setActiveTab("discover")}
                className="rounded-xl bg-primary px-4 py-2.5 text-xs font-black text-primary-foreground shadow"
              >
                Etkinlikleri Keşfet
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {registeredEventsList.map((evt) => {
                const isCheckedIn = checkedInEventIds.includes(evt.id)
                return (
                  <div
                    key={evt.id}
                    className="rounded-3xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/20 p-5 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="rounded-lg bg-emerald-600 text-white px-2 py-0.5 text-[9px] font-black">
                          Kayıtlısın ✓
                        </span>
                        <h3 className="text-sm font-black text-foreground mt-1.5">{evt.title}</h3>
                        <p className="text-xs text-muted-foreground font-semibold mt-0.5">{evt.venueName}</p>
                      </div>

                      <span className="rounded-xl bg-amber-400 text-amber-950 px-2.5 py-1 text-xs font-black">
                        +{evt.pointsGranted} GP
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-bold text-foreground border-t border-b border-border/40 py-2.5">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-primary" /> {evt.date}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-3.5 text-primary" /> {evt.time}
                      </span>
                    </div>

                    {/* QR CHECK-IN STATUS OR BUTTON (PRD SECTIONS 13-17) */}
                    <div className="space-y-2">
                      {isCheckedIn ? (
                        <div className="rounded-2xl bg-emerald-100 dark:bg-emerald-950 p-3 text-center text-xs font-black text-emerald-800 dark:text-emerald-200 flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="size-4 text-emerald-600" />
                          <span>Katılım Doğrulandı ✓ +{evt.pointsGranted} GP Kazandın</span>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              if (onOpenQrScreen) onOpenQrScreen()
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-primary py-3 text-xs font-black text-primary-foreground shadow-2xs active:scale-95"
                          >
                            <QrCode className="size-3.5" />
                            <span>GölBOX QR'ını Göster</span>
                          </button>
                          <button
                            onClick={() => handleSimulateCheckIn(evt.id, evt.pointsGranted, evt.title)}
                            className="rounded-2xl bg-amber-400 px-3.5 py-3 text-xs font-black text-amber-950 shadow-2xs hover:bg-amber-300"
                            title="Check-in Simülasyonu"
                          >
                            Check-in Yap (Demo)
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <button
                          onClick={() => {
                            const url = `https://www.google.com/maps/search/?api=1&query=${evt.latitude},${evt.longitude}`
                            window.open(url, "_blank")
                          }}
                          className="font-bold text-primary hover:underline flex items-center gap-1"
                        >
                          <MapPin className="size-3" /> Yol Tarifi
                        </button>
                        <button
                          onClick={() => handleCancelRegistration(evt.id, evt.title)}
                          className="font-bold text-rose-600 hover:underline"
                        >
                          Kaydı İptal Et
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* REGISTRATION SUCCESS MODAL (PRD SECTION 66) */}
      {showSuccessModal && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-2xl border border-border space-y-4">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 font-black shadow-lg">
              <CheckCircle2 className="size-10" />
            </div>

            <div>
              <h3 className="text-base font-black text-foreground">Kaydın Tamamlandı! 🎉</h3>
              <p className="text-xs font-bold text-primary mt-1">{showSuccessModal.title}</p>
            </div>

            <div className="rounded-2xl bg-accent p-3 text-left space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tarih:</span>
                <span className="font-bold text-foreground">{showSuccessModal.date} ({showSuccessModal.time})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mekan:</span>
                <span className="font-bold text-foreground">{showSuccessModal.venueName}</span>
              </div>
              <div className="flex justify-between text-amber-600 font-bold border-t border-border/40 pt-1.5 mt-1.5">
                <span>Katılım Ödülü:</span>
                <span>+{showSuccessModal.pointsGranted} GölPuan</span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground leading-snug">
              Etkinlik günü giriş yapmak ve puanını almak için <strong>GölBOX QR</strong> kodunu görevliye okutmayı unutma.
            </p>

            <button
              onClick={() => {
                setShowSuccessModal(null)
                setSelectedEventForDetail(null)
                setActiveTab("my_events")
              }}
              className="w-full rounded-2xl bg-primary py-3 text-xs font-black text-primary-foreground shadow-md hover:bg-primary/90"
            >
              Etkinliklerime Git ➔
            </button>
          </div>
        </div>,
        document.body
      )}
    </Screen>
  )
}
