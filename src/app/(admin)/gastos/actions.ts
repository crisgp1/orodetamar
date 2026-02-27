'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  registrarGastoSchema,
  type RegistrarGastoInput,
} from '@/lib/validations/gastos'

function revalidar() {
  revalidatePath('/gastos')
  revalidatePath('/dashboard')
  revalidatePath('/rentabilidad')
}

export async function registrarGasto(data: RegistrarGastoInput) {
  const parsed = registrarGastoSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createServerSupabase()
  const { error } = await supabase.from('gastos').insert({
    tipo: parsed.data.tipo,
    concepto: parsed.data.concepto.trim(),
    monto: parsed.data.monto,
    fecha: parsed.data.fecha,
    notas: parsed.data.notas?.trim() || null,
  })

  if (error) return { error: error.message }
  revalidar()
  return { ok: true }
}

export async function actualizarGasto(id: number, data: RegistrarGastoInput) {
  const parsed = registrarGastoSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createServerSupabase()
  const { error } = await supabase
    .from('gastos')
    .update({
      tipo: parsed.data.tipo,
      concepto: parsed.data.concepto.trim(),
      monto: parsed.data.monto,
      fecha: parsed.data.fecha,
      notas: parsed.data.notas?.trim() || null,
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidar()
  return { ok: true }
}

export async function eliminarGasto(id: number) {
  const supabase = createServerSupabase()
  const { error } = await supabase
    .from('gastos')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }
  revalidar()
  return { ok: true }
}
