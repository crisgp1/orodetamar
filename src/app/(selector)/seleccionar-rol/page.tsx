import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChartBar, Storefront } from '@phosphor-icons/react/dist/ssr'
import { ensureProfile } from '@/lib/auth'

export default async function SelectorPage() {
  const profile = await ensureProfile()
  if (!profile) redirect('/')

  const isAdmin = profile.rol === 'ADMIN'
  const isStaff = profile.rol === 'ADMIN' || profile.rol === 'APOYO'

  // Si solo tiene acceso al POS, ir directo
  if (!isAdmin && isStaff) redirect('/pos')

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4">
      <h1 className="mb-2 text-2xl font-bold">Oro de Tamar</h1>
      <p className="mb-8 text-muted-foreground">¿Qué vas a hacer hoy?</p>

      <div className="grid w-full max-w-lg gap-4 sm:grid-cols-2">
        {isAdmin && (
          <Link
            href="/dashboard"
            className="flex flex-col items-center gap-3 rounded-xl border-2 border-muted p-8 text-center transition-colors hover:border-primary hover:bg-primary/5 active:bg-primary/10"
          >
            <ChartBar size={40} weight="duotone" />
            <span className="text-lg font-semibold">Dashboard</span>
            <span className="text-sm text-muted-foreground">
              Inventario, consignaciones, gastos y reportes
            </span>
          </Link>
        )}

        {isStaff && (
          <Link
            href="/pos"
            className="flex flex-col items-center gap-3 rounded-xl border-2 border-muted p-8 text-center transition-colors hover:border-primary hover:bg-primary/5 active:bg-primary/10"
          >
            <Storefront size={40} weight="duotone" />
            <span className="text-lg font-semibold">Portal de Ventas</span>
            <span className="text-sm text-muted-foreground">
              Registrar ventas en el stand
            </span>
          </Link>
        )}
      </div>
    </div>
  )
}
