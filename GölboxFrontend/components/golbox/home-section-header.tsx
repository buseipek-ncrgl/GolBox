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
    <div className={cn("flex items-end justify-between gap-3", className)}>
      <h2
        className={cn(
          "leading-none tracking-tight text-foreground",
          tone === "editorial"
            ? "font-serif text-[1.375rem]"
            : "text-[1.0625rem] font-semibold",
        )}
      >
        {title}
      </h2>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="min-h-11 shrink-0 text-sm font-semibold text-primary"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}
