export const SEHITKAMIL = { lat: 37.0662, lng: 37.3781 }

export function metersBetween(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
) {
  if (![from.lat, from.lng, to.lat, to.lng].every(Number.isFinite)) return Number.NaN
  const earthRadiusMeters = 6371000
  const toRad = (degrees: number) => (degrees * Math.PI) / 180
  const lat1 = toRad(from.lat)
  const lat2 = toRad(to.lat)
  const deltaLat = toRad(to.lat - from.lat)
  const deltaLng = toRad(to.lng - from.lng)
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)
  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatDistance(meters: number) {
  if (!Number.isFinite(meters)) return "—"
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1).replace(".", ",")} km`
}
