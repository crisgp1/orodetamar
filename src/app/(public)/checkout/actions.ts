'use server'

import { auth } from '@clerk/nextjs/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { ensureProfile } from '@/lib/auth'
import { uploadComprobante } from '@/lib/blob'

/* ── Types ── */
type CartItem = {
  productoId: number
  cantidad: number
}

type CheckoutInput = {
  items: CartItem[]
  nombre: string
  telefono: string
  direccion: string
  notas: string
  montoDeclarado: number | null
}

type CheckoutResult =
  | { ok: true; pedidoId: number }
  | { ok: false; error: string }

/* ── Constants ── */
const ANTICIPO_THRESHOLD = 2000 // MXN — above this, 50% deposit required
const ANTICIPO_PERCENT = 0.5

/**
 * Crea un pedido web con comprobante de pago.
 * El comprobante se sube primero a Supabase Storage y luego se referencia.
 */
export async function crearPedidoWeb(
  input: CheckoutInput
): Promise<CheckoutResult> {
  // 1. Auth — must be logged in
  const profile = await ensureProfile()
  if (!profile) return { ok: false, error: 'NO_AUTH' }

  const { items, nombre, telefono, direccion, notas, montoDeclarado } = input

  if (!items.length) return { ok: false, error: 'EMPTY_CART' }
  if (!nombre.trim()) return { ok: false, error: 'MISSING_NAME' }
  if (!telefono.trim()) return { ok: false, error: 'MISSING_PHONE' }
  if (!direccion.trim()) return { ok: false, error: 'MISSING_ADDRESS' }

  const supabase = createServerSupabase()

  // 2. Get perfil ID
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('id, cliente_id')
    .eq('clerk_id', profile.userId)
    .single()

  if (!perfil) return { ok: false, error: 'NO_PROFILE' }

  // 3. Ensure a cliente record exists (auto-create if needed)
  let clienteId = perfil.cliente_id
  if (!clienteId) {
    const { data: newCliente, error: cErr } = await supabase
      .from('clientes')
      .insert({
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        whatsapp: telefono.trim(),
        tipo: 'CONSUMIDOR_FINAL',
        modalidad_pago: 'CONTADO',
        canal_origen: 'SITIO_WEB',
        direccion: direccion.trim(),
      })
      .select('id')
      .single()

    if (cErr || !newCliente) {
      console.error('[checkout] Error creating cliente:', cErr)
      return { ok: false, error: 'DB_ERROR' }
    }

    clienteId = newCliente.id

    // Link perfil → cliente
    await supabase
      .from('perfiles')
      .update({ cliente_id: clienteId })
      .eq('id', perfil.id)
  }

  // 4. Fetch product prices (from DB, never trust client)
  const productIds = items.map((i) => i.productoId)
  const { data: products } = await supabase
    .from('productos')
    .select('id, precio_venta, nombre, presentacion')
    .in('id', productIds)
    .eq('activo', true)

  if (!products || products.length !== items.length) {
    return { ok: false, error: 'PRODUCT_NOT_FOUND' }
  }

  const priceMap = new Map(products.map((p) => [p.id, p.precio_venta]))

  // 5. Calculate totals
  let subtotal = 0
  const detalle = items.map((item) => {
    const precio = priceMap.get(item.productoId) ?? 0
    const lineSubtotal = precio * item.cantidad
    subtotal += lineSubtotal
    return {
      producto_id: item.productoId,
      cantidad: item.cantidad,
      precio_unitario: precio,
      subtotal: lineSubtotal,
    }
  })

  const total = subtotal
  const requiereAnticipo = total > ANTICIPO_THRESHOLD
  const montoAnticipo = requiereAnticipo
    ? Math.ceil(total * ANTICIPO_PERCENT)
    : null

  // 6. Create pedido
  const { data: pedido, error: pErr } = await supabase
    .from('pedidos')
    .insert({
      cliente_id: clienteId,
      perfil_id: perfil.id,
      estado: 'PENDIENTE_PAGO',
      origen: 'WEB',
      canal_venta: 'sitio_web',
      direccion_entrega: direccion.trim(),
      telefono_contacto: telefono.trim(),
      requiere_anticipo: requiereAnticipo,
      monto_anticipo: montoAnticipo,
      subtotal,
      total,
      notas: notas.trim() || null,
    })
    .select('id')
    .single()

  if (pErr || !pedido) {
    console.error('[checkout] Error creating pedido:', pErr)
    return { ok: false, error: 'DB_ERROR' }
  }

  // 7. Insert detail lines
  const { error: dErr } = await supabase
    .from('pedido_detalle')
    .insert(detalle.map((d) => ({ ...d, pedido_id: pedido.id })))

  if (dErr) {
    console.error('[checkout] Error inserting detalle:', dErr)
    // Pedido already created — don't fail hard
  }

  return { ok: true, pedidoId: pedido.id }
}

