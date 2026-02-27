'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { formatMoney } from '@/lib/utils'
import type { VIngresosConsolidados, Gasto } from '@/lib/types/database'

type DatoMes = {
  mes: string
  ingresos: number
  egresos: number
}

function agruparPorMes(
  ingresos: VIngresosConsolidados[],
  gastos: Gasto[]
): DatoMes[] {
  const meses = new Map<string, { ingresos: number; egresos: number }>()

  for (const i of ingresos) {
    const mes = i.fecha.slice(0, 7)
    const prev = meses.get(mes) ?? { ingresos: 0, egresos: 0 }
    prev.ingresos += i.monto
    meses.set(mes, prev)
  }

  for (const g of gastos) {
    const mes = g.fecha.slice(0, 7)
    const prev = meses.get(mes) ?? { ingresos: 0, egresos: 0 }
    prev.egresos += g.monto
    meses.set(mes, prev)
  }

  return Array.from(meses.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, data]) => ({
      mes: formatMesLabel(mes),
      ingresos: Math.round(data.ingresos),
      egresos: Math.round(data.egresos),
    }))
}

function formatMesLabel(mes: string) {
  const [y, m] = mes.split('-')
  const labels = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
  ]
  return `${labels[Number(m) - 1]} ${y.slice(2)}`
}

const LABEL_MAP: Record<string, string> = {
  ingresos: 'Ingresos',
  egresos: 'Egresos',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-sm">
      <p className="mb-1 font-medium">{String(label)}</p>
      {payload.map((entry: { color?: string; dataKey?: string | number; value?: number }, i: number) => (
        <p key={i} style={{ color: entry.color }}>
          {LABEL_MAP[String(entry.dataKey)] ?? entry.dataKey}: {formatMoney(entry.value ?? 0)}
        </p>
      ))}
    </div>
  )
}

export function ChartComparativaMensual({
  ingresos,
  gastos,
}: {
  ingresos: VIngresosConsolidados[]
  gastos: Gasto[]
}) {
  const data = agruparPorMes(ingresos, gastos)

  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Sin datos para graficar.
      </p>
    )
  }

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="mes"
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: number) => formatMoney(v)}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            width={65}
          />
          <Tooltip content={(props) => <CustomTooltip {...props} />} cursor={{ fill: 'transparent' }} />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            formatter={(value: string) => LABEL_MAP[value] ?? value}
          />
          <Bar dataKey="ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="egresos" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
