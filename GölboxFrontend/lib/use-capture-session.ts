"use client"

import { useEffect, useMemo, useState } from "react"
import { useGolbox, type FieldDropNearby } from "@/lib/golbox-context"

export function useCaptureSession(origin: { lat: number; lng: number }, fieldDrops: FieldDropNearby[]) {
  const { token, captureFieldDrop, loading } = useGolbox()
  const [showLogin, setShowLogin] = useState(false)
  const [pendingDropId, setPendingDropId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [capturedIds, setCapturedIds] = useState<string[]>([])

  useEffect(() => {
    if (token) setShowLogin(false)
  }, [token])

  const pendingDrop = useMemo(
    () => fieldDrops.find((drop) => drop.id === pendingDropId) ?? null,
    [fieldDrops, pendingDropId],
  )

  const openCapture = (dropId: string) => {
    if (!token) {
      setShowLogin(true)
      return
    }
    setPendingDropId(dropId)
  }

  const confirmCapture = async () => {
    if (!pendingDrop) return
    setBusyId(pendingDrop.id)
    const ok = await captureFieldDrop(pendingDrop.id, origin.lat, origin.lng)
    if (ok) {
      setCapturedIds((prev) => (prev.includes(pendingDrop.id) ? prev : [...prev, pendingDrop.id]))
      setPendingDropId(null)
    }
    setBusyId(null)
  }

  return {
    token,
    loading,
    showLogin,
    setShowLogin,
    pendingDrop,
    busyId,
    capturedIds,
    openCapture,
    confirmCapture,
    closeCapture: () => setPendingDropId(null),
  }
}
