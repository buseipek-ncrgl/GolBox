export type CityContentType =
  | "announcement"
  | "event"
  | "campaign"
  | "mayor_message"
  | "institutional"
  | "golpuan"
  | "culture"
  | "sports"
  | "youth"
  | "science"

export type CityCtaTarget =
  | "mayor"
  | "agenda"
  | "catalog"
  | "cafes"
  | "map"
  | "qr"
  | "earn"

export interface CityContentItem {
  id: string
  type: CityContentType
  title: string
  subtitle: string
  body?: string
  imageUrl?: string
  ctaLabel: string
  ctaTarget: CityCtaTarget
  startAt: string
  endAt: string
  priority: number
  audience: "all" | "logged_in"
  isPublished: boolean
  categoryLabel: string
  meta?: string
  personName?: string
  personTitle?: string
}

/** Mirrors org setting `visitBonusPoints`. No public settings API exists. */
export const VISIT_BONUS_POINTS = 15

export const CITY_CONTENT_SOURCE = "local-cms-adapter" as const

const HERO_ITEMS: CityContentItem[] = [
  {
    id: "hero-bilimfest",
    type: "event",
    title: "Bilimfest Gaziantep",
    subtitle: "15–17 Ekim · Bilim, teknoloji ve atölyelerle dolu üç gün.",
    body: "Bilim Şehitkamil çatısı altında açık atölyeler, gösteriler ve aile programları. Kayıt ve program detayları etkinlik döneminde yayımlanır.",
    imageUrl: "/city/bilimfest.jpg",
    ctaLabel: "Etkinliği gör",
    ctaTarget: "agenda",
    startAt: "2026-09-01T00:00:00+03:00",
    endAt: "2026-10-18T23:59:59+03:00",
    priority: 10,
    audience: "all",
    isPublished: true,
    categoryLabel: "Etkinlik",
    meta: "15–17 Ekim",
  },
  {
    id: "hero-mayor",
    type: "mayor_message",
    title: "Gençlerimizin ürettiği her projede onların yanındayız.",
    subtitle: "Av. Umut Yılmaz · Şehitkamil Belediye Başkanı",
    body: "Şehitkamil’i bilimle, kültürle ve günlük hayatın kolaylığıyla büyütmeye devam ediyoruz. Bu uygulama; duyurular, kent mekânları ve GölPuan sadakatini aynı çatı altında, sakin bir deneyimle sunmak için var.\n\nGölPuan kitap kafelerde ve kent etkinliklerinde kazandığınız puandır. GölBox, sahadaki hediye kutularıdır. Ismarlıyor ise size ısmarlanan ikramdır. Üçü birbirine karışmaz.",
    imageUrl: "/city/belediye.jpg",
    ctaLabel: "Mesajı oku",
    ctaTarget: "mayor",
    startAt: "2026-01-01T00:00:00+03:00",
    endAt: "2026-12-31T23:59:59+03:00",
    priority: 20,
    audience: "all",
    isPublished: true,
    categoryLabel: "Başkan’dan",
    personName: "Av. Umut Yılmaz",
    personTitle: "Şehitkamil Belediye Başkanı",
  },
  {
    id: "hero-kultur",
    type: "culture",
    title: "Kültür ve gençlik programları",
    subtitle: "Bu hafta sahne, atölye ve kütüphane takvimi güncellendi.",
    body: "Şehitkamil’de kültür merkezleri, gençlik çalışmaları ve kütüphane programları aynı takvimde toplanır. Katılım bilgisi etkinlik kartından okunur.",
    imageUrl: "/city/kultur.jpg",
    ctaLabel: "Gündemi gör",
    ctaTarget: "agenda",
    startAt: "2026-09-01T00:00:00+03:00",
    endAt: "2026-12-31T23:59:59+03:00",
    priority: 30,
    audience: "all",
    isPublished: true,
    categoryLabel: "Kültür",
    meta: "Bu hafta",
  },
  {
    id: "hero-park",
    type: "announcement",
    title: "Millet bahçeleri açık",
    subtitle: "Yürüyüş, spor ve aile alanları gün boyu hizmet veriyor.",
    body: "Şehitkamil’deki millet bahçeleri ve açık spor alanları günlük kullanıma açıktır. Saha hediyeleri haritada ayrıca gösterilir; park duyurusu bir GölBox değildir.",
    imageUrl: "/city/park.jpg",
    ctaLabel: "Yakınımdakiler",
    ctaTarget: "cafes",
    startAt: "2026-09-01T00:00:00+03:00",
    endAt: "2026-12-31T23:59:59+03:00",
    priority: 40,
    audience: "all",
    isPublished: true,
    categoryLabel: "Duyuru",
    meta: "Bugün",
  },
]

