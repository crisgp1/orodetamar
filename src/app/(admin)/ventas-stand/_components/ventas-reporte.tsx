'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { CaretDown, CaretUp, Prohibit, Storefront } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
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
import { Separator } from '@/components/ui/separator'
import type { VCierresStand, VVentasStand } from '@/lib/types/database'
import { deshacerVenta } from '../actions'

type Rango = 'hoy' | 'ayer' | 'semana' | 'mes'

function formatPeso(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
}

function formatFecha(fecha: string) {
  return new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
  })
}

function formatHora(ts: string) {
  return new Date(ts).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const RANGO_LABELS: Record<Rango, string> = {
  hoy: 'Hoy',
  ayer: 'Ayer',
  semana: '7 días',
  mes: 'Mes',
}

export function VentasReporte({
  ventas,
  cierres,
  rango,
  desde,
  hasta,
}: {
  ventas: VVentasStand[]
  cierres: VCierresStand[]
  rango: Rango
  desde: string
  hasta: string
}) {
  const router = useRouter()
  const [cierresOpen, setCierresOpen] = useState(false)

  // La vista ya filtra anulada=false, pero por seguridad
  const ventasActivas = ventas

  const totalVentas = ventasActivas.reduce((sum, v) => sum + v.total, 0)
  const totalEfectivo = ventasActivas
    .filter((v) => v.metodo_pago === 'EFECTIVO')
    .reduce((sum, v) => sum + v.total, 0)
  const totalTransferencia = ventasActivas
    .filter((v) => v.metodo_pago === 'TRANSFERENCIA')
    .reduce((sum, v) => sum + v.total, 0)
  const totalUnidades = ventasActivas.reduce(
    (sum, v) => sum + v.cantidad_vendida,
    0
  )

  const rangoLabel =
    desde === hasta
      ? formatFecha(desde)
      : `${formatFecha(desde)} – ${formatFecha(hasta)}`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Ventas Stand</h1>
          <p className="text-sm text-muted-foreground">{rangoLabel}</p>
        </div>
        <Link href="/pos">
          <Button variant="outline" size="sm">
            <Storefront size={16} weight="bold" />
            Ir al POS
          </Button>
        </Link>
      </div>

      {/* Filtros de rango */}
      <div className="flex gap-2">
        {(Object.keys(RANGO_LABELS) as Rango[]).map((r) => (
          <Button
            key={r}
            variant={rango === r ? 'default' : 'outline'}
            size="sm"
            onClick={() => router.push(`/ventas-stand?rango=${r}`)}
          >
            {RANGO_LABELS[r]}
          </Button>
        ))}
      </div>

      {/* 4 Cards resumen */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total ventas</p>
            <p className="text-xl font-bold">{formatPeso(totalVentas)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Efectivo</p>
            <p className="text-xl font-bold text-emerald-600">
              {formatPeso(totalEfectivo)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Transferencia</p>
            <p className="text-xl font-bold text-blue-600">
              {formatPeso(totalTransferencia)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Unidades</p>
            <p className="text-xl font-bold">{totalUnidades}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de ventas */}
      {ventas.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Sin ventas en este periodo.
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="hidden sm:table-cell">
                  Ubicación
                </TableHead>
                <TableHead className="text-center">Uds</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="hidden sm:table-cell">Método</TableHead>
                <TableHead className="text-right">Hora</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {ventas.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <p className="text-sm font-medium">
                      {v.producto_nombre}
                    </p>
                    {rango !== 'hoy' && rango !== 'ayer' && (
                      <p className="text-xs text-muted-foreground sm:hidden">
                        {formatFecha(v.fecha_local)}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-sm sm:table-cell">
                    {v.ubicacion_nombre ?? '—'}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {v.cantidad_vendida}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {formatPeso(v.total)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {v.metodo_pago === 'EFECTIVO' && (
                      <Badge
                        variant="outline"
                        className="border-emerald-200 text-emerald-700"
                      >
                        Efectivo
                      </Badge>
                    )}
                    {v.metodo_pago === 'TRANSFERENCIA' && (
                      <Badge
                        variant="outline"
                        className="border-blue-200 text-blue-700"
                      >
                        Transf.
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {formatHora(v.created_at)}
                  </TableCell>
                  <TableCell>
                    <AnularButton ventaId={v.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Cierres colapsable */}
      {cierres.length > 0 && (
        <>
          <Separator />
          <div>
            <button
              onClick={() => setCierresOpen(!cierresOpen)}
              className="flex w-full items-center justify-between py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <span>Cierres del stand ({cierres.length})</span>
              {cierresOpen ? (
                <CaretUp size={16} weight="bold" />
              ) : (
                <CaretDown size={16} weight="bold" />
              )}
            </button>
            {cierresOpen && (
              <div className="mt-2 space-y-1.5">
                {cierres.map((c) => {
                  const sinContar =
                    c.cantidad_llevada -
                    c.cantidad_vendida -
                    c.cantidad_retornada
                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {c.producto_nombre}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {c.ubicacion_nombre} · {formatFecha(c.fecha)} · V:
                          {c.cantidad_vendida} R:{c.cantidad_retornada}
                        </p>
                      </div>
                      {sinContar > 0 && (
                        <Badge className="bg-red-100 text-[11px] text-red-700">
                          -{sinContar}
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function AnularButton({ ventaId }: { ventaId: number }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleAnular() {
    startTransition(async () => {
      const result = await deshacerVenta(ventaId, { skipTimeCheck: true })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Venta anulada')
        router.refresh()
      }
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-red-600"
          disabled={isPending}
        >
          <Prohibit size={14} weight="bold" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Anular venta</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción marcará la venta como anulada y devolverá el stock. No se
            puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleAnular}
            className="bg-red-600 hover:bg-red-700"
          >
            {isPending ? '...' : 'Anular venta'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
