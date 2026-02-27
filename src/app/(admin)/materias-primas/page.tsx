import { Flask } from '@phosphor-icons/react/dist/ssr'
import { createServerSupabase } from '@/lib/supabase/server'
import { MateriasPrimasView } from './_components/materias-primas-view'

export default async function MateriasPrimasPage() {
  const supabase = createServerSupabase()

  const [stockRes, movRes, mpRes] = await Promise.all([
    supabase
      .from('v_stock_materia_prima')
      .select('*')
      .order('nombre'),
    supabase
      .from('movimientos_materia_prima')
      .select('*, materias_primas(nombre)')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('materias_primas')
      .select('id, nombre, unidad_medida')
      .eq('activo', true)
      .order('nombre'),
  ])

  const stock = stockRes.data ?? []
  const movimientos = (movRes.data ?? []).map((m) => ({
    ...m,
    materias_primas: m.materias_primas as { nombre: string } | null,
  }))
  const materiasPrimas = mpRes.data ?? []

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-muted p-2 text-muted-foreground">
            <Flask size={24} weight="regular" />
          </div>
          <h1 className="text-2xl font-semibold">Materias Primas</h1>
        </div>
      </div>
      <MateriasPrimasView
        stock={stock}
        movimientos={movimientos}
        materiasPrimas={materiasPrimas}
      />
    </div>
  )
}
