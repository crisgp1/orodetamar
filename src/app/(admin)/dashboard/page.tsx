import {
  Handshake,
  Warning,
  ShoppingCart,
  Package,
  CurrencyDollar,
  Storefront,
  Flask,
  Receipt,
  ArrowUp,
  ArrowDown,
  House,
} from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase/server'

function formatPeso(n: number) {
  return `$${n.toLocaleString('es-MX')}`
}

function getTijuanaDate(d: Date = new Date()) {
  return new Date(d.toLocaleString('en-US', { timeZone: 'America/Tijuana' }))
}

function formatISO(d: Date) {
  return d.toISOString().split('T')[0]
}

export default async function DashboardPage() {
  const supabase = createServerSupabase()

  const now = getTijuanaDate()

  // Week boundaries (Monday-based)
  const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1
  const thisWeekStart = new Date(now)
  thisWeekStart.setDate(now.getDate() - dayOfWeek)
  thisWeekStart.setHours(0, 0, 0, 0)

  const lastWeekStart = new Date(thisWeekStart)
  lastWeekStart.setDate(lastWeekStart.getDate() - 7)
  const lastWeekEnd = new Date(thisWeekStart)
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 1)

  // Month boundaries
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

  const [dashRes, ventasSemRes, ventasSemPrevRes, gastosMesRes, gastosMesPrevRes] =
    await Promise.all([
      supabase.from('v_dashboard').select('*').single(),
      // Ventas stand esta semana
      supabase
        .from('ventas_stand')
        .select('total')
        .gte('fecha', formatISO(thisWeekStart))
        .lte('fecha', formatISO(now)),
      // Ventas stand semana pasada
      supabase
        .from('ventas_stand')
        .select('total')
        .gte('fecha', formatISO(lastWeekStart))
        .lte('fecha', formatISO(lastWeekEnd)),
      // Gastos mes actual
      supabase
        .from('gastos')
        .select('monto')
        .gte('fecha', formatISO(thisMonthStart))
        .lte('fecha', formatISO(now)),
      // Gastos mes pasado
      supabase
        .from('gastos')
        .select('monto')
        .gte('fecha', formatISO(lastMonthStart))
        .lte('fecha', formatISO(lastMonthEnd)),
    ])

  const data = dashRes.data

  const ventasSemActual = (ventasSemRes.data ?? []).reduce((s, v) => s + (v.total ?? 0), 0)
  const ventasSemPrev = (ventasSemPrevRes.data ?? []).reduce((s, v) => s + (v.total ?? 0), 0)

  const gastosMesActual = (gastosMesRes.data ?? []).reduce((s, g) => s + (g.monto ?? 0), 0)
  const gastosMesPrev = (gastosMesPrevRes.data ?? []).reduce((s, g) => s + (g.monto ?? 0), 0)

  function calcDelta(actual: number, prev: number) {
    if (prev === 0) return actual > 0 ? 100 : 0
    return Math.round(((actual - prev) / prev) * 100)
  }

  const deltaVentas = calcDelta(ventasSemActual, ventasSemPrev)
  const deltaGastos = calcDelta(gastosMesActual, gastosMesPrev)

  type CardData = {
    label: string
    value: string | number
    icon: React.ReactNode
    delta?: { pct: number; invertido?: boolean; label: string }
  }

  const cards: CardData[] = [
    {
      label: 'Consignaciones activas',
      value: data?.consignaciones_activas ?? 0,
      icon: <Handshake size={24} weight="regular" />,
    },
    {
      label: 'Con saldo pendiente',
      value: data?.consignaciones_con_saldo ?? 0,
      icon: <Warning size={24} weight="regular" />,
    },
    {
      label: 'Saldo pendiente total',
      value: formatPeso(data?.saldo_pendiente_total ?? 0),
      icon: <CurrencyDollar size={24} weight="regular" />,
    },
    {
      label: 'Pedidos pendientes',
      value: data?.pedidos_pendientes ?? 0,
      icon: <ShoppingCart size={24} weight="regular" />,
    },
    {
      label: 'Productos stock bajo',
      value: data?.productos_stock_bajo ?? 0,
      icon: <Package size={24} weight="regular" />,
    },
    {
      label: 'Ventas de la semana',
      value: formatPeso(data?.ventas_semana ?? 0),
      icon: <Storefront size={24} weight="regular" />,
      delta: { pct: deltaVentas, label: 'vs sem. pasada' },
    },
    {
      label: 'Materias primas bajo stock',
      value: data?.materias_primas_stock_bajo ?? 0,
      icon: <Flask size={24} weight="regular" />,
    },
    {
      label: 'Gastos del mes',
      value: formatPeso(data?.gastos_mes_actual ?? 0),
      icon: <Receipt size={24} weight="regular" />,
      delta: { pct: deltaGastos, invertido: true, label: 'vs mes pasado' },
    },
  ]

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          <House size={18} weight="regular" />
          Ir a la tienda
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="flex items-start gap-4 rounded-lg border border-border bg-card p-4"
          >
            <div className="rounded-md bg-muted p-2 text-muted-foreground">
              {card.icon}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="text-2xl font-semibold">{card.value}</p>
              {card.delta && card.delta.pct !== 0 && (
                <DeltaBadge
                  pct={card.delta.pct}
                  invertido={card.delta.invertido}
                  label={card.delta.label}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DeltaBadge({
  pct,
  invertido,
  label,
}: {
  pct: number
  invertido?: boolean
  label: string
}) {
  const isPositive = pct > 0
  // Para gastos: subir es malo (rojo), bajar es bueno (verde)
  const isGood = invertido ? !isPositive : isPositive

  return (
    <span className={`mt-0.5 inline-flex items-center gap-0.5 text-xs font-medium ${isGood ? 'text-emerald-600' : 'text-red-600'}`}>
      {isPositive ? <ArrowUp size={12} weight="bold" /> : <ArrowDown size={12} weight="bold" />}
      {Math.abs(pct)}% {label}
    </span>
  )
}
