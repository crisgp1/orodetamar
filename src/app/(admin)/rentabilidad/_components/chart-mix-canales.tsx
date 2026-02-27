'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  type PieLabelRenderProps,
} from 'recharts'
import { formatMoney } from '@/lib/utils'
import type { MixCanal } from '@/lib/utils/rentabilidad'

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444']

type Dato = { name: string; value: number; pct: number }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload as Dato
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-sm">
      <p className="font-medium">{data.name}</p>
      <p>{formatMoney(data.value)} ({data.pct}%)</p>
    </div>
  )
}

const RADIAN = Math.PI / 180

function renderCustomLabel(props: PieLabelRenderProps) {
  const cx = Number(props.cx ?? 0)
  const cy = Number(props.cy ?? 0)
  const midAngle = Number(props.midAngle ?? 0)
  const innerRadius = Number(props.innerRadius ?? 0)
  const outerRadius = Number(props.outerRadius ?? 0)
  const percent = Number(props.percent ?? 0)

  const radius = innerRadius + (outerRadius - innerRadius) * 1.4
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  if (percent < 0.05) return null

  return (
    <text
      x={x}
      y={y}
      fill="hsl(var(--foreground))"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={12}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function ChartMixCanales({ mix }: { mix: MixCanal[] }) {
  if (mix.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Sin datos de canales.
      </p>
    )
  }

  const data: Dato[] = mix.map((m) => ({
    name: m.canal,
    value: Math.round(m.monto),
    pct: m.porcentaje,
  }))

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
            label={renderCustomLabel}
            labelLine={false}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={(props) => <CustomTooltip {...props} />} />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
            iconType="circle"
            iconSize={8}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
