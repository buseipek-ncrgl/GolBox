export const DEFAULT_MAP_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
export const DEFAULT_MAP_ATTRIBUTION = "&copy; OpenStreetMap contributors"

export function citizenMapTiles() {
  return {
    url: process.env.NEXT_PUBLIC_MAP_TILE_URL || DEFAULT_MAP_TILE_URL,
    attribution: process.env.NEXT_PUBLIC_MAP_ATTRIBUTION || DEFAULT_MAP_ATTRIBUTION,
  }
}
