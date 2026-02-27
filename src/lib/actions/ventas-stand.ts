'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/server'
import { fechaHoyTijuana } from '@/lib/utils'
import {
  registrarVentaStandSchema,
  registrarCierreStandSchema,
  type RegistrarVentaStandInput,
  type RegistrarCierreStandInput,
} from '@/lib/validations/ventas-stand'

function revalidar() {
  revalidatePath('/ventas-stand')
  revalidatePath('/pos')
  revalidatePath('/inventario')
  revalidatePath('/dashboard')
  revalidatePath('/rentabilidad')
}

export async function registrarVentaStand(data: RegistrarVentaStandInput) {
  const parsed = registrarVentaStandSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createServerSupabase()

  // 1. INSERT ventas_stand
  const { error } = await supabase.from('ventas_stand').insert({
    ubicacion_id: parsed.data.ubicacion_id,
    producto_id: parsed.data.producto_id,
    fecha: fechaHoyTijuana(),
    cantidad_vendida: parsed.data.cantidad_vendida,
    total: parsed.data.total,
    metodo_pago: parsed.data.metodo_pago,
    notas: parsed.data.notas?.trim() || null,
  })

  if (error) return { error: error.message }

  // 2. INSERT movimientos_inventario tipo VENTA (descuenta stock)
  const { error: movError } = await supabase
    .from('movimientos_inventario')
    .insert({
      producto_id: parsed.data.producto_id,
      tipo: 'VENTA',
      cantidad: -parsed.data.cantidad_vendida,
      notas: 'Venta rápida stand',
    })

  if (movError) return { error: movError.message }

  revalidar()
  return { ok: true }
}

/** @deprecated Usa registrarCierreStandPOS en su lugar. Esta función duplica ventas/movimientos. */
export async function registrarCierreStand(data: RegistrarCierreStandInput) {
  const parsed = registrarCierreStandSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createServerSupabase()

  const productosConCantidad = parsed.data.productos.filter(
    (p) => p.cantidad_llevada > 0
  )

  if (productosConCantidad.length === 0) {
    return { error: 'Agrega al menos un producto con cantidad' }
  }

  // 1. INSERT cierres_stand
  const cierreRows = productosConCantidad.map((p) => ({
    ubicacion_id: parsed.data.ubicacion_id,
    fecha: parsed.data.fecha,
    producto_id: p.producto_id,
    cantidad_llevada: p.cantidad_llevada,
    cantidad_vendida: p.cantidad_vendida,
    cantidad_retornada: p.cantidad_retornada,
    notas: p.notas?.trim() || null,
  }))

  const { error: cierreError } = await supabase
    .from('cierres_stand')
    .insert(cierreRows)

  if (cierreError) return { error: cierreError.message }

  // 2. Por cada producto vendido: INSERT ventas_stand + movimiento inventario VENTA
  const productosVendidos = productosConCantidad.filter(
    (p) => p.cantidad_vendida > 0
  )

  if (productosVendidos.length > 0) {
    const productoIds = productosVendidos.map((p) => p.producto_id)
    const { data: productosDB } = await supabase
      .from('productos')
      .select('id, precio_venta')
      .in('id', productoIds)

    const precioMap = new Map(
      (productosDB ?? []).map((p) => [p.id, p.precio_venta])
    )

    // INSERT ventas_stand
    const ventaRows = productosVendidos.map((p) => ({
      ubicacion_id: parsed.data.ubicacion_id,
      fecha: parsed.data.fecha,
      producto_id: p.producto_id,
      cantidad_vendida: p.cantidad_vendida,
      total: p.cantidad_vendida * (precioMap.get(p.producto_id) ?? 0),
      metodo_pago: parsed.data.metodo_pago,
      notas: p.notas?.trim() || null,
    }))

    const { error: ventaError } = await supabase
      .from('ventas_stand')
      .insert(ventaRows)

    if (ventaError) return { error: ventaError.message }

    // INSERT movimientos_inventario tipo VENTA (negativo = descuenta stock)
    const movRows = productosVendidos.map((p) => ({
      producto_id: p.producto_id,
      tipo: 'VENTA' as const,
      cantidad: -p.cantidad_vendida,
      notas: `Venta stand cierre ${parsed.data.fecha}`,
    }))

    const { error: movError } = await supabase
      .from('movimientos_inventario')
      .insert(movRows)

    if (movError) return { error: movError.message }
  }

  revalidar()
  return { ok: true }
}

