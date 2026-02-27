'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  crearPedidoSchema,
  editarPedidoSchema,
  entregarPedidoSchema,
  registrarPagoPedidoSchema,
  cancelarPedidoSchema,
  type CrearPedidoInput,
  type EditarPedidoInput,
  type EntregarPedidoInput,
  type RegistrarPagoPedidoInput,
  type CancelarPedidoInput,
} from '@/lib/validations/pedidos'

function revalidar(pedidoId?: number) {
  revalidatePath('/pedidos')
  revalidatePath('/dashboard')
  revalidatePath('/rentabilidad')
  if (pedidoId) {
    revalidatePath(`/pedidos/${pedidoId}`)
  }
}

// ── Crear pedido ──────────────────────────────────────────────

export async function crearPedido(data: CrearPedidoInput) {
  const parsed = crearPedidoSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createServerSupabase()
  const { cliente_id, fecha_entrega_min, descuento_porcentaje, canal_venta, notas, lineas } = parsed.data

  // Calcular totales
  const subtotal = lineas.reduce((s, l) => s + l.cantidad * l.precio_unitario, 0)
  const descuento = subtotal * (descuento_porcentaje / 100)
  const total = subtotal - descuento

  // Crear cabecera (estado RECIBIDO, NO descuenta inventario)
  const { data: pedido, error: errPed } = await supabase
    .from('pedidos')
    .insert({
      cliente_id,
      estado: 'RECIBIDO',
      fecha_entrega_min: fecha_entrega_min || null,
      canal_venta: canal_venta || null,
      descuento_porcentaje,
      subtotal,
      total,
      notas: notas || null,
    })
    .select('id')
    .single()

  if (errPed || !pedido) {
    return { error: errPed?.message || 'Error creando pedido' }
  }

  // Crear líneas de detalle
  const detalles = lineas.map((l) => ({
    pedido_id: pedido.id,
    producto_id: l.producto_id,
    cantidad: l.cantidad,
    precio_unitario: l.precio_unitario,
    subtotal: l.cantidad * l.precio_unitario,
  }))

  const { error: errDet } = await supabase.from('pedido_detalle').insert(detalles)
  if (errDet) return { error: errDet.message }

  revalidar(pedido.id)
  return { ok: true, id: pedido.id }
}

// ── Editar pedido (solo si RECIBIDO) ──────────────────────────

export async function editarPedido(data: EditarPedidoInput) {
  const parsed = editarPedidoSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createServerSupabase()
  const { pedido_id, cliente_id, fecha_entrega_min, descuento_porcentaje, canal_venta, notas, lineas } = parsed.data

  // Verificar estado
  const { data: pedido } = await supabase
    .from('pedidos')
    .select('estado')
    .eq('id', pedido_id)
    .single()

  if (!pedido) return { error: 'Pedido no encontrado' }
  if (pedido.estado !== 'RECIBIDO') return { error: 'Solo se pueden editar pedidos pendientes' }

  const subtotal = lineas.reduce((s, l) => s + l.cantidad * l.precio_unitario, 0)
  const descuento = subtotal * (descuento_porcentaje / 100)
  const total = subtotal - descuento

  // Actualizar cabecera
  const { error: errUpd } = await supabase
    .from('pedidos')
    .update({
      cliente_id,
      fecha_entrega_min: fecha_entrega_min || null,
      canal_venta: canal_venta || null,
      descuento_porcentaje,
      subtotal,
      total,
      notas: notas || null,
    })
    .eq('id', pedido_id)

  if (errUpd) return { error: errUpd.message }

  // Reemplazar líneas (DELETE cascade + INSERT)
  await supabase.from('pedido_detalle').delete().eq('pedido_id', pedido_id)

  const detalles = lineas.map((l) => ({
    pedido_id,
    producto_id: l.producto_id,
    cantidad: l.cantidad,
    precio_unitario: l.precio_unitario,
    subtotal: l.cantidad * l.precio_unitario,
  }))

  const { error: errDet } = await supabase.from('pedido_detalle').insert(detalles)
  if (errDet) return { error: errDet.message }

  revalidar(pedido_id)
  return { ok: true }
}

// ── Entregar pedido ───────────────────────────────────────────

