"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function Screen({
  children,
  className,
  fill = false,
}: {
  children: ReactNode
  className?: string
  fill?: boolean
}) {
  return (
    <div
      className={cn(
        "gol-fade-up gol-screen",
        fill ? "flex h-full min-h-0 flex-col" : "space-y-6",
        className,
      )}
    >
      {children}
    </div>
  )
}
