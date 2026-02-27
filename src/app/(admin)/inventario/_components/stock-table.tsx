'use client'

import {
  CheckCircle,
  Warning,
  XCircle,
} from '@phosphor-icons/react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { VStockActual } from '@/lib/types/database'

function alertaBadge(alerta: VStockActual['alerta']) {
  switch (alerta) {
    case 'AGOTADO':
      return (
        <Badge className="gap-1 bg-red-100 text-red-700 hover:bg-red-100">
          <XCircle size={14} weight="fill" />
          Agotado
        </Badge>
      )
    case 'STOCK_BAJO':
      return (
        <Badge className="gap-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
          <Warning size={14} weight="fill" />
          Stock bajo
        </Badge>
      )
    case 'OK':
      return (
        <Badge className="gap-1 bg-green-100 text-green-700 hover:bg-green-100">
          <CheckCircle size={14} weight="fill" />
          OK
        </Badge>
      )
  }
}

function tiempoRelativo(fecha: string) {
  const ahora = Date.now()
  const entonces = new Date(fecha).getTime()
  const diffMs = ahora - entonces

  const minutos = Math.floor(diffMs / 60_000)
  if (minutos < 1) return 'ahora mismo'
  if (minutos < 60) return `hace ${minutos} min`

  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `hace ${horas}h`

  const dias = Math.floor(horas / 24)
  if (dias < 30) return `hace ${dias}d`

  const meses = Math.floor(dias / 30)
  return `hace ${meses} mes${meses > 1 ? 'es' : ''}`
}

export function StockTable({ stock }: { stock: VStockActual[] }) {
  if (stock.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        No hay productos en inventario.
      </p>
    )
  }

  return (
    <>
      {/* Desktop: tabla */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Alerta</TableHead>
              <TableHead>Actualizado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stock.map((item) => (
              <TableRow key={item.producto_id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{item.producto_nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.presentacion}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {item.sku || '—'}
                </TableCell>
                <TableCell>{item.categoria}</TableCell>
                <TableCell className="text-right font-semibold">
                  {item.cantidad_disponible}
                </TableCell>
                <TableCell>{alertaBadge(item.alerta)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {tiempoRelativo(item.ultima_actualizacion)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {stock.map((item) => (
          <div
            key={item.producto_id}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="mb-2 flex items-start justify-between">
              <div>
                <p className="font-medium">{item.producto_nombre}</p>
                <p className="text-xs text-muted-foreground">
                  {item.presentacion}
                  {item.sku ? ` · ${item.sku}` : ''}
                </p>
              </div>
              {alertaBadge(item.alerta)}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{item.categoria}</span>
              <span className="text-lg font-semibold">
                {item.cantidad_disponible} uds
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {tiempoRelativo(item.ultima_actualizacion)}
            </p>
          </div>
        ))}
      </div>
    </>
  )
}
