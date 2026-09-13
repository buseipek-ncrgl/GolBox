import { GolToastProvider } from "@/components/golbox/gol-toast"
import { GolboxProvider } from "@/lib/golbox-context"
import { AppShell } from "@/components/golbox/app-shell"

export default function Page() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-[#EEF1EE] sm:p-8">
      <p className="mb-5 hidden text-[11px] font-semibold tracking-[0.22em] text-[#8A9491] sm:block">
        ŞEHİTKAMİL+
      </p>
      <div
        data-golbox-shell
        className="relative h-svh w-full overflow-hidden bg-background sm:h-[844px] sm:max-w-[390px] sm:rounded-[2.6rem] sm:border-[10px] sm:border-[#17201F] sm:shadow-[0_30px_80px_-36px_rgba(18,63,64,0.45)]"
      >
        <div className="pointer-events-none absolute left-1/2 top-0 z-30 hidden h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-[#17201F] sm:block" />
        <GolToastProvider>
          <GolboxProvider>
            <AppShell />
          </GolboxProvider>
        </GolToastProvider>
      </div>
    </main>
  )
}
