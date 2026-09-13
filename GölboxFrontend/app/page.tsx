import { GolToastProvider } from "@/components/golbox/gol-toast"
import { GolboxProvider } from "@/lib/golbox-context"
import { AppShell } from "@/components/golbox/app-shell"

export default function Page() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-[#E8EBE8] sm:p-8">
      <div
        data-golbox-shell
        className="relative h-svh w-full overflow-hidden bg-background sm:h-[844px] sm:max-w-[390px] sm:rounded-[2rem] sm:shadow-[0_8px_40px_rgba(20,40,35,0.10)]"
      >
        <GolToastProvider>
          <GolboxProvider>
            <AppShell />
          </GolboxProvider>
        </GolToastProvider>
      </div>
    </main>
  )
}
