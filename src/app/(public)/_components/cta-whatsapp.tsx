'use client'

import { motion } from 'framer-motion'
import { WhatsappLogo } from '@phosphor-icons/react'
import { useDictionary } from '../_dictionaries/context'

export function CtaWhatsapp({ whatsapp }: { whatsapp: string }) {
  const t = useDictionary()

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6 }}
      className="bg-[oklch(0.45_0.08_85)] px-5 py-20 text-white md:py-28"
    >
      <div className="mx-auto max-w-xl text-center">
        <h2 className="font-display text-2xl font-light italic md:text-4xl">
          {t.cta.headline}
        </h2>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-white/60 md:text-base">
          {t.cta.body}
        </p>
        <a
          href={`https://wa.me/52${whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-2.5 bg-white px-10 py-3.5 text-[11px] font-semibold tracking-[0.15em] uppercase text-[oklch(0.22_0.03_45)] transition-opacity duration-300 hover:opacity-90"
        >
          <WhatsappLogo size={18} weight="bold" />
          {t.cta.boton}
        </a>
      </div>
    </motion.section>
  )
}
