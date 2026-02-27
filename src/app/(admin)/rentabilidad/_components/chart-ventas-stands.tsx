'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatMoney } from '@/lib/utils'
import type { VRentabilidadUbicaciones } from '@/lib/types/database'

type Dato = { nombre: string; ventas: number; promedio: number }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload as Dato
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-sm">
      <p className="mb-1 font-medium">{data.nombre}</p>
      <p className="text-indigo-600">Total: {formatMoney(data.ventas)}</p>
      <p className="text-muted-foreground">Promedio/dia: {formatMoney(data.promedio)}</p>
    </div>
  )
}

export function ChartVentasStands({
  ubicaciones,
}: {
  ubicaciones: VRentabilidadUbicaciones[]
}) {
  const data: Dato[] = ubicaciones.slice(0, 8).map((u) => ({
    nombre:
      u.ubicacion.length > 12
        ? u.ubicacion.slice(0, 12) + '...'
        : u.ubicacion,
    ventas: Math.round(u.total_ventas),
    promedio: Math.round(u.promedio_por_dia),
  }))

  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Sin datos de ubicaciones.
      </p>
    )
  }

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="nombre"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={false}
            angle={-30}
            textAnchor="end"
            height={50}
          />
          <YAxis
            tickFormatter={(v: number) => formatMoney(v)}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            width={65}
          />
          <Tooltip content={(props) => <CustomTooltip {...props} />} cursor={{ fill: 'transparent' }} />
          <Bar dataKey="ventas" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
