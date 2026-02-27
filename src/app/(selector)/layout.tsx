import { redirect } from 'next/navigation'
import { ensureProfile } from '@/lib/auth'

export default async function SelectorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await ensureProfile()
  if (!profile) redirect('/')

  // CLIENTE no tiene acceso a nada interno → redirigir al catálogo
  if (profile.rol === 'CLIENTE') redirect('/')

  return <>{children}</>
}
