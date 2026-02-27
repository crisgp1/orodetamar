import { z } from 'zod'

export const registrarProduccionSchema = z.object({
  producto_id: z.number().int().positive('Selecciona un producto'),
  cantidad: z.number().int().positive('La cantidad debe ser mayor a 0'),
  notas: z.string().optional(),
})

export const registrarMermaSchema = z.object({
  producto_id: z.number().int().positive('Selecciona un producto'),
  cantidad: z.number().int().positive('La cantidad debe ser mayor a 0'),
  notas: z.string().min(1, 'Debes explicar la razon de la merma'),
})

export const registrarReingresoSchema = z.object({
  producto_id: z.number().int().positive('Selecciona un producto'),
  cantidad: z.number().int().positive('La cantidad debe ser mayor a 0'),
  notas: z.string().min(1, 'Debes explicar el origen del reingreso'),
})

export const registrarReprocesamientoSchema = z
  .object({
    producto_origen_id: z.number().int().positive('Selecciona producto origen'),
    cantidad_origen: z.number().int().positive('Cantidad debe ser mayor a 0'),
    producto_destino_id: z
      .number()
      .int()
      .positive('Selecciona producto destino'),
    cantidad_destino: z
      .number()
      .int()
      .positive('Cantidad producida debe ser mayor a 0'),
    notas: z.string().optional(),
  })
  .refine((data) => data.producto_origen_id !== data.producto_destino_id, {
    message: 'Origen y destino deben ser productos diferentes',
    path: ['producto_destino_id'],
  })

export type RegistrarProduccionInput = z.infer<
  typeof registrarProduccionSchema
>
export type RegistrarMermaInput = z.infer<typeof registrarMermaSchema>
export type RegistrarReingresoInput = z.infer<typeof registrarReingresoSchema>
export type RegistrarReprocesamientoInput = z.infer<
  typeof registrarReprocesamientoSchema
>
