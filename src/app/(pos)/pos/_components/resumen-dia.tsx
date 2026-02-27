'use client'

import type { MetodoPago } from '@/lib/types/database'

type VentaHoy = {
  id: number
  producto_id: number
  cantidad_vendida: number
  total: number
  metodo_pago: MetodoPago | null
  created_at: string
}

function formatPeso(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
}

export function ResumenDia({ ventasHoy }: { ventasHoy: VentaHoy[] }) {
  const totalHoy = ventasHoy.reduce((s, v) => s + v.total, 0)
  const cantidadHoy = ventasHoy.reduce((s, v) => s + v.cantidad_vendida, 0)
  const efectivo = ventasHoy
    .filter((v) => v.metodo_pago === 'EFECTIVO')
    .reduce((s, v) => s + v.total, 0)
  const transferencia = ventasHoy
    .filter((v) => v.metodo_pago === 'TRANSFERENCIA')
    .reduce((s, v) => s + v.total, 0)

  return (
    <div className="mx-4 flex items-center justify-between rounded-lg bg-muted px-4 py-3">
      <div>
        <p className="text-xs text-muted-foreground">Hoy</p>
        <p className="text-xl font-bold">{formatPeso(totalHoy)}</p>
        {(efectivo > 0 || transferencia > 0) && (
          <p className="text-xs text-muted-foreground">
            {efectivo > 0 && `Ef. ${formatPeso(efectivo)}`}
            {efectivo > 0 && transferencia > 0 && ' · '}
            {transferencia > 0 && `Tr. ${formatPeso(transferencia)}`}
          </p>
        )}
      </div>
      <div className="text-right">
        <p className="text-xs text-muted-foreground">{cantidadHoy} uds</p>
        <p className="text-sm font-medium">{ventasHoy.length} ventas</p>
      </div>
    </div>
  )
}
