'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/auth'
import {
  crearClienteSchema,
  actualizarClienteSchema,
  type CrearClienteInput,
  type ActualizarClienteInput,
} from '@/lib/validations/clientes'

function revalidar() {
  revalidatePath('/clientes')
  revalidatePath('/consignaciones')
  revalidatePath('/dashboard')
}

export async function crearCliente(data: CrearClienteInput) {
  await requireStaff()
  const parsed = crearClienteSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createServerSupabase()
  const { error } = await supabase.from('clientes').insert({
    nombre: parsed.data.nombre.trim(),
    telefono: parsed.data.telefono?.trim() || null,
    whatsapp: parsed.data.whatsapp?.trim() || null,
    email: parsed.data.email,
    tipo: parsed.data.tipo,
    modalidad_pago: parsed.data.modalidad_pago,
    canal_origen: parsed.data.canal_origen,
    referido_por_id: parsed.data.referido_por_id,
    direccion: parsed.data.direccion?.trim() || null,
    ciudad: parsed.data.ciudad?.trim() || null,
    descuento_porcentaje: parsed.data.descuento_porcentaje,
    notas: parsed.data.notas?.trim() || null,
  })

  if (error) return { error: error.message }
  revalidar()
  return { ok: true }
}

export async function actualizarCliente(data: ActualizarClienteInput) {
  await requireStaff()
  const parsed = actualizarClienteSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createServerSupabase()
  const { id, ...fields } = parsed.data
  const { error } = await supabase
    .from('clientes')
    .update({
      nombre: fields.nombre.trim(),
      telefono: fields.telefono?.trim() || null,
      whatsapp: fields.whatsapp?.trim() || null,
      email: fields.email,
      tipo: fields.tipo,
      modalidad_pago: fields.modalidad_pago,
      canal_origen: fields.canal_origen,
      referido_por_id: fields.referido_por_id,
      direccion: fields.direccion?.trim() || null,
      ciudad: fields.ciudad?.trim() || null,
      descuento_porcentaje: fields.descuento_porcentaje,
      notas: fields.notas?.trim() || null,
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidar()
  return { ok: true }
}

export async function desactivarCliente(id: number) {
  await requireStaff()
  const supabase = createServerSupabase()
  const { error } = await supabase
    .from('clientes')
    .update({ activo: false })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidar()
  return { ok: true }
}
