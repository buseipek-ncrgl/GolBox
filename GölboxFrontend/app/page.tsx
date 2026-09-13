import { GolToastProvider } from "@/components/golbox/gol-toast"
import { GolboxProvider } from "@/lib/golbox-context"
import { AppShell } from "@/components/golbox/app-shell"

export default function Page() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-[#EEF1EE] sm:p-8">
      <div
        data-golbox-shell
        className="relative h-svh w-full overflow-hidden bg-background sm:h-[844px] sm:max-w-[390px] sm:rounded-[2.5rem] sm:border-[8px] sm:border-[#17201F] sm:shadow-[0_24px_60px_-28px_rgba(18,63,64,0.35)]"
      >
        <div className="pointer-events-none absolute left-1/2 top-0 z-30 hidden h-5 w-28 -translate-x-1/2 rounded-b-2xl bg-[#17201F] sm:block" />
        <GolToastProvider>
          <GolboxProvider>
            <AppShell />
          </GolboxProvider>
        </GolToastProvider>
      </div>
    </main>
  )
}
