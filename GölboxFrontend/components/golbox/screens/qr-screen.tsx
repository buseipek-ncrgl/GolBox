"use client"

import { useMemo } from "react"
import { Screen } from "@/components/golbox/screen"
import { ScanLine } from "lucide-react"
import { user as mockUser } from "@/lib/golbox-data"
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
  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : mockUser.fullName
  const points = user?.pointsBalance ?? mockUser.points
  const qrId = user?.id ? `GB-${user.id.replace(/-/g, "").slice(0, 8).toUpperCase()}` : mockUser.qrId
  const matrix = useMatrix(qrId)

  return (
    <Screen fill>
      <header className="space-y-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Kasa</p>
        <h1 className="font-serif text-2xl text-foreground">QR&apos;ın</h1>
        <p className="text-sm text-muted-foreground">
          Tek QR. Kasada göster; kahve, ödül ve puan otomatik işlenir.
        </p>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 py-4">
        <div className="gol-card w-full max-w-[300px] p-6 shadow-[0_24px_60px_-40px_rgba(29,95,96,0.8)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-card-foreground">{displayName}</p>
              <p className="text-xs text-muted-foreground">{qrId}</p>
            </div>
            <span className="rounded-full bg-accent/20 px-2.5 py-1 font-serif text-sm font-semibold text-accent-foreground">
              {points} GP
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
          Kasada bu kodu gösterin
        </div>
      </div>
    </Screen>
  )
}
