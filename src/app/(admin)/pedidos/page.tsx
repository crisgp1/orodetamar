import { ShoppingCart } from '@phosphor-icons/react/dist/ssr'
import { createServerSupabase } from '@/lib/supabase/server'
import { PedidosView } from './_components/pedidos-view'

export default async function PedidosPage() {
  const supabase = createServerSupabase()

  const [pedidosRes, clientesRes, productosRes] = await Promise.all([
    supabase
      .from('pedidos')
      .select(`
        *,
        clientes(nombre, whatsapp),
        pedido_detalle(*, productos(nombre, presentacion, peso_gramos))
      `)
      .order('created_at', { ascending: false }),
    supabase
      .from('clientes')
      .select('id, nombre, tipo, descuento_porcentaje, modalidad_pago')
      .eq('activo', true)
      .order('nombre'),
    supabase
      .from('productos')
      .select('id, nombre, presentacion, peso_gramos, precio_venta, precio_mayoreo')
      .eq('activo', true)
      .order('nombre'),
  ])

  // Fetch total cobrado per pedido
  const pedidoIds = (pedidosRes.data ?? []).map((p) => p.id)
  const { data: pagosRaw } = pedidoIds.length > 0
    ? await supabase
        .from('pedido_pagos')
        .select('pedido_id, monto')
        .in('pedido_id', pedidoIds)
    : { data: [] as { pedido_id: number; monto: number }[] }

  // Sum pagos per pedido
  const cobradoMap = new Map<number, number>()
  for (const p of pagosRaw ?? []) {
    cobradoMap.set(p.pedido_id, (cobradoMap.get(p.pedido_id) ?? 0) + p.monto)
  }

  const pedidos = (pedidosRes.data ?? []).map((p) => ({
    ...p,
    clientes: p.clientes as { nombre: string; whatsapp: string | null } | null,
    pedido_detalle: (p.pedido_detalle as Array<{
      id: number
      pedido_id: number
      producto_id: number
      cantidad: number
      precio_unitario: number
      subtotal: number
      productos: { nombre: string; presentacion: string; peso_gramos: number } | null
    }>) ?? [],
    total_cobrado: cobradoMap.get(p.id) ?? 0,
  }))

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-muted p-2 text-muted-foreground">
            <ShoppingCart size={24} weight="regular" />
          </div>
          <h1 className="text-2xl font-semibold">Pedidos</h1>
        </div>
      </div>
      <PedidosView
        pedidos={pedidos}
        clientes={clientesRes.data ?? []}
        productos={productosRes.data ?? []}
      />
    </div>
  )
}
