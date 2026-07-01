import type { Metadata } from 'next'
import { Nunito } from 'next/font/google'
import './globals.css'

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
})

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
    <html lang="en" className={nunito.variable}>
      <body style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}>{children}</body>
    </html>
  )
}
