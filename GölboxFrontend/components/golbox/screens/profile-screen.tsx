"use client"

import { useEffect, useState } from "react"
import { Screen } from "@/components/golbox/screen"
import { Gift, LogIn, LogOut } from "lucide-react"
import { activity, user as mockUser } from "@/lib/golbox-data"
import { useGolbox } from "@/lib/golbox-context"
import { LoginScreen } from "@/components/golbox/screens/login-screen"
import { RewardsScreen } from "@/components/golbox/screens/rewards-screen"

function formatWhen(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
}

export function ProfileScreen() {
  const { user, token, myCaptures, pointTransactions, logout, loadMyCaptures } = useGolbox()
  const [showLogin, setShowLogin] = useState(false)
  const [showRewards, setShowRewards] = useState(false)

  useEffect(() => {
    if (token) void loadMyCaptures()
  }, [token, loadMyCaptures])

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

  if (showRewards) {
    return <RewardsScreen onClose={() => setShowRewards(false)} closeLabel="Profile dön" />
  }

  if (showLogin && !token) {
    return <LoginScreen onClose={() => setShowLogin(false)} closeLabel="Profile dön" />
  }

  return (
    <Screen>
      <header className="flex items-center gap-4">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary font-serif text-2xl text-primary-foreground">
          {displayName.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Profil</p>
          <h1 className="truncate font-serif text-2xl leading-tight text-foreground">{displayName}</h1>
          <p className="text-sm text-muted-foreground">
            {user ? user.email : "Misafir görünümü · giriş yapınca bakiyen gelir"}
          </p>
        </div>
      </header>

      <button
        type="button"
        onClick={() => setShowRewards(true)}
        className="flex w-full items-center justify-between rounded-[var(--gol-card)] bg-primary px-5 py-4 text-left text-primary-foreground"
      >
        <div>
          <p className="text-xs uppercase tracking-wide text-primary-foreground/70">Göl Puan</p>
          <p className="font-serif text-3xl leading-tight text-accent">{points}</p>
        </div>
        <p className="max-w-[9rem] text-pretty text-right text-sm text-primary-foreground/90">
          Katalog ödülleri GölPuan ile alınır. Saha kutusu ayrıdır.
        </p>
      </button>

      {!token && (
        <button
          type="button"
          onClick={() => setShowLogin(true)}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3.5 text-sm font-semibold text-background"
        >
          <LogIn className="size-4.5" />
          Giriş yap
        </button>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Toplanan kutular</h2>
        <p className="text-xs text-muted-foreground">Saha hediyeleri. Ismarlıyor ve katalog ödülü buraya karışmaz.</p>
        {!token ? (
          <button
            type="button"
            onClick={() => setShowLogin(true)}
            className="gol-card w-full border-dashed px-4 py-6 text-sm text-muted-foreground"
          >
            Toplanan kutuları görmek için giriş yapın.
          </button>
        ) : myCaptures.length === 0 ? (
          <p className="gol-card border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            Henüz toplanan kutu yok.
          </p>
        ) : (
          <ul className="gol-card divide-y divide-border">
            {myCaptures.map((cap) => (
              <li key={cap.id} className="flex items-center gap-3 px-4 py-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Gift className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-card-foreground">{cap.title}</p>
                  <p className="text-xs text-muted-foreground">{formatWhen(cap.createdDate)}</p>
                </div>
                <span className="font-serif text-base text-accent-foreground">+{cap.pointsGranted} GP</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Puan hareketleri</h2>
        <ul className="gol-card divide-y divide-border">
          {gpRows.map((row) => (
            <li key={row.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-card-foreground">{row.label}</p>
                <p className="text-xs text-muted-foreground">{row.when}</p>
              </div>
              <span
                className={
                  row.kind === "earn"
                    ? "font-serif text-base text-accent-foreground"
                    : "font-serif text-base text-muted-foreground"
                }
              >
                {row.value}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {token && (
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card py-3.5 text-sm font-semibold text-muted-foreground"
        >
          <LogOut className="size-4.5" />
          Çıkış yap
        </button>
      )}
    </Screen>
  )
}
