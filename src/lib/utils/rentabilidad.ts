import type {
  VIngresosConsolidados,
  VCostosProduccionPeriodo,
  VRentabilidadUbicaciones,
  VConsignacionesActivas,
  Gasto,
} from '@/lib/types/database'

// ── Types ────────────────────────────────────────────────────

export type PeriodoRentabilidad = 'mes_actual' | 'mes_anterior' | 'trimestre' | 'anual'

export type ResumenFinanciero = {
  ingresos_total: number
  ingresos_stand: number
  ingresos_consignacion: number
  ingresos_pedidos: number
  egresos_total: number
  egresos_compras_mp: number
  egresos_gastos: number
  utilidad_bruta: number
  margen_bruto_pct: number
}

export type ProductoRentabilidad = {
  producto_id: number
  producto_nombre: string
  presentacion: string
  precio_venta: number
  costo_unitario: number
  margen_porcentaje: number
  unidades_vendidas: number
  ingreso_total: number
  // Per-channel breakdown
  uds_stand: number
  uds_consignacion: number
  uds_pedidos: number
}

export type MixCanal = {
  canal: string
  monto: number
  porcentaje: number
}

export type Insight = {
  tipo: 'positivo' | 'negativo' | 'neutro'
  mensaje: string
}

export type GastoAgrupado = {
  tipo: string
  monto: number
  porcentaje: number
}

export type ProductoCanalMatriz = {
  producto_id: number
  producto_nombre: string
  stand_uds: number
  stand_monto: number
  consignacion_uds: number
  consignacion_monto: number
  pedidos_uds: number
  pedidos_monto: number
  total_uds: number
  total_monto: number
}

export type ClienteConsignacionRanking = {
  id: number
  nombre: string
  total_dejado: number
  total_vendido: number
  total_cobrado: number
  saldo_pendiente: number
  dias_transcurridos: number
  tasa_conversion: number
}

export type DatoDiario = {
  fecha: string
  monto: number
}

// ── Calculos principales ────────────────────────────────────

export function calcularRentabilidad(
  ingresos: VIngresosConsolidados[],
  gastos: Gasto[],
  comprasMP: number
): ResumenFinanciero {
  const ingresos_stand = ingresos
    .filter((i) => i.canal === 'STAND')
    .reduce((sum, i) => sum + i.monto, 0)
  const ingresos_consignacion = ingresos
    .filter((i) => i.canal === 'CONSIGNACION')
    .reduce((sum, i) => sum + i.monto, 0)
  const ingresos_pedidos = ingresos
    .filter((i) => i.canal === 'PEDIDO')
    .reduce((sum, i) => sum + i.monto, 0)
  const ingresos_total = ingresos_stand + ingresos_consignacion + ingresos_pedidos

  const egresos_gastos = gastos.reduce((sum, g) => sum + g.monto, 0)
  const egresos_total = comprasMP + egresos_gastos
  const utilidad_bruta = ingresos_total - egresos_total
  const margen_bruto_pct =
    ingresos_total > 0
      ? Math.round((utilidad_bruta / ingresos_total) * 1000) / 10
      : 0

  return {
    ingresos_total,
    ingresos_stand,
    ingresos_consignacion,
    ingresos_pedidos,
    egresos_total,
    egresos_compras_mp: comprasMP,
    egresos_gastos,
    utilidad_bruta,
    margen_bruto_pct,
  }
}

export function calcularMixCanales(resumen: ResumenFinanciero): MixCanal[] {
  const total = resumen.ingresos_total
  if (total === 0) return []
  return [
    { canal: 'Stand', monto: resumen.ingresos_stand, porcentaje: Math.round((resumen.ingresos_stand / total) * 1000) / 10 },
    { canal: 'Consignacion', monto: resumen.ingresos_consignacion, porcentaje: Math.round((resumen.ingresos_consignacion / total) * 1000) / 10 },
    { canal: 'Pedidos', monto: resumen.ingresos_pedidos, porcentaje: Math.round((resumen.ingresos_pedidos / total) * 1000) / 10 },
  ].filter((c) => c.monto > 0)
}

