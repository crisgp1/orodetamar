import type { Metadata } from 'next'
import { Cormorant_Garamond, Karla } from 'next/font/google'

const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
})

const body = Karla({
  subsets: ['latin'],
  variable: '--font-karla',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Oro de Tamar | Dátiles Premium de Baja California',
  description:
    'Dátiles naturales, pulpa enchilosa y snacks artesanales. Cultivados en el desierto, empacados a mano en Tijuana-Rosarito.',
  openGraph: {
    title: 'Oro de Tamar | Dátiles Premium de Baja California',
    description:
      'Dátiles naturales, pulpa enchilosa y snacks artesanales. Cultivados en el desierto, empacados a mano en Tijuana-Rosarito.',
    type: 'website',
    locale: 'es_MX',
  },
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className={`${display.variable} ${body.variable} catalogo-theme noise-overlay min-h-dvh bg-background font-body text-foreground`}
    >
      {children}
    </div>
  )
}
