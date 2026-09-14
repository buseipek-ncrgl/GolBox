"use client"

import { OverlaySheet } from "@/components/golbox/overlay-sheet"

export function LocationPermissionSheet({
  onClose,
  onContinueWithout,
}: {
  onClose: () => void
  onContinueWithout?: () => void
}) {
  return (
    <OverlaySheet title="Konum" onClose={onClose}>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Yakındaki Göl Kafeler ve GölBox saha hediyeleri için tarayıcı konumunu kullanıyoruz. İzin yoksa Şehitkamil
        merkezi esas alınır.
      </p>
      <div className="mt-6 space-y-2">
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 w-full rounded-[14px] bg-primary text-sm font-semibold text-primary-foreground"
        >
          Anladım
        </button>
        {onContinueWithout ? (
          <button
            type="button"
            onClick={onContinueWithout}
            className="min-h-11 w-full text-sm font-semibold text-muted-foreground"
          >
            Konumsuz devam et
          </button>
        ) : null}
      </div>
    </OverlaySheet>
  )
}
