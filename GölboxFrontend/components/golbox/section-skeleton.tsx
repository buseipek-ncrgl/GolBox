import { cn } from "@/lib/utils"

export function SectionSkeleton({
  lines = 3,
  className,
}: {
  lines?: number
  className?: string
}) {
  return (
    <div className={cn("space-y-3", className)} aria-hidden>
      <div className="gol-skeleton h-4 w-28 rounded-full" />
      <div className="gol-skeleton h-[7.5rem] w-full rounded-[var(--gol-radius-xl)]" />
      {Array.from({ length: Math.max(0, lines - 1) }).map((_, index) => (
        <div key={index} className="gol-skeleton h-12 w-full rounded-[var(--gol-radius-lg)]" />
      ))}
    </div>
  )
}