export async function entregarPedido(data: EntregarPedidoInput) {
  const parsed = entregarPedidoSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createServerSupabase()
  const { pedido_id, pago_inmediato, metodo_pago } = parsed.data

  // Obtener pedido
  const { data: pedido } = await supabase
    .from('pedidos')
    .select('*')
    .eq('id', pedido_id)
    .single()

  if (!pedido) return { error: 'Pedido no encontrado' }
  if (pedido.estado !== 'RECIBIDO' && pedido.estado !== 'PAGO_CONFIRMADO' && pedido.estado !== 'PENDIENTE_PAGO') return { error: 'Pedido no válido para entrega' }

  // Obtener detalle separado
  const { data: detalleRaw } = await supabase
    .from('pedido_detalle')
    .select('producto_id, cantidad')
    .eq('pedido_id', pedido_id)

  const detalle = detalleRaw ?? []

  // Validar stock
  for (const linea of detalle) {
    const { data: stock } = await supabase
      .from('inventario')
      .select('cantidad_disponible')
      .eq('producto_id', linea.producto_id)
      .single()

    if (!stock || stock.cantidad_disponible < linea.cantidad) {
      return { error: `Stock insuficiente para producto #${linea.producto_id}` }
    }
  }

  // Descontar inventario
  const movimientos = detalle.map((linea) => ({
    producto_id: linea.producto_id,
    tipo: 'VENTA' as const,
    cantidad: -Math.abs(linea.cantidad),
    pedido_id,
    notas: `Pedido #${pedido_id} entregado`,
  }))

  const { error: errMov } = await supabase.from('movimientos_inventario').insert(movimientos)
  if (errMov) return { error: errMov.message }

  // Actualizar estado
  const { error: errUpd } = await supabase
    .from('pedidos')
    .update({
      estado: 'ENTREGADO',
      fecha_entrega_real: new Date().toISOString(),
    })
    .eq('id', pedido_id)

  if (errUpd) return { error: errUpd.message }

  // Pago inmediato
  if (pago_inmediato && pedido.total) {
    const { error: errPago } = await supabase.from('pedido_pagos').insert({
      pedido_id,
      monto: pedido.total,
      metodo_pago: metodo_pago || 'EFECTIVO',
      notas: 'Pago al entregar',
    })
    if (errPago) return { error: errPago.message }
  }

  revalidar(pedido_id)
  revalidatePath('/inventario')
  return { ok: true }
}

// ── Registrar pago ────────────────────────────────────────────

export async function registrarPagoPedido(data: RegistrarPagoPedidoInput) {
  const parsed = registrarPagoPedidoSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createServerSupabase()
  const { pedido_id, monto, metodo_pago, notas } = parsed.data

  // Obtener pedido y pagos existentes
  const { data: pedido } = await supabase
    .from('pedidos')
    .select('total')
    .eq('id', pedido_id)
    .single()

  if (!pedido) return { error: 'Pedido no encontrado' }

  const { data: pagos } = await supabase
    .from('pedido_pagos')
    .select('monto')
    .eq('pedido_id', pedido_id)

  const totalCobrado = (pagos ?? []).reduce((s, p) => s + p.monto, 0)
  const saldo = (pedido.total ?? 0) - totalCobrado

  if (monto > saldo + 0.01) {
    return { error: `Monto excede saldo pendiente ($${saldo.toFixed(2)})` }
  }

  const { error: errPago } = await supabase.from('pedido_pagos').insert({
    pedido_id,
    monto,
    metodo_pago,
    notas: notas || null,
  })

  if (errPago) return { error: errPago.message }

  revalidar(pedido_id)
  return { ok: true, liquidado: monto >= saldo - 0.01 }
}

// ── Cancelar pedido ───────────────────────────────────────────

export async function cancelarPedido(data: CancelarPedidoInput) {
  const parsed = cancelarPedidoSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createServerSupabase()
  const { pedido_id, notas } = parsed.data

  const { data: pedido } = await supabase
    .from('pedidos')
    .select('estado')
    .eq('id', pedido_id)
    .single()

  if (!pedido) return { error: 'Pedido no encontrado' }
  if (pedido.estado !== 'RECIBIDO' && pedido.estado !== 'PENDIENTE_PAGO') {
    return { error: 'Solo se pueden cancelar pedidos pendientes' }
  }

  // No hay inventario que devolver (no se descontó en RECIBIDO)
  const { error } = await supabase
    .from('pedidos')
    .update({
      estado: 'CANCELADO',
      notas: `CANCELADO: ${notas}`,
    })
    .eq('id', pedido_id)

  if (error) return { error: error.message }

  revalidar(pedido_id)
  return { ok: true }
}

// ── Aprobar comprobante ───────────────────────────────────────

export async function aprobarComprobante(comprobanteId: number) {
  const supabase = createServerSupabase()

  // Obtener comprobante
  const { data: comprobante } = await supabase
    .from('pedido_comprobantes')
    .select('pedido_id, estado')
    .eq('id', comprobanteId)
    .single()

  if (!comprobante) return { error: 'Comprobante no encontrado' }
  if (comprobante.estado !== 'PENDIENTE') return { error: 'Comprobante ya fue revisado' }

  // Aprobar comprobante
  const { error: errUpd } = await supabase
    .from('pedido_comprobantes')
    .update({
      estado: 'APROBADO',
      revisado_at: new Date().toISOString(),
    })
    .eq('id', comprobanteId)

  if (errUpd) return { error: errUpd.message }

  // Cambiar estado del pedido a RECIBIDO si estaba en PENDIENTE_PAGO
  const { data: pedido } = await supabase
    .from('pedidos')
    .select('estado')
    .eq('id', comprobante.pedido_id)
    .single()

  if (pedido?.estado === 'PENDIENTE_PAGO') {
    await supabase
      .from('pedidos')
      .update({ estado: 'RECIBIDO' })
      .eq('id', comprobante.pedido_id)
  }

  revalidar(comprobante.pedido_id)
  return { ok: true }
}

