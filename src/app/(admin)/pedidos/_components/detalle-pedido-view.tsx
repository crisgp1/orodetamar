'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, X, CurrencyDollar, Clock, CheckCircle, XCircle, Receipt, Image as ImageIcon, WarningCircle, CalendarBlank } from '@phosphor-icons/react'
import Image from 'next/image'
import { toast } from 'sonner'
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
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  entregarPedido,
  registrarPagoPedido,
  cancelarPedido,
  aprobarComprobante,
  rechazarComprobante,
  cambiarEstadoPedido,
  toggleDelayPedido,
  setFechaEntregaEstimada,
} from '../actions'
import { EditarPedidoDialog } from './editar-pedido-dialog'
import { WhatsAppButton } from '@/components/shared/whatsapp-button'
import { PedidoTimeline } from '@/components/shared/pedido-timeline'
import type { EstadoPedido, MetodoPago, TipoCliente } from '@/lib/types/database'

type PedidoDetalle = {
  id: number
  cliente_id: number
  estado: EstadoPedido
  fecha_pedido: string
  fecha_entrega_min: string | null
  fecha_entrega_max: string | null
  fecha_entrega_real: string | null
  fecha_entrega_estimada: string | null
  tiene_delay: boolean
  delay_motivo: string | null
  canal_venta: string | null
  descuento_porcentaje: number | null
  subtotal: number | null
  total: number | null
  notas: string | null
  created_at: string
  clientes: {
    nombre: string
    tipo: string
    telefono: string | null
    whatsapp: string | null
    direccion: string | null
    ciudad: string | null
  } | null
  pedido_detalle: Array<{
    id: number
    pedido_id: number
    producto_id: number
    cantidad: number
    precio_unitario: number
    subtotal: number
    productos: { nombre: string; presentacion: string; peso_gramos: number } | null
  }>
  pedido_pagos: Array<{
    id: number
    pedido_id: number
    monto: number
    metodo_pago: MetodoPago
    fecha_pago: string
    notas: string | null
  }>
  pedido_comprobantes: Array<{
    id: number
    pedido_id: number
    imagen_url: string
    monto_declarado: number | null
    estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO'
    notas_admin: string | null
    created_at: string
    revisado_at: string | null
  }>
}

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

