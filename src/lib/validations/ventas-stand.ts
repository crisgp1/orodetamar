import { z } from 'zod'

export const registrarVentaStandSchema = z.object({
  ubicacion_id: z.number().int().positive('Ubicación requerida'),
  producto_id: z.number().int().positive('Producto requerido'),
  cantidad_vendida: z.number().int().positive('Cantidad mayor a 0'),
  total: z.number().positive('Total mayor a 0'),
  metodo_pago: z.enum(['EFECTIVO', 'TRANSFERENCIA']).nullable(),
  notas: z.string().nullable(),
})

export type RegistrarVentaStandInput = z.infer<typeof registrarVentaStandSchema>

export const registrarCierreStandSchema = z.object({
  ubicacion_id: z.number().int().positive('Ubicación requerida'),
  fecha: z.string().min(1, 'Fecha requerida'),
  metodo_pago: z.enum(['EFECTIVO', 'TRANSFERENCIA']),
  productos: z.array(
    z.object({
      producto_id: z.number().int().positive(),
      cantidad_llevada: z.number().int().min(0),
      cantidad_vendida: z.number().int().min(0),
      cantidad_retornada: z.number().int().min(0),
      notas: z.string().nullable(),
    })
  ).min(1, 'Agrega al menos un producto'),
})

export type RegistrarCierreStandInput = z.infer<typeof registrarCierreStandSchema>
