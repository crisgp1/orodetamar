'use client'

import { motion } from 'framer-motion'
import { useDictionary } from '../_dictionaries/context'

export function TrustStrip() {
  const t = useDictionary()

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6 }}
      className="border-y border-border/50 py-10 md:py-14"
    >
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-5 md:grid-cols-4 md:gap-0 md:divide-x md:divide-border/50 md:px-8">
        {t.trust.map((v) => (
          <div key={v.titulo} className="text-center md:px-8">
            {/* Reversed hierarchy: small uppercase label on top, large serif italic below */}
            <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground md:text-[11px]">
              {v.titulo}
            </p>
            <p className="mt-1 font-display text-xl font-light italic text-foreground/80 md:text-2xl">
              {v.detalle}
            </p>
          </div>
        ))}
      </div>
    </motion.section>
  )
}
