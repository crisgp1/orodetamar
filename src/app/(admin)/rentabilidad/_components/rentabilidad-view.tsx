'use client'

import { useRouter } from 'next/navigation'
import { TrendUp } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type {
  VIngresosConsolidados,
  VCostosProduccionPeriodo,
  VRentabilidadUbicaciones,
  VConsignacionesActivas,
  Gasto,
} from '@/lib/types/database'
import type { PeriodoRentabilidad } from '@/lib/utils/rentabilidad'
import {
  calcularRentabilidad,
  calcularMixCanales,
  calcularProductosRentabilidad,
  calcularVentasPorUbicacion,
  calcularMatrizProductoCanal,
  agruparGastos,
  calcularRankingClientes,
  calcularIngresosDiarios,
  calcularEfectivoReal,
  calcularCuentasPorCobrar,
  generarInsights,
} from '@/lib/utils/rentabilidad'
import { calcularSaludCompleta } from '@/lib/utils/health-score'
import { PulseTab } from './pulse-tab'
import { ChannelsTab } from './channels-tab'
import { ProductosTab } from './productos-tab'
import { StandsTab } from './stands-tab'
import { CostsTab } from './costs-tab'
import { CollectionsTab } from './collections-tab'

const PERIODO_LABELS: Record<PeriodoRentabilidad, string> = {
  mes_actual: 'Este mes',
  mes_anterior: 'Mes anterior',
  trimestre: 'Trimestre',
  anual: 'Anual',
}

function formatFechaRango(desde: string, hasta: string) {
  const fmt = (f: string) =>
    new Date(f + 'T12:00:00').toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
    })
  return desde === hasta ? fmt(desde) : `${fmt(desde)} - ${fmt(hasta)}`
}

export function RentabilidadView({
  ingresos,
  ingresosPrevTotal,
  costos,
  ubicaciones,
  gastos,
  comprasMP,
  consignaciones,
  stock,
  periodo,
  desde,
  hasta,
}: {
  ingresos: VIngresosConsolidados[]
  ingresosPrevTotal: number
  costos: VCostosProduccionPeriodo[]
  ubicaciones: VRentabilidadUbicaciones[]
  gastos: Gasto[]
  comprasMP: number
  consignaciones: VConsignacionesActivas[]
  stock: { producto_id: number; producto_nombre: string; cantidad_disponible: number; alerta: 'AGOTADO' | 'STOCK_BAJO' | 'OK' }[]
  periodo: PeriodoRentabilidad
  desde: string
  hasta: string
}) {
  const router = useRouter()
  const mounted = true

  // Calculos
  const resumen = calcularRentabilidad(ingresos, gastos, comprasMP)
  const mix = calcularMixCanales(resumen)
  const productos = calcularProductosRentabilidad(ingresos, costos)
  const ubicacionesOrdenadas = calcularVentasPorUbicacion(ubicaciones)
  const insights = generarInsights(resumen, productos, ubicacionesOrdenadas, consignaciones)
  const health = calcularSaludCompleta(resumen, ingresosPrevTotal, consignaciones, stock)
  const ingresosDiarios = calcularIngresosDiarios(ingresos)
  const efectivoReal = calcularEfectivoReal(resumen, consignaciones)
  const gastosAgrupados = agruparGastos(gastos)
  const matriz = calcularMatrizProductoCanal(ingresos, costos)
  const clientesRanking = calcularRankingClientes(consignaciones)
  const cuentasPorCobrar = calcularCuentasPorCobrar(consignaciones)
  const cobradoPeriodo = consignaciones.reduce((s, c) => s + c.total_cobrado, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-md bg-muted p-2 text-muted-foreground">
          <TrendUp size={24} weight="regular" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Rentabilidad</h1>
          <p className="text-sm text-muted-foreground">
            {formatFechaRango(desde, hasta)}
          </p>
        </div>
      </div>

      {/* Filtros periodo */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(PERIODO_LABELS) as PeriodoRentabilidad[]).map((p) => (
          <Button
            key={p}
            variant={periodo === p ? 'default' : 'outline'}
            size="sm"
            onClick={() => router.push(`/rentabilidad?periodo=${p}`)}
          >
            {PERIODO_LABELS[p]}
          </Button>
        ))}
      </div>

      {/* Tabs — render only after mount to avoid Radix useId() hydration mismatch */}
      {mounted ? (
        <Tabs defaultValue="pulso" className="w-full">
          <TabsList className="w-full grid grid-cols-3 sm:grid-cols-6">
            <TabsTrigger value="pulso">Pulso</TabsTrigger>
            <TabsTrigger value="canales">Canales</TabsTrigger>
            <TabsTrigger value="productos">Productos</TabsTrigger>
            <TabsTrigger value="ubicaciones">Ubicaciones</TabsTrigger>
            <TabsTrigger value="costos">Costos</TabsTrigger>
            <TabsTrigger value="cobros">Cobros</TabsTrigger>
          </TabsList>

          <TabsContent value="pulso" className="mt-4">
            <PulseTab
              resumen={resumen}
              efectivoReal={efectivoReal}
              mix={mix}
              insights={insights}
              health={health}
              ingresosDiarios={ingresosDiarios}
              productos={productos}
              ubicaciones={ubicacionesOrdenadas}
              ingresos={ingresos}
              gastos={gastos}
            />
          </TabsContent>

          <TabsContent value="canales" className="mt-4">
            <ChannelsTab
              resumen={resumen}
              matriz={matriz}
              ubicaciones={ubicacionesOrdenadas}
              clientesRanking={clientesRanking}
              cuentasPorCobrar={cuentasPorCobrar}
            />
          </TabsContent>

          <TabsContent value="productos" className="mt-4">
            <ProductosTab productos={productos} />
          </TabsContent>

          <TabsContent value="ubicaciones" className="mt-4">
            <StandsTab ubicaciones={ubicacionesOrdenadas} />
          </TabsContent>

          <TabsContent value="costos" className="mt-4">
            <CostsTab
              comprasMP={comprasMP}
              gastosTotal={resumen.egresos_gastos}
              gastosAgrupados={gastosAgrupados}
              costos={costos}
            />
          </TabsContent>

          <TabsContent value="cobros" className="mt-4">
            <CollectionsTab
              consignaciones={consignaciones}
              cobradoPeriodo={cobradoPeriodo}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="space-y-4">
          <div className="grid w-full grid-cols-3 gap-1 rounded-lg bg-muted p-1 sm:grid-cols-6">
            {['Pulso', 'Canales', 'Productos', 'Ubicaciones', 'Costos', 'Cobros'].map((t) => (
              <div key={t} className="rounded-md px-3 py-1.5 text-center text-sm text-muted-foreground">
                {t}
              </div>
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
        </div>
      )}
    </div>
  )
}
