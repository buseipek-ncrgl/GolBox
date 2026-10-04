import { API_BASE_URL } from "@/lib/api-config"
import { mapPublicContent, DEFAULT_HERO_NEWS, type CityContentItem } from "@/lib/city-content"

export interface Paged<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
}

export interface PublicActivity {
  id: string
  title: string
  description: string
  imageUrl?: string | null
  location: string
  startDate: string
  endDate: string
  capacity?: number | null
  joinedCount: number
  rewardPoints: number
  isJoined: boolean
  placeId?: string | null
  placeName?: string | null
  placeAddress?: string | null
  placeLatitude?: number | null
  placeLongitude?: number | null
}

export interface CitizenNotification {
  id: string
  title: string
  body: string
  type: string // ORDER_READY, EVENT_REMINDER, MISSION_COMPLETED, LOYALTY_REWARD, CAMPAIGN_ANNOUNCEMENT
  category?: "TRANSACTIONAL" | "PERSONAL" | "MARKETING" | string
  priority?: "CRITICAL" | "HIGH" | "NORMAL" | "LOW"
  entityType?: "ORDER" | "EVENT" | "MISSION" | "REWARD" | "CAMPAIGN" | string | null
  entityId?: string | null
  targetType?: string | null
  targetId?: string | null
  deepLink?: string | null
  isRead: boolean
  createdAt: string
  readAt?: string | null
}

export interface CitizenNotificationPreferences {
  orderUpdates: boolean
  eventUpdates: boolean
  loyaltyUpdates: boolean
  missionUpdates: boolean
  marketingUpdates: boolean
}

function authHeaders(token?: string | null): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function readJson(res: Response) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export async function fetchHeroContent(token?: string | null): Promise<CityContentItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/content/hero`, { headers: authHeaders(token), cache: "no-store" })
    if (!res.ok) return DEFAULT_HERO_NEWS
    const json = await readJson(res)
    const data = json?.data
    const mapped = Array.isArray(data) ? data.map(mapPublicContent) : []
    return mapped.length > 0 ? mapped : DEFAULT_HERO_NEWS
  } catch {
    return DEFAULT_HERO_NEWS
  }
}

export async function fetchAgendaContent(
  token?: string | null,
  page = 1,
  pageSize = 12,
): Promise<Paged<CityContentItem>> {
  const res = await fetch(
    `${API_BASE_URL}/content/agenda?page=${page}&pageSize=${pageSize}`,
    { headers: authHeaders(token), cache: "no-store" },
  )
  if (!res.ok) throw new Error("agenda")
  const json = await readJson(res)
  const data = json?.data
  const items = Array.isArray(data?.items) ? data.items.map(mapPublicContent) : []
  return {
    items,
    page: Number(data?.page ?? page),
    pageSize: Number(data?.pageSize ?? pageSize),
    totalCount: Number(data?.totalCount ?? items.length),
  }
}

export async function fetchPublicActivities(
  token?: string | null,
  page = 1,
  pageSize = 12,
): Promise<Paged<PublicActivity>> {
  const res = await fetch(`${API_BASE_URL}/activities/public?page=${page}&pageSize=${pageSize}`, {
    headers: authHeaders(token),
    cache: "no-store",
  })
  if (!res.ok) throw new Error("activities")
  const json = await readJson(res)
  const data = json?.data
  const items = Array.isArray(data?.items) ? data.items : []
  return {
    items,
    page: Number(data?.page ?? page),
    pageSize: Number(data?.pageSize ?? pageSize),
    totalCount: Number(data?.totalCount ?? items.length),
  }
}

export async function fetchPublicActivity(id: string, token?: string | null): Promise<PublicActivity> {
  const res = await fetch(`${API_BASE_URL}/activities/${id}/public`, {
    headers: authHeaders(token),
    cache: "no-store",
  })
  if (!res.ok) throw new Error("activity")
  const json = await readJson(res)
  if (!json?.data) throw new Error("activity")
  return json.data as PublicActivity
}

export async function joinPublicActivity(id: string, token: string) {
  const res = await fetch(`${API_BASE_URL}/activities/${id}/join`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
  })
  const json = await readJson(res)
  if (!res.ok || json?.success === false) throw new Error(json?.message || "join")
  return json
}

export async function fetchMyNotifications(token: string, page = 1, pageSize = 20): Promise<Paged<CitizenNotification>> {
  const res = await fetch(`${API_BASE_URL}/notifications/my?page=${page}&pageSize=${pageSize}`, {
    headers: authHeaders(token),
    cache: "no-store",
  })
  if (!res.ok) throw new Error("notifications")
  const json = await readJson(res)
  const data = json?.data
  return {
    items: Array.isArray(data?.items) ? data.items : [],
    page: Number(data?.page ?? page),
    pageSize: Number(data?.pageSize ?? pageSize),
    totalCount: Number(data?.totalCount ?? 0),
  }
}

export async function fetchUnreadCount(token: string): Promise<number> {
  const res = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
    headers: authHeaders(token),
    cache: "no-store",
  })
  if (!res.ok) return 0
  const json = await readJson(res)
  return Number(json?.data?.count ?? 0)
}

export async function markNotificationRead(token: string, id: string) {
  const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
    method: "POST",
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error("read")
}

export async function markAllNotificationsRead(token: string) {
  const res = await fetch(`${API_BASE_URL}/notifications/read-all`, {
    method: "POST",
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error("read-all")
}

export async function registerPushToken(token: string, pushToken: string, platform = "web") {
  const res = await fetch(`${API_BASE_URL}/devices/push-token`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ pushToken, platform }),
  })
  if (!res.ok) throw new Error("push-token-register")
}

export async function revokePushToken(token: string, pushToken: string) {
  const res = await fetch(`${API_BASE_URL}/devices/push-token`, {
    method: "DELETE",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ pushToken }),
  })
  if (!res.ok) throw new Error("push-token-revoke")
}

export async function updateNotificationPreferences(token: string, preferences: CitizenNotificationPreferences) {
  const res = await fetch(`${API_BASE_URL}/users/me/notification-preferences`, {
    method: "PUT",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(preferences),
  })
  if (!res.ok) throw new Error("notification-preferences-update")
}
