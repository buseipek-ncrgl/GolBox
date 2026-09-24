function trimSlash(value: string) {
  return value.replace(/\/$/, "")
}

function getDevUrl(path: string) {
  const host = typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? window.location.hostname
    : "127.0.0.1"
  return `http://${host}:5155${path}`
}

export const API_BASE_URL = trimSlash(
  process.env.NEXT_PUBLIC_API_BASE_URL ||
    (process.env.NODE_ENV === "production" ? "/api/v1" : getDevUrl("/api/v1")),
)

export const HUB_URL =
  process.env.NEXT_PUBLIC_HUB_URL ||
  (process.env.NODE_ENV === "production" ? "/hubs/orders" : getDevUrl("/hubs/orders"))

export const NOTIFICATION_HUB_URL =
  process.env.NEXT_PUBLIC_NOTIFICATION_HUB_URL ||
  (process.env.NODE_ENV === "production"
    ? "/hubs/notifications"
    : getDevUrl("/hubs/notifications"))