// ── Rechazar comprobante ──────────────────────────────────────

export async function rechazarComprobante(comprobanteId: number, notas: string) {
  const supabase = createServerSupabase()

  const { data: comprobante } = await supabase
    .from('pedido_comprobantes')
    .select('pedido_id, estado')
    .eq('id', comprobanteId)
    .single()

  if (!comprobante) return { error: 'Comprobante no encontrado' }
  if (comprobante.estado !== 'PENDIENTE') return { error: 'Comprobante ya fue revisado' }

  const { error: errUpd } = await supabase
    .from('pedido_comprobantes')
    .update({
      estado: 'RECHAZADO',
      notas_admin: notas || null,
      revisado_at: new Date().toISOString(),
    })
    .eq('id', comprobanteId)

  if (errUpd) return { error: errUpd.message }

  revalidar(comprobante.pedido_id)
  return { ok: true }
}

// ── Cambiar estado de pedido (timeline) ───────────────────────

const ESTADOS_VALIDOS = [
  'PENDIENTE_PAGO',
  'RECIBIDO',
  'PAGO_CONFIRMADO',
  'EN_PREPARACION',
  'LISTO',
  'EN_RUTA',
  'ENTREGADO',
] as const

export async function cambiarEstadoPedido(pedidoId: number, nuevoEstado: string) {
  if (!ESTADOS_VALIDOS.includes(nuevoEstado as (typeof ESTADOS_VALIDOS)[number])) {
    return { error: 'Estado no válido' }
  }

  const supabase = createServerSupabase()

  const { data: pedido } = await supabase
    .from('pedidos')
    .select('estado')
    .eq('id', pedidoId)
    .single()

  if (!pedido) return { error: 'Pedido no encontrado' }
  if (pedido.estado === 'CANCELADO') return { error: 'No se puede cambiar un pedido cancelado' }

  // Si se mueve a ENTREGADO, hay que descontar inventario
  if (nuevoEstado === 'ENTREGADO' && pedido.estado !== 'ENTREGADO') {
    const { data: detalleRaw } = await supabase
      .from('pedido_detalle')
      .select('producto_id, cantidad')
      .eq('pedido_id', pedidoId)

    const detalle = detalleRaw ?? []

    for (const linea of detalle) {
      const { data: stock } = await supabase
        .from('inventario')
        .select('cantidad_disponible')
        .eq('producto_id', linea.producto_id)
        .single()

      if (!stock || stock.cantidad_disponible < linea.cantidad) {
        return { error: `Stock insuficiente para producto #${linea.producto_id}` }
      }
    }

    const movimientos = detalle.map((linea) => ({
      producto_id: linea.producto_id,
      tipo: 'VENTA' as const,
      cantidad: -Math.abs(linea.cantidad),
      pedido_id: pedidoId,
      notas: `Pedido #${pedidoId} entregado`,
    }))

    const { error: errMov } = await supabase.from('movimientos_inventario').insert(movimientos)
    if (errMov) return { error: errMov.message }
  }

  const updateData: Record<string, unknown> = { estado: nuevoEstado }
  if (nuevoEstado === 'ENTREGADO') {
    updateData.fecha_entrega_real = new Date().toISOString()
  }

  const { error } = await supabase
    .from('pedidos')
    .update(updateData)
    .eq('id', pedidoId)

  if (error) return { error: error.message }

  revalidar(pedidoId)
  revalidatePath('/inventario')
  return { ok: true }
}

// ── Marcar / quitar delay de preparación ──────────────────────

export async function toggleDelayPedido(
  pedidoId: number,
  tieneDelay: boolean,
  motivo?: string
) {
  const supabase = createServerSupabase()

  const { data: pedido } = await supabase
    .from('pedidos')
    .select('estado')
    .eq('id', pedidoId)
    .single()

  if (!pedido) return { error: 'Pedido no encontrado' }
  if (['ENTREGADO', 'CANCELADO'].includes(pedido.estado)) {
    return { error: 'No se puede marcar delay en un pedido finalizado' }
  }

  const { error } = await supabase
    .from('pedidos')
    .update({
      tiene_delay: tieneDelay,
      delay_motivo: tieneDelay ? (motivo || null) : null,
    })
    .eq('id', pedidoId)

  if (error) return { error: error.message }

  revalidar(pedidoId)
  return { ok: true }
}

// ── Establecer fecha de entrega estimada ──────────────────────

export async function setFechaEntregaEstimada(
  pedidoId: number,
  fecha: string | null
) {
  const supabase = createServerSupabase()

  const { data: pedido } = await supabase
    .from('pedidos')
    .select('estado')
    .eq('id', pedidoId)
    .single()

  if (!pedido) return { error: 'Pedido no encontrado' }
  if (['ENTREGADO', 'CANCELADO'].includes(pedido.estado)) {
    return { error: 'No se puede cambiar la entrega estimada de un pedido finalizado' }
  }

  const { error } = await supabase
    .from('pedidos')
    .update({ fecha_entrega_estimada: fecha })
    .eq('id', pedidoId)

  if (error) return { error: error.message }

  revalidar(pedidoId)
  return { ok: true }
}
