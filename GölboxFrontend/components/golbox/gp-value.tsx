import { cn } from "@/lib/utils"

export function GPValue({
  amount,
  signed = false,
  unit = true,
  className,
}: {
  amount: number
  signed?: boolean
  unit?: boolean
  className?: string
}) {
  const prefix = signed && amount > 0 ? "+" : ""
  return (
    <span className={cn("gp-value", className)}>
      {prefix}
      {amount}
      {unit ? " GP" : ""}
    </span>
  )
}
