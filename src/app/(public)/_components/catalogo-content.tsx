'use client'

import { useState, useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useCarrito } from '../_hooks/use-carrito'
import { DictionaryProvider } from '../_dictionaries/context'
import type { Dictionary } from '../_dictionaries'
import { Navbar } from './navbar'
import { Hero } from './hero'
import { TrustStrip } from './trust-strip'
import { CategoryTabs } from './category-tabs'
import { CategoriaSection } from './categoria-section'
import { NarrativeBanner } from './narrative-banner'
import { CtaWhatsapp } from './cta-whatsapp'
import { CarritoFlotante } from './carrito-flotante'
import { CarritoResumen } from './carrito-resumen'
import { Footer } from './footer'

type Categoria = {
  id: number
  nombre: string
  descripcion: string | null
  beneficios_salud: string | null
}

type Producto = {
  id: number
  nombre: string
  presentacion: string
  peso_gramos: number
  precio_venta: number
  imagen_url: string | null
  es_snack: boolean
  categoria_id: number
}

export function CatalogoContent({
  categorias,
  productos,
  whatsapp,
  dictionary,
}: {
  categorias: Categoria[]
  productos: Producto[]
  whatsapp: string
  dictionary: Dictionary
}) {
  const {
    carrito,
    totalItems,
    carritoItems,
    agregar,
    cambiarCantidad,
    quitar,
    limpiar,
  } = useCarrito(productos)

  const [resumenAbierto, setResumenAbierto] = useState(false)

  const categoriasFiltradas = useMemo(() => {
    return categorias
      .map((cat) => ({
        ...cat,
        productos: productos.filter((p) => p.categoria_id === cat.id),
      }))
      .filter((cat) => cat.productos.length > 0)
  }, [categorias, productos])

  const [activeCatId, setActiveCatId] = useState<number | null>(null)

  // Resolve active category (default to first)
  const resolvedActiveId = activeCatId ?? categoriasFiltradas[0]?.id ?? 0
  const activeCategoria = categoriasFiltradas.find(
    (c) => c.id === resolvedActiveId
  )

  return (
    <DictionaryProvider dictionary={dictionary}>
      <Navbar
        whatsapp={whatsapp}
        totalItems={totalItems}
        onAbrirCarrito={() => setResumenAbierto(true)}
      />

      <Hero />

      <TrustStrip />

      <section id="catalogo" className="bg-background py-10 md:py-16">
        {categoriasFiltradas.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <p className="font-display text-lg italic">
              {dictionary.catalogo.vacio}
            </p>
          </div>
        ) : (
          <>
            {/* Taylors-style horizontal category tabs */}
            <CategoryTabs
              categorias={categoriasFiltradas}
              activeId={resolvedActiveId}
              onChange={setActiveCatId}
            />

            {/* Filtered product grid with animated transitions */}
            <AnimatePresence mode="wait">
              {activeCategoria && (
                <CategoriaSection
                  key={activeCategoria.id}
                  categoria={activeCategoria}
                  productos={activeCategoria.productos}
                  carrito={carrito}
                  onAgregar={agregar}
                  onCambiarCantidad={cambiarCantidad}
                />
              )}
            </AnimatePresence>
          </>
        )}
      </section>

      {/* Narrative banner */}
      {dictionary.banners[0] && (
        <NarrativeBanner
          headline={dictionary.banners[0].headline}
          body={dictionary.banners[0].body}
        />
      )}

      <CtaWhatsapp whatsapp={whatsapp} />

      {/* Second narrative banner before footer */}
      {dictionary.banners[1] && (
        <NarrativeBanner
          headline={dictionary.banners[1].headline}
          body={dictionary.banners[1].body}
        />
      )}

      <Footer whatsapp={whatsapp} />

      <CarritoFlotante
        totalItems={totalItems}
        onAbrir={() => setResumenAbierto(true)}
      />

      <CarritoResumen
        abierto={resumenAbierto}
        onCerrar={() => setResumenAbierto(false)}
        items={carritoItems}
        whatsapp={whatsapp}
        onCambiarCantidad={cambiarCantidad}
        onQuitar={quitar}
        onLimpiar={limpiar}
      />
    </DictionaryProvider>
  )
}
