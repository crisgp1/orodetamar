'use client'

import {
  ArrowUp,
  ArrowDown,
  Storefront,
  Handshake,
  ArrowUUpLeft,
  ArrowsClockwise,
  Faders,
  ArrowRight,
} from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import type { TipoMovimiento } from '@/lib/types/database'

type Movimiento = {
  id: number
  producto_id: number
  tipo: TipoMovimiento
  cantidad: number
  producto_origen_id: number | null
  notas: string | null
  created_at: string
  productos: { nombre: string; sku: string | null } | null
  producto_origen: { nombre: string; sku: string | null } | null
}

const tipoConfig: Record<
  TipoMovimiento,
  { label: string; color: string; icon: React.ReactNode }
> = {
  PRODUCCION: {
    label: 'Producción',
    color: 'bg-green-100 text-green-700',
    icon: <ArrowUp size={14} weight="bold" />,
  },
  VENTA: {
    label: 'Venta',
    color: 'bg-blue-100 text-blue-700',
    icon: <Storefront size={14} weight="bold" />,
  },
  CONSIGNACION_SALIDA: {
    label: 'Consig. salida',
    color: 'bg-orange-100 text-orange-700',
    icon: <Handshake size={14} weight="bold" />,
  },
  CONSIGNACION_RETORNO: {
    label: 'Consig. retorno',
    color: 'bg-cyan-100 text-cyan-700',
    icon: <ArrowUUpLeft size={14} weight="bold" />,
  },
  REPROCESAMIENTO: {
    label: 'Reprocesamiento',
    color: 'bg-purple-100 text-purple-700',
    icon: <ArrowsClockwise size={14} weight="bold" />,
  },
  MERMA: {
    label: 'Merma',
    color: 'bg-red-100 text-red-700',
    icon: <ArrowDown size={14} weight="bold" />,
  },
  AJUSTE: {
    label: 'Reingreso',
    color: 'bg-gray-100 text-gray-700',
    icon: <Faders size={14} weight="bold" />,
  },
}

function formatearFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function MovimientosHistorial({
  movimientos,
}: {
  movimientos: Movimiento[]
}) {
  if (movimientos.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No hay movimientos registrados.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {movimientos.map((mov) => {
        const config = tipoConfig[mov.tipo]
        const signo = mov.cantidad > 0 ? '+' : ''
        const esReprocesamiento = mov.tipo === 'REPROCESAMIENTO'
        const productoNombre =
          mov.productos?.nombre ?? `Producto #${mov.producto_id}`

        return (
          <div
            key={mov.id}
            className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
          >
            <div
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.color}`}
            >
              {config.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium">
                  {productoNombre}
                </p>
                <span
                  className={`shrink-0 text-sm font-semibold tabular-nums ${
                    mov.cantidad > 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {signo}
                  {mov.cantidad}
                </span>
              </div>

              {/* Reprocesamiento: show origin → destination */}
              {esReprocesamiento &&
                mov.producto_origen?.nombre &&
                mov.cantidad > 0 && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-purple-600">
                    {mov.producto_origen.nombre}
                    <ArrowRight size={12} weight="bold" />
                    {productoNombre}
                  </p>
                )}

              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge className={`text-[11px] ${config.color}`}>
                  {config.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatearFecha(mov.created_at)}
                </span>
              </div>
              {mov.notas && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {mov.notas}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
