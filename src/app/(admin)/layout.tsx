import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { AdminShell } from '@/components/shared/admin-shell'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/')
  }

  return <AdminShell>{children}</AdminShell>
}
