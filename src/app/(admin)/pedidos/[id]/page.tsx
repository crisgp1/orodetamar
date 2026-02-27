import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { DetallePedidoView } from '../_components/detalle-pedido-view'

export default async function PedidoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createServerSupabase()

  const [pedidoRes, productosRes] = await Promise.all([
    supabase
      .from('pedidos')
      .select(`
        *,
        clientes(nombre, tipo, telefono, whatsapp, direccion, ciudad),
        pedido_detalle(*, productos(nombre, presentacion, peso_gramos)),
        pedido_pagos(*),
        pedido_comprobantes(*)
      `)
      .eq('id', Number(id))
      .single(),
    supabase
      .from('productos')
      .select('id, nombre, presentacion, peso_gramos, precio_venta, precio_mayoreo')
      .eq('activo', true)
      .order('nombre'),
  ])

  if (!pedidoRes.data) notFound()

  const pedido = pedidoRes.data

  const typed = {
    ...pedido,
    clientes: pedido.clientes as {
      nombre: string
      tipo: string
      telefono: string | null
      whatsapp: string | null
      direccion: string | null
      ciudad: string | null
    } | null,
    pedido_detalle: (pedido.pedido_detalle as Array<{
      id: number
      pedido_id: number
      producto_id: number
      cantidad: number
      precio_unitario: number
      subtotal: number
      productos: { nombre: string; presentacion: string; peso_gramos: number } | null
    }>) ?? [],
    pedido_pagos: (pedido.pedido_pagos as Array<{
      id: number
      pedido_id: number
      monto: number
      metodo_pago: 'EFECTIVO' | 'TRANSFERENCIA'
      fecha_pago: string
      notas: string | null
    }>) ?? [],
    pedido_comprobantes: (pedido.pedido_comprobantes as Array<{
      id: number
      pedido_id: number
      imagen_url: string
      monto_declarado: number | null
      estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO'
      notas_admin: string | null
      created_at: string
      revisado_at: string | null
    }>) ?? [],
  }

  return (
    <DetallePedidoView
      pedido={typed}
      productos={productosRes.data ?? []}
    />
  )
}
