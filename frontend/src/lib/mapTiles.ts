export const DEFAULT_MAP_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const DEFAULT_MAP_ATTRIBUTION = '&copy; OpenStreetMap contributors';

export function adminMapTiles() {
  return {
    url: import.meta.env.VITE_MAP_TILE_URL || DEFAULT_MAP_TILE_URL,
    attribution: import.meta.env.VITE_MAP_ATTRIBUTION || DEFAULT_MAP_ATTRIBUTION
  };
}