function formatFecha(fecha: string) {
  return new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatFechaCorta(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

type ProductoOption = {
  id: number
  nombre: string
  presentacion: string
  peso_gramos: number
  precio_venta: number
  precio_mayoreo: number | null
}

function buildMensajeWhatsApp(pedido: PedidoDetalle, saldo: number): string {
  const nombre = pedido.clientes?.nombre ?? 'cliente'
  const id = String(pedido.id).padStart(3, '0')
  const lineas = pedido.pedido_detalle
    .map((d) => `${d.cantidad}x ${d.productos?.nombre ?? 'producto'}`)
    .join(', ')
  const totalStr = `$${(pedido.total ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`

  if (pedido.estado === 'RECIBIDO') {
    const fecha = pedido.fecha_entrega_min
      ? new Date(pedido.fecha_entrega_min + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
      : ''
    return `Hola ${nombre}! Tu pedido #${id} está listo:\n${lineas}\nTotal: ${totalStr}${fecha ? `\n¿Te lo llevo el ${fecha}?` : ''}`
  }

  if (pedido.estado === 'ENTREGADO' && saldo > 0.01) {
    const saldoStr = `$${saldo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
    return `Hola ${nombre}! Tu pedido #${id} por ${totalStr} tiene un saldo pendiente de ${saldoStr}. ¿Cuándo nos ponemos al corriente?`
  }

  return `Hola ${nombre}! Te escribo por tu pedido #${id}.`
}

// ────────────────────────────────────────────────────────────────

export function DetallePedidoView({
  pedido,
  productos,
}: {
  pedido: PedidoDetalle
  productos: ProductoOption[]
}) {
  const router = useRouter()
  const [isPendingTimeline, startTimelineTransition] = useTransition()
  const [isPendingDelay, startDelayTransition] = useTransition()
  const [isPendingEntrega, startEntregaTransition] = useTransition()

  const total = pedido.total ?? 0
  const totalCobrado = pedido.pedido_pagos.reduce((s, p) => s + p.monto, 0)
  const saldo = total - totalCobrado
  const pctCobrado = total > 0 ? (totalCobrado / total) * 100 : 0
  const estado = estadoConfig[pedido.estado] ?? estadoConfig.RECIBIDO

  function handleTimelineChange(nuevoEstado: string) {
    startTimelineTransition(async () => {
      const result = await cambiarEstadoPedido(pedido.id, nuevoEstado)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(`Estado actualizado`)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push('/pedidos')}
          className="mb-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} />
          Pedidos
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold">
            Pedido #{String(pedido.id).padStart(3, '0')}
          </h1>
          <Badge className={`text-[11px] ${estado.color}`}>{estado.label}</Badge>
          {pedido.tiene_delay && (
            <div className="group relative">
              <Badge className="text-[11px] cursor-help bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400 gap-1">
                <WarningCircle size={12} weight="fill" />
                Delay
              </Badge>
              {pedido.delay_motivo && (
                <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="whitespace-nowrap rounded-md bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md border border-border">
                    {pedido.delay_motivo}
                  </div>
                </div>
              )}
            </div>
          )}
          {pedido.fecha_entrega_estimada && !['ENTREGADO', 'CANCELADO'].includes(pedido.estado) && (
            <Badge className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 gap-1">
              <CalendarBlank size={11} />
              Entrega est: {new Date(pedido.fecha_entrega_estimada + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
            </Badge>
          )}
          {pedido.estado === 'ENTREGADO' && (
            <Badge
              className={`text-[10px] ${
                totalCobrado >= total - 0.01
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                  : totalCobrado > 0
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
              }`}
            >
              {totalCobrado >= total - 0.01 ? 'Pagado' : totalCobrado > 0 ? 'Pago parcial' : 'Sin pago'}
            </Badge>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">Progreso del pedido</h2>
        <PedidoTimeline
          estado={pedido.estado}
          interactive
          onChangeEstado={handleTimelineChange}
          isPending={isPendingTimeline}
          tieneDelay={pedido.tiene_delay}
          delayMotivo={pedido.delay_motivo}
          fechaEntregaEstimada={pedido.fecha_entrega_estimada}
        />
        {isPendingTimeline && (
          <p className="mt-3 text-center text-xs text-muted-foreground animate-pulse">Actualizando estado...</p>
        )}
      </div>

      {/* Delay + Entrega estimada */}
      {!['ENTREGADO', 'CANCELADO'].includes(pedido.estado) && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Gestión de entrega</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Delay toggle */}
            <DelayControl
              pedidoId={pedido.id}
              tieneDelay={pedido.tiene_delay}
              delayMotivo={pedido.delay_motivo}
              isPending={isPendingDelay}
              startTransition={startDelayTransition}
            />

            {/* Entrega estimada */}
            <EntregaEstimadaControl
              pedidoId={pedido.id}
              fechaActual={pedido.fecha_entrega_estimada}
              isPending={isPendingEntrega}
              startTransition={startEntregaTransition}
            />
          </div>
        </div>
      )}

      {/* Info del pedido */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Información</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Cliente</p>
            <p className="font-medium">{pedido.clientes?.nombre ?? 'Sin cliente'}</p>
            {pedido.clientes?.whatsapp && (
              <div className="mt-1">
                <WhatsAppButton
                  telefono={pedido.clientes.whatsapp}
                  mensaje={buildMensajeWhatsApp(pedido, saldo)}
                />
              </div>
            )}
            {pedido.clientes?.ciudad && (
              <p className="mt-0.5 text-xs text-muted-foreground">{pedido.clientes.ciudad}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <div>
              <p className="text-xs text-muted-foreground">Fecha pedido</p>
              <p className="text-sm">{formatFechaCorta(pedido.created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fecha entrega</p>
              <p className="text-sm">
                {pedido.fecha_entrega_min ? formatFecha(pedido.fecha_entrega_min) : 'Sin fecha'}
              </p>
            </div>
          </div>
        </div>
        {pedido.notas && !pedido.notas.startsWith('CANCELADO:') && (
          <p className="mt-3 text-sm text-muted-foreground">
            {pedido.notas}
          </p>
        )}
      </div>

      {/* Productos */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Productos</h2>
        <div className="space-y-2">
          {pedido.pedido_detalle.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between rounded border border-border/50 px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium">
                  {d.productos?.nombre ?? `Producto #${d.producto_id}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {d.cantidad} × {formatMoney(d.precio_unitario)}
                </p>
              </div>
              <p className="text-sm font-semibold">{formatMoney(d.subtotal)}</p>
            </div>
          ))}
        </div>

        <Separator className="my-3" />

        {pedido.descuento_porcentaje && pedido.descuento_porcentaje > 0 ? (
          <div className="space-y-1">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatMoney(pedido.subtotal ?? 0)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Descuento ({pedido.descuento_porcentaje}%)</span>
              <span>-{formatMoney((pedido.subtotal ?? 0) - total)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total</span>
              <span className="text-lg font-bold">{formatMoney(total)}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total</span>
            <span className="text-lg font-bold">{formatMoney(total)}</span>
          </div>
        )}
      </div>

      {/* Comprobantes */}
      {pedido.pedido_comprobantes.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Receipt size={14} />
            Comprobantes de pago
          </h2>
          <div className="space-y-3">
            {pedido.pedido_comprobantes.map((c) => (
              <ComprobanteCard key={c.id} comprobante={c} />
            ))}
          </div>
        </div>
      )}

      {/* Pagos (solo si ENTREGADO) */}
      {pedido.estado === 'ENTREGADO' && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Pagos</h2>

          {/* Progress bar */}
          <div className="mb-3 space-y-1">
            <div className="flex justify-between text-xs">
              <span>Cobrado: {formatMoney(totalCobrado)}</span>
              <span>Total: {formatMoney(total)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${
                  pctCobrado >= 99.9 ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(pctCobrado, 100)}%` }}
              />
            </div>
            {saldo > 0.01 && (
              <p className="text-xs font-medium text-red-600">
                Saldo pendiente: {formatMoney(saldo)}
              </p>
            )}
          </div>

          {/* Historial */}
          {pedido.pedido_pagos.length > 0 && (
            <div className="mb-3 space-y-1.5">
              {pedido.pedido_pagos.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded border border-border/50 px-3 py-1.5"
                >
                  <div>
                    <span className="text-sm">{formatMoney(p.monto)}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {p.metodo_pago === 'EFECTIVO' ? 'Efectivo' : 'Transferencia'}
                    </span>
                    {p.notas && (
                      <span className="ml-2 text-xs text-muted-foreground">— {p.notas}</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatFechaCorta(p.fecha_pago)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Registrar pago */}
          {saldo > 0.01 && <RegistrarPagoDialog pedidoId={pedido.id} saldo={saldo} />}
        </div>
      )}

      {/* Cancelado */}
      {pedido.estado === 'CANCELADO' && (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center">
          <p className="text-sm text-muted-foreground">Este pedido fue cancelado.</p>
          {pedido.notas?.startsWith('CANCELADO:') && (
            <p className="mt-1 text-xs text-muted-foreground">
              Motivo: {pedido.notas.replace('CANCELADO: ', '')}
            </p>
          )}
        </div>
      )}

      {/* Acciones */}
      {(pedido.estado === 'RECIBIDO' || pedido.estado === 'PENDIENTE_PAGO' || pedido.estado === 'PAGO_CONFIRMADO') && (
        <div className="flex flex-wrap gap-2">
          {pedido.estado === 'RECIBIDO' && (
            <EditarPedidoDialog
              pedido={pedido}
              productos={productos}
              clienteTipo={pedido.clientes?.tipo as TipoCliente | undefined}
            />
          )}
          {(pedido.estado === 'RECIBIDO' || pedido.estado === 'PAGO_CONFIRMADO') && (
            <EntregarPedidoDialog pedido={pedido} />
          )}
          {(pedido.estado === 'RECIBIDO' || pedido.estado === 'PENDIENTE_PAGO') && (
            <CancelarPedidoDialog pedidoId={pedido.id} />
          )}
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// Entregar pedido dialog
// ────────────────────────────────────────────────────────────────

function EntregarPedidoDialog({ pedido }: { pedido: PedidoDetalle }) {
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

      toast.success(
        pagoInmediato ? 'Pedido entregado y cobrado' : 'Pedido entregado'
      )
      router.refresh()
    })
  }

  const totalUnidades = pedido.pedido_detalle.reduce((s, d) => s + d.cantidad, 0)

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button className="h-10 gap-1.5">
          <Check size={16} weight="bold" />
          Marcar como entregado
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar entrega</AlertDialogTitle>
          <AlertDialogDescription>
            Se descontarán {totalUnidades} producto{totalUnidades !== 1 ? 's' : ''} del inventario.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 rounded-lg border border-border bg-muted/50 p-3 text-sm">
          {pedido.pedido_detalle.map((d) => (
            <div key={d.id} className="flex justify-between">
              <span>
                {d.cantidad}× {d.productos?.nombre ?? `#${d.producto_id}`}
              </span>
              <span className="font-medium">{formatMoney(d.subtotal)}</span>
            </div>
          ))}
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatMoney(pedido.total ?? 0)}</span>
          </div>
        </div>

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

// ────────────────────────────────────────────────────────────────
// Cancelar pedido dialog
// ────────────────────────────────────────────────────────────────

function CancelarPedidoDialog({ pedidoId }: { pedidoId: number }) {
  const router = useRouter()
  const [motivo, setMotivo] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleCancelar() {
    if (!motivo.trim()) {
      toast.error('Escribe el motivo de cancelación')
      return
    }

    startTransition(async () => {
      const result = await cancelarPedido({
        pedido_id: pedidoId,
        notas: motivo.trim(),
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Pedido cancelado')
      router.refresh()
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="h-10 gap-1.5 text-red-600 hover:text-red-700">
          <X size={16} weight="bold" />
          Cancelar pedido
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancelar pedido</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. El inventario no se verá afectado ya que no se ha descontado.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <fieldset className="space-y-2">
          <Label>Motivo de cancelación *</Label>
          <Textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={2}
            placeholder="Ej: Cliente canceló por WhatsApp"
          />
        </fieldset>

        <AlertDialogFooter>
          <AlertDialogCancel>Volver</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancelar}
            disabled={isPending || !motivo.trim()}
            className="bg-red-600 hover:bg-red-700"
          >
            {isPending ? 'Cancelando...' : 'Confirmar cancelación'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ────────────────────────────────────────────────────────────────
// Registrar pago dialog
// ────────────────────────────────────────────────────────────────

function RegistrarPagoDialog({
  pedidoId,
  saldo,
}: {
  pedidoId: number
  saldo: number
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [monto, setMonto] = useState(String(saldo.toFixed(2)))
  const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'TRANSFERENCIA'>('EFECTIVO')
  const [notas, setNotas] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    startTransition(async () => {
      const result = await registrarPagoPedido({
        pedido_id: pedidoId,
        monto: Number(monto),
        metodo_pago: metodoPago,
        notas: notas.trim() || null,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.liquidado) {
        toast.success('Pedido liquidado completamente')
      } else {
        toast('Pago parcial registrado', {
          description: `Saldo restante: ${formatMoney(saldo - Number(monto))}`,
        })
      }

      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <CurrencyDollar size={16} weight="bold" />
          Registrar pago
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
          <DialogDescription>
            Saldo pendiente: {formatMoney(saldo)}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset className="space-y-2">
            <Label>Monto *</Label>
            <Input
              type="number"
              inputMode="decimal"
              min={0.01}
              max={saldo}
              step="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
            />
          </fieldset>

          <fieldset className="space-y-2">
            <Label>Método de pago</Label>
            <Select value={metodoPago} onValueChange={(v) => setMetodoPago(v as 'EFECTIVO' | 'TRANSFERENCIA')}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
              </SelectContent>
            </Select>
          </fieldset>

          <fieldset className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              placeholder="Notas del pago..."
            />
          </fieldset>

          <Button type="submit" className="h-10 w-full" disabled={isPending}>
            {isPending ? 'Registrando...' : 'Registrar pago'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ────────────────────────────────────────────────────────────────
// Delay control
// ────────────────────────────────────────────────────────────────

function DelayControl({
  pedidoId,
  tieneDelay,
  delayMotivo,
  isPending,
  startTransition,
}: {
  pedidoId: number
  tieneDelay: boolean
  delayMotivo: string | null
  isPending: boolean
  startTransition: (cb: () => Promise<void>) => void
}) {
  const router = useRouter()
  const [motivo, setMotivo] = useState(delayMotivo ?? '')
  const [showForm, setShowForm] = useState(false)

  function handleActivar() {
    if (!motivo.trim()) {
      toast.error('Escribe el motivo del retraso')
      return
    }
    startTransition(async () => {
      const result = await toggleDelayPedido(pedidoId, true, motivo.trim())
      if (result.error) { toast.error(result.error); return }
      toast.success('Delay marcado')
      setShowForm(false)
      router.refresh()
    })
  }

  function handleQuitar() {
    startTransition(async () => {
      const result = await toggleDelayPedido(pedidoId, false)
      if (result.error) { toast.error(result.error); return }
      toast.success('Delay removido')
      setMotivo('')
      router.refresh()
    })
  }

  if (tieneDelay) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <WarningCircle size={16} weight="fill" className="text-orange-500" />
          <span className="text-sm font-medium text-orange-700 dark:text-orange-400">Delay activo</span>
        </div>
        {delayMotivo && (
          <p className="text-xs text-muted-foreground bg-orange-50 dark:bg-orange-950/30 rounded px-2 py-1.5">
            {delayMotivo}
          </p>
        )}
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={handleQuitar}
          disabled={isPending}
        >
          {isPending ? 'Quitando...' : 'Quitar delay'}
        </Button>
      </div>
    )
  }

  if (showForm) {
    return (
      <div className="space-y-2">
        <Label className="text-xs">Motivo del retraso *</Label>
        <Textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          rows={2}
          placeholder="Ej: Falta de materia prima, problema de producción..."
          className="text-sm"
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            className="h-7 text-xs gap-1 bg-orange-600 hover:bg-orange-700"
            onClick={handleActivar}
            disabled={isPending || !motivo.trim()}
          >
            <WarningCircle size={12} weight="fill" />
            {isPending ? 'Guardando...' : 'Marcar delay'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => { setShowForm(false); setMotivo('') }}
          >
            Cancelar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">¿Hay un retraso en la preparación?</p>
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs gap-1 text-orange-600 hover:text-orange-700 hover:border-orange-300"
        onClick={() => setShowForm(true)}
      >
        <WarningCircle size={12} />
        Marcar delay
      </Button>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// Entrega estimada control
// ────────────────────────────────────────────────────────────────

function EntregaEstimadaControl({
  pedidoId,
  fechaActual,
  isPending,
  startTransition,
}: {
  pedidoId: number
  fechaActual: string | null
  isPending: boolean
  startTransition: (cb: () => Promise<void>) => void
}) {
  const router = useRouter()
  const [fecha, setFecha] = useState(fechaActual ?? '')

  function handleGuardar() {
    startTransition(async () => {
      const result = await setFechaEntregaEstimada(pedidoId, fecha || null)
      if (result.error) { toast.error(result.error); return }
      toast.success(fecha ? 'Entrega estimada actualizada' : 'Entrega estimada removida')
      router.refresh()
    })
  }

  // Get min date (today)
  const hoy = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-2">
      <Label className="text-xs">Entrega estimada</Label>
      <div className="flex gap-2">
        <Input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          min={hoy}
          className="h-8 text-sm flex-1"
        />
        <Button
          size="sm"
          className="h-8 text-xs gap-1"
          onClick={handleGuardar}
          disabled={isPending || fecha === (fechaActual ?? '')}
        >
          <CalendarBlank size={12} />
          {isPending ? '...' : 'Guardar'}
        </Button>
      </div>
      {fechaActual && (
        <button
          type="button"
          className="text-[10px] text-muted-foreground hover:text-red-600 transition-colors"
          onClick={() => {
            setFecha('')
            startTransition(async () => {
              const result = await setFechaEntregaEstimada(pedidoId, null)
              if (result.error) { toast.error(result.error); return }
              toast.success('Entrega estimada removida')
              router.refresh()
            })
          }}
          disabled={isPending}
        >
          Quitar fecha estimada
        </button>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// Comprobante card con acciones aprobar/rechazar
// ────────────────────────────────────────────────────────────────

function ComprobanteCard({
  comprobante,
}: {
  comprobante: PedidoDetalle['pedido_comprobantes'][number]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [motivoRechazo, setMotivoRechazo] = useState('')

  const estadoIcon = {
    PENDIENTE: <Clock size={14} className="text-amber-500" />,
    APROBADO: <CheckCircle size={14} weight="fill" className="text-emerald-500" />,
    RECHAZADO: <XCircle size={14} weight="fill" className="text-red-500" />,
  }

  const estadoLabel = {
    PENDIENTE: 'En revision',
    APROBADO: 'Aprobado',
    RECHAZADO: 'Rechazado',
  }

  const estadoBadgeColor = {
    PENDIENTE: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
    APROBADO: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
    RECHAZADO: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  }

  function handleAprobar() {
    startTransition(async () => {
      const result = await aprobarComprobante(comprobante.id)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('Comprobante aprobado')
      router.refresh()
    })
  }

  function handleRechazar() {
    if (!motivoRechazo.trim()) {
      toast.error('Escribe el motivo del rechazo')
      return
    }
    startTransition(async () => {
      const result = await rechazarComprobante(comprobante.id, motivoRechazo.trim())
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('Comprobante rechazado')
      setMotivoRechazo('')
      router.refresh()
    })
  }

  return (
    <div className="rounded border border-border p-3">
      <div className="flex items-start gap-3">
        {/* Thumbnail */}
        <a
          href={comprobante.imagen_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block h-20 w-20 shrink-0 overflow-hidden rounded border border-border bg-muted"
        >
          {comprobante.imagen_url.endsWith('.pdf') ? (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              <ImageIcon size={20} />
            </div>
          ) : (
            <Image
              src={comprobante.imagen_url}
              alt="Comprobante"
              width={80}
              height={80}
              className="h-full w-full object-cover"
            />
          )}
        </a>

        {/* Info */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-1.5">
            {estadoIcon[comprobante.estado]}
            <Badge className={`text-[10px] ${estadoBadgeColor[comprobante.estado]}`}>
              {estadoLabel[comprobante.estado]}
            </Badge>
          </div>
          {comprobante.monto_declarado && (
            <p className="text-xs text-muted-foreground">
              Monto declarado: {formatMoney(comprobante.monto_declarado)}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground/60">
            {formatFechaCorta(comprobante.created_at)}
          </p>
          {comprobante.notas_admin && (
            <p className="text-xs italic text-muted-foreground">
              {comprobante.notas_admin}
            </p>
          )}
        </div>
      </div>

      {/* Acciones si PENDIENTE */}
      {comprobante.estado === 'PENDIENTE' && (
        <div className="mt-3 space-y-2 border-t border-dashed border-border pt-3">
          <div className="flex gap-2">
            <Button
              size="sm"
              className="h-8 gap-1 flex-1"
              onClick={handleAprobar}
              disabled={isPending}
            >
              <CheckCircle size={14} weight="bold" />
              Aprobar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1 flex-1 text-red-600 hover:text-red-700"
                  disabled={isPending}
                >
                  <XCircle size={14} weight="bold" />
                  Rechazar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Rechazar comprobante</AlertDialogTitle>
                  <AlertDialogDescription>
                    El cliente podra subir un nuevo comprobante.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <fieldset className="space-y-2">
                  <Label>Motivo del rechazo *</Label>
                  <Textarea
                    value={motivoRechazo}
                    onChange={(e) => setMotivoRechazo(e.target.value)}
                    rows={2}
                    placeholder="Ej: Imagen borrosa, monto incorrecto..."
                  />
                </fieldset>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleRechazar}
                    disabled={isPending || !motivoRechazo.trim()}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isPending ? 'Procesando...' : 'Confirmar rechazo'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </div>
  )
}
