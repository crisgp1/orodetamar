import { z } from 'zod'

export const crearProductoSchema = z.object({
  categoria_id: z.number().int().positive('Selecciona una categoría'),
  nombre: z.string().min(1, 'Nombre requerido'),
  presentacion: z.enum(['bolsa', 'charolita', 'caja']),
  peso_gramos: z.number().int().positive('Peso debe ser mayor a 0'),
  precio_venta: z.number().positive('Precio debe ser mayor a 0'),
  precio_mayoreo: z.number().positive().nullable(),
  sku: z.string().nullable(),
  es_snack: z.boolean(),
  imagen_url: z.string().nullable(),
})

export const actualizarProductoSchema = z.object({
  id: z.number().int().positive(),
  precio_venta: z.number().positive('Precio debe ser mayor a 0'),
  precio_mayoreo: z.number().positive().nullable(),
  activo: z.boolean(),
  imagen_url: z.string().nullable(),
})

export const ingredienteRecetaSchema = z.object({
  producto_id: z.number().int().positive(),
  materia_prima_id: z.number().int().positive('Selecciona materia prima'),
  cantidad_necesaria: z.number().positive('Cantidad debe ser mayor a 0'),
  unidad_medida: z.enum(['KG', 'G', 'LITRO', 'ML', 'UNIDAD']),
  notas: z.string().nullable(),
})

export type CrearProductoInput = z.infer<typeof crearProductoSchema>
export type ActualizarProductoInput = z.infer<typeof actualizarProductoSchema>
export type IngredienteRecetaInput = z.infer<typeof ingredienteRecetaSchema>
