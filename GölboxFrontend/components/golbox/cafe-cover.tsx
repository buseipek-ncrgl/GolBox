"use client"

import { useState } from "react"

export function CafeCover({
  name,
  imageUrl,
  className = "",
}: {
  name: string
  imageUrl?: string | null
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const showImage = Boolean(imageUrl) && !failed

  return (
    <div
      role="img"
      aria-label={name}
      className={`relative overflow-hidden bg-gradient-to-br from-primary via-[#1d5f60] to-[#0b1f20] ${className}`}
    >
      {showImage ? (
        // Live cafe photos may be remote; keep object-cover without next/image host config.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl!}
          alt=""
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_42%),radial-gradient(circle_at_80%_80%,rgba(212,160,23,0.18),transparent_46%)]"
        />
      )}
    </div>
  )
}
