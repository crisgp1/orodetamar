'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDictionary } from '../_dictionaries/context'

const ease = [0.16, 1, 0.3, 1] as const

const images = ['/img/hero.jpeg', '/img/hero2.jpeg']
const INTERVAL = 6000 // 6s per image

export function Hero() {
  const t = useDictionary()
  const [current, setCurrent] = useState(0)

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % images.length)
  }, [])

  useEffect(() => {
    const timer = setInterval(next, INTERVAL)
    return () => clearInterval(timer)
  }, [next])

  return (
    <>
      {/* ── Slideshow — fullscreen, crossfade + subtle zoom ── */}
      <section className="relative h-[100dvh] overflow-hidden">
        <AnimatePresence>
          <motion.img
            key={current}
            src={images[current]}
            alt="Dátiles premium"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 1.5, ease },
              scale: { duration: 6, ease: [0.25, 0.1, 0.25, 1] },
            }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </AnimatePresence>
      </section>

      {/* ── Brand / text section — clean bg below ── */}
      <section className="bg-background px-4 py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease }}
            className="text-xs font-medium tracking-[0.3em] uppercase text-foreground/50 md:text-sm"
          >
            {t.hero.brand}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease, delay: 0.15 }}
            className="mt-6 font-display text-3xl leading-[1.15] font-light italic md:text-5xl lg:text-6xl"
          >
            {t.hero.headline}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease, delay: 0.3 }}
            className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base"
          >
            {t.hero.desc1}
            <br className="hidden sm:block" />
            {t.hero.desc2}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease, delay: 0.45 }}
            className="mt-10"
          >
            <a
              href="#catalogo"
              className="inline-flex items-center gap-2 border border-foreground/20 px-10 py-3.5 text-[11px] font-medium tracking-[0.2em] uppercase text-foreground transition-colors duration-300 hover:bg-foreground hover:text-background"
            >
              {t.hero.cta}
            </a>
          </motion.div>
        </div>
      </section>
    </>
  )
}
