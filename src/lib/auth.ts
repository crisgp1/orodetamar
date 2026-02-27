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
 * Útil como fallback cuando el webhook de Clerk no llega (ej. desarrollo local).
 */
export async function ensureProfile() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return null

  const supabase = createServerSupabase()

  // Verificar si ya existe
  const { data: existing } = await supabase
    .from('perfiles')
    .select('id, rol')
    .eq('clerk_id', userId)
    .single()

  if (existing) {
    return { userId, rol: existing.rol as Rol }
  }

  // No existe → obtener datos de Clerk y crear perfil
  const client = await clerkClient()
  const user = await client.users.getUser(userId)

  const nombre =
    `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Usuario'
  const email = user.emailAddresses[0]?.emailAddress ?? ''
  const rol: Rol = 'CLIENTE'

  const { error } = await supabase.from('perfiles').insert({
    clerk_id: userId,
    nombre,
    email,
    rol,
  })

  if (error) {
    console.error('[ensureProfile] Error creando perfil:', error)
    // Si falla por duplicado (race condition con webhook), intentar leer de nuevo
    if (error.code === '23505') {
      const { data: retry } = await supabase
        .from('perfiles')
        .select('id, rol')
        .eq('clerk_id', userId)
        .single()
      if (retry) return { userId, rol: retry.rol as Rol }
    }
    return { userId, rol }
  }

  // Sincronizar metadata en Clerk
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { rol },
  })

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
