'use client'

import {
  CurrencyDollar,
  TrendUp,
  Wallet,
} from '@phosphor-icons/react'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatMoney } from '@/lib/utils'
import type { ResumenFinanciero, MixCanal, Insight, DatoDiario, ProductoRentabilidad } from '@/lib/utils/rentabilidad'
import type { VIngresosConsolidados, VRentabilidadUbicaciones, Gasto } from '@/lib/types/database'
import type { HealthArea } from '@/lib/utils/health-score'
import { HealthSemaphore } from './health-semaphore'
import { TendenciaIndicator } from './tendencia-indicator'
import { InsightsBanner } from './insights-banner'
import { Sparkline } from './sparkline'
import { ChartComparativaMensual } from './chart-comparativa-mensual'
import { ChartMixCanales } from './chart-mix-canales'

export function PulseTab({
  resumen,
  efectivoReal,
  mix,
  insights,
  health,
  ingresosDiarios,
  productos,
  ubicaciones,
  ingresos,
  gastos,
}: {
  resumen: ResumenFinanciero
  efectivoReal: number
  mix: MixCanal[]
  insights: Insight[]
  health: HealthArea[]
  ingresosDiarios: DatoDiario[]
  productos: ProductoRentabilidad[]
  ubicaciones: VRentabilidadUbicaciones[]
  ingresos: VIngresosConsolidados[]
  gastos: Gasto[]
}) {
  const sparkData = ingresosDiarios.map((d) => ({ value: d.monto }))

  return (
    <div className="space-y-5">
      {/* Semaforo de salud */}
      <HealthSemaphore areas={health} />

      {/* 3 Hero cards */}
      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CurrencyDollar size={12} weight="bold" />
              Ingresos
            </div>
            <div className="mt-1 flex items-center justify-between">
              <p className="text-xl font-bold">{formatMoney(resumen.ingresos_total)}</p>
              <Sparkline data={sparkData} color="#10b981" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendUp size={12} weight="bold" />
              Utilidad
            </div>
            <p className={`mt-1 text-xl font-bold ${resumen.utilidad_bruta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {resumen.utilidad_bruta < 0 ? '-' : ''}{formatMoney(Math.abs(resumen.utilidad_bruta))}
            </p>
            <TendenciaIndicator valor={resumen.margen_bruto_pct} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Wallet size={12} weight="bold" />
              Efectivo
            </div>
            <p className={`mt-1 text-xl font-bold ${efectivoReal >= 0 ? 'text-foreground' : 'text-red-600'}`}>
              {efectivoReal < 0 ? '-' : ''}{formatMoney(Math.abs(efectivoReal))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <InsightsBanner insights={insights} />

      {/* Mini tablas: top 3 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <h4 className="mb-1.5 text-xs font-medium text-muted-foreground">Top productos</h4>
          <div className="space-y-1">
            {productos.slice(0, 3).map((p, i) => (
              <div key={p.producto_id} className="flex items-center justify-between rounded border border-border bg-card px-2 py-1.5">
                <span className="truncate text-xs">{i + 1}. {p.producto_nombre}</span>
                <span className="shrink-0 text-xs font-medium">{formatMoney(p.ingreso_total)}</span>
              </div>
            ))}
            {productos.length === 0 && <p className="text-xs text-muted-foreground">Sin datos</p>}
          </div>
        </div>
        <div>
          <h4 className="mb-1.5 text-xs font-medium text-muted-foreground">Top stands</h4>
          <div className="space-y-1">
            {ubicaciones.slice(0, 3).map((u, i) => (
              <div key={u.ubicacion_id} className="flex items-center justify-between rounded border border-border bg-card px-2 py-1.5">
                <span className="truncate text-xs">{i + 1}. {u.ubicacion}</span>
                <span className="shrink-0 text-xs font-medium">{formatMoney(u.total_ventas)}</span>
              </div>
            ))}
            {ubicaciones.length === 0 && <p className="text-xs text-muted-foreground">Sin datos</p>}
          </div>
        </div>
      </div>

      <Separator />

      {/* Comparativa mensual */}
      <div>
        <h3 className="mb-3 text-sm font-medium">Ingresos vs egresos</h3>
        <ChartComparativaMensual ingresos={ingresos} gastos={gastos} />
      </div>

      <Separator />

      {/* Mix canales */}
      <div>
        <h3 className="mb-3 text-sm font-medium">Mix de canales</h3>
        <ChartMixCanales mix={mix} />
      </div>
    </div>
  )
}
