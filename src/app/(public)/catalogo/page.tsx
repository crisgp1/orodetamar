import type { Metadata } from 'next'
import { createServerSupabase } from '@/lib/supabase/server'
import { getServerDictionary } from '../_dictionaries/server'
import { CatalogoPageContent } from '../_components/catalogo-page-content'

export const metadata: Metadata = {
  title: 'Catálogo | Oro de Tamar',
  description:
    'Explora nuestra selección de dátiles premium, snacks artesanales y productos naturales de Baja California.',
}

export default async function CatalogoPage() {
  const dictionary = await getServerDictionary()
  const supabase = createServerSupabase()

  const [categoriasRes, productosRes, imagenesRes] = await Promise.all([
    supabase
      .from('categorias_producto')
      .select('id, nombre, descripcion, beneficios_salud')
      .order('nombre'),
    supabase
      .from('productos')
      .select(
        'id, categoria_id, nombre, presentacion, peso_gramos, precio_venta, imagen_url, es_snack'
      )
      .eq('activo', true)
      .order('categoria_id')
      .order('peso_gramos'),
    supabase
      .from('producto_imagenes')
      .select('producto_id, imagen_url')
      .order('posicion'),
  ])

  // Build imagenesMap: { productoId: [url1, url2, …] }
  const imagenesMap: Record<number, string[]> = {}
  for (const img of imagenesRes.data ?? []) {
    if (!imagenesMap[img.producto_id]) imagenesMap[img.producto_id] = []
    imagenesMap[img.producto_id].push(img.imagen_url)
  }

  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMERO ?? ''

  return (
    <CatalogoPageContent
      categorias={categoriasRes.data ?? []}
      productos={productosRes.data ?? []}
      imagenesMap={imagenesMap}
      whatsapp={whatsapp}
      dictionary={dictionary}
    />
  )
}
