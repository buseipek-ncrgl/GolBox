"use client"

import { Bell, ChevronRight, CreditCard, HelpCircle, LogOut, Settings, Shield } from "lucide-react"
import { activity, user } from "@/lib/golbox-data"
import { useGolToast } from "@/components/golbox/gol-toast"

const settings = [
  { id: "account", label: "Hesap bilgileri", icon: CreditCard },
  { id: "notify", label: "Bildirim tercihleri", icon: Bell },
  { id: "security", label: "Güvenlik", icon: Shield },
  { id: "prefs", label: "Uygulama ayarları", icon: Settings },
  { id: "help", label: "Yardım", icon: HelpCircle },
]

export function ProfileScreen() {
  const notify = useGolToast()

  return (
    <div className="gol-fade-up space-y-6 px-5 pb-6 pt-3">
      <header className="flex items-center gap-4">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary font-serif text-2xl text-primary-foreground">
          {user.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-foreground">{user.fullName}</h1>
          <p className="text-sm text-muted-foreground">{user.memberSince}&apos;ten beri GölBox&apos;ta</p>
        </div>
      </header>

      {/* puan özeti */}
      <div className="flex items-center justify-between rounded-3xl bg-primary px-5 py-4 text-primary-foreground">
        <div>
          <p className="text-xs uppercase tracking-wide text-primary-foreground/70">Göl Puan</p>
          <p className="font-serif text-3xl leading-tight">{user.points}</p>
        </div>
        <p className="max-w-[9rem] text-pretty text-right text-sm text-primary-foreground/90">
          Ödüllerin otomatik işlenir, talep etmene gerek yok.
        </p>
      </div>

      {/* puan geçmişi */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Puan hareketleri</h2>
        <ul className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
          {activity.map((a) => (
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

      {/* ayarlar */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Hesabın</h2>
        <ul className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
          {settings.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => notify("Bu bölüm prototipte hazır değil")}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
              >
                <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  <s.icon className="size-4.5" />
                </span>
                <span className="flex-1 text-sm font-medium text-card-foreground">{s.label}</span>
                <ChevronRight className="size-4.5 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <button
        onClick={() => notify("Çıkış yapıldı")}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card py-3.5 text-sm font-semibold text-muted-foreground"
      >
        <LogOut className="size-4.5" />
        Çıkış yap
      </button>
    </div>
  )
}
