import type { Metadata } from 'next'
import { GeistSans, GeistMono } from 'geist/font'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = GeistSans;
const _geistMono = GeistMono;

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
