"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Camera, Sparkles, X } from "lucide-react"
import { safeModelUrl } from "@/lib/safe-model-url"
import type { FieldDropNearby } from "@/lib/golbox-context"
import { ThreeCupStage } from "@/components/golbox/three-cup-stage"
import type { ComponentType } from "react"

export function CaptureOverlay({
  drop,
  busy,
  onConfirm,
  onClose,
}: {
  drop: FieldDropNearby
  busy: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [mounted, setMounted] = useState(false)
  const [cameraState, setCameraState] = useState<"pending" | "live" | "unavailable">("pending")
  const [modelFailed, setModelFailed] = useState(false)
  const [GlbStage, setGlbStage] = useState<ComponentType<{ src: string; onError: () => void }> | null>(null)
  const modelUrl = safeModelUrl(drop.modelGlbUrl)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setModelFailed(false)
  }, [modelUrl])

  useEffect(() => {
    if (!modelUrl) {
      setGlbStage(null)
      return
    }
    let cancelled = false
    void import("@/components/golbox/glb-stage").then((mod) => {
      if (!cancelled) setGlbStage(() => mod.GlbStage)
    }).catch(() => {
      if (!cancelled) setModelFailed(true)
    })
    return () => {
      cancelled = true
    }
  }, [modelUrl])

  useEffect(() => {
    let cancelled = false

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (!cancelled) setCameraState("unavailable")
        return
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          await video.play().catch(() => undefined)
        }
        setCameraState("live")
      } catch {
        if (!cancelled) setCameraState("unavailable")
      }
    }

    void start()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  const handleModelError = useCallback(() => {
    setModelFailed(true)
  }, [])

  if (!mounted) return null

  const showCustomGlb = Boolean(modelUrl) && !modelFailed && GlbStage
  const host = typeof document !== "undefined" ? document.querySelector("[data-golbox-shell]") : null

  const ui = (
    <div className="absolute inset-0 z-[80] flex flex-col bg-[#0b1f20] text-white">
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${cameraState === "live" ? "opacity-100" : "opacity-0"}`}
          autoPlay
          muted
          playsInline
        />
        {cameraState !== "live" && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,#1d5f60_0%,#0b1f20_75%)]" />
        )}

        {/* Floating 3D Animated Drink Cup Stage */}
        <div 
          onClick={onConfirm}
          className="absolute inset-x-6 top-[15%] bottom-[25%] cursor-pointer select-none"
        >
          <ThreeCupStage />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-md transition-all hover:bg-black/70 active:scale-95"
          aria-label="Kapat"
        >
          <X className="size-5" />
        </button>

        <div className="absolute inset-x-0 top-5 flex justify-center px-12 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/50 px-3.5 py-1 text-center text-xs font-semibold tracking-wide backdrop-blur-md">
            <Camera className="size-3.5 text-[color:var(--color-gold)]" />
            3D Hediye Bardağı Dokunarak Topla
          </span>
        </div>
      </div>

      <div className="shrink-0 space-y-3 bg-[#0b1f20] px-5 pb-6 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-serif text-lg font-bold">{drop.title}</p>
            <p className="mt-0.5 text-xs text-white/75">
              +{drop.pointsGranted} GP · En yakın 500m konum doğrulamasıyla
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--color-gold)]/20 px-2.5 py-1 text-xs font-bold text-[color:var(--color-gold)] border border-[color:var(--color-gold)]/30">
            <Sparkles className="size-3.5" />
            500m İçi
          </span>
        </div>

        {cameraState === "unavailable" && (
          <p className="text-xs text-amber-200/80">
            Kamera izni verilemedi. Yine de aşağıdaki butona dokunarak hediyenizi alabilirsiniz.
          </p>
        )}

        <button
          type="button"
          disabled={busy}
          onClick={onConfirm}
          className="w-full rounded-2xl bg-gradient-to-r from-primary to-[color:var(--color-brand-600)] py-3.5 text-sm font-bold text-primary-foreground shadow-md transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? "Hediye Toplanıyor..." : "3D Hediyeyi Topla"}
        </button>
      </div>
    </div>
  )

  return host ? createPortal(ui, host) : ui
}

