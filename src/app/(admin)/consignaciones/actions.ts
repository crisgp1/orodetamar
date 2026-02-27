'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/auth'
import {
  crearConsignacionSchema,
  liquidarConsignacionSchema,
  registrarPagoSchema,
  type CrearConsignacionInput,
  type LiquidarConsignacionInput,
  type RegistrarPagoInput,
} from '@/lib/validations/consignaciones'

function revalidar(consignacionId?: number) {
  revalidatePath('/consignaciones')
  revalidatePath('/inventario')
  revalidatePath('/dashboard')
  if (consignacionId) {
    revalidatePath(`/consignaciones/${consignacionId}`)
  }
}

// ── Crear consignacion ──────────────────────────────────────────────

export async function crearConsignacion(data: CrearConsignacionInput) {
  await requireStaff()
  const parsed = crearConsignacionSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = createServerSupabase()
  const { cliente_id, fecha_entrega, notas, productos } = parsed.data

  // 1. Validar stock de todos los productos
  for (const prod of productos) {
    const { data: stock } = await supabase
      .from('inventario')
      .select('cantidad_disponible')
      .eq('producto_id', prod.producto_id)
      .single()

    if (!stock || stock.cantidad_disponible < prod.cantidad) {
      return { error: `Stock insuficiente para producto #${prod.producto_id}` }
    }
  }

  // 2. Crear cabecera
  const { data: consignacion, error: errCab } = await supabase
    .from('consignaciones')
    .insert({
      cliente_id,
      fecha_entrega,
      estado: 'ACTIVA',
      total_vendido: 0,
      total_cobrado: 0,
      notas: notas || null,
    })
    .select('id')
    .single()

  if (errCab || !consignacion) {
    return { error: errCab?.message || 'Error creando consignación' }
  }

  // 3. Crear detalle
  const detalles = productos.map((p) => ({
    consignacion_id: consignacion.id,
    producto_id: p.producto_id,
    cantidad_dejada: p.cantidad,
    cantidad_vendida: 0,
    cantidad_retornada: 0,
    precio_unitario: p.precio_unitario,
  }))

  const { error: errDet } = await supabase
    .from('consignacion_detalle')
    .insert(detalles)

  if (errDet) return { error: errDet.message }

  // 4. Movimientos de inventario (CONSIGNACION_SALIDA)
  const movimientos = productos.map((p) => ({
    producto_id: p.producto_id,
    tipo: 'CONSIGNACION_SALIDA' as const,
    cantidad: -Math.abs(p.cantidad),
    consignacion_id: consignacion.id,
    notas: `Consignacion #${consignacion.id} - ${fecha_entrega}`,
  }))

  const { error: errMov } = await supabase
    .from('movimientos_inventario')
    .insert(movimientos)

  if (errMov) return { error: errMov.message }

  // 5. Revalidar y redirigir
  revalidar(consignacion.id)
  redirect(`/consignaciones/${consignacion.id}`)
}

// ── Liquidar consignacion ───────────────────────────────────────────

export async function liquidarConsignacion(data: LiquidarConsignacionInput) {
  await requireStaff()
  const parsed = liquidarConsignacionSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = createServerSupabase()
  const { consignacion_id, productos, cobro_inmediato, monto_cobro, metodo_pago } =
    parsed.data

  let totalVendido = 0

  // 1. Actualizar cada linea de detalle
  for (const prod of productos) {
    const { data: actual } = await supabase
      .from('consignacion_detalle')
      .select('cantidad_dejada')
      .eq('id', prod.detalle_id)
      .single()

    if (!actual) return { error: 'Detalle no encontrado' }
    if (prod.cantidad_vendida + prod.cantidad_retornada > actual.cantidad_dejada) {
      return {
        error: `Vendido + retornado excede lo dejado para producto #${prod.producto_id}`,
      }
    }

    const hayFaltante =
      prod.cantidad_vendida + prod.cantidad_retornada < actual.cantidad_dejada
    if (hayFaltante && !prod.notas_faltante?.trim()) {
      return {
        error: `Justifica el faltante del producto #${prod.producto_id}`,
      }
    }

    const { error: errDet } = await supabase
      .from('consignacion_detalle')
      .update({
        cantidad_vendida: prod.cantidad_vendida,
        cantidad_retornada: prod.cantidad_retornada,
        destino_retorno:
          prod.cantidad_retornada > 0 ? prod.destino_retorno : null,
        notas_faltante: hayFaltante ? prod.notas_faltante!.trim() : null,
      })
      .eq('id', prod.detalle_id)

    if (errDet) return { error: errDet.message }

    totalVendido += prod.cantidad_vendida * prod.precio_unitario

    // 2. Movimientos de inventario por retorno
    if (prod.cantidad_retornada > 0) {
      const notaRetorno =
        prod.destino_retorno === 'REPROCESAMIENTO_PULPA'
          ? `Retorno consignacion #${consignacion_id} → pendiente reprocesamiento a pulpa`
          : `Retorno consignacion #${consignacion_id} → inventario`

      const { error: errMov } = await supabase
        .from('movimientos_inventario')
        .insert({
          producto_id: prod.producto_id,
          tipo: 'CONSIGNACION_RETORNO',
          cantidad: Math.abs(prod.cantidad_retornada),
          consignacion_id,
          notas: notaRetorno,
        })

      if (errMov) return { error: errMov.message }
    }
  }

  // 3. Cobro inmediato si aplica
  let totalCobrado = 0
  if (cobro_inmediato && monto_cobro && monto_cobro > 0) {
    const { error: errPago } = await supabase
      .from('consignacion_pagos')
      .insert({
        consignacion_id,
        monto: monto_cobro,
        metodo_pago: metodo_pago || 'EFECTIVO',
        notas: 'Cobro en liquidación',
      })

    if (errPago) return { error: errPago.message }
    totalCobrado = monto_cobro
  }

  // 4. Determinar nuevo estado
  let nuevoEstado: 'LIQUIDADA' | 'SALDO_PENDIENTE' = 'SALDO_PENDIENTE'
  if (totalVendido === 0 || totalCobrado >= totalVendido) {
    nuevoEstado = 'LIQUIDADA'
  }

  const fechaHoy = new Date().toISOString().split('T')[0]

  const { error: errUp } = await supabase
    .from('consignaciones')
    .update({
      estado: nuevoEstado,
      total_vendido: totalVendido,
      total_cobrado: totalCobrado,
      fecha_revision: fechaHoy,
      ...(nuevoEstado === 'LIQUIDADA' ? { fecha_liquidacion: fechaHoy } : {}),
    })
    .eq('id', consignacion_id)

  if (errUp) return { error: errUp.message }

  revalidar(consignacion_id)
  return { ok: true, estado: nuevoEstado }
}

