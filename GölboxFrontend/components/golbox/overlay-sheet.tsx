"use client"

import { useEffect, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

function usePhoneShell() {
  const [node, setNode] = useState<HTMLElement | null>(null)
  useEffect(() => {
    setNode(document.querySelector("[data-golbox-shell]") as HTMLElement | null)
  }, [])
  return node
}

export function OverlaySheet({
  title,
  onClose,
  children,
  className,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  className?: string
}) {
  const shell = usePhoneShell()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Handle Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)

    // Handle browser back button
    window.history.pushState({ golboxSheet: true }, "")
    const handlePopState = () => {
      onClose()
    }
    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("popstate", handlePopState)
    }
  }, [onClose])

  const sheet = (
    <div className="absolute inset-0 z-50">
      <button
        type="button"
        aria-label="Kapat"
        onClick={onClose}
        className="gol-fade absolute inset-0 bg-foreground/40"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="overlay-sheet-title"
        className={cn(
          "gol-sheet-up absolute inset-x-0 bottom-0 top-12 flex flex-col overflow-hidden rounded-t-[1.75rem] bg-background",
          className,
        )}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h2 id="overlay-sheet-title" className="font-serif text-xl text-foreground">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="flex size-11 items-center justify-center rounded-full bg-secondary text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-8">{children}</div>
      </div>
    </div>
  )

  if (!mounted) return null
  return shell ? createPortal(sheet, shell) : sheet
}
