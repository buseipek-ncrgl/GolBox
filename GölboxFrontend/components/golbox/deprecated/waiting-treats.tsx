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

  if (token) {
    return livePreps.sort((a, b) => Number(b.status === "hazir") - Number(a.status === "hazir"))
  }
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
  const visible = compact ? preps.slice(0, 1) : preps
  const extra = compact ? Math.max(0, preps.length - 1) : 0

  if (preps.length === 0) {
    return (
      <div className="gol-card border-dashed px-5 py-5 text-center">
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
      <div className="space-y-2">
        {visible.map((prep) => (
          <button
            key={prep.id}
            type="button"
            onClick={onShowQr}
            className="gol-card flex w-full items-center gap-3 p-3.5 text-left transition hover:border-primary/40"
          >
            {/* Sender Avatar Badge */}
            <div className="relative shrink-0">
              <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 font-serif text-sm font-bold text-primary ring-2 ring-primary/20">
                GB
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-accent text-[10px] text-accent-foreground shadow-sm">
                ☕
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold text-card-foreground">{prep.cafe}</span>
                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    prep.status === "hazir"
                      ? "bg-primary text-primary-foreground"
                      : "bg-accent/20 text-accent-foreground"
                  }`}
                >
                  {prep.status === "hazir" ? <Check className="size-3" /> : <Clock className="size-3" />}
                  {prep.status === "hazir" ? "Hazır" : "Hazırlanıyor"}
                </span>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {(prep.items.length > 0 ? prep.items : ["İkram"]).join(" · ")}
              </p>
            </div>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
          </button>
        ))}
        {extra > 0 && (
          <p className="px-1 text-xs text-muted-foreground">ve {extra} ikram daha</p>
        )}
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {visible.map((prep) => (
        <li key={prep.id} className="gol-card">
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
