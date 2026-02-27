'use client'

import {
  Storefront,
  Percent,
  Wallet,
  Package,
} from '@phosphor-icons/react'
import type { HealthArea } from '@/lib/utils/health-score'

const AREA_ICONS = {
  ventas: Storefront,
  margen: Percent,
  cobranza: Wallet,
  inventario: Package,
} as const

const AREA_LABELS = {
  ventas: 'Ventas',
  margen: 'Margen',
  cobranza: 'Cobranza',
  inventario: 'Inventario',
} as const

const STATUS_COLORS = {
  verde: 'bg-emerald-500',
  amarillo: 'bg-amber-500',
  rojo: 'bg-red-500',
} as const

export function HealthSemaphore({ areas }: { areas: HealthArea[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {areas.map((a) => {
        const Icon = AREA_ICONS[a.area]
        return (
          <div
            key={a.area}
            className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5"
          >
            <div className="flex shrink-0 items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full ${STATUS_COLORS[a.status]}`} />
              <Icon size={16} weight="bold" className="text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium">{AREA_LABELS[a.area]}</p>
              <p className="truncate text-[11px] text-muted-foreground">{a.mensaje}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
