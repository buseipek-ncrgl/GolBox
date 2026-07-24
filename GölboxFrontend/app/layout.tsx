import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Manrope, Fraunces } from 'next/font/google'
import './globals.css'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  axes: ['opsz'],
})

export const metadata: Metadata = {
  title: 'GölBox — Dijital Sadakat Deneyimi',
  description:
    'GölBox, kullanıcının zamanına saygı duyan premium dijital sadakat platformu. Göl Puan kazan, kafeleri keşfet, tek QR ile her şeyi hallet.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#1d5f60',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

import { GolboxProvider } from '@/lib/golbox-context'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr" className={`light ${manrope.variable} ${fraunces.variable}`}>
      <body className="bg-background font-sans antialiased">
        <GolboxProvider>
          {children}
        </GolboxProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
