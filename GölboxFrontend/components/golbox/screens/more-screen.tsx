"use client"

import { useState } from "react"
import { Screen } from "@/components/golbox/screen"
import { 
  FileText, 
  GraduationCap, 
  Coffee, 
  Trophy, 
  HeartHandshake, 
  MessageSquare, 
  ChevronRight, 
  Calendar,
  MapPin,
  Ticket, 
  PhoneCall, 
  CheckCircle2, 
  X,
  Sparkles
} from "lucide-react"
import { useGolbox } from "@/lib/golbox-context"

export interface ApplicationOption {
  id: string
  title: string
  subtitle: string
  icon: typeof FileText
  badge?: string
}

const APPLICATION_ITEMS: ApplicationOption[] = [
  {
    id: "app-genclik-kart",
    title: "Şehitkamil Gençlik Kart Başvurusu",
    subtitle: "Kültür, sanat ve tesis indirimlerinden yararlanın.",
    icon: GraduationCap,
    badge: "Popüler",
  },
  {
    id: "app-kitap-kafe",
    title: "Kitap Kafe Ücretsiz İkram Üyeliği",
    subtitle: "24 saat açık kitap kafelerde günlük kahve ikramı.",
    icon: Coffee,
  },
  {
    id: "app-spor-kursu",
    title: "Spor Kursu ve Atölye Başvurusu",
    subtitle: "Yüzme, basketbol, tenis ve fitness eğitimleri.",
    icon: Trophy,
  },
  {
    id: "app-gonullu",
    title: "Şehitkamil Gençlik Gönüllüsü Ol",
    subtitle: "Sosyal sorumluluk ve doğa projelerine katılın.",
    icon: HeartHandshake,
  },
  {
    id: "app-acik-kapi",
    title: "Açık Kapı / Dilek ve Şikayet Başvurusu",
    subtitle: "Belediye birimlerine talep ve önerilerinizi iletin.",
    icon: MessageSquare,
  },
]

