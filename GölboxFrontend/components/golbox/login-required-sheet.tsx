"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { LoginScreen } from "@/components/golbox/screens/login-screen"

export function LoginRequiredSheet({
  onClose,
  closeLabel = "Geri",
}: {
  onClose: () => void
  closeLabel?: string
}) {
  const [target, setTarget] = useState<HTMLElement | null>(null)
  useEffect(() => {
    setTarget(document.querySelector("[data-golbox-shell]") as HTMLElement | null)
  }, [])

  const sheet = (
    <div className="absolute inset-0 z-50 overflow-y-auto bg-background">
      <LoginScreen onClose={onClose} closeLabel={closeLabel} />
    </div>
  )

  if (!target) return sheet
  return createPortal(sheet, target)
}
