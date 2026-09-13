"use client"

import { Check, QrCode, ScanLine } from "lucide-react"

export function LoginRequiredCard({
  onLogin,
}: {
  onLogin: () => void
}) {
  return (
    <article className="gol-card px-4 py-5">
      <span className="flex size-11 items-center justify-center rounded-[14px] bg-secondary text-primary">
        <QrCode className="size-5" strokeWidth={1.8} />
      </span>
      <p className="mt-3 text-[15px] font-semibold leading-snug text-foreground">
        Kasada göstermek ve kuponlarını kullanmak için Şehitkamil+ hesabınla giriş yap.
      </p>
      <button
        type="button"
        onClick={onLogin}
        className="mt-4 flex min-h-11 w-full items-center justify-center rounded-[14px] bg-primary text-sm font-semibold text-primary-foreground"
      >
        Giriş yap
      </button>
      <ul className="mt-5 space-y-2.5">
        {[
          "Kupon kullan",
          "GölPuan ile öde",
          "Ziyaret bonusu kazan",
        ].map((line) => (
          <li key={line} className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <Check className="size-4 shrink-0 text-primary" strokeWidth={2} aria-hidden />
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
      <p className="flex items-center gap-2 text-[12px] text-muted-foreground">
        <ScanLine className="size-3.5" />
        Giriş yoksa kasa kodu üretilmez.
      </p>
    </>
  )
}
