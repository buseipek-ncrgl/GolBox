"use client"

import { useCallback, useEffect, useState } from "react"
import { SEHITKAMIL } from "@/lib/golbox-geo"
import { useGolbox } from "@/lib/golbox-context"

export type LocationPermission = "prompt" | "granted" | "denied" | "unavailable"

export function useCitizenLocation(pollMs = 0) {
  const { loadNearbyFieldDrops } = useGolbox()
  const [origin, setOrigin] = useState(SEHITKAMIL)
  const [usingFallback, setUsingFallback] = useState(true)
  const [permission, setPermission] = useState<LocationPermission>("prompt")

  const refresh = useCallback(
    (lat: number, lng: number) => {
      void loadNearbyFieldDrops(lat, lng)
    },
    [loadNearbyFieldDrops],
  )

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setPermission("unavailable")
      refresh(SEHITKAMIL.lat, SEHITKAMIL.lng)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setOrigin(next)
        setUsingFallback(false)
        setPermission("granted")
        refresh(next.lat, next.lng)
      },
      (error) => {
        setOrigin(SEHITKAMIL)
        setUsingFallback(true)
        setPermission(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable")
        refresh(SEHITKAMIL.lat, SEHITKAMIL.lng)
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }, [refresh])

  useEffect(() => {
    if (!pollMs) return
    const tick = window.setInterval(() => refresh(origin.lat, origin.lng), pollMs)
    return () => window.clearInterval(tick)
  }, [origin.lat, origin.lng, pollMs, refresh])

  return {
    origin,
    usingFallback,
    permission,
    requestLocation,
    refresh: () => refresh(origin.lat, origin.lng),
  }
}