export function MoreScreen({
  onNavigate,
  onOpenCoupons,
}: {
  onNavigate: (tab: any) => void
  onOpenCoupons: () => void
}) {
  const { user } = useGolbox()
  const [selectedApp, setSelectedApp] = useState<ApplicationOption | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setSelectedApp(null)
    }, 2000)
  }

  return (
    <Screen className="space-y-6 pb-12">
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
            Hizmetler ve Başvurular
          </span>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
            Daha Fazla
          </h1>
        </div>
      </div>

      {/* 4 Ana Hizmet Kartı */}
      <section aria-label="Ana Hizmet Seçenekleri" className="space-y-3">
        <h2 className="text-sm font-bold text-foreground">Hızlı Hizmetler</h2>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate("applications")}
            className="group flex flex-col items-start justify-between rounded-[20px] border border-border/70 bg-card p-4 text-left shadow-2xs transition-all hover:border-primary/40 hover:shadow-xs active:scale-[0.98]"
          >
            <span className="flex size-10 items-center justify-center rounded-2xl bg-secondary text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <FileText className="size-5" />
            </span>
            <div className="mt-3">
              <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                Sosyal Başvurular
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Kurs, Kart ve Burs</p>
            </div>
          </button>

          <button
            type="button"
            onClick={onOpenCoupons}
            className="group flex flex-col items-start justify-between rounded-[20px] border border-border/70 bg-card p-4 text-left shadow-2xs transition-all hover:border-primary/40 hover:shadow-xs active:scale-[0.98]"
          >
            <span className="flex size-10 items-center justify-center rounded-2xl bg-secondary text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Ticket className="size-5" />
            </span>
            <div className="mt-3">
              <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                Ödüllerim ve Kuponlar
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Puan Marketi</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate("events")}
            className="group flex flex-col items-start justify-between rounded-[20px] border border-border/70 bg-card p-4 text-left shadow-2xs transition-all hover:border-primary/40 hover:shadow-xs active:scale-[0.98]"
          >
            <span className="flex size-10 items-center justify-center rounded-2xl bg-secondary text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Calendar className="size-5" />
            </span>
            <div className="mt-3">
              <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                Etkinlikler
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Gençlik ve Sanat</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate("map")}
            className="group flex flex-col items-start justify-between rounded-[20px] border border-border/70 bg-card p-4 text-left shadow-2xs transition-all hover:border-primary/40 hover:shadow-xs active:scale-[0.98]"
          >
            <span className="flex size-10 items-center justify-center rounded-2xl bg-secondary text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <MapPin className="size-5" />
            </span>
            <div className="mt-3">
              <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                Harita ve Tesisler
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Kitap Kafe ve Noktalar</p>
            </div>
          </button>
        </div>
      </section>

      {/* Belediye Başvuruları Section */}
      <section aria-label="Belediye Başvuruları" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-tight text-foreground">
            Belediye Online Başvuruları
          </h2>
          <button
            type="button"
            onClick={() => onNavigate("applications")}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Tümünü Gör
          </button>
        </div>

        <div className="space-y-2">
          {APPLICATION_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedApp(item)}
                className="group relative flex w-full items-center gap-3.5 rounded-[18px] border border-border/70 bg-card p-3.5 text-left shadow-none transition-all duration-200 hover:border-primary/30 hover:shadow-xs active:scale-[0.98]"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="size-5" strokeWidth={1.8} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
                      {item.title}
                    </p>
                    {item.badge ? (
                      <span className="rounded-md bg-[color:var(--color-gold)]/20 px-1.5 py-0.5 text-[9px] font-bold text-[color:var(--color-gold)] uppercase">
                        {item.badge}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.subtitle}</p>
                </div>

                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </button>
            )
          })}
        </div>
      </section>

      {/* İletişim & Destek Card */}
      <section aria-label="Destek ve İletişim" className="space-y-3">
        <h2 className="text-sm font-bold tracking-tight text-foreground">
          Kurumsal İletişim
        </h2>

        <div className="rounded-[20px] border border-primary/15 bg-gradient-to-br from-secondary/40 via-card to-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <PhoneCall className="size-5" />
            </span>
            <div>
              <p className="text-xs font-bold text-foreground">Şehitkamil Çağrı Merkezi</p>
              <p className="text-[11px] text-muted-foreground">444 27 00 · 7/24 Kesintisiz Destek</p>
            </div>
          </div>
          <a
            href="tel:4442700"
            className="rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-2xs transition-all hover:bg-primary/95 active:scale-95"
          >
            Ara
          </a>
        </div>
      </section>

      {/* Application Sheet / Modal Overlay */}
      {selectedApp ? (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-lg rounded-t-[26px] sm:rounded-[26px] border border-border/80 bg-card p-5 text-foreground shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-primary">
                  Online Başvuru Formu
                </span>
                <h3 className="font-serif text-lg font-bold">{selectedApp.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="flex size-8 items-center justify-center rounded-full bg-secondary text-muted-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {submitted ? (
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
                <CheckCircle2 className="size-12 text-[color:var(--color-success)]" />
                <h4 className="text-base font-bold text-foreground">Başvurunuz Alındı!</h4>
                <p className="text-xs text-muted-foreground">
                  Başvuru numaranız SMS ile tarafınıza iletilecektir.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitApplication} className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Ad Soyad</label>
                  <input
                    type="text"
                    required
                    defaultValue={user ? `${user.firstName} ${user.lastName}` : ""}
                    placeholder="Adınız Soyadınız"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">T.C. Kimlik / Telefon</label>
                  <input
                    type="text"
                    required
                    placeholder="T.C. Kimlik No veya İletişim Numarası"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Başvuru Notu / Açıklama</label>
                  <textarea
                    rows={3}
                    placeholder="Talebinizi veya açıklamanızı yazınız..."
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-primary py-3 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/95 active:scale-95"
                >
                  Başvuruyu Gönder
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </Screen>
  )
}
