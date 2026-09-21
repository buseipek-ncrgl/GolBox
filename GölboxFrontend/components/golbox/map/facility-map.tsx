"use client"

import { useEffect, useRef, useState } from "react"
import "leaflet/dist/leaflet.css"
import { SEHITKAMIL } from "@/lib/golbox-geo"
import { categoryLabel } from "@/lib/places"
import { citizenMapTiles } from "@/lib/map-tiles"

type MapPlace = {
  id: string
  name: string
  category?: string
  latitude?: number | null
  longitude?: number | null
}

type MapDrop = {
  id: string
  title: string
  latitude: number | string
  longitude: number | string
}

export function FacilityMap({
  layer,
  places,
  drops,
  origin,
  focus,
  onSelectPlace,
  onSelectDrop,
}: {
  layer: "places" | "golbox"
  places: MapPlace[]
  drops: MapDrop[]
  origin: { lat: number; lng: number }
  focus?: { lat: number; lng: number } | null
  onSelectPlace?: (id: string) => void
  onSelectDrop?: (id: string) => void
}) {
  const host = useRef<HTMLDivElement>(null)
  const [mapError, setMapError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    let map: any = undefined

    setMapError(false)

    void (async () => {
      try {
        // @ts-ignore
        const L = await import("leaflet")
        if (cancelled || !host.current) return

        const center = focus ?? origin ?? SEHITKAMIL
        map = L.map(host.current, {
          zoomControl: true,
          attributionControl: true,
        }).setView([center.lat, center.lng], focus ? 15 : 13)

        const tiles = citizenMapTiles()
        const tileLayer = L.tileLayer(tiles.url, {
          attribution: tiles.attribution,
          maxZoom: 19,
        })

        tileLayer.on("tileerror", () => {
          if (!cancelled) setMapError(true)
        })

        tileLayer.addTo(map)

        const makeIcon = (html: string) =>
          L.divIcon({
            className: "gol-map-marker",
            html,
            iconSize: [28, 28],
            iconAnchor: [14, 28],
          })

        const placePoints = places
          .map((place) => ({
            ...place,
            lat: Number(place.latitude),
            lng: Number(place.longitude),
          }))
          .filter((place) => Number.isFinite(place.lat) && Number.isFinite(place.lng))

        const dropPoints = drops
          .map((drop) => ({
            ...drop,
            lat: Number(drop.latitude),
            lng: Number(drop.longitude),
          }))
          .filter((drop) => Number.isFinite(drop.lat) && Number.isFinite(drop.lng))

        if (layer === "places") {
          const zoom = map.getZoom()
          if (zoom < 13 && placePoints.length > 12) {
            const buckets = new Map<string, typeof placePoints>()
            for (const place of placePoints) {
              const key = `${place.lat.toFixed(2)}:${place.lng.toFixed(2)}`
              const list = buckets.get(key) ?? []
              list.push(place)
              buckets.set(key, list)
            }
            buckets.forEach((group) => {
              const lat = group.reduce((s, p) => s + p.lat, 0) / group.length
              const lng = group.reduce((s, p) => s + p.lng, 0) / group.length
              if (group.length === 1) {
                L.marker([group[0].lat, group[0].lng], {
                  icon: makeIcon(
                    `<span style="display:flex;width:28px;height:28px;align-items:center;justify-content:center;border-radius:999px;background:#1D5F60;color:#fff;font:700 11px Manrope,sans-serif">${(categoryLabel(group[0].category) || "T").slice(0, 1)}</span>`,
                  ),
                })
                  .on("click", () => onSelectPlace?.(group[0].id))
                  .addTo(map!)
              } else {
                L.marker([lat, lng], {
                  icon: makeIcon(
                    `<span style="display:flex;width:28px;height:28px;align-items:center;justify-content:center;border-radius:999px;background:#1c2e2e;color:#fff;font:700 11px Manrope,sans-serif">${group.length}</span>`,
                  ),
                }).addTo(map!)
              }
            })
          } else {
            placePoints.forEach((place) => {
              L.marker([place.lat, place.lng], {
                icon: makeIcon(
                  `<span style="display:flex;width:28px;height:28px;align-items:center;justify-content:center;border-radius:999px;background:#1D5F60;color:#fff;font:700 11px Manrope,sans-serif">${(categoryLabel(place.category) || "T").slice(0, 1)}</span>`,
                ),
              })
                .bindTooltip(place.name)
                .on("click", () => onSelectPlace?.(place.id))
                .addTo(map!)
            })
          }
        } else {
          dropPoints.forEach((drop) => {
            L.marker([drop.lat, drop.lng], {
              icon: makeIcon(
                `<span style="display:flex;width:28px;height:28px;align-items:center;justify-content:center;border-radius:8px;background:#1c2e2e;color:#fff;font:700 12px Manrope,sans-serif">G</span>`,
              ),
            })
              .bindTooltip(drop.title)
              .on("click", () => onSelectDrop?.(drop.id))
              .addTo(map!)
          })
        }
      } catch {
        if (!cancelled) setMapError(true)
      }
    })()

    return () => {
      cancelled = true
      map?.remove()
    }
  }, [layer, places, drops, origin, focus, onSelectPlace, onSelectDrop, retryKey])

  if (mapError) {
    return (
      <div className="flex h-full min-h-[16rem] w-full flex-col items-center justify-center gap-3 rounded-[1.25rem] bg-muted/60 p-6 text-center">
        <p className="text-sm font-semibold text-foreground">Harita şu anda yüklenemiyor</p>
        <p className="text-xs text-muted-foreground">İnternet bağlantınızı kontrol edin ve tekrar deneyin.</p>
        <button
          type="button"
          onClick={() => setRetryKey((k) => k + 1)}
          className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
        >
          Tekrar dene
        </button>
      </div>
    )
  }

  return <div ref={host} className="h-full min-h-[16rem] w-full rounded-[1.25rem]" role="application" aria-label="Harita" />
}
