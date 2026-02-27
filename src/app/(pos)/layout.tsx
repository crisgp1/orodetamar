import { redirect } from 'next/navigation'
import { ensureProfile } from '@/lib/auth'

export const metadata = { title: 'Oro de Tamar — Punto de Venta' }

export default async function PosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await ensureProfile()
  if (!profile) redirect('/')

  // Solo ADMIN y APOYO pueden usar el POS
  if (profile.rol !== 'ADMIN' && profile.rol !== 'APOYO') {
    redirect('/')
  }

  return (
    <div className="min-h-dvh bg-background">
      {children}
    </div>
  )
}
