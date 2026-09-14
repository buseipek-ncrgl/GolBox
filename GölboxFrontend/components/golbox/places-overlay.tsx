"use client"

import { X } from "lucide-react"
import { PlacesScreen } from "@/components/golbox/screens/places-screen"

export function PlacesOverlay({
  onOpenPlace,
  onClose,
}: {
  onOpenPlace: (id: string) => void
  onClose: () => void
}) {
  return (
    <div className="absolute inset-0 z-40">
      <button
        type="button"
        aria-label="Kapat"
        onClick={onClose}
        className="gol-fade absolute inset-0 bg-foreground/40 backdrop-blur-[2px]"
      />
      <div className="gol-sheet-up absolute inset-x-0 bottom-0 top-8 flex flex-col overflow-hidden rounded-t-[2rem] bg-background">
        <div className="flex items-center justify-between px-5 pt-4">
          <p className="font-serif text-xl text-foreground">Tesisler</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="flex size-11 items-center justify-center rounded-full bg-secondary text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
          <PlacesScreen onOpenPlace={onOpenPlace} embedded />
        </div>
      </div>
    </div>
  )
}
