'use client'

import {
  CheckCircle,
  WarningCircle,
  Info,
} from '@phosphor-icons/react'
import type { Insight } from '@/lib/utils/rentabilidad'

const ICON_MAP = {
  positivo: CheckCircle,
  negativo: WarningCircle,
  neutro: Info,
} as const

const STYLE_MAP = {
  positivo: 'text-emerald-700 dark:text-emerald-400',
  negativo: 'text-red-700 dark:text-red-400',
  neutro: 'text-blue-700 dark:text-blue-400',
} as const

export function InsightsBanner({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null

  return (
    <div className="space-y-1.5">
      {insights.map((insight, i) => {
        const Icon = ICON_MAP[insight.tipo]
        return (
          <div
            key={i}
            className="flex items-start gap-2 rounded-lg border border-border bg-card px-3 py-2"
          >
            <Icon
              size={16}
              weight="bold"
              className={`mt-0.5 shrink-0 ${STYLE_MAP[insight.tipo]}`}
            />
            <p className="text-sm text-foreground">{insight.mensaje}</p>
          </div>
        )
      })}
    </div>
  )
}
