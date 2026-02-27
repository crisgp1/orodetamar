'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Plus,
  Minus,
  WhatsappLogo,
  Leaf,
  Drop,
  Cookie,
  Package,
  ShoppingBag,
} from '@phosphor-icons/react'
import { DictionaryProvider, useDictionary } from '../_dictionaries/context'
import type { Dictionary } from '../_dictionaries'
import { Navbar } from './navbar'
import { Footer } from './footer'
import { ImageLightbox } from './image-lightbox'
import { CarritoFlotante } from './carrito-flotante'
import { CarritoResumen } from './carrito-resumen'
import { useCarrito } from '../_hooks/use-carrito'

/* ── Types ── */
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

/* ── Helpers ── */
const ease = [0.16, 1, 0.3, 1] as const

function formatPrecio(n: number) {
  return n % 1 === 0 ? `$${n}` : `$${n.toFixed(2)}`
}

function getIcon(nombre: string, esSnack: boolean) {
  const lower = nombre.toLowerCase()
  if (esSnack) return <Cookie size={64} weight="thin" className="text-foreground/10" />
  if (lower.includes('pulpa')) return <Drop size={64} weight="thin" className="text-foreground/10" />
  if (lower.includes('dátil') || lower.includes('datil') || lower.includes('medjool'))
    return <Leaf size={64} weight="thin" className="text-foreground/10" />
  return <Package size={64} weight="thin" className="text-foreground/10" />
}

