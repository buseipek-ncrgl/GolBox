import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export function HomeSectionHeader({
  title,
  actionLabel,
  onAction,
  tone = "utility",
  className,
}: {
  title: string
  actionLabel?: string
  onAction?: () => void
  tone?: "editorial" | "utility"
  className?: string
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <h2
        className={cn(
          "tracking-tight text-foreground",
          tone === "editorial"
            ? "font-serif text-xl font-bold"
            : "text-base font-semibold",
        )}
      >
        {title}
      </h2>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="group inline-flex items-center gap-0.5 text-xs font-semibold text-primary transition-colors hover:text-primary/80 focus-visible:outline-none"
        >
          <span>{actionLabel}</span>
          <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      ) : null}
    </div>
  )
}

