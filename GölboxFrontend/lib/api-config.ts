const DEV_API = "http://localhost:5155/api/v1"
const DEV_HUB = "http://localhost:5155/hubs/orders"
const DEV_NOTIFICATION_HUB = "http://localhost:5155/hubs/notifications"

function trimSlash(value: string) {
  return value.replace(/\/$/, "")
}

export const API_BASE_URL = trimSlash(
  process.env.NEXT_PUBLIC_API_BASE_URL ||
    (process.env.NODE_ENV === "production" ? "/api/v1" : DEV_API),
)

export const HUB_URL =
  process.env.NEXT_PUBLIC_HUB_URL ||
  (process.env.NODE_ENV === "production" ? "/hubs/orders" : DEV_HUB)

export const NOTIFICATION_HUB_URL =
  process.env.NEXT_PUBLIC_NOTIFICATION_HUB_URL ||
  (process.env.NODE_ENV === "production" ? "/hubs/notifications" : DEV_NOTIFICATION_HUB)