export function calcularProductosRentabilidad(
  ingresos: VIngresosConsolidados[],
  costos: VCostosProduccionPeriodo[]
): ProductoRentabilidad[] {
  const costosMap = new Map(costos.map((c) => [c.producto_id, c]))

  const porProducto = new Map<number, {
    uds: number; monto: number
    uds_stand: number; uds_consignacion: number; uds_pedidos: number
  }>()

  for (const i of ingresos) {
    const prev = porProducto.get(i.producto_id) ?? {
      uds: 0, monto: 0, uds_stand: 0, uds_consignacion: 0, uds_pedidos: 0,
    }
    prev.uds += i.cantidad_vendida
    prev.monto += i.monto
    if (i.canal === 'STAND') prev.uds_stand += i.cantidad_vendida
    else if (i.canal === 'CONSIGNACION') prev.uds_consignacion += i.cantidad_vendida
    else if (i.canal === 'PEDIDO') prev.uds_pedidos += i.cantidad_vendida
    porProducto.set(i.producto_id, prev)
  }

  const result: ProductoRentabilidad[] = []
  for (const [productoId, data] of porProducto) {
    const costo = costosMap.get(productoId)
    result.push({
      producto_id: productoId,
      producto_nombre: costo?.producto_nombre ?? `Producto #${productoId}`,
      presentacion: costo?.presentacion ?? '',
      precio_venta: costo?.precio_venta ?? 0,
      costo_unitario: costo?.costo_unitario ?? 0,
      margen_porcentaje: costo?.margen_porcentaje ?? 0,
      unidades_vendidas: data.uds,
      ingreso_total: data.monto,
      uds_stand: data.uds_stand,
      uds_consignacion: data.uds_consignacion,
      uds_pedidos: data.uds_pedidos,
    })
  }

  return result.sort((a, b) => b.ingreso_total - a.ingreso_total)
}

export function calcularVentasPorUbicacion(
  ubicaciones: VRentabilidadUbicaciones[]
): VRentabilidadUbicaciones[] {
  return [...ubicaciones].sort((a, b) => b.total_ventas - a.total_ventas)
}

// ── Matriz producto x canal ────────────────────────────────

export function calcularMatrizProductoCanal(
  ingresos: VIngresosConsolidados[],
  costos: VCostosProduccionPeriodo[]
): ProductoCanalMatriz[] {
  const costosMap = new Map(costos.map((c) => [c.producto_id, c]))
  const map = new Map<number, ProductoCanalMatriz>()

  for (const i of ingresos) {
    if (!map.has(i.producto_id)) {
      const c = costosMap.get(i.producto_id)
      map.set(i.producto_id, {
        producto_id: i.producto_id,
        producto_nombre: c?.producto_nombre ?? i.producto_nombre,
        stand_uds: 0, stand_monto: 0,
        consignacion_uds: 0, consignacion_monto: 0,
        pedidos_uds: 0, pedidos_monto: 0,
        total_uds: 0, total_monto: 0,
      })
    }
    const row = map.get(i.producto_id)!
    row.total_uds += i.cantidad_vendida
    row.total_monto += i.monto
    if (i.canal === 'STAND') { row.stand_uds += i.cantidad_vendida; row.stand_monto += i.monto }
    else if (i.canal === 'CONSIGNACION') { row.consignacion_uds += i.cantidad_vendida; row.consignacion_monto += i.monto }
    else if (i.canal === 'PEDIDO') { row.pedidos_uds += i.cantidad_vendida; row.pedidos_monto += i.monto }
  }

  return Array.from(map.values()).sort((a, b) => b.total_monto - a.total_monto)
}

// ── Gastos agrupados ────────────────────────────────────────

const GASTO_LABELS: Record<string, string> = {
  GASOLINA: 'Gasolina',
  PERMISO: 'Permiso',
  MATERIA_PRIMA: 'Materia Prima',
  EMPAQUE: 'Empaque',
  RENTA: 'Renta',
  HERRAMIENTA: 'Herramienta',
  MARKETING: 'Marketing',
  OTRO: 'Otro',
}

