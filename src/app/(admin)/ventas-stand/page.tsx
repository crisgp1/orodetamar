import { createServerSupabase } from '@/lib/supabase/server'
import { fechaHoyTijuana } from '@/lib/utils'
import { VentasReporte } from './_components/ventas-reporte'

type Rango = 'hoy' | 'ayer' | 'semana' | 'mes'

function getDateRange(rango: Rango) {
  const hoy = fechaHoyTijuana() // "YYYY-MM-DD" en Tijuana
  const [year, month, day] = hoy.split('-').map(Number)

  switch (rango) {
    case 'ayer': {
      const d = new Date(year, month - 1, day - 1)
      const ayer = d.toLocaleDateString('en-CA', { timeZone: 'America/Tijuana' })
      return { desde: ayer, hasta: ayer }
    }
    case 'semana': {
      const d = new Date(year, month - 1, day - 6)
      const hace7 = d.toLocaleDateString('en-CA', { timeZone: 'America/Tijuana' })
      return { desde: hace7, hasta: hoy }
    }
    case 'mes': {
      const desde = `${year}-${String(month).padStart(2, '0')}-01`
      return { desde, hasta: hoy }
    }
    default:
      return { desde: hoy, hasta: hoy }
  }
}

export default async function VentasStandPage({
  searchParams,
}: {
  searchParams: Promise<{ rango?: string }>
}) {
  const params = await searchParams
  const rango = (['hoy', 'ayer', 'semana', 'mes'].includes(params.rango ?? '')
    ? params.rango
    : 'hoy') as Rango
  const { desde, hasta } = getDateRange(rango)

  const supabase = createServerSupabase()

  const [ventasRes, cierresRes] = await Promise.all([
    supabase
      .from('v_ventas_stand')
      .select('*')
      .gte('fecha_local', desde)
      .lte('fecha_local', hasta)
      .order('created_at', { ascending: false }),
    supabase
      .from('v_cierres_stand')
      .select('*')
      .gte('fecha', desde)
      .lte('fecha', hasta)
      .order('fecha', { ascending: false }),
  ])

  return (
    <VentasReporte
      ventas={ventasRes.data ?? []}
      cierres={cierresRes.data ?? []}
      rango={rango}
      desde={desde}
      hasta={hasta}
    />
  )
}
