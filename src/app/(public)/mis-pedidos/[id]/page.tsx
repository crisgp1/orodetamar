import { redirect, notFound } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getDictionary, defaultLocale } from '../../_dictionaries'
import { PedidoDetalleContent } from './pedido-detalle-content'

export const metadata = {
  title: 'Detalle del pedido | Oro de Tamar',
}

export default async function PedidoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect('/')

  const { id } = await params
  const pedidoId = Number(id)
  if (!pedidoId) notFound()

  const supabase = createServerSupabase()

  // Get perfil
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('id')
    .eq('clerk_id', userId)
    .single()

  if (!perfil) redirect('/')

  // Get pedido (only if it belongs to this user)
  const { data: pedido } = await supabase
    .from('pedidos')
    .select(`
      id,
      estado,
      subtotal,
      total,
      origen,
      direccion_entrega,
      telefono_contacto,
      requiere_anticipo,
      monto_anticipo,
      tiene_delay,
      delay_motivo,
      fecha_entrega_estimada,
      notas,
      created_at,
      pedido_detalle (
        id,
        producto_id,
        cantidad,
        precio_unitario,
        subtotal,
        productos:producto_id (nombre, presentacion, imagen_url)
      ),
      pedido_comprobantes (
        id,
        imagen_url,
        monto_declarado,
        estado,
        notas_admin,
        created_at
      )
    `)
    .eq('id', pedidoId)
    .eq('perfil_id', perfil.id)
    .single()

  if (!pedido) notFound()

  const dictionary = getDictionary(defaultLocale)

  return <PedidoDetalleContent dictionary={dictionary} pedido={pedido} />
}
