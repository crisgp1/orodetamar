import { z } from 'zod'

export const registrarCompraSchema = z.object({
  materia_prima_id: z.number().int().positive('Selecciona materia prima'),
  cantidad: z.number().positive('Cantidad mayor a 0'),
  costo_total: z.number().positive('Costo mayor a 0'),
  proveedor: z.string().nullable(),
  fecha_compra: z.string().min(1, 'Fecha requerida'),
  notas: z.string().nullable(),
})

export const registrarMovimientoMPSchema = z.object({
  materia_prima_id: z.number().int().positive('Selecciona materia prima'),
  tipo: z.enum(['CONSUMO_PRODUCCION', 'MERMA', 'AJUSTE']),
  cantidad: z.number().positive('Cantidad mayor a 0'),
  notas: z.string().min(1, 'Notas requeridas'),
})

export const crearMateriaPrimaSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  unidad_medida: z.enum(['KG', 'G', 'UNIDAD', 'LITRO', 'ML']),
  proveedor: z.string().nullable(),
  notas: z.string().nullable(),
})

export type RegistrarCompraInput = z.infer<typeof registrarCompraSchema>
export type RegistrarMovimientoMPInput = z.infer<typeof registrarMovimientoMPSchema>
export type CrearMateriaPrimaInput = z.infer<typeof crearMateriaPrimaSchema>
