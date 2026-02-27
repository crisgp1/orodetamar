'use client'

import { Storefront, Handshake, ShoppingCart } from '@phosphor-icons/react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatMoney } from '@/lib/utils'
import type {
  ResumenFinanciero,
  ProductoCanalMatriz,
  ClienteConsignacionRanking,
} from '@/lib/utils/rentabilidad'
import type { VRentabilidadUbicaciones } from '@/lib/types/database'

export function ChannelsTab({
  resumen,
  matriz,
  ubicaciones,
  clientesRanking,
  cuentasPorCobrar,
}: {
  resumen: ResumenFinanciero
  matriz: ProductoCanalMatriz[]
  ubicaciones: VRentabilidadUbicaciones[]
  clientesRanking: ClienteConsignacionRanking[]
  cuentasPorCobrar: { total: number; vencido: number }
}) {
  const canales = [
    {
      label: 'Stand',
      icon: Storefront,
      monto: resumen.ingresos_stand,
      color: 'text-emerald-600',
      detail: `${ubicaciones.length} ubicaciones`,
    },
    {
      label: 'Consignacion',
      icon: Handshake,
      monto: resumen.ingresos_consignacion,
      color: 'text-indigo-600',
      detail: `${clientesRanking.length} clientes`,
    },
    {
      label: 'Pedidos',
      icon: ShoppingCart,
      monto: resumen.ingresos_pedidos,
      color: 'text-amber-600',
      detail: 'Directos',
    },
  ]

  return (
    <div className="space-y-6">
      {/* 3 Canal cards */}
      <div className="grid grid-cols-3 gap-2">
        {canales.map((c) => {
          const Icon = c.icon
          const pct = resumen.ingresos_total > 0
            ? Math.round((c.monto / resumen.ingresos_total) * 100)
            : 0
          return (
            <Card key={c.label}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon size={14} weight="bold" />
                  {c.label}
                </div>
                <p className={`mt-1 text-lg font-bold ${c.color}`}>{formatMoney(c.monto)}</p>
                <p className="text-[11px] text-muted-foreground">{pct}% del total · {c.detail}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Cuentas por cobrar */}
      {cuentasPorCobrar.total > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900 dark:bg-amber-950/30">
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Cuentas por cobrar: {formatMoney(cuentasPorCobrar.total)}
            </p>
            {cuentasPorCobrar.vencido > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {formatMoney(cuentasPorCobrar.vencido)} vencidos (&gt;15 dias)
              </p>
            )}
          </div>
        </div>
      )}

      <Separator />

      {/* Matriz producto x canal */}
      <div>
        <h3 className="mb-3 text-sm font-medium">Producto x Canal (unidades)</h3>
        {matriz.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Sin datos</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-center">Stand</TableHead>
                  <TableHead className="text-center">Consig.</TableHead>
                  <TableHead className="text-center">Pedido</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matriz.slice(0, 15).map((r) => (
                  <TableRow key={r.producto_id}>
                    <TableCell className="text-sm">{r.producto_nombre}</TableCell>
                    <TableCell className="text-center text-sm">{r.stand_uds || '-'}</TableCell>
                    <TableCell className="text-center text-sm">{r.consignacion_uds || '-'}</TableCell>
                    <TableCell className="text-center text-sm">{r.pedidos_uds || '-'}</TableCell>
                    <TableCell className="text-right text-sm font-medium">{r.total_uds}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Separator />

      {/* Ranking clientes consignacion */}
      {clientesRanking.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium">Clientes consignacion</h3>
          <div className="space-y-2">
            {clientesRanking.map((c, i) => (
              <div
                key={c.id}
                className={`flex items-center justify-between gap-3 rounded-lg border bg-card p-3 ${
                  i < 3 ? 'border-emerald-200 dark:border-emerald-900' : 'border-border'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{c.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      Conversion: {c.tasa_conversion}% · {c.dias_transcurridos}d
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium">{formatMoney(c.total_vendido)}</p>
                  {c.saldo_pendiente > 0 && (
                    <Badge className="bg-amber-100 text-amber-700 text-[10px] dark:bg-amber-950 dark:text-amber-400">
                      Debe {formatMoney(c.saldo_pendiente)}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
