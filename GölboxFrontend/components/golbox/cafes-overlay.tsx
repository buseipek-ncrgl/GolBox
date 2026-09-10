"use client"

import { X } from "lucide-react"
import { CafesScreen } from "@/components/golbox/screens/cafes-screen"

export function CafesOverlay({
  onOpenCafe,
  onClose,
}: {
  onOpenCafe: (id: string) => void
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
          <p className="font-serif text-xl text-foreground">Göl Kafeler</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="flex size-9 items-center justify-center rounded-full bg-secondary text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
          <CafesScreen onOpenCafe={onOpenCafe} embedded />
        </div>
      </div>
    </div>
  )
}
