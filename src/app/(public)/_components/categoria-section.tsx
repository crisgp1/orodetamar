'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { ProductoCard } from './producto-card'

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

const letterVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease,
      delay: i * 0.03,
    },
  }),
}

export function CategoriaSection({
  categoria,
  productos,
  imagenesMap,
  carrito,
  onAgregar,
  onCambiarCantidad,
}: {
  categoria: Categoria
  productos: Producto[]
  imagenesMap: Record<number, string[]>
  carrito: Map<number, number>
  onAgregar: (id: number) => void
  onCambiarCantidad: (id: number, delta: number) => void
}) {
  const headerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(headerRef, { once: false, margin: '-50px' })
  const letters = categoria.nombre.split('')

  return (
    <motion.div
      key={categoria.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35, ease }}
      className="mx-auto max-w-7xl px-5 pt-10 pb-16 md:px-8 md:pt-14 md:pb-24"
    >
      {/* Large animated category name — Taylors-style */}
      <div ref={headerRef} className="mb-10 text-center md:mb-14">
        <div className="overflow-hidden">
          <h2 className="flex flex-wrap items-center justify-center font-display text-4xl font-light tracking-[0.12em] uppercase md:text-6xl lg:text-7xl">
            {letters.map((letter, i) => (
              <motion.span
                key={`${categoria.id}-${i}`}
                custom={i}
                variants={letterVariants}
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
                className="inline-block"
              >
                {letter === ' ' ? '\u00A0' : letter}
              </motion.span>
            ))}
          </h2>
        </div>

        {/* Animated line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 0.8, ease, delay: 0.3 }}
          className="mx-auto mt-4 h-px w-16 origin-center bg-foreground/20"
        />

        {categoria.beneficios_salud && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mx-auto mt-4 max-w-lg font-display text-base leading-relaxed font-light italic text-muted-foreground md:text-lg"
          >
            {categoria.beneficios_salud}
          </motion.p>
        )}
      </div>

      {/* Products grid with staggered reveal */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 md:gap-y-14 lg:grid-cols-4">
        {productos.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.45,
              ease,
              delay: 0.15 + i * 0.06,
            }}
          >
            <ProductoCard
              producto={p}
              imagenes={imagenesMap[p.id]}
              cantidadEnCarrito={carrito.get(p.id) ?? 0}
              onAgregar={() => onAgregar(p.id)}
              onCambiarCantidad={(delta) => onCambiarCantidad(p.id, delta)}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