export function agruparGastos(gastos: Gasto[]): GastoAgrupado[] {
  const map = new Map<string, number>()
  for (const g of gastos) {
    map.set(g.tipo, (map.get(g.tipo) ?? 0) + g.monto)
  }
  const total = gastos.reduce((s, g) => s + g.monto, 0)
  return Array.from(map.entries())
    .map(([tipo, monto]) => ({
      tipo: GASTO_LABELS[tipo] ?? tipo,
      monto,
      porcentaje: total > 0 ? Math.round((monto / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.monto - a.monto)
}

// ── Ranking clientes consignacion ───────────────────────────

export function calcularRankingClientes(
  consignaciones: VConsignacionesActivas[]
): ClienteConsignacionRanking[] {
  const map = new Map<number, ClienteConsignacionRanking>()

  for (const c of consignaciones) {
    if (!map.has(c.cliente_id)) {
      map.set(c.cliente_id, {
        id: c.cliente_id,
        nombre: c.cliente_nombre,
        total_dejado: 0,
        total_vendido: 0,
        total_cobrado: 0,
        saldo_pendiente: 0,
        dias_transcurridos: 0,
        tasa_conversion: 0,
      })
    }
    const r = map.get(c.cliente_id)!
    r.total_dejado += c.total_dejado
    r.total_vendido += c.total_vendido
    r.total_cobrado += c.total_cobrado
    r.saldo_pendiente += c.saldo_pendiente
    r.dias_transcurridos = Math.max(r.dias_transcurridos, c.dias_transcurridos)
  }

  for (const r of map.values()) {
    r.tasa_conversion = r.total_dejado > 0
      ? Math.round((r.total_vendido / r.total_dejado) * 1000) / 10
      : 0
  }

  return Array.from(map.values()).sort((a, b) => b.total_vendido - a.total_vendido)
}

// ── Ingresos diarios ────────────────────────────────────────

export function calcularIngresosDiarios(ingresos: VIngresosConsolidados[]): DatoDiario[] {
  const map = new Map<string, number>()
  for (const i of ingresos) {
    const fecha = i.fecha.slice(0, 10)
    map.set(fecha, (map.get(fecha) ?? 0) + i.monto)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, monto]) => ({ fecha, monto: Math.round(monto) }))
}

// ── Efectivo cobrado (stand = instant, consig/pedido = pagos) ──

export function calcularEfectivoReal(
  resumen: ResumenFinanciero,
  consignaciones: VConsignacionesActivas[]
): number {
  const cobradoConsig = consignaciones.reduce((s, c) => s + c.total_cobrado, 0)
  // Stand se cobra al instante, pedidos se asume cobrado
  return resumen.ingresos_stand + cobradoConsig + resumen.ingresos_pedidos - resumen.egresos_total
}

// ── Cuentas por cobrar ──────────────────────────────────────

export function calcularCuentasPorCobrar(
  consignaciones: VConsignacionesActivas[]
): { total: number; vencido: number } {
  const total = consignaciones.reduce((s, c) => s + c.saldo_pendiente, 0)
  const vencido = consignaciones
    .filter((c) => c.dias_transcurridos > 15 && c.saldo_pendiente > 0)
    .reduce((s, c) => s + c.saldo_pendiente, 0)
  return { total, vencido }
}

// ── Insights ────────────────────────────────────────────────

export function generarInsights(
  resumen: ResumenFinanciero,
  productos: ProductoRentabilidad[],
  ubicaciones: VRentabilidadUbicaciones[],
  consignaciones: VConsignacionesActivas[]
): Insight[] {
  const insights: Insight[] = []

  // Margen
  if (resumen.ingresos_total > 0) {
    if (resumen.margen_bruto_pct >= 50) {
      insights.push({ tipo: 'positivo', mensaje: `Margen bruto de ${resumen.margen_bruto_pct}% — excelente.` })
    } else if (resumen.margen_bruto_pct >= 30) {
      insights.push({ tipo: 'neutro', mensaje: `Margen bruto de ${resumen.margen_bruto_pct}% — aceptable.` })
    } else {
      insights.push({ tipo: 'negativo', mensaje: `Margen bruto de ${resumen.margen_bruto_pct}% — revisar costos o precios.` })
    }
  }

  // Producto estrella
  if (productos.length > 0) {
    insights.push({
      tipo: 'positivo',
      mensaje: `"${productos[0].producto_nombre}" es el producto estrella con ${productos[0].unidades_vendidas} uds.`,
    })
  }

  // Margen bajo
  const mb = productos.find((p) => p.margen_porcentaje < 25 && p.unidades_vendidas > 0)
  if (mb) {
    insights.push({ tipo: 'negativo', mensaje: `"${mb.producto_nombre}" tiene margen de ${mb.margen_porcentaje}% — ajustar precio.` })
  }

  // Canal dominante
  const mix = calcularMixCanales(resumen)
  if (mix.length > 0 && mix[0].porcentaje > 70) {
    insights.push({ tipo: 'neutro', mensaje: `${mix[0].porcentaje}% de ingresos viene de ${mix[0].canal} — diversificar reduce riesgo.` })
  }

  // Cobranza pendiente
  const pendiente = consignaciones.reduce((s, c) => s + c.saldo_pendiente, 0)
  if (pendiente > 0 && resumen.ingresos_total > 0) {
    const pct = Math.round((pendiente / resumen.ingresos_total) * 100)
    if (pct > 30) {
      insights.push({ tipo: 'negativo', mensaje: `${pct}% de ingresos pendientes de cobro.` })
    }
  }

  // Ubicacion top
  if (ubicaciones.length > 0) {
    insights.push({ tipo: 'positivo', mensaje: `"${ubicaciones[0].ubicacion}" genera mayor venta en stand.` })
  }

  return insights.slice(0, 3)
}
