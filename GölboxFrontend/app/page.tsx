import { GolToastProvider } from "@/components/golbox/gol-toast"
import { GolboxProvider } from "@/lib/golbox-context"
import { AppShell } from "@/components/golbox/app-shell"

export default function Page() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-secondary/40 sm:p-8">
      <div className="mb-8 hidden max-w-xs text-center sm:block">
        <p className="font-serif text-3xl text-primary">GölBox</p>
        <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
          Dikkatini isteyen değil, zamanına saygı duyan bir sadakat deneyimi.
        </p>
      </div>

      <div
        data-golbox-shell
        className="relative h-svh w-full overflow-hidden bg-background sm:h-[812px] sm:max-w-[390px] sm:rounded-[3rem] sm:border-8 sm:border-foreground sm:shadow-[0_40px_90px_-30px_rgba(29,95,96,0.5)]"
      >
        <div className="pointer-events-none absolute left-1/2 top-0 z-30 hidden h-6 w-36 -translate-x-1/2 rounded-b-2xl bg-foreground sm:block" />
        <GolToastProvider>
          <GolboxProvider>
            <AppShell />
          </GolboxProvider>
        </GolToastProvider>
      </div>
    </main>
  )
}
