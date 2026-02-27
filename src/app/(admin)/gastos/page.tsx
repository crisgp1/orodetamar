import { Receipt } from '@phosphor-icons/react/dist/ssr'
import { createServerSupabase } from '@/lib/supabase/server'
import { GastosView } from './_components/gastos-view'

export default async function GastosPage() {
  const supabase = createServerSupabase()

  const { data: gastos } = await supabase
    .from('gastos')
    .select('*')
    .order('fecha', { ascending: false })
    .limit(100)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-muted p-2 text-muted-foreground">
            <Receipt size={24} weight="regular" />
          </div>
          <h1 className="text-2xl font-semibold">Gastos</h1>
        </div>
      </div>
      <GastosView gastos={gastos ?? []} />
    </div>
  )
}
