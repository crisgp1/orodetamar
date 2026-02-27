'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  Package,
  ShoppingBag,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
} from '@phosphor-icons/react'
import { DictionaryProvider, useDictionary } from '../_dictionaries/context'
import type { Dictionary } from '../_dictionaries'

/* ── Types matching the Supabase response shape ── */
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
  total: number | null
  origen: string | null
  direccion_entrega: string | null
  telefono_contacto: string | null
  requiere_anticipo: boolean | null
  monto_anticipo: number | null
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
    month: 'short',
    year: 'numeric',
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

export function MisPedidosContent({
  dictionary,
  pedidos,
}: {
  dictionary: Dictionary
  pedidos: Pedido[]
}) {
  return (
    <DictionaryProvider dictionary={dictionary}>
      <MisPedidosInner pedidos={pedidos} />
    </DictionaryProvider>
  )
}

function MisPedidosInner({ pedidos }: { pedidos: Pedido[] }) {
  const t = useDictionary()

  const estadoLabel = (estado: string) =>
    (t.misPedidos.estados as Record<string, string>)[estado] ?? estado

  return (
    <div className="min-h-dvh pb-20">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-5">
          <Link href="/" className="text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="font-display text-xl font-normal">{t.misPedidos.titulo}</h1>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 pt-8">
        {pedidos.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center py-20 text-center">
            <ShoppingBag size={48} weight="thin" className="mb-4 text-muted-foreground" />
            <p className="font-display text-lg">{t.misPedidos.vacio}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t.misPedidos.vacioDesc}</p>
            <Link
              href="/"
              className="mt-6 inline-flex h-10 items-center gap-2 border border-border px-6 text-sm transition-colors hover:bg-muted"
            >
              {t.misPedidos.irCatalogo}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {pedidos.map((p) => (
              <Link
                key={p.id}
                href={`/mis-pedidos/${p.id}`}
                className="group block border border-border p-5 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <Package size={16} className="shrink-0 text-muted-foreground" />
                      <span className="font-display text-sm font-semibold">
                        {t.misPedidos.pedido} #{p.id}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatFecha(p.created_at)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.pedido_detalle.length}{' '}
                      {p.pedido_detalle.length === 1 ? 'producto' : 'productos'}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="tabular-nums font-display text-lg font-semibold">
                      {formatPrecio(p.total)}
                    </span>
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${estadoColor[p.estado] ?? 'bg-muted text-muted-foreground'}`}
                    >
                      {estadoLabel(p.estado)}
                    </span>
                  </div>
                </div>

                {/* Comprobante status */}
                {p.pedido_comprobantes.length > 0 && (
                  <div className="mt-3 border-t border-dashed border-border pt-3">
                    {p.pedido_comprobantes.map((c) => (
                      <p key={c.id} className="flex items-center gap-1 text-xs text-muted-foreground">
                        {c.estado === 'PENDIENTE' && <><Clock size={12} className="text-amber-500" /> {t.misPedidos.comprobantePendiente}</>}
                        {c.estado === 'APROBADO' && <><CheckCircle size={12} weight="fill" className="text-emerald-500" /> {t.misPedidos.comprobanteAprobado}</>}
                        {c.estado === 'RECHAZADO' && <><XCircle size={12} weight="fill" className="text-red-500" /> {t.misPedidos.comprobanteRechazado}</>}
                      </p>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex items-center justify-end text-xs text-muted-foreground transition-colors group-hover:text-foreground">
                  {t.misPedidos.verDetalle}
                  <ArrowRight size={12} className="ml-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
