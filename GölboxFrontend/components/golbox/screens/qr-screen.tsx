"use client"

import { useMemo } from "react"
import { ScanLine } from "lucide-react"
import { user } from "@/lib/golbox-data"

// qrId'den deterministik, QR benzeri bir matris üretir (dekoratif)
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
    // konum işaretleyicileri (finder patterns)
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
  const matrix = useMatrix(user.qrId)

  return (
    <div className="gol-fade-up flex min-h-full flex-col px-5 pb-6 pt-3">
      <header className="space-y-1">
        <h1 className="font-serif text-2xl text-foreground">QR&apos;ın</h1>
        <p className="text-sm text-muted-foreground">
          Tek QR. Kasada göster; kahve, ödül ve puan otomatik işlenir.
        </p>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 py-4">
        <div className="w-full max-w-[300px] rounded-[2rem] border border-border bg-card p-6 shadow-[0_24px_60px_-40px_rgba(29,95,96,0.8)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-card-foreground">{user.fullName}</p>
              <p className="text-xs text-muted-foreground">{user.qrId}</p>
            </div>
            <span className="rounded-full bg-accent/20 px-2.5 py-1 text-xs font-semibold text-accent-foreground">
              {user.points} Puan
            </span>
          </div>

          <div className="mt-5 rounded-2xl bg-background p-4">
            <div
              className="grid aspect-square w-full gap-[2px]"
              style={{ gridTemplateColumns: `repeat(${matrix.length}, minmax(0, 1fr))` }}
              role="img"
              aria-label="Kişisel GölBox QR kodu"
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
        </div>

        <div className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm text-secondary-foreground">
          <ScanLine className="size-4" />
          Sistem bağlama göre işlemi başlatır
        </div>
      </div>
    </div>
  )
}
