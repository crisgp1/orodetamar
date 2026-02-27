'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash } from '@phosphor-icons/react'
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
import { crearConsignacion } from '../actions'
import type { VStockActual } from '@/lib/types/database'

type ClienteOption = { id: number; nombre: string; ciudad: string | null }

type FilaProducto = {
  key: number
  producto_id: string
  cantidad: string
  precio_unitario: string
}

let keyCounter = 0

function formatPeso(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
}

export function CrearConsignacionDialog({
  clientes,
  productos,
}: {
  clientes: ClienteOption[]
  productos: VStockActual[]
}) {
  const [open, setOpen] = useState(false)

  const sinClientes = clientes.length === 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={sinClientes}>
          <Plus size={16} weight="bold" />
          Nueva
        </Button>
      </DialogTrigger>
      <DialogContent fullScreenMobile className="flex flex-col overflow-hidden sm:max-h-[85dvh]">
        <DialogHeader>
          <DialogTitle>Nueva consignación</DialogTitle>
          <DialogDescription>
            Registra los productos que dejas en un punto de venta.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <CrearConsignacionFormContent
            clientes={clientes}
            productos={productos}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

function CrearConsignacionFormContent({
  clientes,
  productos,
}: {
  clientes: ClienteOption[]
  productos: VStockActual[]
}) {
  const [clienteId, setClienteId] = useState('')
  const [fecha, setFecha] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [notas, setNotas] = useState('')
  const [filas, setFilas] = useState<FilaProducto[]>([
    { key: ++keyCounter, producto_id: '', cantidad: '', precio_unitario: '' },
  ])
  const [isPending, startTransition] = useTransition()

  function productosUsados(excludeKey: number) {
    return new Set(
      filas
        .filter((f) => f.key !== excludeKey && f.producto_id)
        .map((f) => f.producto_id)
    )
  }

  function updateFila(key: number, field: keyof FilaProducto, value: string) {
    setFilas((prev) =>
      prev.map((f) => {
        if (f.key !== key) return f
        const updated = { ...f, [field]: value }

        if (field === 'producto_id') {
          const prod = productos.find((p) => String(p.producto_id) === value)
          if (prod) {
            updated.precio_unitario = String(prod.precio_venta)
          }
        }
        return updated
      })
    )
  }

  function addFila() {
    setFilas((prev) => [
      ...prev,
      {
        key: ++keyCounter,
        producto_id: '',
        cantidad: '',
        precio_unitario: '',
      },
    ])
  }

  function removeFila(key: number) {
    setFilas((prev) => (prev.length > 1 ? prev.filter((f) => f.key !== key) : prev))
  }

  const total = filas.reduce((sum, f) => {
    const cant = Number(f.cantidad) || 0
    const precio = Number(f.precio_unitario) || 0
    return sum + cant * precio
  }, 0)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const cid = Number(clienteId)
    if (!cid) {
      toast.error('Selecciona un cliente')
      return
    }
    if (!fecha) {
      toast.error('Selecciona fecha de entrega')
      return
    }

    const productosData = filas
      .filter((f) => f.producto_id && Number(f.cantidad) > 0)
      .map((f) => {
        const prod = productos.find(
          (p) => String(p.producto_id) === f.producto_id
        )
        const cant = Number(f.cantidad)

        if (prod && cant > prod.cantidad_disponible) {
          toast.error(
            `${prod.producto_nombre}: stock insuficiente (disponible: ${prod.cantidad_disponible})`
          )
          return null
        }

        return {
          producto_id: Number(f.producto_id),
          cantidad: cant,
          precio_unitario: Number(f.precio_unitario),
        }
      })

    if (productosData.some((p) => p === null)) return
    if (productosData.length === 0) {
      toast.error('Agrega al menos un producto')
      return
    }

    startTransition(async () => {
      const result = await crearConsignacion({
        cliente_id: cid,
        fecha_entrega: fecha,
        notas: notas.trim() || undefined,
        productos: productosData as Array<{
          producto_id: number
          cantidad: number
          precio_unitario: number
        }>,
      })

      if (result?.error) {
        toast.error(result.error)
      }
      // redirect happens in the action on success
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Cliente + fecha */}
      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset className="space-y-2">
          <Label>Cliente</Label>
          <Select value={clienteId} onValueChange={setClienteId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona cliente" />
            </SelectTrigger>
            <SelectContent>
              {clientes.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.nombre}
                  {c.ciudad ? ` — ${c.ciudad}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </fieldset>

        <fieldset className="space-y-2">
          <Label>Fecha de entrega</Label>
          <Input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </fieldset>
      </div>

      <fieldset className="space-y-2">
        <Label>Notas (opcional)</Label>
        <Textarea
          placeholder="Ej: Dejar en mostrador de entrada"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={2}
        />
      </fieldset>

      <Separator />

      {/* Product rows */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <Label className="text-base">Productos</Label>
          <Button type="button" variant="outline" size="sm" onClick={addFila}>
            <Plus size={16} weight="bold" />
            Agregar
          </Button>
        </div>

        <div className="space-y-3">
          {filas.map((fila) => {
            const usados = productosUsados(fila.key)
            const disponibles = productos.filter(
              (p) => !usados.has(String(p.producto_id))
            )
            const prodSelec = productos.find(
              (p) => String(p.producto_id) === fila.producto_id
            )
            const subtotal =
              (Number(fila.cantidad) || 0) *
              (Number(fila.precio_unitario) || 0)

            return (
              <div
                key={fila.key}
                className="rounded-lg border border-border bg-card p-3"
              >
                <fieldset className="mb-3 space-y-1">
                  <Label className="text-xs">Producto</Label>
                  <Select
                    value={fila.producto_id}
                    onValueChange={(v) =>
                      updateFila(fila.key, 'producto_id', v)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {disponibles.map((p) => (
                        <SelectItem
                          key={p.producto_id}
                          value={String(p.producto_id)}
                        >
                          {p.producto_nombre} — {p.presentacion} (
                          {p.cantidad_disponible} uds)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </fieldset>

                <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                  <fieldset className="space-y-1">
                    <Label className="text-xs">Cantidad</Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={prodSelec?.cantidad_disponible}
                      placeholder="0"
                      value={fila.cantidad}
                      onChange={(e) =>
                        updateFila(fila.key, 'cantidad', e.target.value)
                      }
                    />
                  </fieldset>

                  <fieldset className="space-y-1">
                    <Label className="text-xs">Precio</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      value={fila.precio_unitario}
                      onChange={(e) =>
                        updateFila(fila.key, 'precio_unitario', e.target.value)
                      }
                    />
                  </fieldset>

                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFila(fila.key)}
                      disabled={filas.length === 1}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash size={16} />
                    </Button>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {prodSelec
                      ? `Stock: ${prodSelec.cantidad_disponible}`
                      : ''}
                  </span>
                  <span className="font-medium">
                    {subtotal > 0 ? formatPeso(subtotal) : ''}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Separator />

      {/* Total + submit */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Total consignación</p>
          <p className="text-xl font-semibold">{formatPeso(total)}</p>
        </div>
        <Button type="submit" disabled={isPending} size="lg">
          {isPending ? 'Creando...' : 'Crear consignación'}
        </Button>
      </div>
    </form>
  )
}
