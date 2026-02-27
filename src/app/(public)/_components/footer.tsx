'use client'

import { motion } from 'framer-motion'
import { WhatsappLogo } from '@phosphor-icons/react'
import { useDictionary } from '../_dictionaries/context'

export function Footer({ whatsapp }: { whatsapp: string }) {
  const t = useDictionary()

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6 }}
      className="bg-[oklch(0.2_0.02_45)] px-5 py-20 text-[oklch(0.85_0.01_75)] md:py-28"
    >
      <div className="mx-auto max-w-2xl text-center">
        {/* Large brand mark — Taylors-style */}
        <p className="font-display text-3xl font-semibold tracking-[0.2em] uppercase text-white/90 md:text-4xl">
          Oro de Tamar
        </p>

        <p className="mt-6 font-display text-base font-light italic text-white/50 md:text-lg">
          {t.footer.headline}
        </p>

        {/* Ornament */}
        <div className="mx-auto mt-8 flex w-40 items-center justify-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-white/20">·</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="mt-8 flex flex-col items-center gap-1 text-sm text-white/40">
          <p>{t.footer.ubicacion}</p>
          <p>{t.footer.horario}</p>
        </div>

        <a
          href={`https://wa.me/52${whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-2 border border-white/15 px-8 py-3 text-[11px] font-medium tracking-[0.15em] uppercase text-white/60 transition-colors duration-300 hover:bg-white hover:text-[oklch(0.2_0.02_45)]"
        >
          <WhatsappLogo size={16} weight="bold" />
          {t.footer.whatsapp}
        </a>

        <p className="mt-10 text-xs text-white/30 italic">
          {t.footer.mayoreo}
        </p>

        <p className="mt-8 text-[10px] tracking-[0.15em] uppercase text-white/15">
          &copy; {new Date().getFullYear()} Oro de Tamar
        </p>
      </div>
    </motion.footer>
  )
}
