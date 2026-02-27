'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/server'
import { deleteBlob } from '@/lib/blob'
import {
  crearProductoSchema,
  actualizarProductoSchema,
  ingredienteRecetaSchema,
  agregarImagenSchema,
  eliminarImagenSchema,
  reordenarImagenesSchema,
  type CrearProductoInput,
  type ActualizarProductoInput,
  type IngredienteRecetaInput,
  type AgregarImagenInput,
  type EliminarImagenInput,
  type ReordenarImagenesInput,
} from '@/lib/validations/productos'

function revalidar() {
  revalidatePath('/productos')
  revalidatePath('/dashboard')
  revalidatePath('/inventario')
  // Catálogo público y páginas de producto
  revalidatePath('/')
  revalidatePath('/producto', 'page')
}

export async function crearProducto(data: CrearProductoInput) {
  const parsed = crearProductoSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createServerSupabase()
  const { data: producto, error } = await supabase
    .from('productos')
    .insert({
      categoria_id: parsed.data.categoria_id,
      nombre: parsed.data.nombre.trim(),
      presentacion: parsed.data.presentacion,
      peso_gramos: parsed.data.peso_gramos,
      precio_venta: parsed.data.precio_venta,
      precio_mayoreo: parsed.data.precio_mayoreo,
      sku: parsed.data.sku?.trim() || null,
      es_snack: parsed.data.es_snack,
      imagen_url: parsed.data.imagen_url,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  // Initialize inventory row with 0 stock
  await supabase.from('inventario').insert({
    producto_id: producto.id,
    cantidad_disponible: 0,
  })

  revalidar()
  return { ok: true, id: producto.id }
}

export async function actualizarProducto(data: ActualizarProductoInput) {
  const parsed = actualizarProductoSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createServerSupabase()
  const { error } = await supabase
    .from('productos')
    .update({
      precio_venta: parsed.data.precio_venta,
      precio_mayoreo: parsed.data.precio_mayoreo,
      activo: parsed.data.activo,
      imagen_url: parsed.data.imagen_url,
    })
    .eq('id', parsed.data.id)

  if (error) return { error: error.message }
  revalidar()
  return { ok: true }
}

export async function toggleActivoProducto(id: number) {
  const supabase = createServerSupabase()

  const { data: prod } = await supabase
    .from('productos')
    .select('activo')
    .eq('id', id)
    .single()

  if (!prod) return { error: 'Producto no encontrado' }

  const { error } = await supabase
    .from('productos')
    .update({ activo: !prod.activo })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidar()
  return { ok: true, activo: !prod.activo }
}

export async function agregarIngredienteReceta(data: IngredienteRecetaInput) {
  const parsed = ingredienteRecetaSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createServerSupabase()
  const { error } = await supabase
    .from('receta_ingredientes')
    .upsert(
      {
        producto_id: parsed.data.producto_id,
        materia_prima_id: parsed.data.materia_prima_id,
        cantidad_necesaria: parsed.data.cantidad_necesaria,
        unidad_medida: parsed.data.unidad_medida,
        notas: parsed.data.notas?.trim() || null,
      },
      { onConflict: 'producto_id,materia_prima_id' }
    )

  if (error) return { error: error.message }
  revalidatePath('/productos')
  return { ok: true }
}

export async function eliminarIngredienteReceta(id: number) {
  const supabase = createServerSupabase()
  const { error } = await supabase
    .from('receta_ingredientes')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/productos')
  return { ok: true }
}

// ────────────────────────────────────────────────────────────────
// Image gallery CRUD
// ────────────────────────────────────────────────────────────────

/** Sync productos.imagen_url with the first gallery image (posicion=0) */
async function syncPortada(productoId: number) {
  const supabase = createServerSupabase()
  const { data } = await supabase
    .from('producto_imagenes')
    .select('imagen_url')
    .eq('producto_id', productoId)
    .order('posicion')
    .limit(1)
    .single()

  await supabase
    .from('productos')
    .update({ imagen_url: data?.imagen_url ?? null })
    .eq('id', productoId)
}

export async function agregarImagenProducto(data: AgregarImagenInput) {
  const parsed = agregarImagenSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createServerSupabase()

  // Get next position
  const { data: last } = await supabase
    .from('producto_imagenes')
    .select('posicion')
    .eq('producto_id', parsed.data.producto_id)
    .order('posicion', { ascending: false })
    .limit(1)
    .single()

  const posicion = (last?.posicion ?? -1) + 1

  const { data: img, error } = await supabase
    .from('producto_imagenes')
    .insert({
      producto_id: parsed.data.producto_id,
      imagen_url: parsed.data.imagen_url,
      posicion,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  await syncPortada(parsed.data.producto_id)
  revalidar()
  return { ok: true, imagen: img }
}

export async function eliminarImagenProducto(data: EliminarImagenInput) {
  const parsed = eliminarImagenSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createServerSupabase()

  // Get image info before deleting
  const { data: img } = await supabase
    .from('producto_imagenes')
    .select('producto_id, imagen_url')
    .eq('id', parsed.data.id)
    .single()

  if (!img) return { error: 'Imagen no encontrada' }

  const { error } = await supabase
    .from('producto_imagenes')
    .delete()
    .eq('id', parsed.data.id)

  if (error) return { error: error.message }

  // Delete blob from storage
  try {
    await deleteBlob(img.imagen_url)
  } catch { /* non-critical */ }

  await syncPortada(img.producto_id)
  revalidar()
  return { ok: true }
}

export async function reordenarImagenesProducto(data: ReordenarImagenesInput) {
  const parsed = reordenarImagenesSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createServerSupabase()

  // Update each image's position in order
  const updates = parsed.data.imagen_ids.map((id, idx) =>
    supabase
      .from('producto_imagenes')
      .update({ posicion: idx })
      .eq('id', id)
      .eq('producto_id', parsed.data.producto_id)
  )

  const results = await Promise.all(updates)
  const firstError = results.find((r) => r.error)
  if (firstError?.error) return { error: firstError.error.message }

  await syncPortada(parsed.data.producto_id)
  revalidar()
  return { ok: true }
}

export async function obtenerImagenesProducto(productoId: number) {
  const supabase = createServerSupabase()
  const { data, error } = await supabase
    .from('producto_imagenes')
    .select('*')
    .eq('producto_id', productoId)
    .order('posicion')

  if (error) return { error: error.message, imagenes: [] }
  return { imagenes: data ?? [] }
}