/* ── Main Export ── */
export function ProductoDetail({
  producto,
  categoria,
  relacionados,
  imagenesMap,
  allProductos,
  whatsapp,
  dictionary,
}: {
  producto: Producto
  categoria: Categoria
  relacionados: Producto[]
  imagenesMap: Record<number, string[]>
  allProductos: Producto[]
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
  } = useCarrito(allProductos)

  const [resumenAbierto, setResumenAbierto] = useState(false)

  return (
    <DictionaryProvider dictionary={dictionary}>
      <Navbar
        whatsapp={whatsapp}
        totalItems={totalItems}
        onAbrirCarrito={() => setResumenAbierto(true)}
      />

      <ProductoHero
        producto={producto}
        categoria={categoria}
        imagenes={imagenesMap[producto.id]}
        whatsapp={whatsapp}
        cantidadEnCarrito={carrito.get(producto.id) ?? 0}
        onAgregar={() => agregar(producto.id)}
        onCambiarCantidad={(delta) => cambiarCantidad(producto.id, delta)}
      />

      {relacionados.length > 0 && (
        <RelacionadosSection
          productos={relacionados}
          imagenesMap={imagenesMap}
          carrito={carrito}
          onAgregar={agregar}
          onCambiarCantidad={cambiarCantidad}
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

/* ── Hero Section ── */
function ProductoHero({
  producto,
  categoria,
  imagenes,
  whatsapp,
  cantidadEnCarrito,
  onAgregar,
  onCambiarCantidad,
}: {
  producto: Producto
  categoria: Categoria
  imagenes?: string[]
  whatsapp: string
  cantidadEnCarrito: number
  onAgregar: () => void
  onCambiarCantidad: (delta: number) => void
}) {
  const t = useDictionary()
  const icon = getIcon(producto.nombre, producto.es_snack)
  const gallery = imagenes?.length ? imagenes : producto.imagen_url ? [producto.imagen_url] : []
  const coverImage = gallery[0] ?? producto.imagen_url

  const waMessage = encodeURIComponent(
    `Hola! Me interesa el producto: ${producto.nombre} (${producto.presentacion})`
  )

  return (
    <section className="min-h-dvh pt-14">
      <div className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-20">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease }}
        >
          <Link
            href="/#catalogo"
            className="inline-flex items-center gap-2 text-[11px] tracking-[0.15em] uppercase text-muted-foreground transition-colors duration-300 hover:text-foreground"
          >
            <ArrowLeft size={14} weight="bold" />
            {t.producto.volver}
          </Link>
        </motion.div>

        {/* Two-column layout */}
        <div className="mt-8 grid gap-10 md:mt-12 md:grid-cols-2 md:gap-16 lg:gap-24">
          {/* Left: product image */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease }}
            className="relative aspect-[3/4] overflow-hidden bg-muted"
          >
            {coverImage ? (
              <ImageLightbox images={gallery} alt={producto.nombre}>
                <img
                  src={coverImage}
                  alt={producto.nombre}
                  className="h-full w-full object-cover"
                />
              </ImageLightbox>
            ) : (
              <div className="flex h-full items-center justify-center">
                {icon}
              </div>
            )}
          </motion.div>

          {/* Right: product info */}
          <div className="flex flex-col justify-center">
            {/* Category label */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease, delay: 0.1 }}
              className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground md:text-[11px]"
            >
              {categoria.nombre}
            </motion.p>

            {/* Product name — large serif italic */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease, delay: 0.15 }}
              className="mt-3 font-display text-3xl leading-tight font-light italic md:text-4xl lg:text-5xl"
            >
              {producto.nombre}
            </motion.h1>

            {/* Price */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="mt-4 font-display text-2xl font-light tracking-wide md:text-3xl"
            >
              {formatPrecio(producto.precio_venta)}
            </motion.p>

            {/* Divider */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, ease, delay: 0.3 }}
              className="mt-6 h-px w-full origin-left bg-foreground/10"
            />

            {/* Details grid */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease, delay: 0.35 }}
              className="mt-6 grid grid-cols-2 gap-4"
            >
              <div>
                <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                  {t.producto.presentacion}
                </p>
                <p className="mt-0.5 text-sm font-medium">{producto.presentacion}</p>
              </div>
              <div>
                <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                  {t.producto.peso}
                </p>
                <p className="mt-0.5 text-sm font-medium">
                  {producto.peso_gramos}
                  {t.producto.gramos}
                </p>
              </div>
              <div>
                <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                  {t.producto.categoria}
                </p>
                <p className="mt-0.5 text-sm font-medium">{categoria.nombre}</p>
              </div>
            </motion.div>

            {/* Health benefits */}
            {categoria.beneficios_salud && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-6 font-display text-sm leading-relaxed font-light italic text-muted-foreground md:text-base"
              >
                {categoria.beneficios_salud}
              </motion.p>
            )}

            {/* Divider */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, ease, delay: 0.45 }}
              className="mt-6 h-px w-full origin-left bg-foreground/10"
            />

            {/* Add to cart */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease, delay: 0.5 }}
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              {cantidadEnCarrito === 0 ? (
                <button
                  onClick={onAgregar}
                  className="flex h-12 flex-1 items-center justify-center gap-2 bg-foreground text-[11px] font-medium tracking-[0.2em] uppercase text-background transition-opacity duration-300 hover:opacity-85"
                >
                  <ShoppingBag size={16} weight="bold" />
                  {t.producto.agregar}
                </button>
              ) : (
                <div className="flex h-12 flex-1 items-center justify-between bg-foreground px-4 text-background">
                  <span className="text-[10px] tracking-[0.15em] uppercase opacity-70">
                    {t.producto.enCarrito}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      className="flex h-8 w-8 items-center justify-center transition-opacity hover:opacity-70"
                      onClick={() => onCambiarCantidad(-1)}
                    >
                      <Minus size={14} weight="bold" />
                    </button>
                    <span className="w-6 text-center font-display text-sm font-semibold">
                      {cantidadEnCarrito}
                    </span>
                    <button
                      className="flex h-8 w-8 items-center justify-center transition-opacity hover:opacity-70"
                      onClick={() => onCambiarCantidad(1)}
                    >
                      <Plus size={14} weight="bold" />
                    </button>
                  </div>
                </div>
              )}

              {/* WhatsApp CTA */}
              <a
                href={`https://wa.me/52${whatsapp}?text=${waMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 items-center justify-center gap-2 border border-foreground/15 px-6 text-[11px] font-medium tracking-[0.15em] uppercase text-foreground transition-colors duration-300 hover:bg-foreground hover:text-background"
              >
                <WhatsappLogo size={16} weight="bold" />
                {t.producto.consultar}
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Related Products ── */
function RelacionadosSection({
  productos,
  imagenesMap,
  carrito,
  onAgregar,
  onCambiarCantidad,
}: {
  productos: Producto[]
  imagenesMap: Record<number, string[]>
  carrito: Map<number, number>
  onAgregar: (id: number) => void
  onCambiarCantidad: (id: number, delta: number) => void
}) {
  const t = useDictionary()

  return (
    <section className="border-t border-border/50 bg-background py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease }}
          className="mb-10 text-center md:mb-14"
        >
          <h2 className="font-display text-2xl font-light italic md:text-3xl lg:text-4xl">
            {t.producto.relacionados}
          </h2>
          <div className="mx-auto mt-4 h-px w-12 bg-foreground/15" />
        </motion.div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 md:gap-y-14 lg:grid-cols-4">
          {productos.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, ease, delay: i * 0.06 }}
            >
              <RelatedCard
                producto={p}
                imagenes={imagenesMap[p.id]}
                cantidadEnCarrito={carrito.get(p.id) ?? 0}
                onAgregar={() => onAgregar(p.id)}
                onCambiarCantidad={(delta) => onCambiarCantidad(p.id, delta)}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Related Card (links to its own page) ── */
function RelatedCard({
  producto,
  imagenes,
  cantidadEnCarrito,
  onAgregar,
  onCambiarCantidad,
}: {
  producto: Producto
  imagenes?: string[]
  cantidadEnCarrito: number
  onAgregar: () => void
  onCambiarCantidad: (delta: number) => void
}) {
  const t = useDictionary()
  const icon = getIcon(producto.nombre, producto.es_snack)
  const gallery = imagenes?.length ? imagenes : producto.imagen_url ? [producto.imagen_url] : []
  const coverImage = gallery[0] ?? producto.imagen_url

  return (
    <div className="group overflow-hidden bg-muted">
      {/* Clickable image area */}
      {coverImage ? (
        <ImageLightbox images={gallery} alt={producto.nombre}>
          <div className="aspect-[3/4] overflow-hidden">
            <img
              src={coverImage}
              alt={producto.nombre}
              className="h-full w-full object-cover transition-transform duration-700 md:group-hover:scale-105"
            />
          </div>
        </ImageLightbox>
      ) : (
        <Link href={`/producto/${producto.id}`} className="block">
          <div className="aspect-[3/4] overflow-hidden">
            <div className="flex h-full items-center justify-center">{icon}</div>
          </div>
        </Link>
      )}

      {/* Info */}
      <Link
        href={`/producto/${producto.id}`}
        className="block px-3 py-4 text-center"
      >
        <p className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground md:text-[10px]">
          {producto.presentacion}
        </p>
        <h3 className="mt-1 text-xs font-bold tracking-[0.08em] uppercase md:text-sm">
          {producto.nombre}
        </h3>
        <p className="tabular-nums mt-1 text-xs text-muted-foreground md:text-sm">
          {formatPrecio(producto.precio_venta)}
        </p>
      </Link>

      {/* Add bar */}
      {cantidadEnCarrito === 0 && (
        <button
          onClick={onAgregar}
          className="flex h-9 w-full items-center justify-center bg-foreground text-[10px] font-medium tracking-[0.15em] uppercase text-background transition-transform duration-300 ease-out md:translate-y-full md:group-hover:translate-y-0"
        >
          {t.catalogo.agregar}
        </button>
      )}
      {cantidadEnCarrito > 0 && (
        <div className="flex h-9 w-full items-center justify-center gap-1 bg-foreground text-background">
          <button
            className="flex h-9 w-9 items-center justify-center transition-opacity hover:opacity-70"
            onClick={() => onCambiarCantidad(-1)}
          >
            <Minus size={12} weight="bold" />
          </button>
          <span className="w-6 text-center font-display text-xs font-semibold">
            {cantidadEnCarrito}
          </span>
          <button
            className="flex h-9 w-9 items-center justify-center transition-opacity hover:opacity-70"
            onClick={() => onCambiarCantidad(1)}
          >
            <Plus size={12} weight="bold" />
          </button>
        </div>
      )}
    </div>
  )
}
