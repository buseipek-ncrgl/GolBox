export const CityContentTypes = {
  Hero: "Hero",
  Announcement: "Announcement",
  EventPromo: "EventPromo",
  MayorMessage: "MayorMessage",
  Campaign: "Campaign",
  Institutional: "Institutional",
} as const

export type CityContentType = (typeof CityContentTypes)[keyof typeof CityContentTypes]

export const ContentCtaTypes = {
  None: "None",
  ExternalUrl: "ExternalUrl",
  InternalRoute: "InternalRoute",
  Activity: "Activity",
  Cafe: "Cafe",
  Place: "Place",
  RewardCatalog: "RewardCatalog",
  Map: "Map",
  Profile: "Profile",
} as const

export type ContentCtaType = (typeof ContentCtaTypes)[keyof typeof ContentCtaTypes]

export const INTERNAL_ROUTES = ["home", "map", "qr", "profile", "catalog", "coupons", "cafes", "places", "earn"] as const
export type InternalRoute = (typeof INTERNAL_ROUTES)[number]

export interface CityContentItem {
  id: string
  type: CityContentType
  title: string
  subtitle: string
  body?: string
  imageUrl?: string
  ctaLabel: string
  ctaType: ContentCtaType
  ctaTarget?: string | null
  startAt: string
  endAt?: string | null
  priority: number
  isPublished: boolean
  categoryLabel: string
  meta?: string
  personName?: string
  personTitle?: string
  personImageUrl?: string
  activityId?: string | null
  imageFocus?: string
}

export const CITY_CONTENT_SOURCE = "backend-api" as const

const USE_DEV_CMS = process.env.NEXT_PUBLIC_USE_DEV_CMS === "true"

const CATEGORY_LABEL: Record<CityContentType, string> = {
  Hero: "Duyuru",
  Announcement: "Duyuru",
  EventPromo: "Etkinlik",
  MayorMessage: "Başkan’dan",
  Campaign: "Kampanya içeriği",
  Institutional: "Kurumsal",
}

function asType(value: string | undefined): CityContentType {
  if (value && value in CATEGORY_LABEL) return value as CityContentType
  return CityContentTypes.Announcement
}

function asCta(value: string | undefined): ContentCtaType {
  if (value && Object.values(ContentCtaTypes).includes(value as ContentCtaType)) return value as ContentCtaType
  return ContentCtaTypes.None
}

export function mapPublicContent(raw: Record<string, unknown>): CityContentItem {
  const type = asType(String(raw.type ?? ""))
  return {
    id: String(raw.id ?? ""),
    type,
    title: String(raw.title ?? ""),
    subtitle: String(raw.subtitle ?? ""),
    body: raw.body ? String(raw.body) : undefined,
    imageUrl: raw.imageUrl ? String(raw.imageUrl) : undefined,
    ctaLabel: String(raw.ctaLabel ?? "Detayı oku"),
    ctaType: asCta(raw.ctaType ? String(raw.ctaType) : undefined),
    ctaTarget: raw.ctaTarget ? String(raw.ctaTarget) : null,
    startAt: String(raw.startAt ?? ""),
    endAt: raw.endAt ? String(raw.endAt) : null,
    priority: Number(raw.priority ?? 0),
    isPublished: true,
    categoryLabel: String(raw.categoryLabel ?? CATEGORY_LABEL[type]),
    meta: raw.meta ? String(raw.meta) : undefined,
    personName: raw.authorName ? String(raw.authorName) : undefined,
    personTitle: raw.authorTitle ? String(raw.authorTitle) : undefined,
    personImageUrl: raw.authorImageUrl ? String(raw.authorImageUrl) : undefined,
    activityId: raw.activityId ? String(raw.activityId) : null,
    imageFocus: raw.imageFocus ? String(raw.imageFocus) : undefined,
  }
}

