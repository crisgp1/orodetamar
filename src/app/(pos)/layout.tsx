import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Oro de Tamar — Punto de Venta' }

export default async function PosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) redirect('/')

  return (
    <div className="min-h-dvh bg-background">
      {children}
    </div>
  )
}
