export const PlaceCategories = {
  Cafe: "Cafe",
  ScienceCenter: "ScienceCenter",
  Library: "Library",
  YouthCenter: "YouthCenter",
  SportsFacility: "SportsFacility",
  CultureCenter: "CultureCenter",
  Theatre: "Theatre",
  Park: "Park",
  Other: "Other",
} as const

export type PlaceCategory = (typeof PlaceCategories)[keyof typeof PlaceCategories]

export const PLACE_CATEGORY_CHIPS: { id: "all" | PlaceCategory; label: string }[] = [
  { id: "all", label: "Tümü" },
  { id: "Cafe", label: "Göl Kafeler" },
  { id: "ScienceCenter", label: "Bilim" },
  { id: "Library", label: "Kütüphaneler" },
  { id: "YouthCenter", label: "Gençlik" },
  { id: "SportsFacility", label: "Spor" },
  { id: "CultureCenter", label: "Kültür" },
  { id: "Theatre", label: "Sahne / Tiyatro" },
  { id: "Park", label: "Parklar" },
]

export const PLACE_AMENITIES: { id: string; label: string }[] = [
  { id: "Wifi", label: "Wi-Fi" },
  { id: "Parking", label: "Otopark" },
  { id: "WheelchairAccess", label: "Engelli erişimi" },
  { id: "AccessibleToilet", label: "Erişilebilir WC" },
  { id: "KidsArea", label: "Çocuk alanı" },
  { id: "Library", label: "Kütüphane" },
  { id: "Cafe", label: "Kafe" },
  { id: "Wc", label: "WC" },
  { id: "PrayerRoom", label: "Mescit" },
]

export const DAY_LABELS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"]

export type OpenStatus = "Open" | "Closed" | "Unknown"

export function categoryLabel(category?: string | null) {
  return PLACE_CATEGORY_CHIPS.find((chip) => chip.id === category)?.label || "Tesis"
}

export function amenityLabel(id: string) {
  return PLACE_AMENITIES.find((item) => item.id === id)?.label || id
}

export function openStatusLabel(status?: string | null) {
  if (status === "Open") return "Açık"
  if (status === "Closed") return "Kapalı"
  return "Saat belirtilmedi"
}

export function mapsDirectionsUrl(lat: number, lng: number, name: string) {
  const label = encodeURIComponent(name)
  if (typeof navigator !== "undefined" && /iPhone|iPad|Macintosh/.test(navigator.userAgent)) {
    return `https://maps.apple.com/?ll=${lat},${lng}&q=${label}`
  }
  return `https://www.openstreetmap.org/directions?from=&to=${lat}%2C${lng}#map=16/${lat}/${lng}`
}

export function geoUrl(lat: number, lng: number, name: string) {
  return `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(name)})`
}

export interface PlaceListItem {
  id: string
  name: string
  slug: string
  category: PlaceCategory | string
  shortDescription?: string | null
  addressSummary?: string | null
  district?: string | null
  neighborhood?: string | null
  latitude?: number | null
  longitude?: number | null
  coverImageUrl?: string | null
  openStatus: OpenStatus | string
  distanceMeters?: number | null
  sortOrder: number
}

export interface PlaceNearbyItem {
  id: string
  name: string
  category: string
  coverImageUrl?: string | null
  distanceMeters: number
  openStatus: OpenStatus | string
  addressSummary?: string | null
}

export interface PlaceDetail {
  id: string
  name: string
  slug: string
  category: string
  shortDescription?: string | null
  description?: string | null
  address?: string | null
  district?: string | null
  neighborhood?: string | null
  addressSummary?: string | null
  latitude?: number | null
  longitude?: number | null
  phone?: string | null
  email?: string | null
  websiteUrl?: string | null
  coverImageUrl?: string | null
  openStatus: OpenStatus | string
  distanceMeters?: number | null
  wheelchairAccessible?: boolean | null
  accessibleToilet?: boolean | null
  amenities: string[]
  images: { id: string; imageUrl: string; altText?: string | null; sortOrder: number; isCover: boolean }[]
  openingHours: { dayOfWeek: number; openTime?: string | null; closeTime?: string | null; isClosed: boolean }[]
  cafeId?: string | null
  upcomingEvents: { id: string; title: string; startDate: string; endDate: string; location?: string | null }[]
}
