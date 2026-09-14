import { API_BASE_URL } from "@/lib/api-config"
import type { PlaceDetail, PlaceListItem, PlaceNearbyItem } from "@/lib/places"

export interface PagedPlaces {
  items: PlaceListItem[]
  page: number
  pageSize: number
  totalCount: number
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

export async function fetchPlaces(params: {
  category?: string
  search?: string
  page?: number
  pageSize?: number
  lat?: number
  lng?: number
  openNow?: boolean
  token?: string | null
}): Promise<PagedPlaces> {
  const query = new URLSearchParams()
  if (params.category && params.category !== "all") query.set("category", params.category)
  if (params.search) query.set("search", params.search)
  query.set("page", String(params.page ?? 1))
  query.set("pageSize", String(params.pageSize ?? 20))
  if (Number.isFinite(params.lat) && Number.isFinite(params.lng)) {
    query.set("lat", String(params.lat))
    query.set("lng", String(params.lng))
  }
  if (params.openNow) query.set("openNow", "true")
  const res = await fetch(`${API_BASE_URL}/places?${query.toString()}`, {
    headers: authHeaders(params.token),
    cache: "no-store",
  })
  if (!res.ok) throw new Error("places")
  const json = await readJson(res)
  const data = json?.data
  return {
    items: Array.isArray(data?.items) ? data.items : [],
    page: Number(data?.page ?? 1),
    pageSize: Number(data?.pageSize ?? 20),
    totalCount: Number(data?.totalCount ?? 0),
  }
}

export async function fetchNearbyPlaces(
  lat: number,
  lng: number,
  limit = 8,
  token?: string | null,
): Promise<PlaceNearbyItem[]> {
  const res = await fetch(
    `${API_BASE_URL}/places/nearby?lat=${lat}&lng=${lng}&limit=${limit}`,
    { headers: authHeaders(token), cache: "no-store" },
  )
  if (!res.ok) throw new Error("nearby")
  const json = await readJson(res)
  return Array.isArray(json?.data) ? json.data : []
}

export async function fetchPlaceDetail(
  idOrSlug: string,
  origin?: { lat: number; lng: number },
  token?: string | null,
): Promise<PlaceDetail> {
  const query = origin
    ? `?lat=${origin.lat}&lng=${origin.lng}`
    : ""
  const res = await fetch(`${API_BASE_URL}/places/${encodeURIComponent(idOrSlug)}${query}`, {
    headers: authHeaders(token),
    cache: "no-store",
  })
  if (!res.ok) throw new Error("place")
  const json = await readJson(res)
  if (!json?.data) throw new Error("place")
  return json.data as PlaceDetail
}
