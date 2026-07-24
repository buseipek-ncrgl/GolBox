"use client"

import { Bell, ChevronRight, CreditCard, HelpCircle, LogOut, Settings, Shield } from "lucide-react"
import { useGolbox } from "@/lib/golbox-context"

const settings = [
  { id: "account", label: "Hesap Bilgileri", icon: CreditCard },
  { id: "notify", label: "Bildirim Tercihleri", icon: Bell },
  { id: "security", label: "Güvenlik & Şifre", icon: Shield },
  { id: "prefs", label: "Uygulama Ayarları", icon: Settings },
  { id: "help", label: "Yardım & Destek", icon: HelpCircle },
]

export function ProfileScreen() {
  const { user, logout } = useGolbox()
  if (!user) return null

  return (
    <div className="gol-fade-up space-y-6 px-5 pb-6 pt-3">
      <header className="flex items-center gap-4">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary font-serif text-2xl text-primary-foreground">
          {user.firstName.charAt(0)}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-foreground">{user.firstName} {user.lastName}</h1>
          <p className="text-xs text-muted-foreground">E-Posta: {user.email}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Yaş: {user.age || 'Belirtilmemiş'} · {user.educationLevel || 'Öğrenci / Çalışan'}</p>
        </div>
      </header>

      {/* Puan Özeti */}
      <div className="flex items-center justify-between rounded-3xl bg-primary px-5 py-4 text-primary-foreground shadow-sm">
        <div>
          <p className="text-xs uppercase tracking-wide text-primary-foreground/70">Toplanan GölPuan</p>
          <p className="font-serif text-3xl font-bold leading-tight">{user.pointsBalance} <span className="text-sm font-sans font-normal">GP</span></p>
        </div>
        <p className="max-w-[9rem] text-pretty text-right text-xs text-primary-foreground/90 leading-snug">
          Gölbaşı Belediyesi Dijital Vatandaş Ekosistemi
        </p>
      </div>

      {/* Ayarlar Listesi */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Hesap Ayarları</h2>
        <ul className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
          {settings.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => alert(`${s.label} ayarları günceldir.`)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-secondary/40"
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

      {/* Oturum Kapat Butonu */}
      <button
        onClick={logout}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card py-3.5 text-sm font-semibold text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
      >
        <LogOut className="size-4.5" />
        Oturumu Kapat
      </button>
    </div>
  )
}
