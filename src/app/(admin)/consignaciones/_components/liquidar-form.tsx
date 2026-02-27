'use client'

import { useState, useTransition } from 'react'
import { ClipboardText } from '@phosphor-icons/react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { liquidarConsignacion } from '../actions'
import type { ConsignacionDetalle, DestinoRetorno } from '@/lib/types/database'

type DetalleConProducto = ConsignacionDetalle & {
  productos: { nombre: string; sku: string | null; presentacion: string } | null
}

type FilaLiquidacion = {
  detalle_id: number
  producto_id: number
  nombre: string
  cantidad_dejada: number
  precio_unitario: number
  cantidad_vendida: string
  cantidad_retornada: string
  destino_retorno: DestinoRetorno | ''
  notas_faltante: string
}

function formatPeso(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
}

export function LiquidarDialog({
  consignacionId,
  detalle,
}: {
  consignacionId: number
  detalle: DetalleConProducto[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex-1" size="lg">
          <ClipboardText size={18} weight="bold" />
          Liquidar consignación
        </Button>
      </DialogTrigger>
      <DialogContent fullScreenMobile className="flex flex-col overflow-hidden sm:max-h-[85dvh]">
        <DialogHeader>
          <DialogTitle>Liquidar consignación</DialogTitle>
          <DialogDescription>
            Registra las unidades vendidas y retornadas de cada producto.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <LiquidarFormContent
            consignacionId={consignacionId}
            detalle={detalle}
            onClose={() => setOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

function LiquidarFormContent({
  consignacionId,
  detalle,
  onClose,
}: {
  consignacionId: number
  detalle: DetalleConProducto[]
  onClose: () => void
}) {
  const [filas, setFilas] = useState<FilaLiquidacion[]>(
    detalle.map((d) => ({
      detalle_id: d.id,
      producto_id: d.producto_id,
      nombre: d.productos?.nombre ?? `Producto #${d.producto_id}`,
      cantidad_dejada: d.cantidad_dejada,
      precio_unitario: d.precio_unitario,
      cantidad_vendida: '',
      cantidad_retornada: '',
      destino_retorno: '',
      notas_faltante: '',
    }))
  )
  const [cobroInmediato, setCobroInmediato] = useState(false)
  const [montoCobro, setMontoCobro] = useState('')
  const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'TRANSFERENCIA'>(
    'EFECTIVO'
  )
  const [isPending, startTransition] = useTransition()

  function updateFila(
    idx: number,
    field: 'cantidad_vendida' | 'cantidad_retornada' | 'destino_retorno' | 'notas_faltante',
    value: string
  ) {
    setFilas((prev) =>
      prev.map((f, i) => {
        if (i !== idx) return f

        if (field === 'cantidad_vendida' || field === 'cantidad_retornada') {
          const raw = value === '' ? '' : Math.max(0, Math.floor(Number(value) || 0))
          if (raw === '') return { ...f, [field]: '' }

          const otherField = field === 'cantidad_vendida' ? 'cantidad_retornada' : 'cantidad_vendida'
          const otherVal = Number(f[otherField]) || 0
          const clamped = Math.min(Number(raw), f.cantidad_dejada - otherVal)
          return { ...f, [field]: String(Math.max(0, clamped)) }
        }

        return { ...f, [field]: value }
      })
    )
  }

  // Computed totals
  const totalVendido = filas.reduce((sum, f) => {
    return sum + (Number(f.cantidad_vendida) || 0) * f.precio_unitario
  }, 0)

  const sinContar = filas.some((f) => {
    const v = Number(f.cantidad_vendida) || 0
    const r = Number(f.cantidad_retornada) || 0
    return v + r < f.cantidad_dejada
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    for (const f of filas) {
      const v = Number(f.cantidad_vendida) || 0
      const r = Number(f.cantidad_retornada) || 0

      if (r > 0 && !f.destino_retorno) {
        toast.error(`Selecciona destino de retorno para ${f.nombre}`)
        return
      }

      if (v + r < f.cantidad_dejada && !f.notas_faltante.trim()) {
        toast.error(`Justifica el faltante de ${f.nombre}`)
        return
      }
    }

    const productosData = filas.map((f) => {
      const v = Number(f.cantidad_vendida) || 0
      const r = Number(f.cantidad_retornada) || 0
      const hayFaltante = v + r < f.cantidad_dejada

      return {
        detalle_id: f.detalle_id,
        producto_id: f.producto_id,
        cantidad_vendida: v,
        cantidad_retornada: r,
        destino_retorno: f.destino_retorno
          ? (f.destino_retorno as DestinoRetorno)
          : null,
        precio_unitario: f.precio_unitario,
        notas_faltante: hayFaltante ? f.notas_faltante.trim() : null,
      }
    })

    startTransition(async () => {
      const result = await liquidarConsignacion({
        consignacion_id: consignacionId,
        productos: productosData,
        cobro_inmediato: cobroInmediato,
        monto_cobro: cobroInmediato ? Number(montoCobro) || undefined : undefined,
        metodo_pago: cobroInmediato ? metodoPago : undefined,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success(
        result.estado === 'LIQUIDADA'
          ? 'Consignación liquidada'
          : 'Revisión registrada, saldo pendiente de cobro'
      )
      onClose()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Product rows */}
      {filas.map((fila, idx) => {
        const vendida = Number(fila.cantidad_vendida) || 0
        const retornada = Number(fila.cantidad_retornada) || 0
        const restante = fila.cantidad_dejada - vendida - retornada
        const maxVendida = fila.cantidad_dejada - retornada
        const maxRetornada = fila.cantidad_dejada - vendida
        const subtotalVendido = vendida * fila.precio_unitario

        return (
          <div
            key={fila.detalle_id}
            className="rounded-lg border border-border bg-card p-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">{fila.nombre}</p>
              <span className="text-xs text-muted-foreground">
                Dejadas: {fila.cantidad_dejada}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <fieldset className="space-y-1">
                <Label className="text-xs">Vendidas (max {maxVendida})</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={maxVendida}
                  placeholder="0"
                  value={fila.cantidad_vendida}
                  onChange={(e) =>
                    updateFila(idx, 'cantidad_vendida', e.target.value)
                  }
                />
              </fieldset>

              <fieldset className="space-y-1">
                <Label className="text-xs">Retornadas (max {maxRetornada})</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={maxRetornada}
                  placeholder="0"
                  value={fila.cantidad_retornada}
                  onChange={(e) =>
                    updateFila(idx, 'cantidad_retornada', e.target.value)
                  }
                />
              </fieldset>
            </div>

            {/* Destino retorno (only if retornada > 0) */}
            {retornada > 0 && (
              <fieldset className="mt-2 space-y-1">
                <Label className="text-xs">Destino retorno</Label>
                <Select
                  value={fila.destino_retorno}
                  onValueChange={(v) =>
                    updateFila(idx, 'destino_retorno', v)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona destino" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INVENTARIO">
                      Inventario (producto en buen estado)
                    </SelectItem>
                    <SelectItem value="REPROCESAMIENTO_PULPA">
                      Reprocesamiento a pulpa
                    </SelectItem>
                  </SelectContent>
                </Select>
              </fieldset>
            )}

            {/* Summary row */}
            <div className="mt-2 flex items-center justify-between text-xs">
              {restante > 0 ? (
                <span className="text-yellow-600">
                  Faltante: {restante}
                </span>
              ) : (
                <span className="text-green-600">Completo</span>
              )}
              {subtotalVendido > 0 && (
                <span className="font-medium">
                  {formatPeso(subtotalVendido)}
                </span>
              )}
            </div>

            {/* Justificacion faltante (obligatoria cuando restante > 0) */}
            {restante > 0 && (
              <fieldset className="mt-2 space-y-1">
                <Label className="text-xs">Justificación faltante *</Label>
                <Textarea
                  placeholder="Ej: Se rompieron 2 en transporte, cliente dice que nunca las recibió"
                  value={fila.notas_faltante}
                  onChange={(e) =>
                    updateFila(idx, 'notas_faltante', e.target.value)
                  }
                  rows={2}
                />
              </fieldset>
            )}
          </div>
        )
      })}

      <Separator />

      {/* Total vendido */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Total vendido</p>
        <p className="text-xl font-semibold">{formatPeso(totalVendido)}</p>
      </div>

      {sinContar && (
        <p className="text-xs text-yellow-600">
          Hay productos con faltante. Justifica cada uno para continuar.
        </p>
      )}

      <Separator />

      {/* Cobro inmediato */}
      <fieldset className="space-y-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={cobroInmediato}
            onChange={(e) => {
              setCobroInmediato(e.target.checked)
              if (e.target.checked) {
                setMontoCobro(String(totalVendido))
              }
            }}
            className="h-4 w-4 rounded border-input"
          />
          Cobrar ahora
        </label>

        {cobroInmediato && (
          <div className="grid grid-cols-2 gap-2">
            <fieldset className="space-y-1">
              <Label className="text-xs">Monto</Label>
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={montoCobro}
                onChange={(e) => setMontoCobro(e.target.value)}
              />
              {Number(montoCobro) >= totalVendido && totalVendido > 0 && (
                <p className="text-xs text-green-600">
                  Cierra la consignacion
                </p>
              )}
            </fieldset>

            <fieldset className="space-y-1">
              <Label className="text-xs">Método</Label>
              <Select
                value={metodoPago}
                onValueChange={(v) =>
                  setMetodoPago(v as 'EFECTIVO' | 'TRANSFERENCIA')
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                  <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </fieldset>
          </div>
        )}
      </fieldset>

      <Button
        type="submit"
        className="w-full"
        disabled={isPending}
        size="lg"
      >
        {isPending ? 'Procesando...' : 'Liquidar consignación'}
      </Button>
    </form>
  )
}
