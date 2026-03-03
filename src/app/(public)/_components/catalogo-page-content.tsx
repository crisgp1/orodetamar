'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { MagnifyingGlass, ArrowLeft, X } from '@phosphor-icons/react'
import { useCarrito } from '../_hooks/use-carrito'
import { DictionaryProvider } from '../_dictionaries/context'
import type { Dictionary } from '../_dictionaries'
import { Navbar } from './navbar'
import { ProductoCard } from './producto-card'
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

const ease = [0.16, 1, 0.3, 1] as const

export function CatalogoPageContent({
  categorias,
  productos,
  imagenesMap,
  whatsapp,
  dictionary,
}: {
  categorias: Categoria[]
  productos: Producto[]
  imagenesMap: Record<number, string[]>
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
  const [busqueda, setBusqueda] = useState('')
  const [activeCatId, setActiveCatId] = useState<number | null>(null) // null = "Todos"
  const headerRef = useRef<HTMLDivElement>(null)
  const isHeaderInView = useInView(headerRef, { once: true })

  // Filter categories that have products
  const categoriasFiltradas = useMemo(() => {
    return categorias
      .map((cat) => ({
        ...cat,
        productos: productos.filter((p) => p.categoria_id === cat.id),
      }))
      .filter((cat) => cat.productos.length > 0)
  }, [categorias, productos])

  // Filter products by search + category
  const productosFiltrados = useMemo(() => {
    let result = productos

    // Filter by category
    if (activeCatId !== null) {
      result = result.filter((p) => p.categoria_id === activeCatId)
    }

    // Filter by search — fuzzy: strip accents and allow partial matches
    if (busqueda.trim()) {
      const normalize = (s: string) =>
        s
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // strip accents
          .replace(/[^a-z0-9\s]/g, '')      // remove special chars
          .trim()

      const q = normalize(busqueda)
      const tokens = q.split(/\s+/).filter(Boolean)

      result = result.filter((p) => {
        const haystack = normalize(`${p.nombre} ${p.presentacion}`)
        return tokens.every((token) => haystack.includes(token))
      })
    }

    return result
  }, [productos, activeCatId, busqueda])

  // Current category info
  const activeCategoria = activeCatId
    ? categoriasFiltradas.find((c) => c.id === activeCatId)
    : null

  // Scroll to grid on tab change
  const gridRef = useRef<HTMLDivElement>(null)
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [activeCatId])

  return (
    <DictionaryProvider dictionary={dictionary}>
      <Navbar
        whatsapp={whatsapp}
        totalItems={totalItems}
        onAbrirCarrito={() => setResumenAbierto(true)}
      />

      {/* ── Hero header — Taylor's style: large serif headline + search ── */}
      <section className="bg-background pt-14">
        <div ref={headerRef} className="mx-auto max-w-4xl px-5 pt-16 pb-10 text-center md:px-8 md:pt-24 md:pb-14">
          {/* Back to home */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isHeaderInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5 }}
          >
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.1em] uppercase text-foreground/40 transition-colors hover:text-foreground/70"
            >
              <ArrowLeft size={12} weight="bold" />
              {dictionary.catalogoPage.volverInicio}
            </Link>
          </motion.div>

          {/* Large animated title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease, delay: 0.1 }}
            className="mt-8 font-display text-4xl font-light tracking-[0.08em] uppercase md:text-6xl lg:text-7xl"
          >
            {dictionary.catalogoPage.titulo}
          </motion.h1>

          {/* Decorative line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={isHeaderInView ? { scaleX: 1 } : {}}
            transition={{ duration: 0.8, ease, delay: 0.3 }}
            className="mx-auto mt-5 h-px w-16 origin-center bg-foreground/20"
          />

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={isHeaderInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mx-auto mt-5 max-w-lg font-display text-base leading-relaxed font-light italic text-muted-foreground md:text-lg"
          >
            {dictionary.catalogoPage.subtitulo}
          </motion.p>

          {/* Search bar — elegant, minimal */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="mx-auto mt-8 max-w-md"
          >
            <div className="relative">
              <MagnifyingGlass
                size={16}
                weight="regular"
                className="absolute top-1/2 left-4 -translate-y-1/2 text-foreground/30"
              />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder={dictionary.catalogoPage.buscar}
                className="w-full border-b border-foreground/15 bg-transparent py-3 pr-10 pl-10 text-sm tracking-[0.03em] text-foreground placeholder:text-foreground/30 focus:border-foreground/40 focus:outline-none"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda('')}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-foreground/30 transition-colors hover:text-foreground/60"
                >
                  <X size={14} weight="regular" />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Category tabs — horizontal, Taylor's style ── */}
      <section className="sticky top-14 z-40 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div
            className="flex items-center gap-5 overflow-x-auto pb-px md:gap-8"
            style={{ scrollbarWidth: 'none' }}
          >
            {/* "All" tab */}
            <button
              onClick={() => setActiveCatId(null)}
              className={`relative shrink-0 py-4 text-sm font-medium tracking-[0.2em] uppercase transition-colors duration-300 md:text-base ${
                activeCatId === null
                  ? 'text-foreground'
                  : 'text-foreground/30 hover:text-foreground/60'
              }`}
            >
              <span className="flex items-center gap-2">
                {activeCatId === null && (
                  <motion.span
                    layoutId="cat-tab-bullet"
                    className="inline-block h-2 w-2 bg-foreground"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                {dictionary.catalogoPage.todos}
              </span>
            </button>

            {categoriasFiltradas.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCatId(cat.id)}
                className={`relative shrink-0 py-4 text-sm font-medium tracking-[0.2em] uppercase transition-colors duration-300 md:text-base ${
                  activeCatId === cat.id
                    ? 'text-foreground'
                    : 'text-foreground/30 hover:text-foreground/60'
                }`}
              >
                <span className="flex items-center gap-2">
                  {activeCatId === cat.id && (
                    <motion.span
                      layoutId="cat-tab-bullet"
                      className="inline-block h-2 w-2 bg-foreground"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  {cat.nombre}
                </span>
              </button>
            ))}
          </div>
          <div className="h-px bg-border/50" />
        </div>
      </section>

      {/* ── Category description (if filtered) ── */}
      <AnimatePresence mode="wait">
        {activeCategoria?.beneficios_salud && (
          <motion.section
            key={`desc-${activeCategoria.id}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease }}
            className="overflow-hidden bg-background"
          >
            <div className="mx-auto max-w-2xl px-5 pt-8 pb-2 text-center md:px-8">
              <p className="font-display text-base leading-relaxed font-light italic text-muted-foreground md:text-lg">
                {activeCategoria.beneficios_salud}
              </p>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── Product grid ── */}
      <section ref={gridRef} className="scroll-mt-28 bg-background py-10 md:py-14">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          {/* Product count */}
          <p className="mb-8 text-[11px] tracking-[0.15em] uppercase text-foreground/30">
            {productosFiltrados.length} {dictionary.catalogoPage.productos}
          </p>

          {productosFiltrados.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center"
            >
              <p className="font-display text-lg italic text-muted-foreground">
                {dictionary.catalogoPage.sinResultados}
              </p>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeCatId}-${busqueda}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease }}
                className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 md:gap-y-14 lg:grid-cols-4"
              >
                {productosFiltrados.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.45,
                      ease,
                      delay: Math.min(i * 0.04, 0.4),
                    }}
                  >
                    <ProductoCard
                      producto={p}
                      imagenes={imagenesMap[p.id]}
                      cantidadEnCarrito={carrito.get(p.id) ?? 0}
                      onAgregar={() => agregar(p.id)}
                      onCambiarCantidad={(delta) => cambiarCantidad(p.id, delta)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </section>

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
