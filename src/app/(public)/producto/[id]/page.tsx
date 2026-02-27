import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { getDictionary, defaultLocale } from '../../_dictionaries'
import { ProductoDetail } from '../../_components/producto-detail'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = createServerSupabase()
  const { data: producto } = await supabase
    .from('productos')
    .select('nombre, presentacion')
    .eq('id', Number(id))
    .eq('activo', true)
    .single()

  if (!producto) {
    return { title: 'Producto no encontrado | Oro de Tamar' }
  }

  return {
    title: `${producto.nombre} — ${producto.presentacion} | Oro de Tamar`,
    description: `${producto.nombre} ${producto.presentacion}. Dátiles premium de Baja California, cultivados en el desierto y empacados a mano.`,
    openGraph: {
      title: `${producto.nombre} | Oro de Tamar`,
      description: `${producto.nombre} ${producto.presentacion}`,
      type: 'website',
    },
  }
}

export default async function ProductoPage({ params }: Props) {
  const { id } = await params
  const supabase = createServerSupabase()
  const dictionary = getDictionary(defaultLocale)

  // Fetch the product with its category
  const { data: producto } = await supabase
    .from('productos')
    .select(
      'id, categoria_id, nombre, presentacion, peso_gramos, precio_venta, imagen_url, es_snack'
    )
    .eq('id', Number(id))
    .eq('activo', true)
    .single()

  if (!producto) notFound()

  // Fetch category
  const { data: categoria } = await supabase
    .from('categorias_producto')
    .select('id, nombre, descripcion, beneficios_salud')
    .eq('id', producto.categoria_id)
    .single()

  if (!categoria) notFound()

  // Fetch related products (same category, exclude current, max 4)
  const { data: relacionados } = await supabase
    .from('productos')
    .select(
      'id, categoria_id, nombre, presentacion, peso_gramos, precio_venta, imagen_url, es_snack'
    )
    .eq('activo', true)
    .eq('categoria_id', producto.categoria_id)
    .neq('id', producto.id)
    .order('peso_gramos')
    .limit(4)

  // Fetch gallery images for this product + related
  const relatedIds = (relacionados ?? []).map((r) => r.id)
  const allIds = [producto.id, ...relatedIds]
  const { data: imagenesData } = await supabase
    .from('producto_imagenes')
    .select('producto_id, imagen_url')
    .in('producto_id', allIds)
    .order('posicion')

  // Build images map
  const imagenesMap: Record<number, string[]> = {}
  for (const img of imagenesData ?? []) {
    if (!imagenesMap[img.producto_id]) imagenesMap[img.producto_id] = []
    imagenesMap[img.producto_id].push(img.imagen_url)
  }

  // Fetch ALL active products for cart functionality
  const { data: allProductos } = await supabase
    .from('productos')
    .select(
      'id, categoria_id, nombre, presentacion, peso_gramos, precio_venta, imagen_url, es_snack'
    )
    .eq('activo', true)
    .order('categoria_id')
    .order('peso_gramos')

  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMERO ?? ''

  return (
    <ProductoDetail
      producto={producto}
      categoria={categoria}
      relacionados={relacionados ?? []}
      imagenesMap={imagenesMap}
      allProductos={allProductos ?? []}
      whatsapp={whatsapp}
      dictionary={dictionary}
    />
  )
}
