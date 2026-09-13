"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

export function CityImage({
  src,
  alt,
  className,
  focus = "center",
  priority = false,
}: {
  src?: string | null
  alt: string
  className?: string
  /** CSS object-position so CMS photos can keep a proper focal point. */
  focus?: string
  priority?: boolean
}) {
  const [failed, setFailed] = useState(false)
  const show = Boolean(src) && !failed

  if (!show) {
    return (
      <span
        aria-hidden
        className={cn("block bg-[color:var(--color-brand-900)]", className)}
      />
    )
  }

  return (
    // Local or future CMS photos; object-fit/focal-point need a plain img.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src!}
      alt={alt}
      onError={() => setFailed(true)}
      fetchPriority={priority ? "high" : "low"}
      loading={priority ? "eager" : "lazy"}
      style={{ objectPosition: focus }}
      className={cn("object-cover", className)}
    />
  )
}
