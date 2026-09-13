import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function HomeSectionHeader({
  title,
  actionLabel,
  onAction,
  className,
}: {
  title: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}) {
  return (
    <div className={cn("flex items-end justify-between gap-3", className)}>
      <h2 className="font-serif text-[1.35rem] leading-none tracking-tight text-foreground">{title}</h2>
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
