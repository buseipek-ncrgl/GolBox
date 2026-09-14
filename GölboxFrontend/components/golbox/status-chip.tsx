import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type StatusTone = "neutral" | "brand" | "success" | "warning" | "danger"

const tones: Record<StatusTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  brand: "bg-primary text-primary-foreground",
  success: "bg-[color:var(--color-brand-100)] text-[color:var(--color-success)]",
  warning: "bg-[#F6EDD8] text-[color:var(--color-warning)]",
  danger: "bg-[#F8E4E1] text-[color:var(--color-danger)]",
}

export function StatusChip({
  tone = "neutral",
  icon,
  children,
  className,
}: {
  tone?: StatusTone
  icon?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide",
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}
