'use client'

import { LineChart, Line, ResponsiveContainer } from 'recharts'

export function Sparkline({
  data,
  dataKey = 'value',
  color = 'currentColor',
  width = 80,
  height = 30,
}: {
  data: Record<string, number>[]
  dataKey?: string
  color?: string
  width?: number
  height?: number
}) {
  if (data.length < 2) return null

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
