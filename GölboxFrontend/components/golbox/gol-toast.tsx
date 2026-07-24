"use client"

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react"
import { Sparkles } from "lucide-react"

type Toast = { id: number; message: string }

const ToastContext = createContext<(message: string) => void>(() => {})

export function useGolToast() {
  return useContext(ToastContext)
}

export function GolToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const notify = useCallback((message: string) => {
    if (timer.current) clearTimeout(timer.current)
    setToast({ id: Date.now(), message })
    // Manifesto: bildirim 2-3 saniye görünür, sonra kaybolur
    timer.current = setTimeout(() => setToast(null), 2600)
  }, [])

  return (
    <ToastContext.Provider value={notify}>
      {children}
      {toast && (
        <div
          key={toast.id}
          role="status"
          aria-live="polite"
          className="gol-toast-in absolute left-1/2 top-4 z-50 flex items-center gap-2.5 rounded-full border border-white/15 bg-foreground/95 px-4 py-2.5 text-sm font-medium text-background shadow-lg backdrop-blur"
        >
          <Sparkles className="size-4 text-accent" strokeWidth={2.2} />
          <span className="whitespace-nowrap">{toast.message}</span>
        </div>
      )}
    </ToastContext.Provider>
  )
}