export const DEFAULT_HERO_NEWS: CityContentItem[] = [
  {
    id: "news-1",
    type: CityContentTypes.Hero,
    title: "GölBOX Özel İndirimi Başladı!",
    subtitle: "Tüm kahve ve tatlılarda %20 net indirim fırsatı.",
    body: "GölBOX üyemiz olarak Kitap Kafelerimizde indirimli fiyatlardan yararlanabilirsiniz.",
    imageUrl: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&auto=format&fit=crop&q=80",
    ctaLabel: "Siparişe Başla",
    ctaType: ContentCtaTypes.InternalRoute,
    ctaTarget: "menu",
    startAt: new Date().toISOString(),
    priority: 1,
    isPublished: true,
    categoryLabel: "GölBOX Özel Fırsat",
  },
  {
    id: "news-2",
    type: CityContentTypes.Hero,
    title: "Soğuk Kahvelerde 2 Kat GölPuan!",
    subtitle: "Iced Cold Brew ve Iced Latte alımlarında çift puan kazanın, ücretsiz kahvenize yaklaşın.",
    body: "Yaz günlerinde serinlerken GölPuan biriktirme fırsatını kaçırmayın.",
    imageUrl: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&auto=format&fit=crop&q=80",
    ctaLabel: "Menüyü İncele",
    ctaType: ContentCtaTypes.InternalRoute,
    ctaTarget: "menu",
    startAt: new Date().toISOString(),
    priority: 2,
    isPublished: true,
    categoryLabel: "Katlı Puan Fırsatı",
  },
  {
    id: "news-3",
    type: CityContentTypes.Hero,
    title: "İlk Gel-Al Siparişine Özel Filtre Kahve İkramı",
    subtitle: "Uygulamadan ilk siparişini Şehitkamil Kitap Kafelerden ver, taze demlenmiş kahven hediye.",
    body: "Gel-Al siparişlerinde sıra beklemeden kahvenizi hemen teslim alın.",
    imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80",
    ctaLabel: "Gel-Al Sipariş Ver",
    ctaType: ContentCtaTypes.InternalRoute,
    ctaTarget: "menu",
    startAt: new Date().toISOString(),
    priority: 3,
    isPublished: true,
    categoryLabel: "Gel-Al İkramı",
  },
  {
    id: "news-4",
    type: CityContentTypes.Hero,
    title: "San Sebastian Cheesecake Ödülü Kataloğumuzda!",
    subtitle: "Şehitkamil Kitap Kafelerde biriktirdiğin GölPuan'larla nefis tatlı hediyeni kap.",
    body: "750 GölPuan karşılığında ücretsiz San Sebastian Cheesecake kuponunu anında oluştur.",
    imageUrl: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&auto=format&fit=crop&q=80",
    ctaLabel: "Ödül Kataloğu",
    ctaType: ContentCtaTypes.InternalRoute,
    ctaTarget: "golpuan",
    startAt: new Date().toISOString(),
    priority: 4,
    isPublished: true,
    categoryLabel: "Hediye Lezzet",
  },
]

/** Explicit development fixture. Never used unless NEXT_PUBLIC_USE_DEV_CMS=true. */
const DEV_FIXTURE: CityContentItem[] = USE_DEV_CMS
  ? DEFAULT_HERO_NEWS
  : []

export function devCmsFixture() {
  return USE_DEV_CMS ? DEV_FIXTURE : []
}

export function isAllowedInternalRoute(value: string | null | undefined): value is InternalRoute {
  return Boolean(value && INTERNAL_ROUTES.includes(value as InternalRoute))
}

export function isAllowedExternalUrl(value: string | null | undefined) {
  if (!value) return false
  try {
    const url = new URL(value)
    if (url.protocol !== "https:" && url.protocol !== "http:") return false
    if (url.username || url.password) return false
    const host = url.hostname.toLowerCase()
    return (
      host === "sehitkamil.bel.tr" ||
      host === "www.sehitkamil.bel.tr" ||
      host === "gaziantep.bel.tr" ||
      host === "www.gaziantep.bel.tr" ||
      host.endsWith(".sehitkamil.bel.tr") ||
      host.endsWith(".gaziantep.bel.tr")
    )
  } catch {
    return false
  }
}

export type ContentCtaAction =
  | { kind: "detail" }
  | { kind: "mayor" }
  | { kind: "activity"; activityId: string }
  | { kind: "cafe"; cafeId?: string }
  | { kind: "place"; placeId?: string }
  | { kind: "catalog" }
  | { kind: "coupons" }
  | { kind: "map" }
  | { kind: "profile" }
  | { kind: "qr" }
  | { kind: "earn" }
  | { kind: "external"; url: string }

