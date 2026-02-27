'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Minus, X, Eye, Check, WarningCircle } from '@phosphor-icons/react'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
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
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { crearPedido, entregarPedido } from '../actions'
import type { EstadoPedido, TipoCliente } from '@/lib/types/database'

type PedidoRow = {
  id: number
  cliente_id: number
  estado: EstadoPedido
  fecha_entrega_min: string | null
  fecha_entrega_estimada: string | null
  tiene_delay: boolean
  delay_motivo: string | null
  subtotal: number | null
  total: number | null
  notas: string | null
  created_at: string
  clientes: { nombre: string; whatsapp: string | null } | null
  pedido_detalle: Array<{
    id: number
    producto_id: number
    cantidad: number
    precio_unitario: number
    subtotal: number
    productos: { nombre: string; presentacion: string; peso_gramos: number } | null
  }>
  total_cobrado: number
}

type ClienteOption = {
  id: number
  nombre: string
  tipo: TipoCliente
  descuento_porcentaje: number | null
  modalidad_pago: string
}

type ProductoOption = {
  id: number
  nombre: string
  presentacion: string
  peso_gramos: number
  precio_venta: number
  precio_mayoreo: number | null
}

type LineaFilled = {
  key: number
  producto_id: number
  nombre: string
  cantidad: number
  precio: number
  esMayoreo: boolean
}

const TIPOS_MAYOREO: TipoCliente[] = ['MAYORISTA', 'RESTAURANTE', 'ABARROTES', 'MERCADO']

