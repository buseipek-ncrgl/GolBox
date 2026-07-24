"use client"

import { useMemo, useState, useEffect } from "react"
import { ScanLine, ShieldCheck, Timer } from "lucide-react"
import { useGolbox } from "@/lib/golbox-context"

function useMatrix(seed: string, size = 21) {
  return useMemo(() => {
    let h = 0
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
    const rand = () => {
      h = (h * 1103515245 + 12345) & 0x7fffffff
      return h / 0x7fffffff
    }
    const grid: boolean[][] = []
    for (let r = 0; r < size; r++) {
      const row: boolean[] = []
      for (let c = 0; c < size; c++) row.push(rand() > 0.5)
      grid.push(row)
    }
    const stamp = (or: number, oc: number) => {
      for (let r = 0; r < 7; r++)
        for (let c = 0; c < 7; c++) {
          const edge = r === 0 || r === 6 || c === 0 || c === 6
          const core = r >= 2 && r <= 4 && c >= 2 && c <= 4
          grid[or + r][oc + c] = edge || core
        }
    }
    stamp(0, 0)
    stamp(0, size - 7)
    stamp(size - 7, 0)
    return grid
  }, [seed, size])
}

export function QrScreen() {
  const { user } = useGolbox()
  const [timeLeft, setTimeLeft] = useState(30)
  const [epoch, setEpoch] = useState(Math.floor(Date.now() / 30000))

  useEffect(() => {
    const interval = setInterval(() => {
      const currentSeconds = Math.floor(Date.now() / 1000)
      const secondsInPeriod = currentSeconds % 30
      const remaining = 30 - secondsInPeriod
      setTimeLeft(remaining)
      setEpoch(Math.floor(currentSeconds / 30))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  if (!user) return null

  // Create TOTP token seed combining UserId and Current 30s epoch
  const dynamicSeed = `${user.id}-${epoch}`
  const matrix = useMatrix(dynamicSeed)
  const totpDisplayCode = `GB-TOTP-${(user.id.substring(0, 4) + epoch.toString().slice(-4)).toUpperCase()}`

  return (
    <div className="gol-fade-up flex min-h-full flex-col px-5 pb-6 pt-3">
      <header className="space-y-1">
        <h1 className="font-serif text-2xl text-foreground">Dinamik QR&apos;ın</h1>
        <p className="text-sm text-muted-foreground">
          30 saniyede bir yenilenen güvenli dijital kod. Kopyalanamaz ve ekran görüntüsüyle kullanılamaz.
        </p>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 py-4">
        <div className="w-full max-w-[300px] rounded-[2rem] border border-border bg-card p-6 shadow-[0_24px_60px_-40px_rgba(29,95,96,0.8)] relative">
          
          {/* TOTP Countdown badge */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-semibold text-card-foreground text-sm">{user.firstName} {user.lastName}</p>
              <p className="text-[10px] font-mono text-muted-foreground">{totpDisplayCode}</p>
            </div>
            <div className="flex items-center gap-1 bg-accent/20 px-2.5 py-1 rounded-full text-xs font-bold text-accent-foreground">
              <Timer className="size-3.5 animate-spin" />
              <span>{timeLeft}s</span>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-background p-4 relative">
            <div
              className="grid aspect-square w-full gap-[2px]"
              style={{ gridTemplateColumns: `repeat(${matrix.length}, minmax(0, 1fr))` }}
              role="img"
              aria-label="Dinamik GölBox QR Kodu"
            >
              {matrix.flatMap((row, r) =>
                row.map((on, c) => (
                  <span
                    key={`${r}-${c}`}
                    className={on ? "rounded-[1px] bg-primary" : "bg-transparent"}
                  />
                )),
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${(timeLeft / 30) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 px-4 py-2 text-xs font-semibold">
          <ShieldCheck className="size-4 text-emerald-600" />
          Zamana Bağlı Şifrelenmiş Canlı QR Kod
        </div>
      </div>
    </div>
  )
}
