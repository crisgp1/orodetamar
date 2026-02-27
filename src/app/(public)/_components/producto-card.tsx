'use client'

import Link from 'next/link'
import { Plus, Minus, Leaf, Drop, Cookie, Package } from '@phosphor-icons/react'
import { useDictionary } from '../_dictionaries/context'
import { ImageLightbox } from './image-lightbox'

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

function formatPrecio(n: number) {
  return n % 1 === 0 ? `$${n}` : `$${n.toFixed(2)}`
}

function getIcon(nombre: string, esSnack: boolean) {
  const lower = nombre.toLowerCase()
  if (esSnack) return <Cookie size={36} weight="thin" className="text-foreground/15" />
  if (lower.includes('pulpa')) return <Drop size={36} weight="thin" className="text-foreground/15" />
  if (lower.includes('dátil') || lower.includes('datil') || lower.includes('medjool'))
    return <Leaf size={36} weight="thin" className="text-foreground/15" />
  return <Package size={36} weight="thin" className="text-foreground/15" />
}

export function ProductoCard({
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
      {/* Image — click to expand if has image, otherwise link to product page */}
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

      {/* Product info — links to product page */}
      <Link href={`/producto/${producto.id}`} className="block relative px-3 py-4 text-center">
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

      {/* Small "Agregar" bar — slides up from bottom on hover, ~10-15% of card */}
      {cantidadEnCarrito === 0 && (
        <button
          onClick={onAgregar}
          className="flex h-9 w-full items-center justify-center bg-foreground text-[10px] font-medium tracking-[0.15em] uppercase text-background transition-transform duration-300 ease-out md:translate-y-full md:group-hover:translate-y-0"
        >
          {t.catalogo.agregar}
        </button>
      )}

      {/* Small quantity bar — always visible when in cart */}
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
