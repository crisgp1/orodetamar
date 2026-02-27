'use client'

import { ArrowRight, Package } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatMoney } from '@/lib/utils'
import type { ProductoRentabilidad } from '@/lib/utils/rentabilidad'
import { ChartMargenProductos } from './chart-margen-productos'

function getBadgeStyle(margen: number) {
  if (margen >= 50) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
  if (margen >= 30) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400'
  return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
}

export function ProductosTab({
  productos,
}: {
  productos: ProductoRentabilidad[]
}) {
  if (productos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
        <Package size={32} weight="light" />
        <p className="text-sm">Sin datos de productos en este periodo.</p>
      </div>
    )
  }

  // Ranking dual: mas vendido vs mas rentable
  const masVendidos = [...productos].sort((a, b) => b.unidades_vendidas - a.unidades_vendidas)
  const masRentables = [...productos]
    .filter((p) => p.unidades_vendidas > 0)
    .sort((a, b) => b.margen_porcentaje - a.margen_porcentaje)

  return (
    <div className="space-y-6">
      {/* Ranking dual */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <h4 className="mb-1.5 text-xs font-medium text-muted-foreground">Más vendidos (uds)</h4>
          <div className="space-y-1">
            {masVendidos.slice(0, 5).map((p, i) => (
              <div key={p.producto_id} className="flex items-center justify-between rounded border border-border bg-card px-2 py-1.5">
                <span className="truncate text-xs">{i + 1}. {p.producto_nombre}</span>
                <span className="shrink-0 text-xs font-medium">{p.unidades_vendidas}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="mb-1.5 text-xs font-medium text-muted-foreground">Mayor margen (%)</h4>
          <div className="space-y-1">
            {masRentables.slice(0, 5).map((p, i) => (
              <div key={p.producto_id} className="flex items-center justify-between rounded border border-border bg-card px-2 py-1.5">
                <span className="truncate text-xs">{i + 1}. {p.producto_nombre}</span>
                <Badge className={`text-[10px] ${getBadgeStyle(p.margen_porcentaje)}`}>
                  {p.margen_porcentaje.toFixed(0)}%
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Separator />

      {/* Chart */}
      <div>
        <h3 className="mb-3 text-sm font-medium">Margen por producto</h3>
        <ChartMargenProductos productos={productos} />
      </div>

      <Separator />

      {/* Full ranking */}
      <div>
        <h3 className="mb-3 text-sm font-medium">
          Detalle completo ({productos.length})
        </h3>
        <div className="space-y-2">
          {productos.map((p, idx) => (
            <div
              key={p.producto_id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.producto_nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.presentacion} · {p.unidades_vendidas} uds
                    {p.uds_stand > 0 && ` · S:${p.uds_stand}`}
                    {p.uds_consignacion > 0 && ` · C:${p.uds_consignacion}`}
                    {p.uds_pedidos > 0 && ` · P:${p.uds_pedidos}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-right text-xs shrink-0">
                <span className="hidden text-muted-foreground sm:inline">
                  {formatMoney(p.costo_unitario)}
                </span>
                <ArrowRight size={12} className="hidden text-muted-foreground sm:inline" />
                <span className="font-medium">{formatMoney(p.ingreso_total)}</span>
                <Badge className={`text-[11px] ${getBadgeStyle(p.margen_porcentaje)}`}>
                  {p.margen_porcentaje.toFixed(0)}%
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
