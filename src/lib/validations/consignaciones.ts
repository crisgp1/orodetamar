import { z } from 'zod'

export const crearConsignacionSchema = z.object({
  cliente_id: z.number().int().positive('Selecciona un cliente'),
  fecha_entrega: z.string().min(1, 'Selecciona fecha de entrega'),
  notas: z.string().optional(),
  productos: z
    .array(
      z.object({
        producto_id: z.number().int().positive('Selecciona producto'),
        cantidad: z.number().int().positive('Cantidad mayor a 0'),
        precio_unitario: z.number().positive('Precio mayor a 0'),
      })
    )
    .min(1, 'Agrega al menos un producto'),
})

export const liquidarConsignacionSchema = z.object({
  consignacion_id: z.number().int().positive(),
  productos: z
    .array(
      z.object({
        detalle_id: z.number().int().positive(),
        producto_id: z.number().int().positive(),
        cantidad_vendida: z.number().int().min(0),
        cantidad_retornada: z.number().int().min(0),
        destino_retorno: z
          .enum(['INVENTARIO', 'REPROCESAMIENTO_PULPA'])
          .nullable(),
        precio_unitario: z.number().positive(),
        notas_faltante: z.string().nullable(),
      })
    )
    .min(1),
  cobro_inmediato: z.boolean(),
  monto_cobro: z.number().positive().optional(),
  metodo_pago: z.enum(['EFECTIVO', 'TRANSFERENCIA']).optional(),
})

export const registrarPagoSchema = z.object({
  consignacion_id: z.number().int().positive(),
  monto: z.number().positive('Monto mayor a 0'),
  metodo_pago: z.enum(['EFECTIVO', 'TRANSFERENCIA']),
  notas: z.string().optional(),
})

export type CrearConsignacionInput = z.infer<typeof crearConsignacionSchema>
export type LiquidarConsignacionInput = z.infer<
  typeof liquidarConsignacionSchema
>
export type RegistrarPagoInput = z.infer<typeof registrarPagoSchema>