/**
 * Sube un comprobante de pago para un pedido y lo liga.
 * Recibe FormData con: pedidoId, file (imagen), montoDeclarado.
 */
export async function subirComprobante(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const profile = await ensureProfile()
  if (!profile) return { ok: false, error: 'NO_AUTH' }

  const pedidoId = Number(formData.get('pedidoId'))
  const file = formData.get('file') as File | null
  const montoDeclarado = Number(formData.get('montoDeclarado')) || null

  if (!pedidoId || !file) return { ok: false, error: 'MISSING_DATA' }

  // Validate file
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  if (!allowedTypes.includes(file.type)) return { ok: false, error: 'INVALID_FILE_TYPE' }
  if (file.size > 5 * 1024 * 1024) return { ok: false, error: 'FILE_TOO_LARGE' }

  const supabase = createServerSupabase()

  // Verify this pedido belongs to the user
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('id')
    .eq('clerk_id', profile.userId)
    .single()

  if (!perfil) return { ok: false, error: 'NO_PROFILE' }

  const { data: pedido } = await supabase
    .from('pedidos')
    .select('id, perfil_id')
    .eq('id', pedidoId)
    .single()

  if (!pedido || pedido.perfil_id !== perfil.id) {
    return { ok: false, error: 'NOT_AUTHORIZED' }
  }

  // Upload to Vercel Blob
  const uploadResult = await uploadComprobante(pedidoId, file)
  if (!uploadResult.ok) {
    return { ok: false, error: uploadResult.error }
  }

  // Insert comprobante record
  const { error: compErr } = await supabase
    .from('pedido_comprobantes')
    .insert({
      pedido_id: pedidoId,
      imagen_url: uploadResult.url,
      monto_declarado: montoDeclarado,
      estado: 'PENDIENTE',
    })

  if (compErr) {
    console.error('[checkout] Error inserting comprobante:', compErr)
    return { ok: false, error: 'DB_ERROR' }
  }

  return { ok: true }
}

/**
 * Obtiene los pedidos del usuario autenticado.
 */
export async function obtenerMisPedidos() {
  const profile = await ensureProfile()
  if (!profile) return []

  const supabase = createServerSupabase()

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('id')
    .eq('clerk_id', profile.userId)
    .single()

  if (!perfil) return []

  const { data: pedidos } = await supabase
    .from('pedidos')
    .select(`
      id,
      estado,
      total,
      origen,
      direccion_entrega,
      telefono_contacto,
      requiere_anticipo,
      monto_anticipo,
      notas,
      created_at,
      pedido_detalle (
        id,
        producto_id,
        cantidad,
        precio_unitario,
        subtotal,
        productos:producto_id (nombre, presentacion, imagen_url)
      ),
      pedido_comprobantes (
        id,
        imagen_url,
        monto_declarado,
        estado,
        notas_admin,
        created_at
      )
    `)
    .eq('perfil_id', perfil.id)
    .order('created_at', { ascending: false })

  return pedidos ?? []
}

/**
 * Obtiene los datos bancarios de la empresa.
 */
export async function obtenerDatosBancarios() {
  const supabase = createServerSupabase()

  const { data } = await supabase
    .from('empresa_info')
    .select('clave, contenido')
    .in('clave', ['banco_nombre', 'banco_clabe', 'banco_beneficiario'])

  if (!data) return { banco: '', clabe: '', beneficiario: '' }

  const map = new Map(data.map((d) => [d.clave, d.contenido]))
  return {
    banco: map.get('banco_nombre') ?? '',
    clabe: map.get('banco_clabe') ?? '',
    beneficiario: map.get('banco_beneficiario') ?? '',
  }
}
