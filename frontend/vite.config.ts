import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => {
  if (command === 'build') {
    const missing = ['VITE_MAP_TILE_URL', 'VITE_MAP_ATTRIBUTION'].filter(
      (key) => !process.env[key],
    );
    if (missing.length > 0) {
      throw new Error(
        `Production admin build requires map tile env: ${missing.join(', ')}. Do not ship the development OSM default.`,
      );
    }
  }

  return {
    plugins: [react()],
  }
})
