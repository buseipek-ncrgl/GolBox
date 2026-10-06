"use client"

import React from "react"

export function GolboxBrandLogo({
  className = "size-20",
  size = 120,
}: {
  className?: string
  size?: number
}) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: "visible" }}
    >
      <defs>
        {/* Curved Path for Top Text: ŞEHİTKAMİL BELEDİYESİ */}
        <path
          id="topArcPath"
          d="M 30 100 A 70 70 0 0 1 170 100"
          fill="none"
        />
        {/* Curved Path for Bottom Text: GÖLBOX */}
        <path
          id="bottomArcPath"
          d="M 30 100 A 70 70 0 0 0 170 100"
          fill="none"
        />
        {/* Subtle Outer Drop Shadow */}
        <filter id="logoShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.2" />
        </filter>
        {/* Linear Gradient for Rich Emerald Green Background */}
        <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#047857" />
          <stop offset="100%" stopColor="#064e3b" />
        </linearGradient>
      </defs>

      {/* Main Outer Circle */}
      <circle
        cx="100"
        cy="100"
        r="92"
        fill="url(#emeraldGradient)"
        stroke="#ffffff"
        strokeWidth="3.5"
        filter="url(#logoShadow)"
      />

      {/* Inner Decorative Accent Ring */}
      <circle
        cx="100"
        cy="100"
        r="86"
        fill="none"
        stroke="rgba(255, 255, 255, 0.25)"
        strokeWidth="1.2"
        strokeDasharray="4 3"
      />

      {/* Top Arc Text: ŞEHİTKAMİL BELEDİYESİ */}
      <text
        fill="#ffffff"
        fontSize="11.5"
        fontWeight="800"
        letterSpacing="2.2"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        <textPath href="#topArcPath" startOffset="50%" textAnchor="middle">
          ŞEHİTKAMİL BELEDİYESİ
        </textPath>
      </text>

      {/* Center Emblem: Şehitkamil Tree & Stylized Figures Emblem */}
      <g transform="translate(100, 92) scale(0.95)">
        {/* Tree Canopy / Foliage Outlines */}
        <path
          d="M 0 -38 C -18 -38, -32 -26, -32 -10 C -38 -8, -40 2, -34 10 C -34 20, -22 26, -10 26 C -4 26, 4 26, 10 26 C 22 26, 34 20, 34 10 C 40 2, 38 -8, 32 -10 C 32 -26, 18 -38, 0 -38 Z"
          fill="none"
          stroke="#ffffff"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Inner Canopy Detail Swirl */}
        <path
          d="M -16 -12 C -10 -24, 10 -24, 16 -12 C 22 2, 8 16, 0 18 C -8 16, -22 2, -16 -12 Z"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.2"
          opacity="0.85"
        />
        {/* Stylized Figures Forming Tree Trunk */}
        {/* Left Figure Head */}
        <circle cx="-9" cy="-2" r="3.5" fill="#ffffff" />
        {/* Right Figure Head */}
        <circle cx="9" cy="-2" r="3.5" fill="#ffffff" />
        {/* Left Figure Body Curve */}
        <path
          d="M -9 3 C -14 10, -12 22, -4 28 C -3 34, -4 38, -4 40"
          fill="none"
          stroke="#ffffff"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        {/* Right Figure Body Curve */}
        <path
          d="M 9 3 C 14 10, 12 22, 4 28 C 3 34, 4 38, 4 40"
          fill="none"
          stroke="#ffffff"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        {/* Center Joining Trunk Base */}
        <path
          d="M 0 16 L 0 40"
          fill="none"
          stroke="#ffffff"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </g>

      {/* Bottom Arc Text: GÖLBOX */}
      <text
        fill="#ffffff"
        fontSize="17"
        fontWeight="900"
        letterSpacing="4"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        <textPath href="#bottomArcPath" startOffset="50%" textAnchor="middle">
          GÖLBOX
        </textPath>
      </text>
    </svg>
  )
}
