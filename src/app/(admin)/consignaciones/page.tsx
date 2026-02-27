import { Handshake } from '@phosphor-icons/react/dist/ssr'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  ConsignacionesActivas,
  ConsignacionesHistorial,
} from './_components/consignaciones-lista'
import { CrearConsignacionDialog } from './_components/crear-consignacion-form'
import type { EstadoConsignacion } from '@/lib/types/database'

export default async function ConsignacionesPage() {
  const supabase = createServerSupabase()

  const [activasRes, historialRes, clientesRes, productosRes] = await Promise.all([
    supabase
      .from('v_consignaciones_activas')
      .select('*')
      .order('fecha_entrega', { ascending: true }),
    supabase
      .from('consignaciones')
      .select('*, clientes(nombre)')
      .in('estado', ['LIQUIDADA', 'CANCELADA'])
      .order('fecha_liquidacion', { ascending: false })
      .limit(10),
    supabase
      .from('clientes')
      .select('id, nombre, ciudad')
      .eq('activo', true)
      .eq('modalidad_pago', 'CONSIGNACION')
      .order('nombre'),
    supabase
      .from('v_stock_actual')
      .select('*')
      .gt('cantidad_disponible', 0)
      .order('producto_nombre'),
  ])

  const activas = activasRes.data ?? []
  const historial = (historialRes.data ?? []).map((c) => ({
    ...c,
    estado: c.estado as EstadoConsignacion,
    clientes: c.clientes as { nombre: string } | null,
  }))
  const clientes = clientesRes.data ?? []
  const productos = productosRes.data ?? []

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-muted p-2 text-muted-foreground">
            <Handshake size={24} weight="regular" />
          </div>
          <h1 className="text-2xl font-semibold">Consignaciones</h1>
        </div>
        <CrearConsignacionDialog clientes={clientes} productos={productos} />
      </div>

      {/* Active consignments */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-medium">Activas</h2>
        <ConsignacionesActivas consignaciones={activas} />
      </section>

      {/* History */}
      {historial.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-medium">Historial</h2>
          <ConsignacionesHistorial consignaciones={historial} />
        </section>
      )}
    </div>
  )
}
