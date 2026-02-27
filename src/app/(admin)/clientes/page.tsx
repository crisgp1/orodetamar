import { Users } from '@phosphor-icons/react/dist/ssr'
import { createServerSupabase } from '@/lib/supabase/server'
import type { Cliente } from '@/lib/types/database'
import { ClientesView } from './_components/clientes-view'

export default async function ClientesPage() {
  const supabase = createServerSupabase()

  const { data: clientes } = await supabase
    .from('clientes')
    .select('*')
    .eq('activo', true)
    .order('nombre')

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-muted p-2 text-muted-foreground">
            <Users size={24} weight="regular" />
          </div>
          <h1 className="text-2xl font-semibold">Clientes</h1>
        </div>
      </div>
      <ClientesView clientes={(clientes ?? []) as Cliente[]} />
    </div>
  )
}
