'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  registrarProduccionSchema,
  registrarMermaSchema,
  registrarReingresoSchema,
  registrarReprocesamientoSchema,
  type RegistrarProduccionInput,
  type RegistrarMermaInput,
  type RegistrarReingresoInput,
  type RegistrarReprocesamientoInput,
} from '@/lib/validations/inventario'

function revalidar() {
  revalidatePath('/inventario')
  revalidatePath('/materias-primas')
  revalidatePath('/dashboard')
}

export async function registrarProduccion(data: RegistrarProduccionInput) {
  const parsed = registrarProduccionSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = createServerSupabase()

  // 1. Leer receta del producto con nombre de MP para mensajes de error
  const { data: receta } = await supabase
    .from('receta_ingredientes')
    .select('materia_prima_id, cantidad_necesaria, materias_primas(nombre)')
    .eq('producto_id', parsed.data.producto_id)

  // 2. Si hay receta, validar stock de cada materia prima
  if (receta && receta.length > 0) {
    for (const ing of receta) {
      const consumo = ing.cantidad_necesaria * parsed.data.cantidad
      const mp = ing.materias_primas as { nombre: string } | null
      const nombreMP = mp?.nombre ?? `MP #${ing.materia_prima_id}`

      const { data: stockMP } = await supabase
        .from('inventario_materia_prima')
        .select('cantidad_disponible')
        .eq('materia_prima_id', ing.materia_prima_id)
        .single()

      if (!stockMP || stockMP.cantidad_disponible < consumo) {
        return {
          error: `Stock insuficiente de ${nombreMP}. Necesitas ${consumo}, tienes ${stockMP?.cantidad_disponible ?? 0}`,
        }
      }
    }
  }

  // 3. Registrar producción (+inventario producto)
  const { error } = await supabase.from('movimientos_inventario').insert({
    producto_id: parsed.data.producto_id,
    tipo: 'PRODUCCION',
    cantidad: parsed.data.cantidad,
    notas: parsed.data.notas || null,
  })

  if (error) return { error: error.message }

  // 4. Descontar materia prima según receta (trigger actualiza inventario_materia_prima)
  if (receta && receta.length > 0) {
    const movimientosMP = receta.map((ing) => ({
      materia_prima_id: ing.materia_prima_id,
      tipo: 'CONSUMO_PRODUCCION' as const,
      cantidad: -(ing.cantidad_necesaria * parsed.data.cantidad),
      notas: `Consumo por producción de ${parsed.data.cantidad}x producto_id=${parsed.data.producto_id}`,
    }))

    const { error: mpError } = await supabase
      .from('movimientos_materia_prima')
      .insert(movimientosMP)

    if (mpError) return { error: mpError.message }
  }

  revalidar()
  return { ok: true }
}

export async function registrarMerma(data: RegistrarMermaInput) {
  const parsed = registrarMermaSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = createServerSupabase()

  const { error } = await supabase.from('movimientos_inventario').insert({
    producto_id: parsed.data.producto_id,
    tipo: 'MERMA',
    cantidad: -Math.abs(parsed.data.cantidad),
    notas: parsed.data.notas || null,
  })

  if (error) return { error: error.message }

  revalidar()
  return { ok: true }
}

export async function registrarReingreso(data: RegistrarReingresoInput) {
  const parsed = registrarReingresoSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = createServerSupabase()

  const { error } = await supabase.from('movimientos_inventario').insert({
    producto_id: parsed.data.producto_id,
    tipo: 'AJUSTE',
    cantidad: Math.abs(parsed.data.cantidad),
    notas: parsed.data.notas || null,
  })

  if (error) return { error: error.message }

  revalidar()
  return { ok: true }
}

export async function registrarReprocesamiento(
  data: RegistrarReprocesamientoInput
) {
  const parsed = registrarReprocesamientoSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = createServerSupabase()

  // Validar stock disponible del origen
  const { data: stock } = await supabase
    .from('inventario')
    .select('cantidad_disponible')
    .eq('producto_id', parsed.data.producto_origen_id)
    .single()

  if (!stock || stock.cantidad_disponible < parsed.data.cantidad_origen) {
    return { error: 'Stock insuficiente del producto origen' }
  }

  // Movimiento 1: salida del origen
  const { error: err1 } = await supabase
    .from('movimientos_inventario')
    .insert({
      producto_id: parsed.data.producto_origen_id,
      tipo: 'REPROCESAMIENTO',
      cantidad: -Math.abs(parsed.data.cantidad_origen),
      producto_origen_id: parsed.data.producto_origen_id,
      notas: parsed.data.notas || null,
    })

  if (err1) return { error: err1.message }

  // Movimiento 2: entrada del destino (con trazabilidad al origen)
  const { error: err2 } = await supabase
    .from('movimientos_inventario')
    .insert({
      producto_id: parsed.data.producto_destino_id,
      tipo: 'REPROCESAMIENTO',
      cantidad: Math.abs(parsed.data.cantidad_destino),
      producto_origen_id: parsed.data.producto_origen_id,
      notas: parsed.data.notas || null,
    })

  if (err2) return { error: err2.message }

  revalidar()
  return { ok: true }
}
