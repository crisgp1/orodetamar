'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTitle,
} from '@/components/ui/dialog'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { motion, AnimatePresence, type PanInfo } from 'framer-motion'
import { CaretLeft, CaretRight, MagnifyingGlassPlus, X } from '@phosphor-icons/react'

/* ──────────────────────────────────────────────────────────────
   ImageLightbox — full-screen immersive gallery
   Uses Radix Dialog primitives directly (not DialogContent)
   for true full-viewport control.
   ────────────────────────────────────────────────────────────── */

const SWIPE_X = 50
const SWIPE_Y_DISMISS = 80

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? '50%' : '-50%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? '-50%' : '50%', opacity: 0 }),
}

export function ImageLightbox({
  src,
  alt,
  images,
  startIndex = 0,
  children,
}: {
  src?: string
  alt: string
  images?: string[]
  startIndex?: number
  children: React.ReactNode
}) {
  const gallery = images?.length ? images : src ? [src] : []
  const hasMultiple = gallery.length > 1

  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(startIndex)
  const [direction, setDirection] = useState(0)

  const goTo = useCallback(
    (next: number, dir: number) => {
      if (next < 0 || next >= gallery.length) return
      setDirection(dir)
      setIndex(next)
    },
    [gallery.length]
  )

  const prev = useCallback(() => goTo(index - 1, -1), [index, goTo])
  const next = useCallback(() => goTo(index + 1, 1), [index, goTo])

  useEffect(() => {
    if (!open || !hasMultiple) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, hasMultiple, prev, next])

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      if (info.offset.y > SWIPE_Y_DISMISS) {
        setOpen(false)
        return
      }
      if (!hasMultiple) return
      if (info.offset.x > SWIPE_X) prev()
      else if (info.offset.x < -SWIPE_X) next()
    },
    [hasMultiple, prev, next]
  )

  if (gallery.length === 0) return <>{children}</>

  return (
    <>
      {/* Trigger */}
      <div
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIndex(startIndex)
          setDirection(0)
          setOpen(true)
        }}
        className="cursor-zoom-in relative group/lightbox"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter') setOpen(true)
        }}
      >
        {children}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover/lightbox:opacity-100">
          <div className="rounded-full bg-black/15 p-3 backdrop-blur-sm">
            <MagnifyingGlassPlus size={20} weight="bold" className="text-white/90" />
          </div>
        </div>
      </div>

      {/* Lightbox — Radix Dialog with raw primitives for full control */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPortal>
          {/* Dark overlay — the key to the immersive feel */}
          <DialogOverlay
            className="!bg-black/92 backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(0,0,0,0.92)' }}
          />

          {/* Full-screen content — tap dark area to close */}
          <DialogPrimitive.Content
            className="fixed inset-0 z-50 outline-none"
            onPointerDownOutside={(e) => e.preventDefault()}
            onClick={() => setOpen(false)}
          >
            {/* Accessible title */}
            <DialogTitle className="sr-only">{alt}</DialogTitle>

            {/* Close — large, always visible top-right */}
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false) }}
              className="absolute right-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/25 sm:right-6 sm:top-6"
              aria-label="Cerrar"
            >
              <X size={24} weight="bold" />
            </button>

            {/* Counter */}
            {hasMultiple && (
              <div className="absolute top-5 left-1/2 z-40 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium tracking-widest text-white/60 backdrop-blur-sm">
                {index + 1} / {gallery.length}
              </div>
            )}

            {/* Centered image area */}
            <div className="flex h-full w-full items-center justify-center p-6 sm:p-12 md:p-16">
              {/* Desktop prev */}
              {hasMultiple && index > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); prev() }}
                  className="absolute left-3 z-30 hidden h-12 w-12 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white sm:left-5 md:flex"
                  aria-label="Anterior"
                >
                  <CaretLeft size={28} weight="bold" />
                </button>
              )}

              {/* Desktop next */}
              {hasMultiple && index < gallery.length - 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); next() }}
                  className="absolute right-3 z-30 hidden h-12 w-12 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white sm:right-5 md:flex"
                  aria-label="Siguiente"
                >
                  <CaretRight size={28} weight="bold" />
                </button>
              )}

              {/* Image */}
              <AnimatePresence initial={false} custom={direction} mode="popLayout">
                <motion.img
                  key={`lb-${index}`}
                  src={gallery[index]}
                  alt={`${alt}${hasMultiple ? ` (${index + 1})` : ''}`}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                  drag
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  dragElastic={0.3}
                  onDragEnd={handleDragEnd}
                  onClick={(e) => e.stopPropagation()}
                  className="max-h-[80dvh] max-w-[90vw] select-none rounded object-contain sm:max-h-[85dvh] sm:max-w-[80vw]"
                  style={{ touchAction: 'none' }}
                  draggable={false}
                />
              </AnimatePresence>
            </div>

            {/* Dots */}
            {hasMultiple && (
              <div className="absolute bottom-6 left-1/2 z-40 flex -translate-x-1/2 gap-2">
                {gallery.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); goTo(i, i > index ? 1 : -1) }}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === index ? 'w-6 bg-white' : 'w-2 bg-white/30 hover:bg-white/50'
                    }`}
                    aria-label={`Imagen ${i + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Mobile hint */}
            <div className="absolute bottom-12 left-1/2 z-30 -translate-x-1/2 text-[10px] tracking-widest text-white/20 md:hidden">
              ↓ desliza para cerrar
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </>
  )
}
