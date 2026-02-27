import { createServerSupabase } from '@/lib/supabase/server'
import { fechaHoyTijuana } from '@/lib/utils'
import { RentabilidadView } from './_components/rentabilidad-view'
import type { PeriodoRentabilidad } from '@/lib/utils/rentabilidad'

function getDateRange(periodo: PeriodoRentabilidad) {
  const hoy = fechaHoyTijuana()
  const [year, month] = hoy.split('-').map(Number)

  switch (periodo) {
    case 'mes_anterior': {
      const m = month - 1 <= 0 ? 12 : month - 1
      const y = month - 1 <= 0 ? year - 1 : year
      const desde = `${y}-${String(m).padStart(2, '0')}-01`
      const lastDay = new Date(y, m, 0).getDate()
      const hasta = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
      return { desde, hasta }
    }
    case 'trimestre': {
      const d = new Date(year, month - 1, 1)
      d.setMonth(d.getMonth() - 2)
      const desde = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
      return { desde, hasta: hoy }
    }
    case 'anual':
      return { desde: `${year}-01-01`, hasta: hoy }
    default:
      return { desde: `${year}-${String(month).padStart(2, '0')}-01`, hasta: hoy }
  }
}

// Get previous period for comparison
function getPreviousRange(periodo: PeriodoRentabilidad) {
  const hoy = fechaHoyTijuana()
  const [year, month] = hoy.split('-').map(Number)

  switch (periodo) {
    case 'mes_actual':
    case 'mes_anterior': {
      // Previous month
      const current = getDateRange(periodo)
      const [cy, cm] = current.desde.split('-').map(Number)
      const pm = cm - 1 <= 0 ? 12 : cm - 1
      const py = cm - 1 <= 0 ? cy - 1 : cy
      const desde = `${py}-${String(pm).padStart(2, '0')}-01`
      const lastDay = new Date(py, pm, 0).getDate()
      const hasta = `${py}-${String(pm).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
      return { desde, hasta }
    }
    case 'trimestre': {
      const d = new Date(year, month - 1, 1)
      d.setMonth(d.getMonth() - 5)
      const desde = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
      d.setMonth(d.getMonth() + 3)
      const lastDay = new Date(d.getFullYear(), d.getMonth(), 0).getDate()
      const hasta = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
      return { desde, hasta }
    }
    case 'anual':
      return { desde: `${year - 1}-01-01`, hasta: `${year - 1}-12-31` }
    default:
      return { desde: `${year}-01-01`, hasta: hoy }
  }
}

export default async function RentabilidadPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>
}) {
  const params = await searchParams
  const periodo = (
    ['mes_actual', 'mes_anterior', 'trimestre', 'anual'].includes(params.periodo ?? '')
      ? params.periodo
      : 'mes_actual'
  ) as PeriodoRentabilidad

  const { desde, hasta } = getDateRange(periodo)
  const prev = getPreviousRange(periodo)
  const supabase = createServerSupabase()

  const [
    ingresosRes,
    ingresosPrevRes,
    costosRes,
    ubicacionesRes,
    gastosRes,
    comprasRes,
    consignacionesRes,
    stockRes,
  ] = await Promise.all([
    // Current period
    supabase
      .from('v_ingresos_consolidados')
      .select('*')
      .gte('fecha', desde)
      .lte('fecha', hasta),
    // Previous period (for comparison)
    supabase
      .from('v_ingresos_consolidados')
      .select('monto')
      .gte('fecha', prev.desde)
      .lte('fecha', prev.hasta),
    supabase
      .from('v_costos_produccion_periodo')
      .select('*')
      .order('margen_porcentaje', { ascending: false }),
    supabase
      .from('v_rentabilidad_ubicaciones')
      .select('*')
      .order('total_ventas', { ascending: false }),
    supabase
      .from('gastos')
      .select('*')
      .gte('fecha', desde)
      .lte('fecha', hasta),
    supabase
      .from('compras_materia_prima')
      .select('costo_total')
      .gte('fecha_compra', desde)
      .lte('fecha_compra', hasta),
    // Consignaciones activas (for cobranza + health)
    supabase
      .from('v_consignaciones_activas')
      .select('*'),
    // Stock (for health)
    supabase
      .from('v_stock_actual')
      .select('producto_id, producto_nombre, cantidad_disponible, alerta'),
  ])

  const comprasTotal = (comprasRes.data ?? []).reduce((s, c) => s + c.costo_total, 0)
  const ingresosPrevTotal = (ingresosPrevRes.data ?? []).reduce((s, i) => s + i.monto, 0)

  return (
    <RentabilidadView
      ingresos={ingresosRes.data ?? []}
      ingresosPrevTotal={ingresosPrevTotal}
      costos={costosRes.data ?? []}
      ubicaciones={ubicacionesRes.data ?? []}
      gastos={gastosRes.data ?? []}
      comprasMP={comprasTotal}
      consignaciones={consignacionesRes.data ?? []}
      stock={(stockRes.data ?? []) as { producto_id: number; producto_nombre: string; cantidad_disponible: number; alerta: 'AGOTADO' | 'STOCK_BAJO' | 'OK' }[]}
      periodo={periodo}
      desde={desde}
      hasta={hasta}
    />
  )
}
