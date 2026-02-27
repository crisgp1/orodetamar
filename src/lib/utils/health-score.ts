import type { VConsignacionesActivas } from '@/lib/types/database'
import type { ResumenFinanciero } from './rentabilidad'

export type HealthStatus = 'verde' | 'amarillo' | 'rojo'

export type HealthArea = {
  area: 'ventas' | 'margen' | 'cobranza' | 'inventario'
  status: HealthStatus
  mensaje: string
}

type StockForHealth = { alerta: 'AGOTADO' | 'STOCK_BAJO' | 'OK' }

export function calcularSaludVentas(
  ingresosActual: number,
  ingresosAnterior: number
): HealthArea {
  if (ingresosAnterior === 0) {
    return {
      area: 'ventas',
      status: ingresosActual > 0 ? 'verde' : 'amarillo',
      mensaje: ingresosActual > 0 ? 'Primeras ventas registradas' : 'Sin ventas en el periodo',
    }
  }
  const ratio = ingresosActual / ingresosAnterior
  if (ratio >= 1) {
    const pct = Math.round((ratio - 1) * 100)
    return { area: 'ventas', status: 'verde', mensaje: `Crecimiento del ${pct}% vs anterior` }
  }
  if (ratio >= 0.8) {
    const pct = Math.round((1 - ratio) * 100)
    return { area: 'ventas', status: 'amarillo', mensaje: `Baja del ${pct}% vs anterior` }
  }
  const pct = Math.round((1 - ratio) * 100)
  return { area: 'ventas', status: 'rojo', mensaje: `Caida del ${pct}% vs anterior` }
}

export function calcularSaludMargen(resumen: ResumenFinanciero): HealthArea {
  const m = resumen.margen_bruto_pct
  if (m > 30) return { area: 'margen', status: 'verde', mensaje: `Margen del ${m}%` }
  if (m >= 15) return { area: 'margen', status: 'amarillo', mensaje: `Margen del ${m}% — espacio de mejora` }
  return { area: 'margen', status: 'rojo', mensaje: `Margen del ${m}% — revisar costos` }
}

export function calcularSaludCobranza(
  consignacionesActivas: VConsignacionesActivas[],
  ingresosTotal: number
): HealthArea {
  const pendiente = consignacionesActivas.reduce((s, c) => s + c.saldo_pendiente, 0)
  const vencido = consignacionesActivas.filter((c) => c.dias_transcurridos > 15 && c.saldo_pendiente > 0)
  const pctPendiente = ingresosTotal > 0 ? Math.round((pendiente / ingresosTotal) * 100) : 0

  if (vencido.length > 0) {
    const totalVencido = vencido.reduce((s, c) => s + c.saldo_pendiente, 0)
    return {
      area: 'cobranza',
      status: 'rojo',
      mensaje: `$${Math.round(totalVencido).toLocaleString('es-MX')} vencidos >15 dias`,
    }
  }
  if (pctPendiente > 30) {
    return {
      area: 'cobranza',
      status: 'amarillo',
      mensaje: `${pctPendiente}% de ingresos por cobrar`,
    }
  }
  if (pendiente > 0) {
    return {
      area: 'cobranza',
      status: 'verde',
      mensaje: `$${Math.round(pendiente).toLocaleString('es-MX')} por cobrar`,
    }
  }
  return { area: 'cobranza', status: 'verde', mensaje: 'Sin saldos pendientes' }
}

export function calcularSaludInventario(stock: StockForHealth[]): HealthArea {
  const criticos = stock.filter((s) => s.alerta === 'AGOTADO' || s.alerta === 'STOCK_BAJO')
  if (criticos.length >= 3) {
    return { area: 'inventario', status: 'rojo', mensaje: `${criticos.length} productos con stock critico` }
  }
  if (criticos.length > 0) {
    return { area: 'inventario', status: 'amarillo', mensaje: `${criticos.length} producto(s) stock bajo` }
  }
  return { area: 'inventario', status: 'verde', mensaje: 'Stock saludable' }
}

export function calcularSaludCompleta(
  resumen: ResumenFinanciero,
  ingresosAnterior: number,
  consignaciones: VConsignacionesActivas[],
  stock: StockForHealth[]
): HealthArea[] {
  return [
    calcularSaludVentas(resumen.ingresos_total, ingresosAnterior),
    calcularSaludMargen(resumen),
    calcularSaludCobranza(consignaciones, resumen.ingresos_total),
    calcularSaludInventario(stock),
  ]
}
