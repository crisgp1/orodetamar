'use client'

import { useState, useTransition, useEffect } from 'react'
import { ArrowCounterClockwise } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { deshacerVenta } from '@/lib/actions/ventas-stand'
import type { MetodoPago } from '@/lib/types/database'

type VentaHoy = {
  id: number
  producto_id: number
  cantidad_vendida: number
  total: number
  metodo_pago: MetodoPago | null
  created_at: string
  producto_nombre?: string
}

function formatPeso(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
}

function formatHora(ts: string) {
  return new Date(ts).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const FIVE_MINUTES = 5 * 60 * 1000

function isRecent(ts: string) {
  return Date.now() - new Date(ts).getTime() < FIVE_MINUTES
}

export function FeedVentas({
  ventasHoy,
}: {
  ventasHoy: VentaHoy[]
}) {
  // Re-render every 15s to update undo button visibility
  const [, setTick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 15_000)
    return () => clearInterval(interval)
  }, [])

  if (ventasHoy.length === 0) return null

  return (
    <div className="px-4">
      <h2 className="mb-2 text-sm font-medium text-muted-foreground">
        Ventas de hoy
      </h2>
      <div className="space-y-1.5">
        {ventasHoy.map((v) => {
          const canUndo = isRecent(v.created_at)
          return (
            <div
              key={v.id}
              className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {v.producto_nombre ?? `#${v.producto_id}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatHora(v.created_at)} · {v.cantidad_vendida} uds
                  {v.metodo_pago === 'EFECTIVO' && ' · Efectivo'}
                  {v.metodo_pago === 'TRANSFERENCIA' && ' · Transf.'}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <p className="text-sm font-semibold">{formatPeso(v.total)}</p>
                {canUndo && <UndoButton ventaId={v.id} />}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function UndoButton({ ventaId }: { ventaId: number }) {
  const [isPending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)

  function handleUndo() {
    if (!confirming) {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 3000)
      return
    }
    startTransition(async () => {
      const result = await deshacerVenta(ventaId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Venta anulada')
      }
      setConfirming(false)
    })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`h-7 px-2 text-xs ${confirming ? 'text-red-600 hover:text-red-700' : 'text-muted-foreground'}`}
      onClick={handleUndo}
      disabled={isPending}
    >
      <ArrowCounterClockwise size={14} weight="bold" />
      {isPending ? '...' : confirming ? 'Confirmar' : 'Anular'}
    </Button>
  )
}
