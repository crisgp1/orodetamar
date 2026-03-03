import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { CatalogoContent } from '../_components/catalogo-content'
import { getDictionary, locales, defaultLocale } from '../_dictionaries'
import { getServerLocale } from '../_dictionaries/server'
import { setLocaleCookie } from '../_dictionaries/actions'

type Props = { params: Promise<{ locale?: string[] }> }
type SupportedLocale = (typeof locales)[number]

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: segments } = await params
  const urlLocale = segments?.[0]
  const locale = urlLocale && locales.includes(urlLocale as SupportedLocale)
    ? urlLocale
    : await getServerLocale()
  const t = getDictionary(locale)
  return {
    title: t.meta.title,
    description: t.meta.description,
    openGraph: {
      title: t.meta.title,
      description: t.meta.description,
      type: 'website',
      locale: locale === 'fr' ? 'fr_FR' : locale === 'en' ? 'en_US' : 'es_MX',
    },
  }
}

export default async function CatalogoPage({ params }: Props) {
  const { locale: segments } = await params
  const urlLocale = segments?.[0]

  // Only allow known locales and max 1 segment
  if (segments && (segments.length > 1 || !locales.includes(urlLocale as SupportedLocale))) {
    notFound()
  }

  // If locale is in URL, persist it to cookie; otherwise read from cookie
  let locale: string
  if (urlLocale && locales.includes(urlLocale as SupportedLocale)) {
    locale = urlLocale
    await setLocaleCookie(locale)
  } else {
    locale = await getServerLocale()
  }

  const dictionary = getDictionary(locale)
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
    <CatalogoContent
      categorias={categoriasRes.data ?? []}
      productos={productosRes.data ?? []}
      imagenesMap={imagenesMap}
      whatsapp={whatsapp}
      dictionary={dictionary}
    />
  )
}
