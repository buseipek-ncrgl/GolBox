"use client"

import { useState } from "react"
import { Screen } from "@/components/golbox/screen"
import { 
  Building2, 
  Coffee, 
  GraduationCap, 
  Ticket, 
  User, 
  PhoneCall, 
  MapPin, 
  ChevronRight, 
  ExternalLink,
  Sparkles,
  Info,
  QrCode
} from "lucide-react"
import { useGolbox } from "@/lib/golbox-context"

export interface FacilityItem {
  id: string
  name: string
  category: string
  address: string
  hours: string
  icon: typeof Coffee
  badge?: string
}

const DEMO_FACILITIES: FacilityItem[] = [
  {
    id: "fac-1",
    name: "Şehitkamil Sanat ve Kitap Kafe",
    category: "Kitap Kafe ve Kütüphane",
    address: "Güvenevler Mah. 29017 Sk. No:4",
    hours: "24 Saat Açık",
    icon: Coffee,
    badge: "GölBox Noktası",
  },
  {
    id: "fac-2",
    name: "Dülük Tabiat Parkı Gençlik Kampı",
    category: "Doğa ve Spor",
    address: "Dülük Köyü İçi Yolu No:1",
    hours: "08:00 - 22:00",
    icon: Building2,
  },
  {
    id: "fac-3",
    name: "Şehitkamil Gençlik Sanat Merkezi",
    category: "Kültür ve Sanat",
    address: "Atatürk Mah. 15002 Sk.",
    hours: "09:00 - 18:00",
    icon: GraduationCap,
  },
  {
    id: "fac-4",
    name: "İbrahimli Spor Kompleksi ve Havuz",
    category: "Spor Tesisleri",
    address: "İbrahimli Mah. Batıkent Cad.",
    hours: "07:00 - 23:00",
    icon: Building2,
  },
]

export function MenuScreen({
  onNavigate,
  onOpenCoupons,
}: {
  onNavigate: (tab: any) => void
  onOpenCoupons: () => void
}) {
  const { user, token } = useGolbox()
  const [selectedFacility, setSelectedFacility] = useState<FacilityItem | null>(null)

  return (
    <Screen className="space-y-6 pb-12">
      <header className="pt-1">
        <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
          Kurumsal ve Hizmetler
        </span>
        <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
          Menü ve Tesisler
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Şehitkamil Belediyesi tesisleri, kitap kafeleri ve kurumsal hizmetler.
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
            onClick={() => onNavigate("qr")}
            className="flex flex-col items-center justify-center text-center gap-1.5 rounded-[18px] border border-primary/40 bg-primary/5 p-3 shadow-2xs transition-all hover:border-primary active:scale-95"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <QrCode className="size-4.5" />
            </span>
            <div>
              <p className="text-xs font-bold text-foreground">QR Kodum</p>
              <p className="text-[10px] text-muted-foreground">Kasa Kodu</p>
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
          <h2 className="text-sm font-bold text-foreground">Şehitkamil Belediye Tesisleri</h2>
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
          {DEMO_FACILITIES.map((fac) => {
            const Icon = fac.icon
            return (
              <div
                key={fac.id}
                className="group flex w-full items-center gap-3.5 rounded-[20px] border border-border/70 bg-card p-3.5 text-left shadow-2xs transition-all hover:border-primary/30"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
                  <Icon className="size-5.5" strokeWidth={1.8} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                      {fac.category}
                    </span>
                    {fac.badge ? (
                      <span className="rounded-md bg-[color:var(--color-gold)]/20 px-1.5 py-0.5 text-[9px] font-bold text-[color:var(--color-gold)] uppercase">
                        {fac.badge}
                      </span>
                    ) : null}
                  </div>
                  <p className="truncate text-sm font-bold text-foreground mt-0.5">{fac.name}</p>
                  <p className="truncate text-xs text-muted-foreground mt-0.5">{fac.address}</p>
                </div>

                <span className="shrink-0 rounded-lg bg-secondary/80 px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                  {fac.hours}
                </span>
              </div>
            )
          })}
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
