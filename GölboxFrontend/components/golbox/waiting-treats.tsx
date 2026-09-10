"use client"

import { ArrowRight, Check, Clock, Coffee } from "lucide-react"
import { useGolbox } from "@/lib/golbox-context"

export function useWaitingTreats() {
  const { token, orders } = useGolbox()
  const livePreps = (orders || [])
    .filter((order) => ["Ready", "Preparing", "Pending", "Approved"].includes(order.status))
    .map((order) => ({
      id: order.id,
      cafe: order.cafeName,
      status: order.status === "Ready" ? ("hazir" as const) : ("hazirlaniyor" as const),
      note:
        order.status === "Ready"
          ? "Kasada QR'ını göster, hemen hazır."
          : "İkram hazırlanıyor.",
      items: (order.items || []).map((item) => item.menuItemName).filter(Boolean),
    }))

  if (token) return livePreps
  return []
}

export function WaitingTreats({
  compact = false,
  onShowQr,
  onExploreCafes,
}: {
  compact?: boolean
  onShowQr: () => void
  onExploreCafes: () => void
}) {
  const { token } = useGolbox()
  const preps = useWaitingTreats()

  if (preps.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-border bg-card px-5 py-5 text-center">
        <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
          <Coffee className="size-5" />
        </div>
        <p className="text-sm text-muted-foreground">
          {token ? "Şu an seni bekleyen bir ikram yok." : "Giriş yapınca seni bekleyen ikramlar burada durur."}
        </p>
        <button type="button" onClick={onExploreCafes} className="mt-2 text-sm font-semibold text-primary">
          Göl Kafeleri keşfet
        </button>
      </div>
    )
  }

  if (compact) {
    return (
      <ul className="space-y-2">
        {preps.map((prep) => (
          <li key={prep.id}>
            <button
              type="button"
              onClick={onShowQr}
              className="flex w-full items-center gap-3 rounded-[1.5rem] border border-border bg-card px-4 py-3.5 text-left"
            >
              <span
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  prep.status === "hazir"
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent text-accent-foreground"
                }`}
              >
                {prep.status === "hazir" ? (
                  <>
                    <Check className="size-3.5" /> Hazır
                  </>
                ) : (
                  <>
                    <Clock className="size-3.5" /> Hazırlanıyor
                  </>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-card-foreground">{prep.cafe}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {(prep.items.length > 0 ? prep.items : ["İkram"]).join(" · ")}
                </span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <ul className="space-y-3">
      {preps.map((prep) => (
        <li key={prep.id} className="overflow-hidden rounded-[1.75rem] border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border bg-secondary/50 px-4 py-3">
            <span
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                prep.status === "hazir"
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent text-accent-foreground"
              }`}
            >
              {prep.status === "hazir" ? (
                <>
                  <Check className="size-3.5" /> Hazır
                </>
              ) : (
                <>
                  <Clock className="size-3.5" /> Hazırlanıyor
                </>
              )}
            </span>
            <span className="ml-auto truncate text-sm font-medium text-card-foreground">{prep.cafe}</span>
          </div>
          <div className="space-y-3 p-4">
            <p className="text-sm text-muted-foreground">{prep.note}</p>
            <ul className="flex flex-wrap gap-2">
              {(prep.items.length > 0 ? prep.items : ["İkram"]).map((item) => (
                <li
                  key={item}
                  className="rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground"
                >
                  {item}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={onShowQr}
              className="flex w-full items-center justify-center rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground"
            >
              Kasada QR&apos;ını göster
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
