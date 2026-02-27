import { z } from 'zod'

export const crearUbicacionSchema = z.object({
  nombre: z.string().min(1, 'Nombre obligatorio'),
  direccion: z.string().nullable(),
  ciudad: z.string().nullable(),
  zona: z.enum(['TURISTICA', 'POPULAR', 'COMERCIAL']).nullable(),
  notas: z.string().nullable(),
})

export const actualizarUbicacionSchema = crearUbicacionSchema.extend({
  id: z.number().int().positive(),
})

export const toggleUbicacionSchema = z.object({
  id: z.number().int().positive(),
  activo: z.boolean(),
})

export type CrearUbicacionInput = z.infer<typeof crearUbicacionSchema>
export type ActualizarUbicacionInput = z.infer<typeof actualizarUbicacionSchema>
export type ToggleUbicacionInput = z.infer<typeof toggleUbicacionSchema>
