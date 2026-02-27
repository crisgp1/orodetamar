'use client'

import { motion } from 'framer-motion'

export function NarrativeBanner({
  headline,
  body,
}: {
  headline: string
  body: string
}) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8 }}
      className="relative overflow-hidden bg-[oklch(0.18_0.02_45)] px-5 py-24 text-[oklch(0.92_0.01_75)] md:py-32"
    >
      {/* Subtle noise texture on dark */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay">
        <div className="h-full w-full bg-[url(&quot;data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E&quot;)] bg-repeat [background-size:256px_256px]" />
      </div>

      <div className="relative mx-auto max-w-2xl text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="font-display text-3xl leading-tight font-light italic md:text-5xl"
        >
          {headline}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-white/50 md:text-base"
        >
          {body}
        </motion.p>
      </div>
    </motion.section>
  )
}
