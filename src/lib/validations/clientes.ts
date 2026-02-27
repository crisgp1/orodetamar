import { z } from 'zod'

export const crearClienteSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  telefono: z.string().nullable(),
  whatsapp: z.string().nullable(),
  email: z.string().email('Email inválido').nullable().or(z.literal('')).transform(v => v === '' ? null : v),
  tipo: z.enum(['CONSUMIDOR_FINAL', 'RESTAURANTE', 'ABARROTES', 'MERCADO', 'MAYORISTA', 'CONSIGNACION']),
  modalidad_pago: z.enum(['CONTADO', 'CONSIGNACION']),
  canal_origen: z.enum(['RECOMENDACION', 'PUNTO_DE_VENTA', 'FACEBOOK', 'WHATSAPP', 'VISITA_DIRECTA', 'SITIO_WEB', 'OTRO']).nullable(),
  referido_por_id: z.number().int().positive().nullable(),
  direccion: z.string().nullable(),
  ciudad: z.string().nullable(),
  descuento_porcentaje: z.number().min(0).max(100).nullable(),
  notas: z.string().nullable(),
})

export const actualizarClienteSchema = crearClienteSchema.extend({
  id: z.number().int().positive(),
})

export type CrearClienteInput = z.infer<typeof crearClienteSchema>
export type ActualizarClienteInput = z.infer<typeof actualizarClienteSchema>
