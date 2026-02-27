import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { CatalogoContent } from '../_components/catalogo-content'
import { getDictionary, locales, defaultLocale } from '../_dictionaries'

type Props = { params: Promise<{ locale?: string[] }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: segments } = await params
  const locale = segments?.[0] ?? defaultLocale
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
  const locale = segments?.[0] ?? defaultLocale

  // Only allow known locales and max 1 segment
  if (segments && (segments.length > 1 || !locales.includes(locale as any))) {
    notFound()
  }

  const dictionary = getDictionary(locale)
  const supabase = createServerSupabase()

  const [categoriasRes, productosRes] = await Promise.all([
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
  ])

  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMERO ?? '6641234567'

  return (
    <CatalogoContent
      categorias={categoriasRes.data ?? []}
      productos={productosRes.data ?? []}
      whatsapp={whatsapp}
      dictionary={dictionary}
    />
  )
}
