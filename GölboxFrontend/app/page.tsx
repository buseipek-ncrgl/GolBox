import { GolToastProvider } from "@/components/golbox/gol-toast"
import { GolboxProvider } from "@/lib/golbox-context"
import { AppShell } from "@/components/golbox/app-shell"

export default function Page() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-muted/40 sm:p-4">
      <div
        data-golbox-shell
        className="relative h-svh w-full max-w-md md:max-w-2xl lg:max-w-4xl overflow-hidden bg-background sm:h-[90vh] sm:rounded-2xl sm:shadow-xl sm:border sm:border-border"
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
