import { rewardProgress, user } from "@/lib/golbox-data"

export function UserCard() {
  const { pct, remaining } = rewardProgress()

  return (
    <section
      aria-label="Göl Puan durumun"
      className="relative overflow-hidden rounded-3xl bg-primary px-5 py-5 text-primary-foreground shadow-[0_18px_40px_-24px_rgba(29,95,96,0.9)]"
    >
      {/* sakin göl dokusu */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-16 size-48 rounded-full bg-white/5"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-8 size-44 rounded-full bg-white/5"
      />

      <div className="relative flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-full bg-primary-foreground/15 font-serif text-lg">
          {user.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="text-sm/none text-primary-foreground/70">Merhaba</p>
          <p className="mt-1 truncate text-lg font-semibold">{user.name}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-[11px] uppercase tracking-wide text-primary-foreground/60">Göl Puan</p>
          <p className="font-serif text-2xl leading-none">{user.points}</p>
        </div>
      </div>

      <div className="relative mt-5">
        <div className="flex items-end justify-between gap-3">
          <p className="text-pretty text-sm leading-snug text-primary-foreground/90">
            <span className="font-semibold text-accent">{remaining} puan</span> sonra{" "}
            <span className="font-medium">{user.reward.title.toLowerCase()}</span> seni bekliyor.
          </p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-primary-foreground/15">
          <div
            className="h-full rounded-full bg-accent transition-all duration-700"
            style={{ width: `${Math.round(pct * 100)}%` }}
          />
        </div>
      </div>
    </section>
  )
}
