// ============================================================
// Tipos de la BD — generados manualmente desde docs/schema.sql
// IMPORTANTE: usar `type`, NO `interface` (Supabase generic bug)
// ============================================================

// Enums (15)
export type TipoCliente =
  | 'CONSUMIDOR_FINAL'
  | 'RESTAURANTE'
  | 'ABARROTES'
  | 'MERCADO'
  | 'MAYORISTA'
  | 'CONSIGNACION'

export type ModalidadPago = 'CONTADO' | 'CONSIGNACION'

export type CanalOrigen =
  | 'RECOMENDACION'
  | 'PUNTO_DE_VENTA'
  | 'FACEBOOK'
  | 'WHATSAPP'
  | 'VISITA_DIRECTA'
  | 'SITIO_WEB'
  | 'OTRO'

export type EstadoPedido =
  | 'PENDIENTE_PAGO'
  | 'RECIBIDO'
  | 'PAGO_CONFIRMADO'
  | 'EN_PREPARACION'
  | 'LISTO'
  | 'EN_RUTA'
  | 'ENTREGADO'
  | 'CANCELADO'

export type EstadoConsignacion =
  | 'ACTIVA'
  | 'EN_REVISION'
  | 'SALDO_PENDIENTE'
  | 'LIQUIDADA'
  | 'CANCELADA'

export type TipoMovimiento =
  | 'PRODUCCION'
  | 'VENTA'
  | 'CONSIGNACION_SALIDA'
  | 'CONSIGNACION_RETORNO'
  | 'REPROCESAMIENTO'
  | 'MERMA'
  | 'AJUSTE'

export type DestinoRetorno = 'INVENTARIO' | 'REPROCESAMIENTO_PULPA'

export type MetodoPago = 'EFECTIVO' | 'TRANSFERENCIA' | 'TRANSFERENCIA_SPEI'

export type ZonaUbicacion = 'TURISTICA' | 'POPULAR' | 'COMERCIAL'

export type PrioridadUbicacion = 'ALTA' | 'NORMAL'

export type RolUsuario = 'ADMIN' | 'APOYO' | 'CLIENTE'

export type UnidadMedida = 'KG' | 'G' | 'UNIDAD' | 'LITRO' | 'ML'

export type TipoMovimientoMP = 'COMPRA' | 'CONSUMO_PRODUCCION' | 'MERMA' | 'AJUSTE'

export type TipoGasto =
  | 'GASOLINA'
  | 'PERMISO'
  | 'MATERIA_PRIMA'
  | 'EMPAQUE'
  | 'RENTA'
  | 'HERRAMIENTA'
  | 'MARKETING'
  | 'OTRO'

// ============================================================
// Row types (24 tablas)
// IMPORTANT: must be `type`, not `interface` — interfaces don't
// satisfy Record<string, unknown> in Supabase's generic
// conditionals when exported across files, resolving to `never`.
// ============================================================

export type EstadoComprobante = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO'

export type OrigenPedido = 'WEB' | 'WHATSAPP' | 'PRESENCIAL' | 'TELEFONO'

export type Perfil = {
  id: number
  clerk_id: string
  nombre: string
  email: string
  rol: RolUsuario
  cliente_id: number | null
  activo: boolean
  created_at: string
  updated_at: string
}

export type CategoriaProducto = {
  id: number
  nombre: string
  descripcion: string | null
  vida_util_dias_ambiente: number | null
  vida_util_dias_refrigerado: number | null
  vida_util_dias_congelado: number | null
  beneficios_salud: string | null
  created_at: string
}

export type Producto = {
  id: number
  categoria_id: number
  nombre: string
  presentacion: string
  peso_gramos: number
  precio_venta: number
  precio_mayoreo: number | null
  sku: string | null
  es_snack: boolean
  activo: boolean
  imagen_url: string | null
  created_at: string
  updated_at: string
}

export type ProductoImagen = {
  id: number
  producto_id: number
  imagen_url: string
  posicion: number
  created_at: string
}

