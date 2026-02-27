import { redirect } from 'next/navigation'
import { ensureProfile } from '@/lib/auth'
import { AdminShell } from '@/components/shared/admin-shell'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await ensureProfile()

  if (!profile) {
    redirect('/')
  }

  // Solo ADMIN y APOYO pueden acceder al panel
  if (profile.rol !== 'ADMIN' && profile.rol !== 'APOYO') {
    redirect('/')
  }

  return <AdminShell>{children}</AdminShell>
}
