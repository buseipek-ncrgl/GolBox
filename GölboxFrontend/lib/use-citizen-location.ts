"use client"

import { useCallback, useEffect, useState } from "react"
import { SEHITKAMIL } from "@/lib/golbox-geo"
import { useGolbox } from "@/lib/golbox-context"

export function useCitizenLocation(pollMs = 0) {
  const { loadNearbyFieldDrops } = useGolbox()
  const [origin, setOrigin] = useState(SEHITKAMIL)
  const [usingFallback, setUsingFallback] = useState(true)

  const refresh = useCallback(
    (lat: number, lng: number) => {
      void loadNearbyFieldDrops(lat, lng)
    },
    [loadNearbyFieldDrops],
  )

  useEffect(() => {
    let cancelled = false
    if (!navigator.geolocation) {
      refresh(SEHITKAMIL.lat, SEHITKAMIL.lng)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setOrigin(next)
        setUsingFallback(false)
        refresh(next.lat, next.lng)
      },
      () => {
        if (cancelled) return
        setOrigin(SEHITKAMIL)
        setUsingFallback(true)
        refresh(SEHITKAMIL.lat, SEHITKAMIL.lng)
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
    return () => {
      cancelled = true
    }
  }, [refresh])

  useEffect(() => {
    if (!pollMs) return
    const tick = window.setInterval(() => refresh(origin.lat, origin.lng), pollMs)
    return () => window.clearInterval(tick)
  }, [origin.lat, origin.lng, pollMs, refresh])

  return {
    origin,
    usingFallback,
    refresh: () => refresh(origin.lat, origin.lng),
  }
}
