import { Warehouse } from '@phosphor-icons/react/dist/ssr'
import { createServerSupabase } from '@/lib/supabase/server'
import type { TipoMovimiento } from '@/lib/types/database'
import { StockTable } from './_components/stock-table'
import { MovimientosHistorial } from './_components/movimientos-historial'
import { RegistrarMovimientoModal } from './_components/registrar-movimiento-modal'

export default async function InventarioPage() {
  const supabase = createServerSupabase()

  const [stockRes, movimientosRes, productosRes] = await Promise.all([
    supabase
      .from('v_stock_actual')
      .select('*')
      .order('cantidad_disponible', { ascending: true }),
    supabase
      .from('movimientos_inventario')
      .select(
        '*, productos:productos!movimientos_inventario_producto_id_fkey(nombre, sku), producto_origen:productos!movimientos_inventario_producto_origen_id_fkey(nombre, sku)'
      )
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('productos')
      .select('id, nombre, presentacion')
      .eq('activo', true)
      .order('nombre'),
  ])

  const stock = stockRes.data ?? []
  const productos = productosRes.data ?? []

  const movimientos = (movimientosRes.data ?? []).map((m) => ({
    id: m.id,
    producto_id: m.producto_id,
    tipo: m.tipo as TipoMovimiento,
    cantidad: m.cantidad,
    producto_origen_id: m.producto_origen_id,
    notas: m.notas,
    created_at: m.created_at,
    productos: m.productos as { nombre: string; sku: string | null } | null,
    producto_origen: m.producto_origen as {
      nombre: string
      sku: string | null
    } | null,
  }))

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-muted p-2 text-muted-foreground">
            <Warehouse size={24} weight="regular" />
          </div>
          <h1 className="text-2xl font-semibold">Inventario</h1>
        </div>
        <RegistrarMovimientoModal productos={productos} stock={stock} />
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-medium">Stock actual</h2>
        <StockTable stock={stock} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Ultimos movimientos</h2>
        <MovimientosHistorial movimientos={movimientos} />
      </section>
    </div>
  )
}
