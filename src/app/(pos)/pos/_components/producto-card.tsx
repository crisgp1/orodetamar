'use client'

import { useState, useTransition } from 'react'
import { Plus, Minus, Check, Money, DeviceMobile } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { registrarVentaStand } from '@/lib/actions/ventas-stand'

type ProductoOption = {
  id: number
  nombre: string
  presentacion: string
  precio_venta: number
}

function formatPeso(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
}

const METODO_ICON = { EFECTIVO: Money, TRANSFERENCIA: DeviceMobile } as const
const METODO_LABEL = { EFECTIVO: 'Efectivo', TRANSFERENCIA: 'Transferencia' } as const

export function ProductoCard({
  producto,
  ubicacionId,
  metodoPago,
  stock,
  disabled,
}: {
  producto: ProductoOption
  ubicacionId: number | null
  metodoPago: 'EFECTIVO' | 'TRANSFERENCIA'
  stock: number
  disabled: boolean
}) {
  const [cantidad, setCantidad] = useState(1)
  const [isPending, startTransition] = useTransition()
  const [soldMetodo, setSoldMetodo] = useState<'EFECTIVO' | 'TRANSFERENCIA' | null>(null)

  const total = cantidad * producto.precio_venta
  const justSold = soldMetodo !== null

  function vender() {
    if (!ubicacionId) return
    const metodoUsado = metodoPago
    startTransition(async () => {
      const result = await registrarVentaStand({
        ubicacion_id: ubicacionId,
        producto_id: producto.id,
        cantidad_vendida: cantidad,
        total,
        metodo_pago: metodoUsado,
        notas: null,
      })
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(
        `${producto.nombre} ×${cantidad} · ${formatPeso(total)} · ${METODO_LABEL[metodoUsado]}`
      )
      setSoldMetodo(metodoUsado)
      setCantidad(1)
      setTimeout(() => setSoldMetodo(null), 2000)
    })
  }

  const isEfectivo = metodoPago === 'EFECTIVO'

  return (
    <div
      className={cn(
        'relative flex flex-col items-center rounded-lg border-2 p-3 transition-all',
        justSold
          ? soldMetodo === 'EFECTIVO'
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950'
            : 'border-blue-500 bg-blue-50 dark:bg-blue-950'
          : disabled
            ? 'border-border bg-muted opacity-50'
            : 'border-border bg-card'
      )}
    >
      <p className="text-center text-sm font-semibold leading-tight">
        {producto.nombre}
      </p>
      <p className="text-xs text-muted-foreground">{producto.presentacion}</p>
      <p className="mt-1 text-base font-bold">{formatPeso(producto.precio_venta)}</p>

      {/* Stock: solo texto neutro cuando hay stock positivo */}
      {stock > 0 && (
        <p className="mt-1 text-xs text-muted-foreground">Quedan: {stock}</p>
      )}

      {/* +/- cantidad */}
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setCantidad((c) => Math.max(1, c - 1))}
          disabled={disabled}
          className="flex min-h-10 min-w-10 items-center justify-center rounded-md border border-border bg-background text-foreground active:bg-muted disabled:opacity-50"
        >
          <Minus size={14} weight="bold" />
        </button>
        <span className="w-6 text-center text-sm font-bold">{cantidad}</span>
        <button
          type="button"
          onClick={() => setCantidad((c) => c + 1)}
          disabled={disabled}
          className="flex min-h-10 min-w-10 items-center justify-center rounded-md border border-border bg-background text-foreground active:bg-muted disabled:opacity-50"
        >
          <Plus size={14} weight="bold" />
        </button>
      </div>

      {/* Botón Vender con icono de método */}
      <Button
        size="sm"
        className={cn(
          'mt-2 h-10 w-full',
          !disabled && !isPending && !justSold && isEfectivo && 'bg-emerald-600 hover:bg-emerald-700',
          !disabled && !isPending && !justSold && !isEfectivo && 'bg-blue-600 hover:bg-blue-700'
        )}
        onClick={vender}
        disabled={isPending || disabled}
      >
        {isPending ? (
          '...'
        ) : justSold ? (
          <span className="flex items-center gap-1">
            <Check size={16} weight="bold" />
            {METODO_LABEL[soldMetodo!]}
          </span>
        ) : (() => {
          const Icon = METODO_ICON[metodoPago]
          return (
            <span className="flex items-center gap-1">
              {cantidad > 1
                ? `Vender ${cantidad} · ${formatPeso(total)}`
                : 'Vender'}
              <Icon size={16} weight="bold" />
            </span>
          )
        })()}
      </Button>
    </div>
  )
}

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
