"use client"

import { Screen } from "@/components/golbox/screen"
import { 
  CalendarDays,
  Ticket, 
  User, 
  PhoneCall, 
  MapPin, 
  Building2,
} from "lucide-react"
import { useGolbox } from "@/lib/golbox-context"
import type { TabId } from "@/lib/golbox-data"

export function MenuScreen({
  onNavigate,
  onOpenCoupons,
}: {
  onNavigate: (tab: TabId) => void
  onOpenCoupons: () => void
}) {
  const { cafes, cafesLoadState } = useGolbox()

  return (
    <Screen className="space-y-6 pb-12">
      <header className="pt-1">
        <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
          Kurumsal ve Hizmetler
        </span>
        <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
          Menü
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Şehitkamil Belediyesi hizmetleri ve uygulama bölümleri.
        </p>
      </header>

      {/* Hızlı Erişim Kartları */}
      <section aria-label="Hızlı Hizmetler" className="space-y-3">
        <h2 className="text-sm font-bold text-foreground">Hızlı Erişim</h2>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={onOpenCoupons}
            className="flex flex-col items-center justify-center text-center gap-1.5 rounded-[18px] border border-border/70 bg-card p-3 shadow-2xs transition-all hover:border-primary/40 active:scale-95"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-primary">
              <Ticket className="size-4.5" />
            </span>
            <div>
              <p className="text-xs font-bold text-foreground">Ödüllerim</p>
              <p className="text-[10px] text-muted-foreground">Katalog</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate("events")}
            className="flex flex-col items-center justify-center text-center gap-1.5 rounded-[18px] border border-border/70 bg-card p-3 shadow-2xs transition-all hover:border-primary/40 active:scale-95"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-primary">
              <CalendarDays className="size-4.5" />
            </span>
            <div>
              <p className="text-xs font-bold text-foreground">Etkinlikler</p>
              <p className="text-[10px] text-muted-foreground">Şehir Takvimi</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate("profile")}
            className="flex flex-col items-center justify-center text-center gap-1.5 rounded-[18px] border border-border/70 bg-card p-3 shadow-2xs transition-all hover:border-primary/40 active:scale-95"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-primary">
              <User className="size-4.5" />
            </span>
            <div>
              <p className="text-xs font-bold text-foreground">Profilim</p>
              <p className="text-[10px] text-muted-foreground">Hesap</p>
            </div>
          </button>
        </div>
      </section>

      {/* Belediye Tesisleri Listesi */}
      <section aria-label="Belediye Tesisleri" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">Şehitkamil Belediyesi Tesisleri</h2>
          <button
            type="button"
            onClick={() => onNavigate("map")}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <MapPin className="size-3.5" />
            Haritada Gör
          </button>
        </div>

        <div className="space-y-2.5">
          {cafes.map((fac) => (
              <div
                key={fac.id}
                className="group flex w-full items-center gap-3.5 rounded-[20px] border border-border/70 bg-card p-3.5 text-left shadow-2xs transition-all hover:border-primary/30"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
                  <Building2 className="size-5.5" strokeWidth={1.8} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                      {fac.categoryName || "Belediye Tesisi"}
                    </span>
                    {fac.isActive !== false ? (
                      <span className="rounded-md bg-[color:var(--color-gold)]/20 px-1.5 py-0.5 text-[9px] font-bold text-[color:var(--color-gold)] uppercase">
                        Ödül Kullanım Noktası
                      </span>
                    ) : null}
                  </div>
                  <p className="truncate text-sm font-bold text-foreground mt-0.5">{fac.name}</p>
                  <p className="truncate text-xs text-muted-foreground mt-0.5">{fac.address}</p>
                </div>

                <span className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-semibold ${
                  fac.isActive === false
                    ? "bg-destructive/10 text-destructive"
                    : "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400"
                }`}>
                  {fac.isActive === false ? "Kapalı" : "Açık"}
                </span>
              </div>
          ))}
          {cafesLoadState === "empty" || cafesLoadState === "error" ? (
            <div className="rounded-[20px] border border-dashed border-border p-5 text-center text-xs text-muted-foreground">
              Tesis bilgileri şu anda görüntülenemiyor.
            </div>
          ) : null}
        </div>
      </section>

      {/* İletişim ve Çağrı Merkezi */}
      <section aria-label="Kurumsal İletişim" className="space-y-3">
        <h2 className="text-sm font-bold text-foreground">Kurumsal İletişim ve Destek</h2>

        <div className="rounded-[22px] border border-primary/20 bg-gradient-to-br from-secondary/50 via-card to-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-2xs">
              <PhoneCall className="size-5" />
            </span>
            <div>
              <p className="text-xs font-bold text-foreground">Şehitkamil Çağrı Merkezi</p>
              <p className="text-[11px] text-muted-foreground">444 27 00 · 7/24 Çağrı Hizmeti</p>
            </div>
          </div>
          <a
            href="tel:4442700"
            className="rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground transition-all hover:bg-primary/95 active:scale-95"
          >
            Ara
          </a>
        </div>
      </section>
    </Screen>
  )
}
