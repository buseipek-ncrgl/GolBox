"use client"

import { useState } from "react"
import { Check, MapPin, Plus, X } from "lucide-react"
import { CafeCover } from "@/components/golbox/cafe-cover"
import { useGolToast } from "@/components/golbox/gol-toast"
import { useGolbox } from "@/lib/golbox-context"
import { LoginScreen } from "@/components/golbox/screens/login-screen"

export function CafeDetailSheet({ cafeId, onClose }: { cafeId: string; onClose: () => void }) {
  const { cafes: liveCafes, token, createOrder, loading } = useGolbox()
  const notify = useGolToast()
  const live = liveCafes.find((cafe) => cafe.id === cafeId)
  const [prep, setPrep] = useState<string[]>([])
  const [showLogin, setShowLogin] = useState(false)
  const [sending, setSending] = useState(false)

  if (!live) {
    return (
      <div className="absolute inset-0 z-50">
        <button type="button" aria-label="Kapat" onClick={onClose} className="gol-fade absolute inset-0 bg-foreground/40 backdrop-blur-[2px]" />
        <div className="gol-sheet-up absolute inset-x-0 bottom-0 top-24 flex flex-col items-center justify-center gap-3 rounded-t-[2rem] bg-background px-6 text-center">
          <p className="font-semibold text-foreground">Kafe bulunamadı</p>
          <p className="text-sm text-muted-foreground">Bu tesis canlı listede yok.</p>
          <button type="button" onClick={onClose} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Kapat
          </button>
        </div>
      </div>
    )
  }

  const name = live.name
  const address = live.address
  const category = live.categoryName ?? "Kitap Kafe"
  const imageUrl = live.imageUrl
  const open = live.isActive !== false
  const statusLabel = open ? "Açık" : "Kapalı"
  const liveItems = live.menuItems ?? []

  const toggleLive = (id: string) => {
    setPrep((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const submitLive = async () => {
    if (!token) {
      setShowLogin(true)
      return
    }
    setSending(true)
    let okCount = 0
    for (const menuItemId of prep) {
      const ok = await createOrder(live.id, menuItemId, 1, false)
      if (ok) okCount += 1
    }
    setSending(false)
    if (okCount > 0) {
      notify("Ismarlıyor listene eklendi")
      onClose()
    }
  }

  return (
    <div className="absolute inset-0 z-50">
      <button
        type="button"
        aria-label="Kapat"
        onClick={onClose}
        className="gol-fade absolute inset-0 bg-foreground/40 backdrop-blur-[2px]"
      />
      <div className="gol-sheet-up absolute inset-x-0 bottom-0 top-10 flex flex-col overflow-hidden rounded-t-[2rem] bg-background">
        <div className="relative h-44 w-full shrink-0">
          <CafeCover name={name} imageUrl={imageUrl} className="h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-background/85 text-foreground backdrop-blur"
          >
            <X className="size-5" />
          </button>
          <div className="absolute inset-x-5 bottom-3">
            <p className="font-serif text-2xl text-foreground">{name}</p>
            <p className="text-sm text-muted-foreground">{category}</p>
          </div>
        </div>

        <div className="no-scrollbar flex-1 space-y-6 overflow-y-auto px-5 pb-40 pt-5">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
              <MapPin className="size-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-card-foreground">{address}</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                open ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {statusLabel}
            </span>
          </div>

          <section className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Ismarlıyor</h3>
              <p className="text-xs text-muted-foreground">
                Seçtiklerin seni bekleyen ikramlara düşer. Katalog ödülü ve saha kutusu buradan ayrıdır.
              </p>
            </div>

            <ul className="overflow-hidden rounded-2xl border border-border bg-card">
              {liveItems.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-muted-foreground">Menü henüz yüklenmedi.</li>
              ) : (
                liveItems.map((item) => {
                  const active = prep.includes(item.id)
                  return (
                    <li key={item.id} className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-card-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">₺{item.price}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleLive(item.id)}
                        aria-pressed={active}
                        aria-label={`${item.name} ekle`}
                        className={`flex size-8 items-center justify-center rounded-full transition-colors ${
                          active ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {active ? <Check className="size-4" /> : <Plus className="size-4" />}
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
          </section>
        </div>

        {prep.length > 0 && (
          <div className="gol-fade absolute inset-x-0 bottom-0 border-t border-border bg-background/95 px-5 py-4 backdrop-blur">
            <button
              type="button"
              disabled={sending || loading}
              onClick={submitLive}
              className="flex w-full items-center justify-center rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {sending ? "Gönderiliyor..." : token ? `${prep.length} ürün · Ismarla` : "Giriş yap ve ısmarla"}
            </button>
          </div>
        )}
        {showLogin && !token && (
          <div className="absolute inset-0 z-[60] bg-background">
            <LoginScreen onClose={() => setShowLogin(false)} closeLabel="Kafeye dön" />
          </div>
        )}
      </div>
    </div>
  )
}
