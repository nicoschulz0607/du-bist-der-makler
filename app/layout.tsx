import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Du bist der Makler – Immobilie verkaufen ohne Provision',
  description:
    'Verkaufe deine Immobilie selbst – professionell, günstig, ohne Makler. Mit KI-Tools, Schritt-für-Schritt-Begleitung und echtem Makler-Know-how. Einmal zahlen, selbst verkaufen.',
  keywords: [
    'Immobilie verkaufen ohne Makler',
    'Haus verkaufen selbst',
    'Wohnung privat verkaufen',
    'Immobilien ohne Provision',
    'KI Exposé Generator',
  ],
  openGraph: {
    title: 'Du bist der Makler – Immobilie verkaufen ohne Provision',
    description:
      'Mit KI-Tools und Makler-Know-how: Einmal zahlen, selbst verkaufen, tausende Euro sparen.',
    type: 'website',
    locale: 'de_DE',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
