'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PencilSimple, Plus, Minus, X } from '@phosphor-icons/react'
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
import { editarPedido } from '../actions'
import type { TipoCliente } from '@/lib/types/database'

type PedidoParaEditar = {
  id: number
  cliente_id: number
  fecha_entrega_min: string | null
  descuento_porcentaje: number | null
  notas: string | null
  clientes: { nombre: string } | null
  pedido_detalle: Array<{
    producto_id: number
    cantidad: number
    precio_unitario: number
    productos: { nombre: string; presentacion: string; peso_gramos: number } | null
  }>
}

type ProductoOption = {
  id: number
  nombre: string
  presentacion: string
  peso_gramos: number
  precio_venta: number
  precio_mayoreo: number | null
}

type LineaEditable = {
  key: number
  producto_id: number
  nombre: string
  cantidad: number
  precio: number
}

const TIPOS_MAYOREO: TipoCliente[] = ['MAYORISTA', 'RESTAURANTE', 'ABARROTES', 'MERCADO']

function formatMoney(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
}

export function EditarPedidoDialog({
  pedido,
  productos,
  clienteTipo,
}: {
  pedido: PedidoParaEditar
  productos: ProductoOption[]
  clienteTipo?: TipoCliente | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [fechaEntrega, setFechaEntrega] = useState(pedido.fecha_entrega_min ?? '')
  const [descuento, setDescuento] = useState(pedido.descuento_porcentaje ?? 0)
  const [notas, setNotas] = useState(pedido.notas ?? '')
  const [lineas, setLineas] = useState<LineaEditable[]>(() =>
    pedido.pedido_detalle.map((d, i) => ({
      key: i,
      producto_id: d.producto_id,
      nombre: d.productos?.nombre ?? `Producto #${d.producto_id}`,
      cantidad: d.cantidad,
      precio: d.precio_unitario,
    }))
  )
  const [agregando, setAgregando] = useState(false)
  const [isPending, startTransition] = useTransition()

  const esMayoreo = clienteTipo ? TIPOS_MAYOREO.includes(clienteTipo) : false

  function resetToOriginal() {
    setFechaEntrega(pedido.fecha_entrega_min ?? '')
    setDescuento(pedido.descuento_porcentaje ?? 0)
    setNotas(pedido.notas ?? '')
    setLineas(
      pedido.pedido_detalle.map((d, i) => ({
        key: i,
        producto_id: d.producto_id,
        nombre: d.productos?.nombre ?? `Producto #${d.producto_id}`,
        cantidad: d.cantidad,
        precio: d.precio_unitario,
      }))
    )
    setAgregando(false)
  }

  function handleOpenChange(v: boolean) {
    setOpen(v)
    if (v) resetToOriginal()
  }

  function handleSelectProducto(productoIdStr: string) {
    const prod = productos.find((p) => p.id === Number(productoIdStr))
    if (!prod) return
    if (lineas.some((l) => l.producto_id === prod.id)) {
      toast.error('Producto ya agregado')
      return
    }
    const precio = esMayoreo && prod.precio_mayoreo ? prod.precio_mayoreo : prod.precio_venta
    setLineas((prev) => [
      ...prev,
      {
        key: Date.now(),
        producto_id: prod.id,
        nombre: prod.nombre,
        cantidad: 1,
        precio,
      },
    ])
    setAgregando(false)
  }

  function updateCantidad(key: number, delta: number) {
    setLineas((prev) =>
      prev.map((l) =>
        l.key === key ? { ...l, cantidad: Math.max(1, l.cantidad + delta) } : l
      )
    )
  }

  function setCantidadDirecta(key: number, val: number) {
    setLineas((prev) =>
      prev.map((l) => (l.key === key ? { ...l, cantidad: Math.max(1, val) } : l))
    )
  }

  function setPrecioDirecto(key: number, val: number) {
    setLineas((prev) =>
      prev.map((l) => (l.key === key ? { ...l, precio: Math.max(0, val) } : l))
    )
  }

  function removeLinea(key: number) {
    setLineas((prev) => prev.filter((l) => l.key !== key))
  }

  const subtotal = lineas.reduce((s, l) => s + l.cantidad * l.precio, 0)
  const montoDescuento = subtotal * (descuento / 100)
  const total = subtotal - montoDescuento

  const productosDisponibles = productos.filter(
    (p) => !lineas.some((l) => l.producto_id === p.id)
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (lineas.length === 0) {
      toast.error('Agrega al menos un producto')
      return
    }

    startTransition(async () => {
      const result = await editarPedido({
        pedido_id: pedido.id,
        cliente_id: pedido.cliente_id,
        fecha_entrega_min: fechaEntrega || null,
        descuento_porcentaje: descuento,
        canal_venta: null,
        notas: notas.trim() || null,
        lineas: lineas.map((l) => ({
          producto_id: l.producto_id,
          cantidad: l.cantidad,
          precio_unitario: l.precio,
        })),
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Pedido actualizado')
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-10 gap-1.5">
          <PencilSimple size={16} weight="bold" />
          Editar pedido
        </Button>
      </DialogTrigger>
      <DialogContent fullScreenMobile className="flex flex-col overflow-hidden sm:max-h-[85dvh] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar pedido #{String(pedido.id).padStart(3, '0')}</DialogTitle>
          <DialogDescription>
            Cliente: {pedido.clientes?.nombre ?? 'Sin cliente'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto">
          {/* Fecha + descuento */}
          <div className="grid grid-cols-2 gap-3">
            <fieldset className="space-y-2">
              <Label>Fecha entrega</Label>
              <Input
                type="date"
                value={fechaEntrega}
                onChange={(e) => setFechaEntrega(e.target.value)}
              />
            </fieldset>
            <fieldset className="space-y-2">
              <Label>Descuento (%)</Label>
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                step="0.5"
                value={descuento || ''}
                onChange={(e) => setDescuento(Number(e.target.value) || 0)}
                placeholder="0"
              />
            </fieldset>
          </div>

          {/* Notas */}
          <fieldset className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              placeholder="Notas del pedido..."
            />
          </fieldset>

          <Separator />

          {/* Líneas de productos */}
          <div className="space-y-2">
            <Label>Productos *</Label>

            {lineas.map((linea) => (
              <LineaEditar
                key={linea.key}
                linea={linea}
                onCantidadChange={(delta) => updateCantidad(linea.key, delta)}
                onCantidadDirecta={(val) => setCantidadDirecta(linea.key, val)}
                onPrecioChange={(val) => setPrecioDirecto(linea.key, val)}
                onRemove={() => removeLinea(linea.key)}
              />
            ))}

            {agregando && productosDisponibles.length > 0 ? (
              <div className="rounded-lg border border-dashed border-border p-3">
                <Select onValueChange={handleSelectProducto}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {productosDisponibles.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.nombre} — {formatMoney(p.precio_venta)}
                        {p.precio_mayoreo ? ` / ${formatMoney(p.precio_mayoreo)} may.` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : productosDisponibles.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                className="h-10 w-full"
                onClick={() => setAgregando(true)}
              >
                <Plus size={16} weight="bold" />
                Agregar producto
              </Button>
            ) : null}
          </div>

          {/* Totales */}
          {lineas.length > 0 && (
            <div className="space-y-1 rounded-lg border border-border bg-muted/50 p-3">
              {descuento > 0 && (
                <>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatMoney(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Descuento ({descuento}%)</span>
                    <span>-{formatMoney(montoDescuento)}</span>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total</span>
                <span className="text-lg font-bold">{formatMoney(total)}</span>
              </div>
            </div>
          )}

          <Button type="submit" className="h-10 w-full" disabled={isPending || lineas.length === 0}>
            {isPending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ────────────────────────────────────────────────────────────────

function LineaEditar({
  linea,
  onCantidadChange,
  onCantidadDirecta,
  onPrecioChange,
  onRemove,
}: {
  linea: LineaEditable
  onCantidadChange: (delta: number) => void
  onCantidadDirecta: (val: number) => void
  onPrecioChange: (val: number) => void
  onRemove: () => void
}) {
  const [editandoPrecio, setEditandoPrecio] = useState(false)
  const [editandoCantidad, setEditandoCantidad] = useState(false)
  const subtotal = linea.cantidad * linea.precio

  return (
    <div className="space-y-1.5 rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium">{linea.nombre}</span>
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 rounded p-1 text-muted-foreground hover:text-red-600"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-md border border-border">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-foreground"
            onClick={() => onCantidadChange(-1)}
          >
            <Minus size={16} />
          </button>
          {editandoCantidad ? (
            <input
              type="number"
              inputMode="numeric"
              min={1}
              className="h-10 w-10 border-x border-border bg-transparent text-center text-sm font-medium focus:outline-none"
              value={linea.cantidad}
              onChange={(e) => onCantidadDirecta(Number(e.target.value) || 1)}
              onBlur={() => setEditandoCantidad(false)}
              autoFocus
            />
          ) : (
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center border-x border-border text-sm font-medium"
              onClick={() => setEditandoCantidad(true)}
            >
              {linea.cantidad}
            </button>
          )}
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-foreground"
            onClick={() => onCantidadChange(1)}
          >
            <Plus size={16} />
          </button>
        </div>

        <span className="text-sm text-muted-foreground">&times;</span>

        {editandoPrecio ? (
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            className="h-8 w-24 text-right"
            value={linea.precio}
            onChange={(e) => onPrecioChange(Number(e.target.value) || 0)}
            onBlur={() => setEditandoPrecio(false)}
            autoFocus
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditandoPrecio(true)}
            className="text-sm font-medium hover:underline"
          >
            {formatMoney(linea.precio)}
          </button>
        )}

        <span className="ml-auto text-sm font-semibold">
          = {formatMoney(subtotal)}
        </span>
      </div>
    </div>
  )
}
