'use client'

import { useTransition } from 'react'
import {
  Clock,
  MagnifyingGlass,
  Warning,
  CheckCircle,
  XCircle,
  CalendarBlank,
  Trash,
  ArrowUUpLeft,
  ArrowsClockwise,
  CurrencyDollar,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { WhatsAppButton } from '@/components/shared/whatsapp-button'
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
import { cancelarConsignacion } from '../actions'
import { LiquidarDialog } from './liquidar-form'
import { RegistrarPagoForm } from './registrar-pago-form'
import type {
  Consignacion,
  ConsignacionDetalle,
  ConsignacionPago,
  EstadoConsignacion,
  DestinoRetorno,
} from '@/lib/types/database'

type ConCliente = Consignacion & {
  clientes: { nombre: string; whatsapp: string | null; ciudad: string | null } | null
}

type DetalleConProducto = ConsignacionDetalle & {
  productos: { nombre: string; sku: string | null; presentacion: string } | null
}

const estadoConfig: Record<
  EstadoConsignacion,
  { label: string; color: string; icon: React.ReactNode }
> = {
  ACTIVA: {
    label: 'Activa',
    color: 'bg-blue-100 text-blue-700',
    icon: <Clock size={14} weight="bold" />,
  },
  EN_REVISION: {
    label: 'En revisión',
    color: 'bg-yellow-100 text-yellow-700',
    icon: <MagnifyingGlass size={14} weight="bold" />,
  },
  SALDO_PENDIENTE: {
    label: 'Saldo pendiente',
    color: 'bg-red-100 text-red-700',
    icon: <Warning size={14} weight="bold" />,
  },
  LIQUIDADA: {
    label: 'Liquidada',
    color: 'bg-green-100 text-green-700',
    icon: <CheckCircle size={14} weight="fill" />,
  },
  CANCELADA: {
    label: 'Cancelada',
    color: 'bg-gray-100 text-gray-500',
    icon: <XCircle size={14} />,
  },
}

const destinoLabels: Record<DestinoRetorno, { label: string; icon: React.ReactNode }> = {
  INVENTARIO: {
    label: 'Inventario',
    icon: <ArrowUUpLeft size={14} />,
  },
  REPROCESAMIENTO_PULPA: {
    label: 'Reprocesar a pulpa',
    icon: <ArrowsClockwise size={14} />,
  },
}

function formatPeso(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
}

function formatFecha(fecha: string) {
  return new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function buildMensajeConsignacion(
  consignacion: ConCliente,
  diasTranscurridos: number,
  saldoPendiente: number,
): string {
  const nombre = consignacion.clientes?.nombre ?? 'cliente'
  const fecha = formatFecha(consignacion.fecha_entrega)

  if (consignacion.estado === 'ACTIVA') {
    return `Hola ${nombre}! Pasaron ${diasTranscurridos} días desde que dejé producto en tu local (${fecha}). ¿Paso a hacer revisión?`
  }
  if (consignacion.estado === 'SALDO_PENDIENTE' && saldoPendiente > 0.01) {
    const saldoStr = `$${saldoPendiente.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
    return `Hola ${nombre}! De la consignación del ${fecha}, queda un saldo de ${saldoStr}. ¿Cuándo nos ponemos al corriente?`
  }

  return `Hola ${nombre}! Te escribo por la consignación del ${fecha}.`
}

export function ConsignacionDetalleView({
  consignacion,
  detalle,
  pagos,
}: {
  consignacion: ConCliente
  detalle: DetalleConProducto[]
  pagos: ConsignacionPago[]
}) {
  const [isCancelling, startCancelTransition] = useTransition()

  const estado = estadoConfig[consignacion.estado]
  const totalDejado = detalle.reduce(
    (sum, d) => sum + d.cantidad_dejada * d.precio_unitario,
    0
  )
  const saldoPendiente =
    consignacion.total_vendido - consignacion.total_cobrado
  const diasTranscurridos = Math.floor(
    (new Date().getTime() - new Date(consignacion.fecha_entrega + 'T12:00:00').getTime()) /
      86400000
  )

  function handleCancelar() {
    startCancelTransition(async () => {
      const result = await cancelarConsignacion(consignacion.id)
      if (result?.error) {
        toast.error(result.error)
      }
      // redirect happens in action on success
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold">
            Consignación #{consignacion.id}
          </h1>
          <Badge className={`gap-1 ${estado.color}`}>
            {estado.icon}
            {estado.label}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {consignacion.clientes?.nombre}
          </span>
          {consignacion.clientes?.ciudad && (
            <span>{consignacion.clientes.ciudad}</span>
          )}
          <span className="flex items-center gap-1">
            <CalendarBlank size={14} />
            {formatFecha(consignacion.fecha_entrega)}
          </span>
          {consignacion.estado === 'ACTIVA' && (
            <Badge
              className={`text-[11px] ${
                diasTranscurridos > 7
                  ? 'bg-red-100 text-red-700'
                  : diasTranscurridos > 3
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-600'
              }`}
            >
              {diasTranscurridos}d
            </Badge>
          )}
          {consignacion.clientes?.whatsapp && (
            <WhatsAppButton
              telefono={consignacion.clientes.whatsapp}
              mensaje={buildMensajeConsignacion(consignacion, diasTranscurridos, saldoPendiente)}
            />
          )}
        </div>

        {consignacion.notas && (
          <p className="mt-2 text-sm text-muted-foreground">
            {consignacion.notas}
          </p>
        )}
      </div>

      {/* Financial summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Dejado</p>
          <p className="text-lg font-semibold">{formatPeso(totalDejado)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Vendido</p>
          <p className="text-lg font-semibold">
            {formatPeso(consignacion.total_vendido)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Cobrado</p>
          <p className="text-lg font-semibold">
            {formatPeso(consignacion.total_cobrado)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Saldo</p>
          <p
            className={`text-lg font-semibold ${
              saldoPendiente > 0 ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {formatPeso(saldoPendiente)}
          </p>
        </div>
      </div>

      <Separator />

      {/* Product detail table */}
      <div>
        <h2 className="mb-3 text-base font-medium">Productos</h2>
        <div className="space-y-2">
          {detalle.map((d) => {
            const sinContar =
              d.cantidad_dejada - d.cantidad_vendida - d.cantidad_retornada
            const subtotalVendido = d.cantidad_vendida * d.precio_unitario

            return (
              <div
                key={d.id}
                className="rounded-lg border border-border bg-card p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {d.productos?.nombre ?? `#${d.producto_id}`}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {d.productos?.presentacion}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div>
                    <p className="text-muted-foreground">Dejadas</p>
                    <p className="font-medium">{d.cantidad_dejada}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Vendidas</p>
                    <p className="font-medium">{d.cantidad_vendida}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Retornadas</p>
                    <p className="font-medium">{d.cantidad_retornada}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">
                      {consignacion.estado === 'ACTIVA'
                        ? 'Sin contar'
                        : 'Subtotal'}
                    </p>
                    <p className="font-medium">
                      {consignacion.estado === 'ACTIVA'
                        ? sinContar
                        : formatPeso(subtotalVendido)}
                    </p>
                  </div>
                </div>

                {d.destino_retorno && d.cantidad_retornada > 0 && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    {destinoLabels[d.destino_retorno].icon}
                    {destinoLabels[d.destino_retorno].label}
                  </div>
                )}

                {d.notas_faltante && (
                  <div className="mt-2 rounded-md bg-yellow-50 px-2 py-1.5 text-xs text-yellow-700">
                    <span className="font-medium">Faltante:</span> {d.notas_faltante}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Payments history */}
      {pagos.length > 0 && (
        <>
          <Separator />
          <div>
            <h2 className="mb-3 text-base font-medium">Pagos</h2>
            <div className="space-y-2">
              {pagos.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2"
                >
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      <CurrencyDollar size={14} />
                      {formatPeso(p.monto)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(p.fecha_pago).toLocaleDateString('es-MX', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {p.notas ? ` — ${p.notas}` : ''}
                    </p>
                  </div>
                  <Badge className="bg-gray-100 text-gray-700 text-[11px]">
                    {p.metodo_pago === 'EFECTIVO' ? 'Efectivo' : 'Transferencia'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <Separator />

      {/* Actions by state */}
      {consignacion.estado === 'ACTIVA' && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <LiquidarDialog
            consignacionId={consignacion.id}
            detalle={detalle}
          />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="lg" className="text-destructive">
                <Trash size={18} />
                Cancelar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancelar consignación</AlertDialogTitle>
                <AlertDialogDescription>
                  Se retornará todo el producto al inventario y la consignación se
                  cerrará. Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Volver</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancelar}
                  disabled={isCancelling}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  {isCancelling ? 'Cancelando...' : 'Sí, cancelar'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {consignacion.estado === 'SALDO_PENDIENTE' && (
        <RegistrarPagoForm
          consignacionId={consignacion.id}
          saldoPendiente={saldoPendiente}
        />
      )}
    </div>
  )
}
