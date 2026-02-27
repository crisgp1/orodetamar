import { z } from 'zod'

export const registrarGastoSchema = z.object({
  tipo: z.enum(['GASOLINA', 'PERMISO', 'MATERIA_PRIMA', 'EMPAQUE', 'RENTA', 'HERRAMIENTA', 'MARKETING', 'OTRO']),
  concepto: z.string().min(1, 'Concepto requerido'),
  monto: z.number().positive('Monto mayor a 0'),
  fecha: z.string().min(1, 'Fecha requerida'),
  notas: z.string().nullable(),
})

export type RegistrarGastoInput = z.infer<typeof registrarGastoSchema>
