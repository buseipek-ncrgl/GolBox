"use client"

import { useState } from "react"
import { Screen } from "@/components/golbox/screen"
import { Calendar, MapPin, Clock, ArrowRight, Sparkles, Filter } from "lucide-react"
import { HomeSectionHeader } from "@/components/golbox/home-section-header"

export interface EventItem {
  id: string
  title: string
  category: string
  date: string
  time: string
  location: string
  imageUrl: string
  points: number
  isFeatured?: boolean
  description: string
}

const DEMO_EVENTS: EventItem[] = [
  {
    id: "evt-1",
    title: "Gençlik Teknoloji ve Yapay Zeka Festivali",
    category: "Teknoloji",
    date: "28 Eylül 2026",
    time: "14:00 - 18:00",
    location: "Şehitkamil Kültür ve Kongre Merkezi",
    imageUrl: "/images/event-tech.jpg",
    points: 100,
    isFeatured: true,
    description: "Yapay zeka atölyeleri, yazılım yarışmaları ve sürpriz hediye ödülleriyle dolu gençlik festivali.",
  },
  {
    id: "evt-2",
    title: "Açık Hava Gençlik Konseri ve Müzik Gecesi",
    category: "Kültür ve Sanat",
    date: "02 Ekim 2026",
    time: "19:30",
    location: "Dülük Tabiat Parkı Amfi Tiyatro",
    imageUrl: "/images/event-concert.jpg",
    points: 50,
    isFeatured: false,
    description: "Genç müzik gruplarının sahne alacağı açık hava konseri ve ikram stantları.",
  },
  {
    id: "evt-3",
    title: "Şehitkamil Doğa Yürüyüşü ve Kamp Turnuvası",
    category: "Spor",
    date: "05 Ekim 2026",
    time: "09:00",
    location: "Dülükbaba Ormanlık Alanı",
    imageUrl: "/images/event-sports.jpg",
    points: 75,
    isFeatured: false,
    description: "Rehber eşliğinde doğa yürüyüşü, oryantiring ve gençlik spor turnuvası.",
  },
  {
    id: "evt-4",
    title: "Kahve Demleme ve Barista Temel Eğitimi",
    category: "Eğitim",
    date: "10 Ekim 2026",
    time: "15:00",
    location: "Şehitkamil Gençlik Kitap Kafe",
    imageUrl: "/images/event-coffee.jpg",
    points: 60,
    isFeatured: false,
    description: "Profesyonel baristalar eşliğinde 3. nesil kahve demleme teknikleri ve tadım atölyesi.",
  },
]

const CATEGORIES = ["Tümü", "Teknoloji", "Kültür ve Sanat", "Spor", "Eğitim"]

export function EventsScreen({
  onOpenActivity,
}: {
  onOpenActivity?: (id: string) => void
}) {
  const [selectedCategory, setSelectedCategory] = useState("Tümü")

  const filteredEvents = selectedCategory === "Tümü" 
    ? DEMO_EVENTS 
    : DEMO_EVENTS.filter((e) => e.category === selectedCategory)

  const featured = DEMO_EVENTS.find((e) => e.isFeatured)

  return (
    <Screen className="space-y-5 pb-8">
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
            Şehitkamil Etkinlikleri
          </span>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
            Şehirde Etkinlikler
          </h1>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="size-3.5 text-[color:var(--color-gold)]" />
          {DEMO_EVENTS.length} Etkinlik
        </span>
      </div>

      {/* Featured Event Card */}
      {featured ? (
        <div className="group relative overflow-hidden rounded-[22px] border border-[color:var(--color-gold)]/40 bg-gradient-to-br from-[color:var(--color-brand-900)] to-[color:var(--color-brand-700)] text-white shadow-md">
          <div className="relative p-5">
            <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--color-gold)] px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
              Öne Çıkan Etkinlik
            </span>

            <h2 className="mt-2.5 font-serif text-xl font-bold leading-snug tracking-tight text-white">
              {featured.title}
            </h2>

            <p className="mt-1.5 line-clamp-2 text-xs text-white/80 leading-relaxed">
              {featured.description}
            </p>

            <div className="mt-3.5 flex flex-wrap items-center gap-3 text-xs text-white/90">
              <span className="inline-flex items-center gap-1 font-medium">
                <Calendar className="size-3.5 text-[color:var(--color-gold)]" />
                {featured.date}
              </span>
              <span className="inline-flex items-center gap-1 font-medium">
                <Clock className="size-3.5 text-[color:var(--color-gold)]" />
                {featured.time}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
              <span className="text-xs font-bold text-[color:var(--color-gold)]">
                +{featured.points} GölPuan Kazanım
              </span>
              <button
                type="button"
                onClick={() => onOpenActivity?.(featured.id)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-1.5 text-xs font-bold text-[color:var(--color-brand-900)] shadow-sm transition-all hover:bg-white/90 active:scale-95"
              >
                <span>Detay & Katıl</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Category Pills */}
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto py-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              selectedCategory === cat
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "border border-border/70 bg-card text-muted-foreground hover:bg-secondary/60"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Events List */}
      <div className="space-y-3">
        <HomeSectionHeader title="Gelecek Etkinlikler" tone="utility" />
        
        {filteredEvents.map((item) => (
          <article
            key={item.id}
            className="group relative overflow-hidden rounded-[18px] border border-border/70 bg-card p-4 shadow-2xs transition-all hover:border-primary/30 hover:shadow-xs"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-primary">
                  {item.category}
                </span>
                <h3 className="mt-0.5 text-base font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
              </div>
              <span className="shrink-0 rounded-lg bg-secondary px-2 py-1 text-[11px] font-bold text-primary">
                +{item.points} GP
              </span>
            </div>

            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {item.description}
            </p>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-2.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 font-medium">
                  <Calendar className="size-3.5 text-primary" />
                  {item.date}
                </span>
                <span className="inline-flex items-center gap-1 font-medium">
                  <MapPin className="size-3.5 text-primary" />
                  {item.location.split(" ")[0]}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onOpenActivity?.(item.id)}
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                <span>İncele</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </Screen>
  )
}
