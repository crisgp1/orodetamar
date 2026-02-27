'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ClipboardText, Plus, MapPin } from '@phosphor-icons/react'
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
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { registrarCierreStandPOS } from '@/lib/actions/ventas-stand'
import type { VentaResumenProducto } from '../page'

type ProductoOption = {
  id: number
  nombre: string
  presentacion: string
  precio_venta: number
}

type FilaCierre = {
  producto_id: number
  nombre: string
  presentacion: string
  cantidad_vendida_pos: number
  cantidad_vendida_total: number
  cantidad_llevada: number
}

function formatFechaLarga(fecha: string) {
  return new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function CierreDialog({
  ubicacionId,
  ubicacionNombre,
  productos,
  ventasPorProducto,
  disabled,
}: {
  ubicacionId: number | null
  ubicacionNombre: string
  productos: ProductoOption[]
  ventasPorProducto: Record<number, VentaResumenProducto>
  disabled: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [fecha, setFecha] = useState(() =>
    new Date().toLocaleDateString('en-CA', { timeZone: 'America/Tijuana' })
  )
  const [notas, setNotas] = useState('')
  const [isPending, startTransition] = useTransition()

  // Pre-fill rows from today's sales
  const [filas, setFilas] = useState<FilaCierre[]>(() =>
    Object.values(ventasPorProducto).map((v) => ({
      producto_id: v.producto_id,
      nombre: v.nombre,
      presentacion: v.presentacion,
      cantidad_vendida_pos: v.cantidad_vendida,
      cantidad_vendida_total: v.cantidad_vendida,
      cantidad_llevada: 0,
    }))
  )

  // Products available to add (not already in filas)
  const productosDisponibles = productos.filter(
    (p) => !filas.some((f) => f.producto_id === p.id)
  )

  function agregarProducto(productoId: string) {
    const prod = productos.find((p) => p.id === Number(productoId))
    if (!prod) return
    setFilas((prev) => [
      ...prev,
      {
        producto_id: prod.id,
        nombre: prod.nombre,
        presentacion: prod.presentacion,
        cantidad_vendida_pos: 0,
        cantidad_vendida_total: 0,
        cantidad_llevada: 0,
      },
    ])
  }

  function updateVendidaTotal(idx: number, value: number) {
    setFilas((prev) => {
      const next = [...prev]
      next[idx] = {
        ...next[idx],
        cantidad_vendida_total: Math.max(next[idx].cantidad_vendida_pos, value),
      }
      return next
    })
  }

  function updateLlevada(idx: number, value: number) {
    setFilas((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], cantidad_llevada: Math.max(0, value) }
      return next
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!ubicacionId) return

    startTransition(async () => {
      const result = await registrarCierreStandPOS({
        ubicacion_id: ubicacionId,
        fecha,
        productos: filas.map((f) => ({
          producto_id: f.producto_id,
          cantidad_llevada: f.cantidad_llevada,
          cantidad_vendida_pos: f.cantidad_vendida_pos,
          cantidad_vendida_total: f.cantidad_vendida_total,
        })),
        notas: notas.trim() || null,
      })
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('Cierre registrado')
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={disabled}>
          <ClipboardText size={16} weight="bold" />
          Cierre del día
        </Button>
      </DialogTrigger>
      <DialogContent fullScreenMobile>
        <DialogHeader>
          <DialogTitle>Cierre del día</DialogTitle>
          <DialogDescription>
            Control de inventario y ventas del día.
          </DialogDescription>
        </DialogHeader>

        {/* Info heredada */}
        <div className="flex items-center gap-4 rounded-lg bg-muted px-3 py-2 text-sm">
          <span className="flex items-center gap-1.5 font-medium">
            <MapPin size={14} weight="bold" />
            {ubicacionNombre}
          </span>
          <span className="text-muted-foreground">
            {formatFechaLarga(fecha)}
          </span>
          <Input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="ml-auto h-7 w-auto text-xs"
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Filas de productos */}
          <div className="max-h-[50vh] space-y-3 overflow-y-auto sm:max-h-[40vh]">
            {filas.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No hay ventas registradas hoy. Agrega productos que llevaste al
                stand.
              </p>
            )}

            {filas.map((fila, idx) => {
              const retorno = Math.max(
                0,
                fila.cantidad_llevada - fila.cantidad_vendida_total
              )
              const sinRegistrar =
                fila.cantidad_vendida_total - fila.cantidad_vendida_pos
              const vendioMasQueLlevo =
                fila.cantidad_llevada > 0 &&
                fila.cantidad_vendida_total > fila.cantidad_llevada

              return (
                <div
                  key={fila.producto_id}
                  className="rounded-lg border border-border p-3"
                >
                  <p className="text-sm font-medium">
                    {fila.nombre}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      {fila.presentacion}
                    </span>
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Vendidas por POS:{' '}
                    <span className="font-semibold text-foreground">
                      {fila.cantidad_vendida_pos}
                    </span>
                  </p>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Total vendidas hoy</Label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={fila.cantidad_vendida_pos}
                        value={fila.cantidad_vendida_total || ''}
                        onChange={(e) =>
                          updateVendidaTotal(idx, Number(e.target.value) || 0)
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Llevé al stand</Label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={fila.cantidad_llevada || ''}
                        onChange={(e) =>
                          updateLlevada(idx, Number(e.target.value) || 0)
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="mt-1.5 flex gap-3 text-xs text-muted-foreground">
                    {fila.cantidad_llevada > 0 && (
                      <span>Retorno: {retorno}</span>
                    )}
                    {sinRegistrar > 0 && (
                      <span className="text-amber-600">
                        Se registrarán {sinRegistrar} ventas adicionales
                      </span>
                    )}
                  </div>

                  {vendioMasQueLlevo && (
                    <p className="mt-1 text-xs text-amber-600">
                      Vendiste más de lo que llevaste. ¿Registraste la
                      producción?
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {/* Agregar producto */}
          {productosDisponibles.length > 0 && (
            <div>
              <Label className="mb-1 text-xs text-muted-foreground">
                Agregar producto no vendido por POS
              </Label>
              <Select onValueChange={agregarProducto}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Agregar producto..." />
                </SelectTrigger>
                <SelectContent>
                  {productosDisponibles.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.nombre} — {p.presentacion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Separator />

          {/* Notas */}
          <div>
            <Label className="text-xs">Notas del cierre (opcional)</Label>
            <Textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Observaciones..."
              rows={2}
              className="mt-1 resize-none"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Si vendiste más de lo registrado en POS, ajusta el total. Las ventas
            adicionales se registrarán automáticamente.
          </p>

          <Button
            type="submit"
            className="h-12 w-full text-base"
            disabled={isPending || filas.length === 0}
          >
            {isPending ? 'Registrando...' : 'Registrar cierre'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
