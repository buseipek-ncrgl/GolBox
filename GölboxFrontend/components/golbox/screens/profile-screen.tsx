"use client"

import { useState } from "react"
import { Bell, ChevronRight, CreditCard, Gift, HelpCircle, LogOut, Settings, Shield } from "lucide-react"
import { activity, user as mockUser } from "@/lib/golbox-data"
import { useGolToast } from "@/components/golbox/gol-toast"
import { useGolbox } from "@/lib/golbox-context"
import { LoginScreen } from "@/components/golbox/screens/login-screen"

const settings = [
  { id: "account", label: "Hesap bilgileri", icon: CreditCard },
  { id: "notify", label: "Bildirim tercihleri", icon: Bell },
  { id: "security", label: "Güvenlik", icon: Shield },
  { id: "prefs", label: "Uygulama ayarları", icon: Settings },
  { id: "help", label: "Yardım", icon: HelpCircle },
]

function formatWhen(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
}

export function ProfileScreen() {
  const notify = useGolToast()
  const { user, token, myCaptures, pointTransactions, logout } = useGolbox()
  const [showLogin, setShowLogin] = useState(false)

  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : mockUser.fullName
  const points = user?.pointsBalance ?? mockUser.points
  const gpRows =
    token && pointTransactions.length > 0
      ? pointTransactions.slice(0, 8).map((pt) => ({
          id: pt.id,
          label: pt.description || "GölPuan",
          when: formatWhen(pt.createdDate),
          value: `${pt.amount > 0 ? "+" : ""}${pt.amount}`,
          kind: pt.amount >= 0 ? "earn" : "spend",
        }))
      : activity

  if (showLogin && !token) {
    return <LoginScreen onClose={() => setShowLogin(false)} closeLabel="Profile dön" />
  }

  return (
    <div className="gol-fade-up space-y-6 px-5 pb-6 pt-3">
      <header className="flex items-center gap-4">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary font-serif text-2xl text-primary-foreground">
          {displayName.charAt(0)}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-foreground">{displayName}</h1>
          <p className="text-sm text-muted-foreground">
            {user ? user.email : `${mockUser.memberSince}'ten beri GölBox'ta`}
          </p>
        </div>
      </header>

      <div className="flex items-center justify-between rounded-3xl bg-primary px-5 py-4 text-primary-foreground">
        <div>
          <p className="text-xs uppercase tracking-wide text-primary-foreground/70">Göl Puan</p>
          <p className="font-serif text-3xl leading-tight">{points}</p>
        </div>
        <p className="max-w-[9rem] text-pretty text-right text-sm text-primary-foreground/90">
          Katalog ödülleri GölPuan ile alınır. Saha kutusu ayrıdır.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Toplanan kutular</h2>
        <p className="text-xs text-muted-foreground">Saha hediyeleri. Ismarlıyor ve katalog ödülü buraya karışmaz.</p>
        {!token ? (
          <button
            type="button"
            onClick={() => setShowLogin(true)}
            className="w-full rounded-3xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground"
          >
            Toplanan kutuları görmek için giriş yapın.
          </button>
        ) : myCaptures.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            Henüz toplanan kutu yok.
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
            {myCaptures.map((cap) => (
              <li key={cap.id} className="flex items-center gap-3 px-4 py-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Gift className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-card-foreground">{cap.title}</p>
                  <p className="text-xs text-muted-foreground">{formatWhen(cap.createdDate)}</p>
                </div>
                <span className="font-serif text-base text-primary">+{cap.pointsGranted} GP</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Puan hareketleri</h2>
        <ul className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
          {gpRows.map((a) => (
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
        onClick={() => {
          if (token) logout()
          else notify("Oturum açık değil")
        }}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card py-3.5 text-sm font-semibold text-muted-foreground"
      >
        <LogOut className="size-4.5" />
        Çıkış yap
      </button>
    </div>
  )
}
