import { z } from 'zod'

const lineaPedidoSchema = z.object({
  producto_id: z.number().int().positive('Selecciona producto'),
  cantidad: z.number().int().positive('Cantidad mayor a 0'),
  precio_unitario: z.number().positive('Precio mayor a 0'),
})

export const crearPedidoSchema = z.object({
  cliente_id: z.number().int().positive('Selecciona cliente'),
  fecha_entrega_min: z.string().nullable(),
  descuento_porcentaje: z.number().min(0).max(100).default(0),
  canal_venta: z.string().nullable(),
  notas: z.string().nullable(),
  lineas: z.array(lineaPedidoSchema).min(1, 'Agrega al menos un producto'),
})

export const editarPedidoSchema = crearPedidoSchema.extend({
  pedido_id: z.number().int().positive(),
})

export const entregarPedidoSchema = z.object({
  pedido_id: z.number().int().positive(),
  pago_inmediato: z.boolean(),
  metodo_pago: z.enum(['EFECTIVO', 'TRANSFERENCIA']).optional(),
})

export const registrarPagoPedidoSchema = z.object({
  pedido_id: z.number().int().positive(),
  monto: z.number().positive('Monto mayor a 0'),
  metodo_pago: z.enum(['EFECTIVO', 'TRANSFERENCIA']),
  notas: z.string().nullable(),
})

export const cancelarPedidoSchema = z.object({
  pedido_id: z.number().int().positive(),
  notas: z.string().min(1, 'Motivo de cancelación obligatorio'),
})

export type CrearPedidoInput = z.infer<typeof crearPedidoSchema>
export type EditarPedidoInput = z.infer<typeof editarPedidoSchema>
export type EntregarPedidoInput = z.infer<typeof entregarPedidoSchema>
export type RegistrarPagoPedidoInput = z.infer<typeof registrarPagoPedidoSchema>
export type CancelarPedidoInput = z.infer<typeof cancelarPedidoSchema>
