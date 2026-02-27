'use client'

import Link from 'next/link'
import {
  Clock,
  MagnifyingGlass,
  Warning,
  CheckCircle,
  XCircle,
  CalendarBlank,
} from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { VConsignacionesActivas, EstadoConsignacion } from '@/lib/types/database'

const estadoConfig: Record<
  EstadoConsignacion,
  { label: string; color: string; icon: React.ReactNode }
> = {
  ACTIVA: {
    label: 'Activa',
    color: 'bg-blue-100 text-blue-700',
    icon: <Clock size={14} weight="bold" />,
  },
  EN_REVISION: {
    label: 'En revisión',
    color: 'bg-yellow-100 text-yellow-700',
    icon: <MagnifyingGlass size={14} weight="bold" />,
  },
  SALDO_PENDIENTE: {
    label: 'Saldo pendiente',
    color: 'bg-red-100 text-red-700',
    icon: <Warning size={14} weight="bold" />,
  },
  LIQUIDADA: {
    label: 'Liquidada',
    color: 'bg-green-100 text-green-700',
    icon: <CheckCircle size={14} weight="fill" />,
  },
  CANCELADA: {
    label: 'Cancelada',
    color: 'bg-gray-100 text-gray-500',
    icon: <XCircle size={14} />,
  },
}

function diasBadge(dias: number) {
  if (dias > 7) return 'bg-red-100 text-red-700'
  if (dias > 3) return 'bg-yellow-100 text-yellow-700'
  return 'bg-gray-100 text-gray-600'
}

function formatPeso(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

export function ConsignacionesActivas({
  consignaciones,
}: {
  consignaciones: VConsignacionesActivas[]
}) {
  if (consignaciones.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No hay consignaciones activas.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {consignaciones.map((c) => {
        const estado = estadoConfig[c.estado]
        const saldo = c.saldo_pendiente

        return (
          <Link
            key={c.id}
            href={`/consignaciones/${c.id}`}
            className="block rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50"
          >
            {/* Row 1: Cliente + estado */}
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="truncate font-medium">{c.cliente_nombre}</p>
              <Badge className={`shrink-0 gap-1 ${estado.color}`}>
                {estado.icon}
                {estado.label}
              </Badge>
            </div>

            {/* Row 2: Fecha + dias */}
            <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarBlank size={14} />
                {new Date(c.fecha_entrega + 'T12:00:00').toLocaleDateString('es-MX', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
              <Badge className={`text-[11px] ${diasBadge(c.dias_transcurridos)}`}>
                {c.dias_transcurridos}d
              </Badge>
            </div>

            {/* Row 3: Financials */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <p className="text-muted-foreground">Dejado</p>
                <p className="font-medium">{formatPeso(c.total_dejado)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Vendido</p>
                <p className="font-medium">{formatPeso(c.total_vendido)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Saldo</p>
                <p
                  className={`font-semibold ${saldo > 0 ? 'text-red-600' : 'text-green-600'}`}
                >
                  {formatPeso(saldo)}
                </p>
              </div>
            </div>

            {/* Row 4: Action hint */}
            {c.estado === 'ACTIVA' && (
              <div className="mt-3">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <span>Liquidar</span>
                </Button>
              </div>
            )}
            {c.estado === 'SALDO_PENDIENTE' && (
              <div className="mt-3">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <span>Registrar pago</span>
                </Button>
              </div>
            )}
          </Link>
        )
      })}
    </div>
  )
}

// ── Historial (liquidadas / canceladas) ─────────────────────────────

type HistorialItem = {
  id: number
  estado: EstadoConsignacion
  fecha_entrega: string
  fecha_liquidacion: string | null
  total_vendido: number
  total_cobrado: number
  clientes: { nombre: string } | null
}

export function ConsignacionesHistorial({
  consignaciones,
}: {
  consignaciones: HistorialItem[]
}) {
  if (consignaciones.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No hay consignaciones cerradas.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {consignaciones.map((c) => {
        const estado = estadoConfig[c.estado]
        return (
          <Link
            key={c.id}
            href={`/consignaciones/${c.id}`}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/50"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {c.clientes?.nombre ?? `Cliente #${c.id}`}
              </p>
              <p className="text-xs text-muted-foreground">
                {c.fecha_liquidacion
                  ? new Date(c.fecha_liquidacion + 'T12:00:00').toLocaleDateString(
                      'es-MX',
                      { day: 'numeric', month: 'short', year: 'numeric' }
                    )
                  : ''}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-sm font-medium">
                {formatPeso(c.total_vendido)}
              </span>
              <Badge className={`text-[11px] ${estado.color}`}>
                {estado.label}
              </Badge>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
