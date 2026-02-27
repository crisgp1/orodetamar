'use client'

import { Wallet, Warning, Clock, CheckCircle } from '@phosphor-icons/react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatMoney } from '@/lib/utils'
import type { VConsignacionesActivas } from '@/lib/types/database'

function getAntiguedad(dias: number): { label: string; style: string } {
  if (dias <= 7) return { label: '<7d', style: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' }
  if (dias <= 15) return { label: '7-15d', style: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400' }
  if (dias <= 30) return { label: '15-30d', style: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400' }
  return { label: '>30d', style: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' }
}

export function CollectionsTab({
  consignaciones,
  cobradoPeriodo,
}: {
  consignaciones: VConsignacionesActivas[]
  cobradoPeriodo: number
}) {
  const pendienteTotal = consignaciones.reduce((s, c) => s + c.saldo_pendiente, 0)
  const vencido = consignaciones.filter((c) => c.dias_transcurridos > 15 && c.saldo_pendiente > 0)
  const vencidoTotal = vencido.reduce((s, c) => s + c.saldo_pendiente, 0)
  const conSaldo = consignaciones.filter((c) => c.saldo_pendiente > 0).sort((a, b) => b.saldo_pendiente - a.saldo_pendiente)

  return (
    <div className="space-y-6">
      {/* 3 cards */}
      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CheckCircle size={12} weight="bold" />
              Cobrado
            </div>
            <p className="mt-1 text-lg font-bold text-emerald-600">{formatMoney(cobradoPeriodo)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock size={12} weight="bold" />
              Pendiente
            </div>
            <p className="mt-1 text-lg font-bold text-amber-600">{formatMoney(pendienteTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Warning size={12} weight="bold" />
              Vencido
            </div>
            <p className="mt-1 text-lg font-bold text-red-600">{formatMoney(vencidoTotal)}</p>
            <p className="text-[11px] text-muted-foreground">&gt;15 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista saldos pendientes */}
      {conSaldo.length > 0 ? (
        <div>
          <h3 className="mb-3 text-sm font-medium">Saldos pendientes por cliente</h3>
          <div className="space-y-2">
            {conSaldo.map((c) => {
              const ant = getAntiguedad(c.dias_transcurridos)
              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{c.cliente_nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      Vendido: {formatMoney(c.total_vendido)} · Cobrado: {formatMoney(c.total_cobrado)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-sm font-bold text-amber-600">{formatMoney(c.saldo_pendiente)}</p>
                    <Badge className={`text-[10px] ${ant.style}`}>{ant.label}</Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
          <Wallet size={32} weight="light" />
          <p className="text-sm">Sin saldos pendientes.</p>
        </div>
      )}

      {/* Producto en la calle */}
      {consignaciones.length > 0 && (
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">Producto en la calle (consignaciones activas)</p>
          <p className="text-lg font-bold">
            {formatMoney(consignaciones.reduce((s, c) => s + c.total_dejado, 0))}
          </p>
          <p className="text-xs text-muted-foreground">
            {consignaciones.length} consignacion(es) activa(s)
          </p>
        </div>
      )}
    </div>
  )
}
