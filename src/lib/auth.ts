'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { createServerSupabase } from '@/lib/supabase/server'

/**
 * Zero-Trust auth helpers.
 * Cada server action DEBE llamar a uno de estos antes de tocar la BD.
 */

type Rol = 'ADMIN' | 'APOYO' | 'CLIENTE'

/** Obtiene el rol del usuario desde sessionClaims. */
export async function getRol(): Promise<{ userId: string; rol: Rol } | null> {
  const { userId, sessionClaims } = await auth()
  if (!userId) return null

  const rol = (sessionClaims?.metadata as { rol?: Rol } | undefined)?.rol ?? 'CLIENTE'
  return { userId, rol }
}

/**
 * Sync-on-demand: si el perfil no existe en Supabase, lo crea.
 * Usa Clerk publicMetadata como fuente de verdad para el rol.
 */
export async function ensureProfile() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return null

  // Rol autoritativo desde Clerk session claims
  const clerkRol = (sessionClaims?.metadata as { rol?: Rol } | undefined)?.rol

  const supabase = createServerSupabase()

  // Verificar si ya existe
  const { data: existing } = await supabase
    .from('perfiles')
    .select('id, rol')
    .eq('clerk_id', userId)
    .single()

  if (existing) {
    // Si Clerk tiene un rol diferente (ej. admin promovió vía dashboard), sincronizar
    if (clerkRol && clerkRol !== existing.rol) {
      await supabase
        .from('perfiles')
        .update({ rol: clerkRol })
        .eq('clerk_id', userId)
      return { userId, rol: clerkRol }
    }
    return { userId, rol: existing.rol as Rol }
  }

  // No existe → obtener datos de Clerk y crear perfil
  const client = await clerkClient()
  const user = await client.users.getUser(userId)

  const nombre =
    `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Usuario'
  const email = user.emailAddresses[0]?.emailAddress ?? ''
  const rol: Rol = clerkRol ?? 'CLIENTE'

  const { error } = await supabase.from('perfiles').insert({
    clerk_id: userId,
    nombre,
    email,
    rol,
  })

  if (error) {
    console.error('[ensureProfile] Error creando perfil:', error)
    // Duplicado — puede ser race condition (mismo clerk_id) o cambio de entorno (mismo email, distinto clerk_id)
    if (error.code === '23505') {
      // 1. Race condition: mismo clerk_id ya insertado por webhook → leer y retornar
      const { data: byClerk } = await supabase
        .from('perfiles')
        .select('id, rol')
        .eq('clerk_id', userId)
        .single()
      if (byClerk) return { userId, rol: byClerk.rol as Rol }

      // 2. Cambio de entorno (dev↔prod): mismo email verificado, distinto clerk_id
      //    Solo permitir si Clerk confirma que el email está verificado
      const emailObj = user.emailAddresses.find(
        (e) => e.emailAddress === email
      )
      const emailVerificado =
        emailObj?.verification?.status === 'verified'

      if (emailVerificado) {
        const { data: byEmail } = await supabase
          .from('perfiles')
          .select('id, rol')
          .eq('email', email)
          .single()
        if (byEmail) {
          // Solo actualizar clerk_id y nombre — MANTENER el rol existente (no escalar)
          await supabase
            .from('perfiles')
            .update({ clerk_id: userId, nombre })
            .eq('id', byEmail.id)
          return { userId, rol: byEmail.rol as Rol }
        }
      }
    }
    // Fallback: confiar en el rol de Clerk
    return { userId, rol }
  }

  // Sincronizar metadata en Clerk si no tenía rol
  if (!clerkRol) {
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { rol },
    })
  }

  return { userId, rol }
}

/** Lanza error si no hay sesión activa. Retorna userId. */
export async function requireAuth() {
  const { userId } = await auth()
  if (!userId) throw new Error('No autorizado')
  return userId
}

/** Lanza error si el usuario no es ADMIN ni APOYO. Retorna { userId, rol }. */
export async function requireStaff() {
  const { userId, sessionClaims } = await auth()
  if (!userId) throw new Error('No autorizado')

  const rol = (sessionClaims?.metadata as { rol?: Rol } | undefined)?.rol
  if (rol !== 'ADMIN' && rol !== 'APOYO') {
    throw new Error('Sin permisos — se requiere rol ADMIN o APOYO')
  }

  return { userId, rol }
}

/** Lanza error si el usuario no es ADMIN. Retorna userId. */
export async function requireAdmin() {
  const { userId, sessionClaims } = await auth()
  if (!userId) throw new Error('No autorizado')

  const rol = (sessionClaims?.metadata as { rol?: Rol } | undefined)?.rol
  if (rol !== 'ADMIN') {
    throw new Error('Sin permisos de administrador')
  }

  return userId
}
