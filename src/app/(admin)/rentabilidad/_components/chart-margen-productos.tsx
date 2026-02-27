'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { ProductoRentabilidad } from '@/lib/utils/rentabilidad'

type Dato = { nombre: string; margen: number }

function getBarColor(margen: number) {
  if (margen >= 50) return '#10b981'
  if (margen >= 30) return '#f59e0b'
  return '#ef4444'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload as Dato
  const margen = data.margen
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-sm">
      <p className="font-medium">{data.nombre}</p>
      <p style={{ color: getBarColor(margen) }}>
        Margen: {margen}%
      </p>
    </div>
  )
}

export function ChartMargenProductos({
  productos,
}: {
  productos: ProductoRentabilidad[]
}) {
  const top10: Dato[] = productos
    .filter((p) => p.unidades_vendidas > 0)
    .slice(0, 10)
    .map((p) => ({
      nombre:
        p.producto_nombre.length > 18
          ? p.producto_nombre.slice(0, 18) + '...'
          : p.producto_nombre,
      margen: p.margen_porcentaje,
    }))

  if (top10.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Sin datos de margen.
      </p>
    )
  }

  const chartHeight = Math.max(200, top10.length * 36 + 40)

  return (
    <div style={{ height: chartHeight }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={top10}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v: number) => `${v}%`}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            dataKey="nombre"
            type="category"
            width={130}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={(props) => <CustomTooltip {...props} />} cursor={{ fill: 'transparent' }} />
          <Bar dataKey="margen" radius={[0, 4, 4, 0]} barSize={20}>
            {top10.map((entry, index) => (
              <Cell key={index} fill={getBarColor(entry.margen)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