export async function registrarCierreStandPOS(data: {
  ubicacion_id: number
  fecha: string
  productos: Array<{
    producto_id: number
    cantidad_llevada: number
    cantidad_vendida_pos: number
    cantidad_vendida_total: number
  }>
  notas: string | null
}) {
  const supabase = createServerSupabase()

  const productosActivos = data.productos.filter(
    (p) => p.cantidad_llevada > 0 || p.cantidad_vendida_total > 0
  )

  if (productosActivos.length === 0) {
    return { error: 'No hay productos para registrar' }
  }

  // 1. INSERT cierres_stand (control de inventario)
  const cierreRows = productosActivos.map((p) => ({
    ubicacion_id: data.ubicacion_id,
    fecha: data.fecha,
    producto_id: p.producto_id,
    cantidad_llevada: p.cantidad_llevada,
    cantidad_vendida: p.cantidad_vendida_total,
    cantidad_retornada: Math.max(0, p.cantidad_llevada - p.cantidad_vendida_total),
    notas: data.notas?.trim() || null,
  }))

  const { error: cierreError } = await supabase
    .from('cierres_stand')
    .insert(cierreRows)

  if (cierreError) return { error: cierreError.message }

  // 2. Ventas no registradas en POS → INSERT en ventas_stand + movimiento
  const sinRegistrar = productosActivos.filter(
    (p) => p.cantidad_vendida_total > p.cantidad_vendida_pos
  )

  if (sinRegistrar.length > 0) {
    const productoIds = sinRegistrar.map((p) => p.producto_id)
    const { data: productosDB } = await supabase
      .from('productos')
      .select('id, precio_venta')
      .in('id', productoIds)

    const precioMap = new Map(
      (productosDB ?? []).map((p) => [p.id, p.precio_venta])
    )

    const ventaRows = sinRegistrar.map((p) => {
      const diff = p.cantidad_vendida_total - p.cantidad_vendida_pos
      return {
        ubicacion_id: data.ubicacion_id,
        fecha: data.fecha,
        producto_id: p.producto_id,
        cantidad_vendida: diff,
        total: diff * (precioMap.get(p.producto_id) ?? 0),
        metodo_pago: 'EFECTIVO' as const,
        notas: `Registrado en cierre (${diff} uds sin POS)`,
      }
    })

    const { error: ventaError } = await supabase
      .from('ventas_stand')
      .insert(ventaRows)

    if (ventaError) return { error: ventaError.message }

    const movRows = sinRegistrar.map((p) => {
      const diff = p.cantidad_vendida_total - p.cantidad_vendida_pos
      return {
        producto_id: p.producto_id,
        tipo: 'VENTA' as const,
        cantidad: -diff,
        notas: `Venta cierre ${data.fecha} — ${diff} uds sin POS`,
      }
    })

    const { error: movError } = await supabase
      .from('movimientos_inventario')
      .insert(movRows)

    if (movError) return { error: movError.message }
  }

  revalidar()
  return { ok: true }
}

export async function deshacerVenta(
  ventaId: number,
  options?: { skipTimeCheck?: boolean }
) {
  const supabase = createServerSupabase()

  const { data: venta } = await supabase
    .from('ventas_stand')
    .select('*')
    .eq('id', ventaId)
    .eq('anulada', false)
    .single()

  if (!venta) return { error: 'Venta no encontrada' }

  // Umbral 5 minutos server-side (skip en admin)
  if (!options?.skipTimeCheck) {
    const created = new Date(venta.created_at)
    const now = new Date()
    if (now.getTime() - created.getTime() > 5 * 60 * 1000) {
      return { error: 'Solo puedes deshacer ventas de los últimos 5 minutos' }
    }
  }

  // Soft delete
  const { error: updateError } = await supabase
    .from('ventas_stand')
    .update({ anulada: true })
    .eq('id', ventaId)

  if (updateError) return { error: updateError.message }

  // Devolver stock (AJUSTE compensatorio)
  const { error: movError } = await supabase
    .from('movimientos_inventario')
    .insert({
      producto_id: venta.producto_id,
      tipo: 'AJUSTE',
      cantidad: venta.cantidad_vendida,
      notas: `Anulación venta #${ventaId} desde POS`,
    })

  if (movError) return { error: movError.message }

  revalidar()
  return { ok: true }
}
