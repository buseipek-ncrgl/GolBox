export const SEHITKAMIL = { lat: 37.0662, lng: 37.3781 }

export function formatDistance(meters: number) {
  if (!Number.isFinite(meters)) return "—"
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}