function actionFromInternalRoute(route: InternalRoute): ContentCtaAction {
  if (route === "map") return { kind: "map" }
  if (route === "profile") return { kind: "profile" }
  if (route === "qr") return { kind: "qr" }
  if (route === "catalog") return { kind: "catalog" }
  if (route === "coupons") return { kind: "coupons" }
  if (route === "cafes" || route === "places") return { kind: "place" }
  if (route === "earn") return { kind: "earn" }
  return { kind: "detail" }
}

export function resolveContentCta(item: CityContentItem): ContentCtaAction {
  if (item.type === CityContentTypes.MayorMessage) return { kind: "mayor" }
  if (item.activityId) return { kind: "activity", activityId: item.activityId }

  switch (item.ctaType) {
    case ContentCtaTypes.Activity:
      return item.ctaTarget ? { kind: "activity", activityId: item.ctaTarget } : { kind: "detail" }
    case ContentCtaTypes.Cafe:
      return { kind: "cafe", cafeId: item.ctaTarget || undefined }
    case ContentCtaTypes.Place:
      return { kind: "place", placeId: item.ctaTarget || undefined }
    case ContentCtaTypes.RewardCatalog:
      return { kind: "catalog" }
    case ContentCtaTypes.Map:
      return { kind: "map" }
    case ContentCtaTypes.Profile:
      return { kind: "profile" }
    case ContentCtaTypes.ExternalUrl:
      return isAllowedExternalUrl(item.ctaTarget) ? { kind: "external", url: item.ctaTarget! } : { kind: "detail" }
    case ContentCtaTypes.InternalRoute: {
      if (!isAllowedInternalRoute(item.ctaTarget)) return { kind: "detail" }
      return actionFromInternalRoute(item.ctaTarget)
    }
    default:
      return { kind: "detail" }
  }
}

export type NotificationNavAction =
  | ContentCtaAction
  | { kind: "content"; contentId: string }
  | { kind: "none" }

/** Canonical inbox → surface mapping. Route `cafes` opens Tesisler, not a sibling cafe product. */
export function resolveNotificationTarget(
  targetType?: string | null,
  targetId?: string | null,
): NotificationNavAction {
  const type = (targetType ?? "").trim().toLowerCase()
  const id = (targetId ?? "").trim()

  if (!type || type === "none") return { kind: "none" }
  if (type === "activity") return id ? { kind: "activity", activityId: id } : { kind: "none" }
  if (type === "place") return id ? { kind: "place", placeId: id } : { kind: "place" }
  if (type === "cafe") return id ? { kind: "cafe", cafeId: id } : { kind: "place" }
  if (type === "content") return id ? { kind: "content", contentId: id } : { kind: "none" }
  if (type === "externalurl") return isAllowedExternalUrl(id) ? { kind: "external", url: id } : { kind: "none" }

  if (type === "route" || type === "internalroute") {
    if (!isAllowedInternalRoute(id)) return { kind: "none" }
    return actionFromInternalRoute(id)
  }

  if (type === "reward" || type === "rewardcatalog" || type === "catalog") return { kind: "catalog" }
  if (type === "coupon" || type === "coupons") return { kind: "coupons" }
  if (type === "map" || type === "golbox" || type === "fielddrop") return { kind: "map" }
  if (type === "profile") return { kind: "profile" }
  if (type === "qr") return { kind: "qr" }
  if (type === "places" || type === "cafes") return { kind: "place" }
  if (type === "earn") return { kind: "earn" }

  return { kind: "none" }
}

export function mayorFromList(items: CityContentItem[]) {
  return items.find((item) => item.type === CityContentTypes.MayorMessage) ?? null
}

export function upcomingEventFromList(items: CityContentItem[], now = new Date()) {
  return items.find((item) => {
    if (item.type !== CityContentTypes.EventPromo) return false
    if (item.endAt && new Date(item.endAt) < now) return false
    return true
  }) ?? null
}
