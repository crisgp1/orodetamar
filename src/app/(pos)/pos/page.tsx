import { createServerSupabase } from '@/lib/supabase/server'
import { fechaHoyTijuana } from '@/lib/utils'
import { PosView } from './_components/pos-view'

export type VentaResumenProducto = {
  producto_id: number
  nombre: string
  presentacion: string
  cantidad_vendida: number
  total: number
}

export default async function PosPage() {
  const supabase = createServerSupabase()
  const hoy = fechaHoyTijuana()

  const [
    { data: productos },
    { data: ubicaciones },
    { data: stockData },
    { data: ventasHoy },
    { data: cierres },
  ] = await Promise.all([
    supabase
      .from('productos')
      .select('id, nombre, presentacion, precio_venta')
      .eq('activo', true)
      .order('nombre'),
    supabase
      .from('ubicaciones')
      .select('id, nombre')
      .eq('activo', true)
      .order('nombre'),
    supabase
      .from('v_stock_actual')
      .select('producto_id, cantidad_disponible'),
    supabase
      .from('v_ventas_stand')
      .select('*')
      .eq('fecha_local', hoy)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('v_cierres_stand')
      .select('*')
      .order('fecha', { ascending: false })
      .limit(20),
  ])

  const stockMap: Record<number, number> = {}
  stockData?.forEach((s) => {
    stockMap[s.producto_id] = s.cantidad_disponible
  })

  // Agrupar ventas del día por producto para el cierre
  const ventasPorProducto: Record<number, VentaResumenProducto> = {}
  ;(ventasHoy ?? []).forEach((v) => {
    if (!ventasPorProducto[v.producto_id]) {
      ventasPorProducto[v.producto_id] = {
        producto_id: v.producto_id,
        nombre: v.producto_nombre ?? `Producto #${v.producto_id}`,
        presentacion: v.producto_presentacion ?? '',
        cantidad_vendida: 0,
        total: 0,
      }
    }
    ventasPorProducto[v.producto_id].cantidad_vendida += v.cantidad_vendida
    ventasPorProducto[v.producto_id].total += v.total
  })

  return (
    <PosView
      productos={productos ?? []}
      ubicaciones={ubicaciones ?? []}
      stockMap={stockMap}
      ventasHoy={ventasHoy ?? []}
      cierres={cierres ?? []}
      ventasPorProducto={ventasPorProducto}
    />
  )
}
