'use client'

import { MapPin } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

type UbicacionOption = { id: number; nombre: string }

export function BannerConfig({
  ubicaciones,
  ubicacionId,
  metodoPago,
  onUbicacionChange,
  onMetodoPagoChange,
}: {
  ubicaciones: UbicacionOption[]
  ubicacionId: number | null
  metodoPago: 'EFECTIVO' | 'TRANSFERENCIA'
  onUbicacionChange: (id: number | null) => void
  onMetodoPagoChange: (m: 'EFECTIVO' | 'TRANSFERENCIA') => void
}) {
  const isEfectivo = metodoPago === 'EFECTIVO'

  return (
    <div
      className={cn(
        'sticky top-0 z-30 border-b-2 px-4 py-3 transition-colors',
        isEfectivo
          ? 'border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/30'
          : 'border-blue-500/50 bg-blue-50 dark:bg-blue-950/30'
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        {/* Ubicación */}
        <div className="flex items-center gap-2">
          <MapPin size={18} weight="bold" className="shrink-0 text-muted-foreground" />
          <select
            value={ubicacionId ?? ''}
            onChange={(e) => {
              const val = e.target.value
              onUbicacionChange(val ? Number(val) : null)
            }}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Seleccionar ubicación...</option>
            {ubicaciones.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Toggle segmentado método de pago */}
        <div className="flex rounded-lg border border-border bg-background/50 p-0.5">
          <button
            type="button"
            onClick={() => onMetodoPagoChange('EFECTIVO')}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              isEfectivo
                ? 'bg-emerald-600 text-white'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Efectivo
          </button>
          <button
            type="button"
            onClick={() => onMetodoPagoChange('TRANSFERENCIA')}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              !isEfectivo
                ? 'bg-blue-600 text-white'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Transferencia
          </button>
        </div>
      </div>
    </div>
  )
}
