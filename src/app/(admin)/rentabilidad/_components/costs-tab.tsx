'use client'

import { Receipt, Scales, CurrencyDollar } from '@phosphor-icons/react'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatMoney } from '@/lib/utils'
import type { GastoAgrupado } from '@/lib/utils/rentabilidad'
import type { VCostosProduccionPeriodo } from '@/lib/types/database'
import { Badge } from '@/components/ui/badge'

const GASTO_COLORS: Record<string, string> = {
  Gasolina: 'bg-amber-500',
  'Materia Prima': 'bg-blue-500',
  Empaque: 'bg-slate-500',
  Renta: 'bg-violet-500',
  Permiso: 'bg-emerald-500',
  Herramienta: 'bg-orange-500',
  Marketing: 'bg-pink-500',
  Otro: 'bg-gray-500',
}

export function CostsTab({
  comprasMP,
  gastosTotal,
  gastosAgrupados,
  costos,
}: {
  comprasMP: number
  gastosTotal: number
  gastosAgrupados: GastoAgrupado[]
  costos: VCostosProduccionPeriodo[]
}) {
  const totalEgresos = comprasMP + gastosTotal

  return (
    <div className="space-y-6">
      {/* 3 cards */}
      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Scales size={12} weight="bold" />
              Compras MP
            </div>
            <p className="mt-1 text-lg font-bold text-red-600">{formatMoney(comprasMP)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Receipt size={12} weight="bold" />
              Gastos
            </div>
            <p className="mt-1 text-lg font-bold text-red-600">{formatMoney(gastosTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CurrencyDollar size={12} weight="bold" />
              Total egresos
            </div>
            <p className="mt-1 text-lg font-bold">{formatMoney(totalEgresos)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Gastos por tipo */}
      {gastosAgrupados.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium">Gastos por tipo</h3>
          <div className="space-y-2">
            {gastosAgrupados.map((g) => (
              <div key={g.tipo} className="rounded-lg border border-border bg-card px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${GASTO_COLORS[g.tipo] ?? 'bg-gray-500'}`} />
                    <span className="text-sm">{g.tipo}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{formatMoney(g.monto)}</span>
                    <span className="text-xs text-muted-foreground">{g.porcentaje}%</span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted">
                  <div
                    className={`h-1.5 rounded-full ${GASTO_COLORS[g.tipo] ?? 'bg-gray-500'}`}
                    style={{ width: `${Math.min(g.porcentaje, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {gastosAgrupados.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
          <Receipt size={28} weight="light" />
          <p className="text-sm">Sin gastos en este periodo.</p>
        </div>
      )}

      <Separator />

      {/* Costo unitario por producto */}
      <div>
        <h3 className="mb-3 text-sm font-medium">Costo unitario por producto</h3>
        {costos.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Sin datos de recetas.</p>
        ) : (
          <div className="space-y-2">
            {costos.map((c) => (
              <div
                key={c.producto_id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{c.producto_nombre}</p>
                  <p className="text-xs text-muted-foreground">{c.presentacion}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-xs">
                  <span className="text-muted-foreground">Costo: {formatMoney(c.costo_unitario)}</span>
                  <span className="font-medium">Precio: {formatMoney(c.precio_venta)}</span>
                  <Badge
                    className={`text-[10px] ${
                      c.margen_porcentaje >= 50
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                        : c.margen_porcentaje >= 30
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                    }`}
                  >
                    {c.margen_porcentaje}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