// ── Registrar pago ──────────────────────────────────────────────────

export async function registrarPagoConsignacion(data: RegistrarPagoInput) {
  await requireStaff()
  const parsed = registrarPagoSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = createServerSupabase()
  const { consignacion_id, monto, metodo_pago, notas } = parsed.data

  // Obtener estado actual
  const { data: consig } = await supabase
    .from('consignaciones')
    .select('total_vendido, total_cobrado, estado')
    .eq('id', consignacion_id)
    .single()

  if (!consig) return { error: 'Consignacion no encontrada' }
  if (consig.estado === 'LIQUIDADA')
    return { error: 'Consignacion ya liquidada' }

  // Registrar pago
  const { error: errPago } = await supabase
    .from('consignacion_pagos')
    .insert({
      consignacion_id,
      monto,
      metodo_pago,
      notas: notas || null,
    })

  if (errPago) return { error: errPago.message }

  // Actualizar total cobrado y estado
  const nuevoTotalCobrado = consig.total_cobrado + monto
  const liquidada = nuevoTotalCobrado >= consig.total_vendido

  const { error: errUp } = await supabase
    .from('consignaciones')
    .update({
      total_cobrado: nuevoTotalCobrado,
      ...(liquidada
        ? {
            estado: 'LIQUIDADA' as const,
            fecha_liquidacion: new Date().toISOString().split('T')[0],
          }
        : {}),
    })
    .eq('id', consignacion_id)

  if (errUp) return { error: errUp.message }

  revalidar(consignacion_id)
  return { ok: true, liquidada }
}

// ── Cancelar consignacion ───────────────────────────────────────────

export async function cancelarConsignacion(consignacion_id: number) {
  await requireStaff()
  const supabase = createServerSupabase()

  // Verificar estado
  const { data: consig } = await supabase
    .from('consignaciones')
    .select('estado')
    .eq('id', consignacion_id)
    .single()

  if (!consig) return { error: 'Consignacion no encontrada' }
  if (consig.estado !== 'ACTIVA')
    return { error: 'Solo se pueden cancelar consignaciones activas' }

  // Obtener detalle para retornar todo
  const { data: detalle } = await supabase
    .from('consignacion_detalle')
    .select('producto_id, cantidad_dejada')
    .eq('consignacion_id', consignacion_id)

  if (!detalle) return { error: 'Detalle no encontrado' }

  // Retornar todo al inventario
  const movimientos = detalle.map((d) => ({
    producto_id: d.producto_id,
    tipo: 'CONSIGNACION_RETORNO' as const,
    cantidad: Math.abs(d.cantidad_dejada),
    consignacion_id,
    notas: `Cancelacion consignacion #${consignacion_id}`,
  }))

  const { error: errMov } = await supabase
    .from('movimientos_inventario')
    .insert(movimientos)

  if (errMov) return { error: errMov.message }

  // Actualizar cabecera
  const { error: errUp } = await supabase
    .from('consignaciones')
    .update({
      estado: 'CANCELADA',
      fecha_liquidacion: new Date().toISOString().split('T')[0],
    })
    .eq('id', consignacion_id)

  if (errUp) return { error: errUp.message }

  revalidar(consignacion_id)
  redirect('/consignaciones')
}
