import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'UW Blueprint — People Tracker',
  description: 'Member directory and people management for UW Blueprint',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
