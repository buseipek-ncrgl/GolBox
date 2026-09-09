"use client"

import dynamic from "next/dynamic"
import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Gift, X } from "lucide-react"
import { safeModelUrl } from "@/lib/safe-model-url"
import type { FieldDropNearby } from "@/lib/golbox-context"

const GlbStage = dynamic(
  () => import("@/components/golbox/glb-stage").then((mod) => mod.GlbStage),
  { ssr: false }
)

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
  const modelUrl = safeModelUrl(drop.modelGlbUrl)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setModelFailed(false)
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

  const showModel = Boolean(modelUrl) && !modelFailed
  const host = typeof document !== "undefined" ? document.querySelector("[data-golbox-shell]") : null

  const ui = (
    <div className="absolute inset-0 z-[80] flex flex-col bg-[#0b1f20] text-white">
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-cover ${cameraState === "live" ? "opacity-100" : "opacity-0"}`}
          autoPlay
          muted
          playsInline
        />
        {cameraState !== "live" && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,#1d5f60_0%,#0b1f20_72%)]" />
        )}

        <div className="pointer-events-none absolute inset-x-6 top-[18%] bottom-[28%]">
          {showModel ? (
            <GlbStage src={modelUrl!} onError={handleModelError} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3">
              {drop.imageUrl ? (
                <img
                  src={drop.imageUrl}
                  alt=""
                  className="max-h-40 rounded-3xl object-cover shadow-2xl"
                />
              ) : (
                <span className="flex size-24 items-center justify-center rounded-[2rem] bg-white/10">
                  <Gift className="size-10 text-accent" strokeWidth={1.8} />
                </span>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full bg-black/45"
          aria-label="Kapat"
        >
          <X className="size-5" />
        </button>

        <div className="absolute inset-x-0 top-4 flex justify-center px-16">
          <p className="rounded-full bg-black/40 px-3 py-1 text-center text-[11px] font-medium tracking-wide">
            Kamera üzerine 3D hediye
          </p>
        </div>
      </div>

      <div className="shrink-0 space-y-3 bg-[#0b1f20] px-5 pb-6 pt-4">
        <div>
          <p className="font-serif text-xl">{drop.title}</p>
          <p className="mt-1 text-sm text-white/70">+{drop.pointsGranted} GP · konum doğrulamasıyla alınır</p>
        </div>
        {cameraState === "unavailable" && (
          <p className="text-xs text-white/65">
            Kamera açılamadı. Konum yarıçapındaysanız yine de alabilirsiniz.
          </p>
        )}
        {cameraState === "pending" && (
          <p className="text-xs text-white/65">Kamera isteniyor…</p>
        )}
        {!modelUrl && (
          <p className="text-xs text-white/65">Bu hediyede 3D model yok. GPS Al çalışır.</p>
        )}
        {modelUrl && modelFailed && (
          <p className="text-xs text-white/65">3D model yüklenemedi. GPS Al çalışır.</p>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={onConfirm}
          className="w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Alınıyor..." : "Al"}
        </button>
      </div>
    </div>
  )

  return host ? createPortal(ui, host) : ui
}
