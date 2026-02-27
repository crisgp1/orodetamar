'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  crearProductoSchema,
  actualizarProductoSchema,
  ingredienteRecetaSchema,
  type CrearProductoInput,
  type ActualizarProductoInput,
  type IngredienteRecetaInput,
} from '@/lib/validations/productos'

function revalidar() {
  revalidatePath('/productos')
  revalidatePath('/dashboard')
  revalidatePath('/inventario')
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