export type Cliente = {
  id: number
  nombre: string
  telefono: string | null
  whatsapp: string | null
  email: string | null
  tipo: TipoCliente
  modalidad_pago: ModalidadPago
  canal_origen: CanalOrigen | null
  referido_por_id: number | null
  direccion: string | null
  ciudad: string | null
  descuento_porcentaje: number | null
  notas: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export type Pedido = {
  id: number
  cliente_id: number
  perfil_id: number | null
  fecha_pedido: string
  fecha_entrega_min: string | null
  fecha_entrega_max: string | null
  fecha_entrega_real: string | null
  estado: EstadoPedido
  origen: string | null
  canal_venta: string | null
  direccion_entrega: string | null
  telefono_contacto: string | null
  requiere_anticipo: boolean
  monto_anticipo: number | null
  descuento_porcentaje: number | null
  subtotal: number | null
  total: number | null
  tiene_delay: boolean
  delay_motivo: string | null
  fecha_entrega_estimada: string | null
  notas: string | null
  created_at: string
  updated_at: string
}

export type PedidoComprobante = {
  id: number
  pedido_id: number
  imagen_url: string
  monto_declarado: number | null
  estado: EstadoComprobante
  notas_admin: string | null
  created_at: string
  revisado_at: string | null
}

export type PedidoDetalle = {
  id: number
  pedido_id: number
  producto_id: number
  cantidad: number
  precio_unitario: number
  subtotal: number
}

export type PedidoPago = {
  id: number
  pedido_id: number
  monto: number
  metodo_pago: MetodoPago
  fecha_pago: string
  notas: string | null
}

export type Consignacion = {
  id: number
  cliente_id: number
  fecha_entrega: string
  fecha_revision: string | null
  fecha_liquidacion: string | null
  estado: EstadoConsignacion
  total_vendido: number
  total_cobrado: number
  notas: string | null
  created_at: string
  updated_at: string
}

export type ConsignacionDetalle = {
  id: number
  consignacion_id: number
  producto_id: number
  cantidad_dejada: number
  cantidad_vendida: number
  cantidad_retornada: number
  precio_unitario: number
  destino_retorno: DestinoRetorno | null
  notas_faltante: string | null
}

export type ConsignacionPago = {
  id: number
  consignacion_id: number
  monto: number
  metodo_pago: MetodoPago
  fecha_pago: string
  notas: string | null
}

export type Inventario = {
  id: number
  producto_id: number
  cantidad_disponible: number
  ultima_actualizacion: string
}

export type MovimientoInventario = {
  id: number
  producto_id: number
  tipo: TipoMovimiento
  cantidad: number
  producto_origen_id: number | null
  pedido_id: number | null
  consignacion_id: number | null
  notas: string | null
  created_at: string
}

export type Ubicacion = {
  id: number
  nombre: string
  direccion: string | null
  ciudad: string | null
  latitud: number | null
  longitud: number | null
  zona: ZonaUbicacion | null
  activo: boolean
  notas: string | null
  created_at: string
}

export type RutaSemanal = {
  id: number
  ubicacion_id: number
  dia_semana: number
  hora_inicio: string
  hora_fin: string
  prioridad: PrioridadUbicacion
  activo: boolean
}

export type VentaStand = {
  id: number
  ubicacion_id: number
  fecha: string
  producto_id: number
  cantidad_vendida: number
  total: number
  metodo_pago: MetodoPago | null
  notas: string | null
  anulada: boolean
  created_at: string
}

export type EmpresaInfo = {
  id: number
  clave: string
  titulo: string | null
  contenido: string
  orden: number
  updated_at: string
}

export type Premio = {
  id: number
  nombre: string
  otorgado_por: string | null
  fecha: string | null
  descripcion: string | null
  imagen_url: string | null
  created_at: string
}

// ── Tablas nuevas ───────────────────────────────────────────

export type MateriaPrima = {
  id: number
  nombre: string
  unidad_medida: UnidadMedida
  costo_unitario_actual: number | null
  proveedor: string | null
  notas: string | null
  activo: boolean
  created_at: string
}

export type RecetaIngrediente = {
  id: number
  producto_id: number
  materia_prima_id: number
  cantidad_necesaria: number
  unidad_medida: UnidadMedida
  notas: string | null
}

export type CompraMateriaPrima = {
  id: number
  materia_prima_id: number
  cantidad: number
  costo_total: number
  costo_unitario: number
  proveedor: string | null
  fecha_compra: string
  notas: string | null
  created_at: string
}

export type InventarioMateriaPrima = {
  id: number
  materia_prima_id: number
  cantidad_disponible: number
}

export type MovimientoMateriaPrima = {
  id: number
  materia_prima_id: number
  tipo: TipoMovimientoMP
  cantidad: number
  compra_id: number | null
  notas: string | null
  created_at: string
}

export type Gasto = {
  id: number
  tipo: TipoGasto
  concepto: string
  monto: number
  fecha: string
  notas: string | null
  created_at: string
}

export type CierreStand = {
  id: number
  ubicacion_id: number
  fecha: string
  producto_id: number
  cantidad_llevada: number
  cantidad_vendida: number
  cantidad_retornada: number
  notas: string | null
  created_at: string
}

// ============================================================
// View types (9 vistas) — columnas exactas del SQL
// ============================================================

export type VDashboard = {
  consignaciones_activas: number
  consignaciones_con_saldo: number
  saldo_pendiente_total: number
  pedidos_pendientes: number
  productos_stock_bajo: number
  ventas_semana: number
  materias_primas_stock_bajo: number
  gastos_mes_actual: number
}

export type VStockActual = {
  producto_id: number
  producto_nombre: string
  sku: string | null
  categoria: string
  presentacion: string
  peso_gramos: number
  precio_venta: number
  cantidad_disponible: number
  ultima_actualizacion: string
  alerta: 'AGOTADO' | 'STOCK_BAJO' | 'OK'
}

export type VConsignacionesActivas = {
  id: number
  cliente_id: number
  cliente_nombre: string
  estado: EstadoConsignacion
  fecha_entrega: string
  dias_transcurridos: number
  total_dejado: number
  total_vendido: number
  total_cobrado: number
  saldo_pendiente: number
  created_at: string
}

export type VRutaHoy = {
  dia_semana: number
  dia_nombre: string
  ubicacion: string
  ciudad: string | null
  zona: ZonaUbicacion | null
  latitud: number | null
  longitud: number | null
  hora_inicio: string
  hora_fin: string
  prioridad: PrioridadUbicacion
  en_horario: boolean
}

export type VRentabilidadUbicaciones = {
  ubicacion_id: number
  ubicacion: string
  zona: ZonaUbicacion | null
  dias_venta: number
  total_unidades: number
  total_ventas: number
  promedio_por_dia: number
}

export type VStockMateriaPrima = {
  materia_prima_id: number
  nombre: string
  unidad_medida: UnidadMedida
  costo_unitario_actual: number | null
  proveedor: string | null
  cantidad_disponible: number
  alerta: 'AGOTADO' | 'STOCK_BAJO' | 'OK'
}

export type VCostoProduccion = {
  producto_id: number
  producto_nombre: string
  presentacion: string
  precio_venta: number
  costo_materia_prima: number
  margen_bruto: number
  margen_porcentaje: number
}

export type VRentabilidadMensual = {
  ventas_stand_mes: number
  cobros_consignacion_mes: number
  ventas_pedidos_mes: number
  compras_mes: number
  gastos_mes: number
}

export type VCierresStand = {
  id: number
  ubicacion_id: number
  ubicacion_nombre: string
  fecha: string
  producto_id: number
  producto_nombre: string
  cantidad_llevada: number
  cantidad_vendida: number
  cantidad_retornada: number
  sin_justificar: number
  notas: string | null
}

export type VIngresosConsolidados = {
  canal: 'STAND' | 'CONSIGNACION' | 'PEDIDO'
  producto_id: number
  producto_nombre: string
  presentacion: string
  cantidad_vendida: number
  monto: number
  metodo_pago: string | null
  fecha: string
  created_at: string
}

export type VCostosProduccionPeriodo = {
  producto_id: number
  producto_nombre: string
  presentacion: string
  precio_venta: number
  costo_unitario: number
  margen_porcentaje: number
}

export type VVentasStand = {
  id: number
  ubicacion_id: number
  fecha: string
  producto_id: number
  cantidad_vendida: number
  total: number
  metodo_pago: MetodoPago | null
  notas: string | null
  anulada: boolean
  created_at: string
  fecha_local: string
  producto_nombre: string
  producto_presentacion: string
  producto_precio: number
  ubicacion_nombre: string
}

// ============================================================
// Database type for Supabase client
// ============================================================

export type Database = {
  public: {
    Tables: {
      perfiles: {
        Row: Perfil
        Insert: {
          clerk_id: string
          nombre: string
          email: string
          rol?: RolUsuario
          cliente_id?: number | null
          activo?: boolean
        }
        Update: {
          clerk_id?: string
          nombre?: string
          email?: string
          rol?: RolUsuario
          cliente_id?: number | null
          activo?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'perfiles_cliente_id_fkey'
            columns: ['cliente_id']
            isOneToOne: false
            referencedRelation: 'clientes'
            referencedColumns: ['id']
          },
        ]
      }
      categorias_producto: {
        Row: CategoriaProducto
        Insert: {
          nombre: string
          descripcion?: string | null
          vida_util_dias_ambiente?: number | null
          vida_util_dias_refrigerado?: number | null
          vida_util_dias_congelado?: number | null
          beneficios_salud?: string | null
        }
        Update: {
          nombre?: string
          descripcion?: string | null
          vida_util_dias_ambiente?: number | null
          vida_util_dias_refrigerado?: number | null
          vida_util_dias_congelado?: number | null
          beneficios_salud?: string | null
        }
        Relationships: []
      }
      productos: {
        Row: Producto
        Insert: {
          categoria_id: number
          nombre: string
          presentacion: string
          peso_gramos: number
          precio_venta: number
          precio_mayoreo?: number | null
          sku?: string | null
          es_snack?: boolean
          activo?: boolean
          imagen_url?: string | null
        }
        Update: {
          categoria_id?: number
          nombre?: string
          presentacion?: string
          peso_gramos?: number
          precio_venta?: number
          precio_mayoreo?: number | null
          sku?: string | null
          es_snack?: boolean
          activo?: boolean
          imagen_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'productos_categoria_id_fkey'
            columns: ['categoria_id']
            isOneToOne: false
            referencedRelation: 'categorias_producto'
            referencedColumns: ['id']
          },
        ]
      }
      producto_imagenes: {
        Row: ProductoImagen
        Insert: {
          producto_id: number
          imagen_url: string
          posicion?: number
        }
        Update: {
          producto_id?: number
          imagen_url?: string
          posicion?: number
        }
        Relationships: [
          {
            foreignKeyName: 'producto_imagenes_producto_id_fkey'
            columns: ['producto_id']
            isOneToOne: false
            referencedRelation: 'productos'
            referencedColumns: ['id']
          },
        ]
      }
      clientes: {
        Row: Cliente
        Insert: {
          nombre: string
          tipo?: TipoCliente
          modalidad_pago?: ModalidadPago
          telefono?: string | null
          whatsapp?: string | null
          email?: string | null
          canal_origen?: CanalOrigen | null
          referido_por_id?: number | null
          direccion?: string | null
          ciudad?: string | null
          descuento_porcentaje?: number | null
          notas?: string | null
          activo?: boolean
        }
        Update: {
          nombre?: string
          tipo?: TipoCliente
          modalidad_pago?: ModalidadPago
          telefono?: string | null
          whatsapp?: string | null
          email?: string | null
          canal_origen?: CanalOrigen | null
          referido_por_id?: number | null
          direccion?: string | null
          ciudad?: string | null
          descuento_porcentaje?: number | null
          notas?: string | null
          activo?: boolean
        }
        Relationships: []
      }
      pedidos: {
        Row: Pedido
        Insert: {
          cliente_id: number
          perfil_id?: number | null
          estado?: EstadoPedido
          origen?: string
          fecha_entrega_min?: string | null
          fecha_entrega_max?: string | null
          fecha_entrega_real?: string | null
          canal_venta?: string | null
          direccion_entrega?: string | null
          telefono_contacto?: string | null
          requiere_anticipo?: boolean
          monto_anticipo?: number | null
          descuento_porcentaje?: number | null
          subtotal?: number | null
          total?: number | null
          tiene_delay?: boolean
          delay_motivo?: string | null
          fecha_entrega_estimada?: string | null
          notas?: string | null
        }
        Update: {
          cliente_id?: number
          perfil_id?: number | null
          estado?: EstadoPedido
          origen?: string
          fecha_entrega_min?: string | null
          fecha_entrega_max?: string | null
          fecha_entrega_real?: string | null
          canal_venta?: string | null
          direccion_entrega?: string | null
          telefono_contacto?: string | null
          requiere_anticipo?: boolean
          monto_anticipo?: number | null
          descuento_porcentaje?: number | null
          subtotal?: number | null
          total?: number | null
          tiene_delay?: boolean
          delay_motivo?: string | null
          fecha_entrega_estimada?: string | null
          notas?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'pedidos_cliente_id_fkey'
            columns: ['cliente_id']
            isOneToOne: false
            referencedRelation: 'clientes'
            referencedColumns: ['id']
          },
        ]
      }
      pedido_detalle: {
        Row: PedidoDetalle
        Insert: {
          pedido_id: number
          producto_id: number
          cantidad: number
          precio_unitario: number
          subtotal: number
        }
        Update: {
          pedido_id?: number
          producto_id?: number
          cantidad?: number
          precio_unitario?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: 'pedido_detalle_pedido_id_fkey'
            columns: ['pedido_id']
            isOneToOne: false
            referencedRelation: 'pedidos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pedido_detalle_producto_id_fkey'
            columns: ['producto_id']
            isOneToOne: false
            referencedRelation: 'productos'
            referencedColumns: ['id']
          },
        ]
      }
      pedido_pagos: {
        Row: PedidoPago
        Insert: {
          pedido_id: number
          monto: number
          metodo_pago: MetodoPago
          notas?: string | null
        }
        Update: {
          pedido_id?: number
          monto?: number
          metodo_pago?: MetodoPago
          notas?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'pedido_pagos_pedido_id_fkey'
            columns: ['pedido_id']
            isOneToOne: false
            referencedRelation: 'pedidos'
            referencedColumns: ['id']
          },
        ]
      }
      pedido_comprobantes: {
        Row: PedidoComprobante
        Insert: {
          pedido_id: number
          imagen_url: string
          monto_declarado?: number | null
          estado?: EstadoComprobante
          notas_admin?: string | null
        }
        Update: {
          pedido_id?: number
          imagen_url?: string
          monto_declarado?: number | null
          estado?: EstadoComprobante
          notas_admin?: string | null
          revisado_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'pedido_comprobantes_pedido_id_fkey'
            columns: ['pedido_id']
            isOneToOne: false
            referencedRelation: 'pedidos'
            referencedColumns: ['id']
          },
        ]
      }
      consignaciones: {
        Row: Consignacion
        Insert: {
          cliente_id: number
          fecha_entrega: string
          estado?: EstadoConsignacion
          fecha_revision?: string | null
          fecha_liquidacion?: string | null
          total_vendido?: number
          total_cobrado?: number
          notas?: string | null
        }
        Update: {
          cliente_id?: number
          fecha_entrega?: string
          estado?: EstadoConsignacion
          fecha_revision?: string | null
          fecha_liquidacion?: string | null
          total_vendido?: number
          total_cobrado?: number
          notas?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'consignaciones_cliente_id_fkey'
            columns: ['cliente_id']
            isOneToOne: false
            referencedRelation: 'clientes'
            referencedColumns: ['id']
          },
        ]
      }
      consignacion_detalle: {
        Row: ConsignacionDetalle
        Insert: {
          consignacion_id: number
          producto_id: number
          cantidad_dejada: number
          precio_unitario: number
          cantidad_vendida?: number
          cantidad_retornada?: number
          destino_retorno?: DestinoRetorno | null
          notas_faltante?: string | null
        }
        Update: {
          consignacion_id?: number
          producto_id?: number
          cantidad_dejada?: number
          precio_unitario?: number
          cantidad_vendida?: number
          cantidad_retornada?: number
          destino_retorno?: DestinoRetorno | null
          notas_faltante?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'consignacion_detalle_producto_id_fkey'
            columns: ['producto_id']
            isOneToOne: false
            referencedRelation: 'productos'
            referencedColumns: ['id']
          },
        ]
      }
      consignacion_pagos: {
        Row: ConsignacionPago
        Insert: {
          consignacion_id: number
          monto: number
          metodo_pago: MetodoPago
          notas?: string | null
        }
        Update: {
          consignacion_id?: number
          monto?: number
          metodo_pago?: MetodoPago
          notas?: string | null
        }
        Relationships: []
      }
      inventario: {
        Row: Inventario
        Insert: {
          producto_id: number
          cantidad_disponible?: number
        }
        Update: {
          producto_id?: number
          cantidad_disponible?: number
        }
        Relationships: []
      }
      movimientos_inventario: {
        Row: MovimientoInventario
        Insert: {
          producto_id: number
          tipo: TipoMovimiento
          cantidad: number
          producto_origen_id?: number | null
          pedido_id?: number | null
          consignacion_id?: number | null
          notas?: string | null
        }
        Update: {
          producto_id?: number
          tipo?: TipoMovimiento
          cantidad?: number
          producto_origen_id?: number | null
          pedido_id?: number | null
          consignacion_id?: number | null
          notas?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'movimientos_inventario_producto_id_fkey'
            columns: ['producto_id']
            isOneToOne: false
            referencedRelation: 'productos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'movimientos_inventario_producto_origen_id_fkey'
            columns: ['producto_origen_id']
            isOneToOne: false
            referencedRelation: 'productos'
            referencedColumns: ['id']
          },
        ]
      }
      ubicaciones: {
        Row: Ubicacion
        Insert: {
          nombre: string
          direccion?: string | null
          ciudad?: string | null
          latitud?: number | null
          longitud?: number | null
          zona?: ZonaUbicacion | null
          activo?: boolean
          notas?: string | null
        }
        Update: {
          nombre?: string
          direccion?: string | null
          ciudad?: string | null
          latitud?: number | null
          longitud?: number | null
          zona?: ZonaUbicacion | null
          activo?: boolean
          notas?: string | null
        }
        Relationships: []
      }
      ruta_semanal: {
        Row: RutaSemanal
        Insert: {
          ubicacion_id: number
          dia_semana: number
          hora_inicio: string
          hora_fin: string
          prioridad?: PrioridadUbicacion
          activo?: boolean
        }
        Update: {
          ubicacion_id?: number
          dia_semana?: number
          hora_inicio?: string
          hora_fin?: string
          prioridad?: PrioridadUbicacion
          activo?: boolean
        }
        Relationships: []
      }
      ventas_stand: {
        Row: VentaStand
        Insert: {
          ubicacion_id: number
          fecha: string
          producto_id: number
          cantidad_vendida: number
          total: number
          metodo_pago?: MetodoPago | null
          notas?: string | null
          anulada?: boolean
        }
        Update: {
          ubicacion_id?: number
          fecha?: string
          producto_id?: number
          cantidad_vendida?: number
          total?: number
          metodo_pago?: MetodoPago | null
          notas?: string | null
          anulada?: boolean
        }
        Relationships: []
      }
      empresa_info: {
        Row: EmpresaInfo
        Insert: {
          clave: string
          contenido: string
          titulo?: string | null
          orden?: number
        }
        Update: {
          clave?: string
          contenido?: string
          titulo?: string | null
          orden?: number
        }
        Relationships: []
      }
      premios: {
        Row: Premio
        Insert: {
          nombre: string
          otorgado_por?: string | null
          fecha?: string | null
          descripcion?: string | null
          imagen_url?: string | null
        }
        Update: {
          nombre?: string
          otorgado_por?: string | null
          fecha?: string | null
          descripcion?: string | null
          imagen_url?: string | null
        }
        Relationships: []
      }
      materias_primas: {
        Row: MateriaPrima
        Insert: {
          nombre: string
          unidad_medida: UnidadMedida
          costo_unitario_actual?: number | null
          proveedor?: string | null
          notas?: string | null
          activo?: boolean
        }
        Update: {
          nombre?: string
          unidad_medida?: UnidadMedida
          costo_unitario_actual?: number | null
          proveedor?: string | null
          notas?: string | null
          activo?: boolean
        }
        Relationships: []
      }
      receta_ingredientes: {
        Row: RecetaIngrediente
        Insert: {
          producto_id: number
          materia_prima_id: number
          cantidad_necesaria: number
          unidad_medida: UnidadMedida
          notas?: string | null
        }
        Update: {
          producto_id?: number
          materia_prima_id?: number
          cantidad_necesaria?: number
          unidad_medida?: UnidadMedida
          notas?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'receta_ingredientes_producto_id_fkey'
            columns: ['producto_id']
            isOneToOne: false
            referencedRelation: 'productos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'receta_ingredientes_materia_prima_id_fkey'
            columns: ['materia_prima_id']
            isOneToOne: false
            referencedRelation: 'materias_primas'
            referencedColumns: ['id']
          },
        ]
      }
      compras_materia_prima: {
        Row: CompraMateriaPrima
        Insert: {
          materia_prima_id: number
          cantidad: number
          costo_total: number
          proveedor?: string | null
          fecha_compra?: string
          notas?: string | null
        }
        Update: {
          materia_prima_id?: number
          cantidad?: number
          costo_total?: number
          proveedor?: string | null
          fecha_compra?: string
          notas?: string | null
        }
        Relationships: []
      }
      inventario_materia_prima: {
        Row: InventarioMateriaPrima
        Insert: {
          materia_prima_id: number
          cantidad_disponible?: number
        }
        Update: {
          materia_prima_id?: number
          cantidad_disponible?: number
        }
        Relationships: []
      }
      movimientos_materia_prima: {
        Row: MovimientoMateriaPrima
        Insert: {
          materia_prima_id: number
          tipo: TipoMovimientoMP
          cantidad: number
          compra_id?: number | null
          notas?: string | null
        }
        Update: {
          materia_prima_id?: number
          tipo?: TipoMovimientoMP
          cantidad?: number
          compra_id?: number | null
          notas?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'movimientos_materia_prima_materia_prima_id_fkey'
            columns: ['materia_prima_id']
            isOneToOne: false
            referencedRelation: 'materias_primas'
            referencedColumns: ['id']
          },
        ]
      }
      gastos: {
        Row: Gasto
        Insert: {
          tipo: TipoGasto
          concepto: string
          monto: number
          fecha?: string
          notas?: string | null
        }
        Update: {
          tipo?: TipoGasto
          concepto?: string
          monto?: number
          fecha?: string
          notas?: string | null
        }
        Relationships: []
      }
      cierres_stand: {
        Row: CierreStand
        Insert: {
          ubicacion_id: number
          fecha: string
          producto_id: number
          cantidad_llevada: number
          cantidad_vendida: number
          cantidad_retornada: number
          notas?: string | null
        }
        Update: {
          ubicacion_id?: number
          fecha?: string
          producto_id?: number
          cantidad_llevada?: number
          cantidad_vendida?: number
          cantidad_retornada?: number
          notas?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      v_dashboard: {
        Row: VDashboard
        Relationships: []
      }
      v_stock_actual: {
        Row: VStockActual
        Relationships: []
      }
      v_consignaciones_activas: {
        Row: VConsignacionesActivas
        Relationships: []
      }
      v_ruta_hoy: {
        Row: VRutaHoy
        Relationships: []
      }
      v_rentabilidad_ubicaciones: {
        Row: VRentabilidadUbicaciones
        Relationships: []
      }
      v_stock_materia_prima: {
        Row: VStockMateriaPrima
        Relationships: []
      }
      v_costo_produccion: {
        Row: VCostoProduccion
        Relationships: []
      }
      v_rentabilidad_mensual: {
        Row: VRentabilidadMensual
        Relationships: []
      }
      v_cierres_stand: {
        Row: VCierresStand
        Relationships: []
      }
      v_ventas_stand: {
        Row: VVentasStand
        Relationships: []
      }
      v_ingresos_consolidados: {
        Row: VIngresosConsolidados
        Relationships: []
      }
      v_costos_produccion_periodo: {
        Row: VCostosProduccionPeriodo
        Relationships: []
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Functions: {}
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Enums: {}
  }
}