const estadoConfig: Record<string, { label: string; color: string }> = {
  PENDIENTE_PAGO: { label: 'Pendiente de pago', color: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400' },
  RECIBIDO: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' },
  PAGO_CONFIRMADO: { label: 'Pago confirmado', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' },
  EN_PREPARACION: { label: 'En preparacion', color: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400' },
  LISTO: { label: 'Listo', color: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400' },
  EN_RUTA: { label: 'En ruta', color: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400' },
  ENTREGADO: { label: 'Entregado', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' },
  CANCELADO: { label: 'Cancelado', color: 'bg-gray-100 text-gray-500 dark:bg-gray-900 dark:text-gray-400' },
}

function formatMoney(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
}

function formatFechaCorta(fecha: string) {
  return new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function resumenProductos(detalle: PedidoRow['pedido_detalle']): string {
  if (detalle.length === 0) return 'Sin productos'
  const items = detalle.slice(0, 2).map((d) => {
    const nombre = d.productos?.nombre ?? `Producto #${d.producto_id}`
    return `${d.cantidad}x ${nombre}`
  })
  if (detalle.length > 2) items.push(`+${detalle.length - 2} más`)
  return items.join(', ')
}

function cobroBadge(pedido: PedidoRow) {
  const total = pedido.total ?? 0
  const cobrado = pedido.total_cobrado
  if (total <= 0) return null
  if (cobrado >= total - 0.01) return { label: 'Pagado', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' }
  if (cobrado > 0) return { label: 'Parcial', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' }
  if (pedido.estado === 'ENTREGADO') return { label: 'Sin pago', color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' }
  return null
}

// ────────────────────────────────────────────────────────────────
// Main view
// ────────────────────────────────────────────────────────────────

type TabFilter = 'nuevos' | 'pendientes' | 'en_proceso' | 'entregados' | 'todos'

export function PedidosView({
  pedidos,
  clientes,
  productos,
}: {
  pedidos: PedidoRow[]
  clientes: ClienteOption[]
  productos: ProductoOption[]
}) {
  const router = useRouter()

  const nuevos = pedidos.filter((p) => p.estado === 'PENDIENTE_PAGO').length
  const pendientesCount = pedidos.filter((p) => p.estado === 'RECIBIDO' || p.estado === 'PAGO_CONFIRMADO').length
  const enProceso = pedidos.filter((p) => ['EN_PREPARACION', 'LISTO', 'EN_RUTA'].includes(p.estado)).length
  const entregados = pedidos.filter((p) => p.estado === 'ENTREGADO').length

  const defaultTab: TabFilter = nuevos > 0 ? 'nuevos' : 'pendientes'
  const [tab, setTab] = useState<TabFilter>(defaultTab)

  const filtered = pedidos.filter((p) => {
    if (tab === 'nuevos') return p.estado === 'PENDIENTE_PAGO'
    if (tab === 'pendientes') return p.estado === 'RECIBIDO' || p.estado === 'PAGO_CONFIRMADO'
    if (tab === 'en_proceso') return ['EN_PREPARACION', 'LISTO', 'EN_RUTA'].includes(p.estado)
    if (tab === 'entregados') return p.estado === 'ENTREGADO'
    return true
  })

  const emptyMessages: Record<TabFilter, string> = {
    nuevos: 'Sin pedidos nuevos de la tienda.',
    pendientes: 'Sin pedidos pendientes.',
    en_proceso: 'Sin pedidos en proceso.',
    entregados: 'Sin pedidos entregados.',
    todos: 'Sin pedidos.',
  }

  return (
    <div className="space-y-4">
      {/* Header: filtros + nuevo */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg border border-border p-0.5 overflow-x-auto">
          {([
            ['nuevos', `Nuevos (${nuevos})`],
            ['pendientes', `Pendientes (${pendientesCount})`],
            ['en_proceso', `En proceso (${enProceso})`],
            ['entregados', `Entregados (${entregados})`],
            ['todos', `Todos (${pedidos.length})`],
          ] as [TabFilter, string][]).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <NuevoPedidoDialog clientes={clientes} productos={productos} />
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {emptyMessages[tab]}
        </p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">#</th>
                  <th className="pb-2 pr-3 font-medium">Cliente</th>
                  <th className="pb-2 pr-3 font-medium">Productos</th>
                  <th className="pb-2 pr-3 text-right font-medium">Total</th>
                  <th className="pb-2 pr-3 font-medium">Saldo</th>
                  <th className="pb-2 pr-3 font-medium">Entrega</th>
                  <th className="pb-2 pr-3 font-medium">Estado</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const estado = estadoConfig[p.estado] ?? estadoConfig.RECIBIDO
                  const cobro = cobroBadge(p)
                  const saldo = (p.total ?? 0) - p.total_cobrado
                  return (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2.5 pr-3 font-mono text-xs text-muted-foreground">
                        #{String(p.id).padStart(3, '0')}
                      </td>
                      <td className="py-2.5 pr-3 font-medium">
                        {p.clientes?.nombre ?? 'Sin cliente'}
                      </td>
                      <td className="max-w-[240px] truncate py-2.5 pr-3 text-muted-foreground">
                        {resumenProductos(p.pedido_detalle)}
                      </td>
                      <td className="py-2.5 pr-3 text-right font-semibold">
                        {formatMoney(p.total ?? 0)}
                      </td>
                      <td className="py-2.5 pr-3">
                        {saldo > 0.01 && (
                          <span className="text-xs font-medium text-red-600">
                            {formatMoney(saldo)}
                          </span>
                        )}
                        {cobro && (
                          <Badge className={`ml-1 text-[10px] ${cobro.color}`}>
                            {cobro.label}
                          </Badge>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-xs text-muted-foreground">
                        {p.fecha_entrega_min ? formatFechaCorta(p.fecha_entrega_min) : '—'}
                      </td>
                      <td className="py-2.5 pr-3">
                        <div className="flex flex-wrap items-center gap-1">
                          <Badge className={`text-[11px] ${estado.color}`}>{estado.label}</Badge>
                          {p.tiene_delay && (
                            <div className="group relative">
                              <Badge className="text-[10px] cursor-help bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400 gap-0.5">
                                <WarningCircle size={10} weight="fill" />
                                Delay
                              </Badge>
                              {p.delay_motivo && (
                                <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100">
                                  <div className="whitespace-nowrap rounded-md bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md border border-border max-w-[200px] whitespace-normal">
                                    {p.delay_motivo}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-0.5">
                          {(p.estado === 'RECIBIDO' || p.estado === 'PAGO_CONFIRMADO') && (
                            <EntregarRapidoDialog pedido={p} />
                          )}
                          <Button variant="ghost" size="sm" onClick={() => router.push(`/pedidos/${p.id}`)}>
                            <Eye size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-2 sm:hidden">
            {filtered.map((p) => {
              const estado = estadoConfig[p.estado] ?? estadoConfig.RECIBIDO
              const cobro = cobroBadge(p)
              return (
                <div
                  key={p.id}
                  className="rounded-lg border border-border bg-card p-3"
                >
                  <button
                    onClick={() => router.push(`/pedidos/${p.id}`)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        <span className="mr-1.5 font-mono text-xs text-muted-foreground">
                          #{String(p.id).padStart(3, '0')}
                        </span>
                        {p.clientes?.nombre ?? 'Sin cliente'}
                      </span>
                      <span className="text-sm font-semibold">{formatMoney(p.total ?? 0)}</span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {resumenProductos(p.pedido_detalle)}
                    </p>
                  </button>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <Badge className={`text-[11px] ${estado.color}`}>{estado.label}</Badge>
                    {p.tiene_delay && (
                      <div className="group relative">
                        <Badge className="text-[10px] cursor-help bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400 gap-0.5">
                          <WarningCircle size={10} weight="fill" />
                          Delay
                        </Badge>
                        {p.delay_motivo && (
                          <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100">
                            <div className="rounded-md bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md border border-border max-w-[200px]">
                              {p.delay_motivo}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {cobro && <Badge className={`text-[10px] ${cobro.color}`}>{cobro.label}</Badge>}
                    {p.fecha_entrega_min && (
                      <span className="text-[11px] text-muted-foreground">
                        Entrega: {formatFechaCorta(p.fecha_entrega_min)}
                      </span>
                    )}
                    {(p.estado === 'RECIBIDO' || p.estado === 'PAGO_CONFIRMADO') && (
                      <div className="ml-auto">
                        <EntregarRapidoDialog pedido={p} />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// Nuevo pedido dialog
// ────────────────────────────────────────────────────────────────

function NuevoPedidoDialog({
  clientes,
  productos,
}: {
  clientes: ClienteOption[]
  productos: ProductoOption[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [clienteId, setClienteId] = useState('')
  const [fechaEntrega, setFechaEntrega] = useState('')
  const [descuento, setDescuento] = useState(0)
  const [notas, setNotas] = useState('')
  const [lineas, setLineas] = useState<LineaFilled[]>([])
  const [agregando, setAgregando] = useState(true) // show empty select by default
  const [isPending, startTransition] = useTransition()

  const clienteSeleccionado = clientes.find((c) => c.id === Number(clienteId))
  const esMayoreo = clienteSeleccionado
    ? TIPOS_MAYOREO.includes(clienteSeleccionado.tipo)
    : false

  function resetAll() {
    setClienteId('')
    setFechaEntrega('')
    setDescuento(0)
    setNotas('')
    setLineas([])
    setAgregando(true)
  }

  function handleOpenChange(v: boolean) {
    setOpen(v)
    if (!v) resetAll()
  }

  function handleClienteChange(v: string) {
    setClienteId(v)
    const cli = clientes.find((c) => c.id === Number(v))
    if (cli?.descuento_porcentaje && cli.descuento_porcentaje > 0) {
      setDescuento(cli.descuento_porcentaje)
    } else {
      setDescuento(0)
    }
    // Recalc prices for existing lines if client type changes
    const nuevoEsMayoreo = cli ? TIPOS_MAYOREO.includes(cli.tipo) : false
    setLineas((prev) =>
      prev.map((l) => {
        const prod = productos.find((p) => p.id === l.producto_id)
        if (!prod) return l
        const nuevoPrecio =
          nuevoEsMayoreo && prod.precio_mayoreo ? prod.precio_mayoreo : prod.precio_venta
        return { ...l, precio: nuevoPrecio, esMayoreo: nuevoEsMayoreo && !!prod.precio_mayoreo }
      })
    )
  }

  function handleSelectProducto(productoIdStr: string) {
    const prod = productos.find((p) => p.id === Number(productoIdStr))
    if (!prod) return
    // Avoid duplicates
    if (lineas.some((l) => l.producto_id === prod.id)) {
      toast.error('Producto ya agregado')
      return
    }
    const precio =
      esMayoreo && prod.precio_mayoreo ? prod.precio_mayoreo : prod.precio_venta
    setLineas((prev) => [
      ...prev,
      {
        key: Date.now(),
        producto_id: prod.id,
        nombre: `${prod.nombre}`,
        cantidad: 1,
        precio,
        esMayoreo: esMayoreo && !!prod.precio_mayoreo,
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

  // Totals
  const subtotal = lineas.reduce((s, l) => s + l.cantidad * l.precio, 0)
  const montoDescuento = subtotal * (descuento / 100)
  const total = subtotal - montoDescuento

  // Products not yet in lines (for selector)
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
      const result = await crearPedido({
        cliente_id: Number(clienteId),
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

      toast.success('Pedido creado')
      handleOpenChange(false)
      router.push(`/pedidos/${result.id}`)
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus size={16} weight="bold" />
          Nuevo pedido
        </Button>
      </DialogTrigger>
      <DialogContent fullScreenMobile className="flex flex-col overflow-hidden sm:max-h-[85dvh] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo pedido</DialogTitle>
          <DialogDescription>Registra un pedido de cliente.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto">
          {/* Cliente */}
          <fieldset className="space-y-2">
            <Label>Cliente *</Label>
            <Select value={clienteId} onValueChange={handleClienteChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientes.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {clienteSeleccionado && clienteSeleccionado.descuento_porcentaje !== null && clienteSeleccionado.descuento_porcentaje > 0 && (
              <p className="text-xs text-muted-foreground">
                Descuento habitual de {clienteSeleccionado.nombre}: {clienteSeleccionado.descuento_porcentaje}%
              </p>
            )}
          </fieldset>

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

            {/* Filled lines */}
            {lineas.map((linea) => (
              <LineaPedido
                key={linea.key}
                linea={linea}
                onCantidadChange={(delta) => updateCantidad(linea.key, delta)}
                onCantidadDirecta={(val) => setCantidadDirecta(linea.key, val)}
                onPrecioChange={(val) => setPrecioDirecto(linea.key, val)}
                onRemove={() => removeLinea(linea.key)}
              />
            ))}

            {/* Empty select for adding */}
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
            <div className="rounded-lg border border-border bg-muted/50 p-3 space-y-1">
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

          <Button type="submit" className="h-10 w-full" disabled={isPending || !clienteId || lineas.length === 0}>
            {isPending ? 'Creando...' : 'Crear pedido'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ────────────────────────────────────────────────────────────────
// Línea de pedido compacta
// ────────────────────────────────────────────────────────────────

function LineaPedido({
  linea,
  onCantidadChange,
  onCantidadDirecta,
  onPrecioChange,
  onRemove,
}: {
  linea: LineaFilled
  onCantidadChange: (delta: number) => void
  onCantidadDirecta: (val: number) => void
  onPrecioChange: (val: number) => void
  onRemove: () => void
}) {
  const [editandoPrecio, setEditandoPrecio] = useState(false)
  const [editandoCantidad, setEditandoCantidad] = useState(false)
  const subtotal = linea.cantidad * linea.precio

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-1.5">
      {/* Row 1: nombre + eliminar */}
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

      {/* Row 2: stepper + precio + subtotal */}
      <div className="flex items-center gap-2">
        {/* Stepper */}
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

        <span className="text-sm text-muted-foreground">×</span>

        {/* Precio (tappeable) */}
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

        {/* Subtotal */}
        <span className="ml-auto text-sm font-semibold">
          = {formatMoney(subtotal)}
        </span>
      </div>

      {/* Mayoreo badge */}
      {linea.esMayoreo && (
        <span className="text-xs text-muted-foreground">Precio mayoreo</span>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// Entregar rápido desde lista
// ────────────────────────────────────────────────────────────────

function EntregarRapidoDialog({ pedido }: { pedido: PedidoRow }) {
  const router = useRouter()
  const [pagoInmediato, setPagoInmediato] = useState(true)
  const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'TRANSFERENCIA'>('EFECTIVO')
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      const result = await entregarPedido({
        pedido_id: pedido.id,
        pago_inmediato: pagoInmediato,
        metodo_pago: pagoInmediato ? metodoPago : undefined,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success(pagoInmediato ? 'Pedido entregado y cobrado' : 'Pedido entregado')
      router.refresh()
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700" title="Marcar entregado">
          <Check size={16} weight="bold" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Entregar pedido #{String(pedido.id).padStart(3, '0')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {pedido.clientes?.nombre ?? 'Sin cliente'} — {formatMoney(pedido.total ?? 0)}
            {'\n'}Se descontará inventario.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={pagoInmediato}
            onChange={(e) => setPagoInmediato(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          El cliente pagó al recibir
        </label>

        {pagoInmediato && (
          <Select value={metodoPago} onValueChange={(v) => setMetodoPago(v as 'EFECTIVO' | 'TRANSFERENCIA')}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EFECTIVO">Efectivo</SelectItem>
              <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
            </SelectContent>
          </Select>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
            {isPending ? 'Procesando...' : 'Confirmar entrega'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
