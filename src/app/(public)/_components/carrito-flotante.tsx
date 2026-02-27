'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ShoppingBag } from '@phosphor-icons/react'
import { useDictionary } from '../_dictionaries/context'

export function CarritoFlotante({
  totalItems,
  onAbrir,
}: {
  totalItems: number
  onAbrir: () => void
}) {
  const t = useDictionary()

  return (
    <AnimatePresence>
      {totalItems > 0 && (
        <motion.button
          key="carrito-pill"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onClick={onAbrir}
          className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 bg-foreground px-7 py-3.5 text-background shadow-2xl"
        >
          <ShoppingBag size={18} weight="regular" />
          <span className="text-sm font-medium">
            {totalItems}{' '}
            {totalItems !== 1 ? t.carrito.productos : t.carrito.producto}
          </span>
          <span className="text-sm text-background/40">·</span>
          <span className="text-sm font-medium underline">
            {t.carrito.verPedido}
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
