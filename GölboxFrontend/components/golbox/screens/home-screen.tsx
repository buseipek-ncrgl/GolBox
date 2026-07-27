"use client"

import Image from "next/image"
import { ArrowRight, Coffee, MapPin, QrCode } from "lucide-react"
import { UserCard } from "@/components/golbox/user-card"
import { activity, cafes, todayHighlight, type TabId } from "@/lib/golbox-data"

export function HomeScreen({
  onNavigate,
  onOpenCafe,
}: {
  onNavigate: (tab: TabId) => void
  onOpenCafe: (id: string) => void
}) {
  const nearest = cafes[0]

  return (
    <div className="gol-fade-up space-y-6 px-5 pb-6 pt-3">
      <UserCard />

      {/* Bugün seni bekleyen tek fırsat */}
      <section aria-label="Bugün seni bekleyen">
        <button
          onClick={() => onNavigate("qr")}
          className="group flex w-full items-center gap-4 rounded-3xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/30"
        >
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent/20 text-accent-foreground">
            <Coffee className="size-6" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {todayHighlight.kicker}
            </p>
            <p className="mt-0.5 text-pretty font-semibold leading-snug text-card-foreground">
              {todayHighlight.title}
            </p>
            <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{todayHighlight.detail}</p>
          </div>
          <ArrowRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </button>
      </section>

      {/* En yakın şube önerisi */}
      <section aria-label="Sana en yakın şube" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Sana en yakın</h2>
          <button
            onClick={() => onNavigate("cafes")}
            className="text-sm font-medium text-primary"
          >
            Tümü
          </button>
        </div>
        <button
          onClick={() => onOpenCafe(nearest.id)}
          className="group block w-full overflow-hidden rounded-3xl border border-border bg-card text-left"
        >
          <div className="relative h-36 w-full">
            <Image
              src={nearest.image || "/placeholder.svg"}
              alt={`${nearest.name} iç mekan`}
              fill
              sizes="420px"
              className="object-cover"
            />
            <span className="absolute left-3 top-3 rounded-full bg-background/85 px-2.5 py-1 text-[11px] font-medium text-foreground backdrop-blur">
              {nearest.hint}
            </span>
          </div>
          <div className="flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-card-foreground">{nearest.name}</p>
              <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-3.5" /> {nearest.distance} · {nearest.walk}
              </p>
            </div>
            <span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
              {nearest.open ? `Açık · ${nearest.closeAt}` : "Kapalı"}
            </span>
          </div>
        </button>
      </section>

      {/* Sessiz özet: son hareketler (rapor değil, kısa) */}
      <section aria-label="Son hareketler" className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Son hareketler</h2>
        <ul className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
          {activity.slice(0, 3).map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-card-foreground">{a.label}</p>
                <p className="text-xs text-muted-foreground">{a.when}</p>
              </div>
              <span
                className={
                  a.kind === "earn"
                    ? "font-serif text-base text-primary"
                    : "font-serif text-base text-muted-foreground"
                }
              >
                {a.value}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Tek QR kısayolu */}
      <button
        onClick={() => onNavigate("qr")}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3.5 text-sm font-semibold text-background"
      >
        <QrCode className="size-4.5" strokeWidth={2.2} />
        QR'ımı göster
      </button>
    </div>
  )
}
