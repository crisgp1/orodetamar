'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  crearUbicacionSchema,
  actualizarUbicacionSchema,
  toggleUbicacionSchema,
  type CrearUbicacionInput,
  type ActualizarUbicacionInput,
  type ToggleUbicacionInput,
} from '@/lib/validations/ubicaciones'

function revalidar() {
  revalidatePath('/ubicaciones')
  revalidatePath('/pos')
}

export async function crearUbicacion(data: CrearUbicacionInput) {
  const parsed = crearUbicacionSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createServerSupabase()
  const { error } = await supabase.from('ubicaciones').insert({
    nombre: parsed.data.nombre,
    direccion: parsed.data.direccion || null,
    ciudad: parsed.data.ciudad || null,
    zona: parsed.data.zona || null,
    notas: parsed.data.notas || null,
  })

  if (error) return { error: error.message }

  revalidar()
  return { ok: true }
}

export async function actualizarUbicacion(data: ActualizarUbicacionInput) {
  const parsed = actualizarUbicacionSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createServerSupabase()
  const { id, ...rest } = parsed.data
  const { error } = await supabase
    .from('ubicaciones')
    .update({
      nombre: rest.nombre,
      direccion: rest.direccion || null,
      ciudad: rest.ciudad || null,
      zona: rest.zona || null,
      notas: rest.notas || null,
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidar()
  return { ok: true }
}

export async function toggleUbicacion(data: ToggleUbicacionInput) {
  const parsed = toggleUbicacionSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createServerSupabase()
  const { error } = await supabase
    .from('ubicaciones')
    .update({ activo: parsed.data.activo })
    .eq('id', parsed.data.id)

  if (error) return { error: error.message }

  revalidar()
  return { ok: true }
}
