export function adminMapTiles() {
  const url = import.meta.env.VITE_MAP_TILE_URL as string | undefined;
  const attribution = import.meta.env.VITE_MAP_ATTRIBUTION as string | undefined;
  if (import.meta.env.PROD) {
    if (!url || !attribution) {
      throw new Error(
        'Production admin build requires VITE_MAP_TILE_URL and VITE_MAP_ATTRIBUTION'
      );
    }
    return { url, attribution };
  }
  return {
    url: url || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: attribution || '&copy; OpenStreetMap contributors'
  };
}
