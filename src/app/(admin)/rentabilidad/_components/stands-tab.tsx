'use client'

import { MapPin } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatMoney } from '@/lib/utils'
import type { VRentabilidadUbicaciones } from '@/lib/types/database'
import { ChartVentasStands } from './chart-ventas-stands'

const ZONA_LABELS: Record<string, string> = {
  TURISTICA: 'Turistica',
  POPULAR: 'Popular',
  COMERCIAL: 'Comercial',
}

const ZONA_STYLES: Record<string, string> = {
  TURISTICA: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  POPULAR: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
  COMERCIAL: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
}

export function StandsTab({
  ubicaciones,
}: {
  ubicaciones: VRentabilidadUbicaciones[]
}) {
  if (ubicaciones.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
        <MapPin size={32} weight="light" />
        <p className="text-sm">Sin datos de stands en este periodo.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div>
        <h3 className="mb-3 text-sm font-medium">Ventas por stand</h3>
        <ChartVentasStands ubicaciones={ubicaciones} />
      </div>

      <Separator />

      {/* Ranking */}
      <div>
        <h3 className="mb-3 text-sm font-medium">
          Detalle por ubicación ({ubicaciones.length})
        </h3>
        <div className="space-y-2">
          {ubicaciones.map((u, idx) => (
            <div
              key={u.ubicacion_id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">
                      {u.ubicacion}
                    </p>
                    {u.zona && (
                      <Badge
                        className={`text-[10px] ${ZONA_STYLES[u.zona] ?? 'bg-gray-100 text-gray-600'}`}
                      >
                        {ZONA_LABELS[u.zona] ?? u.zona}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {u.dias_venta} dias · {u.total_unidades} unidades
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold">
                  {formatMoney(u.total_ventas)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatMoney(u.promedio_por_dia)}/dia
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
