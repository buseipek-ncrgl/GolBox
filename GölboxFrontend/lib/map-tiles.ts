export function citizenMapTiles() {
  const url = process.env.NEXT_PUBLIC_MAP_TILE_URL
  const attribution = process.env.NEXT_PUBLIC_MAP_ATTRIBUTION
  if (process.env.NODE_ENV === "production") {
    if (!url || !attribution) {
      throw new Error(
        "Production citizen build requires NEXT_PUBLIC_MAP_TILE_URL and NEXT_PUBLIC_MAP_ATTRIBUTION",
      )
    }
    return { url, attribution }
  }
  return {
    url: url || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: attribution || "&copy; OpenStreetMap contributors",
  }
}