const AGENDA_ITEMS: CityContentItem[] = [
  {
    id: "agenda-bilimfest",
    type: "science",
    title: "Bilimfest Gaziantep",
    subtitle: "Bilim, teknoloji ve keşif",
    body: "Üç günlük açık bilim programı. Atölye kontenjanı etkinlik döneminde duyurulur.",
    imageUrl: "/city/bilimfest.jpg",
    ctaLabel: "Detayı oku",
    ctaTarget: "agenda",
    startAt: "2026-09-01T00:00:00+03:00",
    endAt: "2026-10-18T23:59:59+03:00",
    priority: 10,
    audience: "all",
    isPublished: true,
    categoryLabel: "Etkinlik",
    meta: "15–17 Ekim",
  },
  {
    id: "agenda-library",
    type: "culture",
    title: "Kütüphanede sonbahar",
    subtitle: "Çocuk saati ve sessiz çalışma alanları",
    imageUrl: "/city/kultur.jpg",
    ctaLabel: "Detayı oku",
    ctaTarget: "agenda",
    startAt: "2026-09-01T00:00:00+03:00",
    endAt: "2026-12-31T23:59:59+03:00",
    priority: 20,
    audience: "all",
    isPublished: true,
    categoryLabel: "Kültür",
    meta: "Her gün",
  },
  {
    id: "agenda-youth",
    type: "youth",
    title: "Gençlik atölyeleri",
    subtitle: "Tasarım ve kodlama grupları",
    imageUrl: "/city/park.jpg",
    ctaLabel: "Detayı oku",
    ctaTarget: "agenda",
    startAt: "2026-09-01T00:00:00+03:00",
    endAt: "2026-12-31T23:59:59+03:00",
    priority: 30,
    audience: "all",
    isPublished: true,
    categoryLabel: "Gençlik",
    meta: "Kayıt açık",
  },
  {
    id: "agenda-sports",
    type: "sports",
    title: "Açık saha saatleri",
    subtitle: "Mahalle spor tesisleri",
    imageUrl: "/city/belediye.jpg",
    ctaLabel: "Detayı oku",
    ctaTarget: "agenda",
    startAt: "2026-09-01T00:00:00+03:00",
    endAt: "2026-12-31T23:59:59+03:00",
    priority: 40,
    audience: "all",
    isPublished: true,
    categoryLabel: "Spor",
    meta: "Bu hafta",
  },
]

export function isContentActive(item: CityContentItem, now = new Date()) {
  if (!item.isPublished) return false
  const start = new Date(item.startAt)
  const end = new Date(item.endAt)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return item.isPublished
  return start <= now && now <= end
}

export function publishedHeroItems(now = new Date()) {
  return HERO_ITEMS.filter((item) => isContentActive(item, now))
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 5)
}

export function publishedAgendaItems(now = new Date()) {
  return AGENDA_ITEMS.filter((item) => isContentActive(item, now)).sort((a, b) => a.priority - b.priority)
}

export function findCityContent(id: string) {
  return [...HERO_ITEMS, ...AGENDA_ITEMS].find((item) => item.id === id) ?? null
}

export function mayorMessage() {
  return HERO_ITEMS.find((item) => item.type === "mayor_message") ?? null
}

export function upcomingPersonalEvent(now = new Date()) {
  return publishedAgendaItems(now).find((item) => item.type === "event" || item.type === "science") ?? null
}
