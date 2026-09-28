"use client"

import { Check, Coins, Ticket } from "lucide-react"

export function LoginRequiredCard({
  onLogin,
}: {
  onLogin: () => void
}) {
  return (
    <article className="rounded-[18px] border border-border bg-card px-4 py-4">
      <p className="text-[15px] font-semibold leading-snug text-foreground">
        Kasada göstermek ve kuponlarını kullanmak için Şehitkamil hesabınla giriş yap.
      </p>
      <button type="button" onClick={onLogin} className="mt-2 min-h-11 text-sm font-semibold text-primary">
        Giriş yap →
      </button>
      <ul className="mt-4 space-y-2">
        {[
          { icon: Ticket, line: "Kupon kullan" },
          { icon: Coins, line: "GölPuan ile öde" },
          { icon: Check, line: "Ziyaret bonusu kazan" },
        ].map(({ icon: Icon, line }) => (
          <li key={line} className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <Icon className="size-4 shrink-0 text-primary" strokeWidth={1.8} aria-hidden />
            {line}
          </li>
        ))}
      </ul>
    </article>
  )
}

export function QrGuestState({ onLogin }: { onLogin: () => void }) {
  return (
    <>
      <header className="space-y-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Kasa</p>
        <h1 className="font-serif text-2xl text-foreground">QR’ın</h1>
        <p className="text-sm text-muted-foreground">Kişisel kasa kodu giriş yaptıktan sonra üretilir.</p>
      </header>
      <LoginRequiredCard onLogin={onLogin} />
    </>
  )
}
