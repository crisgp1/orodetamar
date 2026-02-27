'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  registrarCompraSchema,
  registrarMovimientoMPSchema,
  crearMateriaPrimaSchema,
  type RegistrarCompraInput,
  type RegistrarMovimientoMPInput,
  type CrearMateriaPrimaInput,
} from '@/lib/validations/materias-primas'

function revalidar() {
  revalidatePath('/materias-primas')
  revalidatePath('/dashboard')
}

export async function registrarCompra(data: RegistrarCompraInput) {
  const parsed = registrarCompraSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createServerSupabase()
  const { error } = await supabase.from('compras_materia_prima').insert({
    materia_prima_id: parsed.data.materia_prima_id,
    cantidad: parsed.data.cantidad,
    costo_total: parsed.data.costo_total,
    proveedor: parsed.data.proveedor?.trim() || null,
    fecha_compra: parsed.data.fecha_compra,
    notas: parsed.data.notas?.trim() || null,
  })

  if (error) return { error: error.message }
  revalidar()
  return { ok: true }
}

export async function registrarMovimientoMP(data: RegistrarMovimientoMPInput) {
  const parsed = registrarMovimientoMPSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createServerSupabase()
  const cantidad = parsed.data.tipo === 'AJUSTE'
    ? Math.abs(parsed.data.cantidad)
    : -Math.abs(parsed.data.cantidad)

  const { error } = await supabase.from('movimientos_materia_prima').insert({
    materia_prima_id: parsed.data.materia_prima_id,
    tipo: parsed.data.tipo,
    cantidad,
    notas: parsed.data.notas.trim(),
  })

  if (error) return { error: error.message }
  revalidar()
  return { ok: true }
}

export async function crearMateriaPrima(data: CrearMateriaPrimaInput) {
  const parsed = crearMateriaPrimaSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createServerSupabase()
  const { data: mp, error } = await supabase
    .from('materias_primas')
    .insert({
      nombre: parsed.data.nombre.trim(),
      unidad_medida: parsed.data.unidad_medida,
      proveedor: parsed.data.proveedor?.trim() || null,
      notas: parsed.data.notas?.trim() || null,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  // Initialize inventory row with 0 stock
  await supabase.from('inventario_materia_prima').insert({
    materia_prima_id: mp.id,
    cantidad_disponible: 0,
  })

  revalidar()
  return { ok: true }
}
