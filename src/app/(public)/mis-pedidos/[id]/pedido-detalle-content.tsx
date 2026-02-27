'use client'

import { useState, useRef, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  MapPin,
  Phone,
  UploadSimple,
  CheckCircle,
  WarningCircle,
  Spinner,
  Clock,
  Receipt,
  CalendarBlank,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { DictionaryProvider, useDictionary } from '../../_dictionaries/context'
import type { Dictionary } from '../../_dictionaries'
import { subirComprobante } from '../../checkout/actions'
import { PedidoTimeline } from '@/components/shared/pedido-timeline'

/* ── Types (matches Supabase response shape) ── */
type PedidoComprobante = {
  id: number
  imagen_url: string
  monto_declarado: number | null
  estado: string
  notas_admin: string | null
  created_at: string
}

type PedidoDetalle = {
  id: number
  producto_id: number
  cantidad: number
  precio_unitario: number
  subtotal: number
  productos: {
    nombre: string
    presentacion: string
    imagen_url: string | null
  } | null
}

type Pedido = {
  id: number
  estado: string
  subtotal: number | null
  total: number | null
  origen: string | null
  direccion_entrega: string | null
  telefono_contacto: string | null
  requiere_anticipo: boolean | null
  monto_anticipo: number | null
  tiene_delay: boolean
  delay_motivo: string | null
  fecha_entrega_estimada: string | null
  notas: string | null
  created_at: string
  pedido_detalle: PedidoDetalle[]
  pedido_comprobantes: PedidoComprobante[]
}

function formatPrecio(n: number | null) {
  if (n == null) return '$0'
  return n % 1 === 0 ? `$${n}` : `$${n.toFixed(2)}`
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const estadoColor: Record<string, string> = {
  PENDIENTE_PAGO: 'bg-amber-100 text-amber-800',
  RECIBIDO: 'bg-blue-100 text-blue-800',
  PAGO_CONFIRMADO: 'bg-emerald-100 text-emerald-800',
  EN_PREPARACION: 'bg-violet-100 text-violet-800',
  LISTO: 'bg-teal-100 text-teal-800',
  EN_RUTA: 'bg-sky-100 text-sky-800',
  ENTREGADO: 'bg-green-100 text-green-800',
  CANCELADO: 'bg-red-100 text-red-800',
}

const comprobanteEstadoIcon: Record<string, typeof CheckCircle> = {
  PENDIENTE: Clock,
  APROBADO: CheckCircle,
  RECHAZADO: WarningCircle,
}

export function PedidoDetalleContent({
  dictionary,
  pedido,
}: {
  dictionary: Dictionary
  pedido: Pedido
}) {
  return (
    <DictionaryProvider dictionary={dictionary}>
      <PedidoDetalleInner pedido={pedido} />
    </DictionaryProvider>
  )
}

function PedidoDetalleInner({ pedido }: { pedido: Pedido }) {
  const t = useDictionary()
  const fileRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [newFile, setNewFile] = useState<File | null>(null)

  const estadoLabel = (estado: string) =>
    (t.misPedidos.estados as Record<string, string>)[estado] ?? estado

  const needsComprobante =
    pedido.estado === 'PENDIENTE_PAGO' &&
    (pedido.pedido_comprobantes.length === 0 ||
      pedido.pedido_comprobantes.every((c) => c.estado === 'RECHAZADO'))

  function handleUpload() {
    if (!newFile) return
    startTransition(async () => {
      const fd = new FormData()
      fd.set('pedidoId', String(pedido.id))
      fd.set('file', newFile)
      const res = await subirComprobante(fd)
      if (res.ok) {
        toast.success('Comprobante subido correctamente')
        setNewFile(null)
        // Reload to show updated status
        window.location.reload()
      } else {
        toast.error('Error al subir comprobante')
      }
    })
  }

  return (
    <div className="min-h-dvh pb-20">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-5">
          <Link
            href="/mis-pedidos"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="font-display text-xl font-normal">
            {t.misPedidos.pedido} #{pedido.id}
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 pt-8 space-y-8">
        {/* Timeline */}
        <section className="border border-border p-5">
          <PedidoTimeline
            estado={pedido.estado}
            tieneDelay={pedido.tiene_delay}
            delayMotivo={pedido.delay_motivo}
            fechaEntregaEstimada={pedido.fecha_entrega_estimada}
          />
        </section>

        {/* Status + date */}
        <div className="flex items-center justify-between">
          <span
            className={`inline-block px-3 py-1 text-xs font-semibold tracking-wide uppercase ${estadoColor[pedido.estado] ?? 'bg-muted text-muted-foreground'}`}
          >
            {estadoLabel(pedido.estado)}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatFecha(pedido.created_at)}
          </span>
        </div>

        {/* Delivery info */}
        {(pedido.direccion_entrega || pedido.telefono_contacto) && (
          <section className="space-y-2 border border-border p-5">
            {pedido.direccion_entrega && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
                <span>{pedido.direccion_entrega}</span>
              </div>
            )}
            {pedido.telefono_contacto && (
              <div className="flex items-center gap-2 text-sm">
                <Phone size={16} className="shrink-0 text-muted-foreground" />
                <span>{pedido.telefono_contacto}</span>
              </div>
            )}
          </section>
        )}

        {/* Order items */}
        <section>
          <h2 className="mb-4 text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground">
            {t.misPedidos.detalle}
          </h2>
          <div className="border border-border">
            {pedido.pedido_detalle.map((d, i) => (
              <div
                key={d.id}
                className={`flex items-center justify-between px-4 py-3 ${
                  i > 0 ? 'border-t border-dashed border-border' : ''
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm">
                    {d.productos?.nombre ?? `Producto #${d.producto_id}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {d.cantidad} &times; {formatPrecio(d.precio_unitario)}
                  </p>
                </div>
                <span className="tabular-nums font-display text-sm font-semibold whitespace-nowrap pl-4">
                  {formatPrecio(d.subtotal)}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm font-medium">{t.misPedidos.total}</span>
            <span className="tabular-nums font-display text-xl font-semibold">
              {formatPrecio(pedido.total)}
            </span>
          </div>

          {/* Anticipo */}
          {pedido.requiere_anticipo && pedido.monto_anticipo && (
            <div className="mt-2 flex items-center justify-between text-sm text-accent">
              <span className="flex items-center gap-1">
                <WarningCircle size={14} />
                {t.misPedidos.anticipo}
              </span>
              <span className="tabular-nums font-display font-semibold">
                {formatPrecio(pedido.monto_anticipo)}
              </span>
            </div>
          )}
        </section>

        {/* Comprobantes */}
        <section>
          <h2 className="mb-4 text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground">
            <Receipt size={14} className="mr-1 inline-block" />
            Comprobantes
          </h2>

          {pedido.pedido_comprobantes.length > 0 ? (
            <div className="space-y-3">
              {pedido.pedido_comprobantes.map((c) => {
                const Icon = comprobanteEstadoIcon[c.estado] ?? Clock
                return (
                  <div key={c.id} className="flex items-start gap-3 border border-border p-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden border border-border bg-muted">
                      {c.imagen_url.endsWith('.pdf') ? (
                        <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                          PDF
                        </div>
                      ) : (
                        <Image
                          src={c.imagen_url}
                          alt="Comprobante"
                          width={64}
                          height={64}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Icon
                          size={14}
                          weight="fill"
                          className={
                            c.estado === 'APROBADO'
                              ? 'text-emerald-600'
                              : c.estado === 'RECHAZADO'
                                ? 'text-red-500'
                                : 'text-amber-500'
                          }
                        />
                        <span className="font-medium">
                          {c.estado === 'PENDIENTE' && t.misPedidos.comprobantePendiente}
                          {c.estado === 'APROBADO' && t.misPedidos.comprobanteAprobado}
                          {c.estado === 'RECHAZADO' && t.misPedidos.comprobanteRechazado}
                        </span>
                      </div>
                      {c.monto_declarado && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Monto declarado: {formatPrecio(c.monto_declarado)}
                        </p>
                      )}
                      {c.notas_admin && (
                        <p className="mt-1 text-xs italic text-muted-foreground">
                          {c.notas_admin}
                        </p>
                      )}
                      <p className="mt-1 text-[10px] text-muted-foreground/60">
                        {formatFecha(c.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Sin comprobantes aún.</p>
          )}

          {/* Upload new comprobante if needed */}
          {needsComprobante && (
            <div className="mt-4 space-y-3">
              <div
                onClick={() => fileRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center border-2 border-dashed px-4 py-6 text-center transition-colors ${
                  newFile
                    ? 'border-[#25D366]/50 bg-[#25D366]/5'
                    : 'border-border hover:border-foreground/30'
                }`}
              >
                {newFile ? (
                  <>
                    <CheckCircle size={24} weight="fill" className="mb-1 text-[#25D366]" />
                    <p className="text-sm">{newFile.name}</p>
                  </>
                ) : (
                  <>
                    <UploadSimple size={24} className="mb-1 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {t.misPedidos.subirComprobante}
                    </p>
                  </>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={(e) => setNewFile(e.target.files?.[0] ?? null)}
                />
              </div>

              {newFile && (
                <button
                  onClick={handleUpload}
                  disabled={isPending}
                  className="flex h-10 w-full items-center justify-center gap-2 bg-foreground text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {isPending ? (
                    <Spinner size={16} className="animate-spin" />
                  ) : (
                    <UploadSimple size={16} />
                  )}
                  {t.misPedidos.subirComprobante}
                </button>
              )}
            </div>
          )}
        </section>

        {/* Notes */}
        {pedido.notas && (
          <section className="border border-border p-5">
            <h3 className="mb-2 text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground">
              Notas
            </h3>
            <p className="text-sm text-muted-foreground">{pedido.notas}</p>
          </section>
        )}
      </div>
    </div>
  )
}
