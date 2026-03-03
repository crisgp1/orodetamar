'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ease = [0.16, 1, 0.3, 1] as const
const smoothEase = [0.4, 0, 0.2, 1] as const

const greetings = [
  'Bienvenido',
  'Welcome',
  'Bienvenue',
  'Willkommen',
  'Benvenuto',
  'いらっしゃいませ',
  'مرحباً',
  '환영합니다',
]

// Each greeting: ~800ms cycle with overlap
const GREETING_INTERVAL = 750
const BRAND_DELAY = greetings.length * GREETING_INTERVAL + 300
const EXIT_DELAY = BRAND_DELAY + 2200

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [currentGreeting, setCurrentGreeting] = useState(0)
  const [phase, setPhase] = useState<'greetings' | 'brand'>('greetings')
  const [exiting, setExiting] = useState(false)

  const finish = useCallback(() => {
    if (exiting) return
    setExiting(true)
    setTimeout(onComplete, 1000)
  }, [onComplete, exiting])

  // Cycle through greetings with generous timing
  useEffect(() => {
    if (phase !== 'greetings') return
    if (currentGreeting >= greetings.length - 1) return

    const timer = setTimeout(
      () => setCurrentGreeting((prev) => prev + 1),
      GREETING_INTERVAL
    )
    return () => clearTimeout(timer)
  }, [currentGreeting, phase])

  // Transition to brand phase
  useEffect(() => {
    const timer = setTimeout(() => setPhase('brand'), BRAND_DELAY)
    return () => clearTimeout(timer)
  }, [])

  // Auto-exit
  useEffect(() => {
    const timer = setTimeout(finish, EXIT_DELAY)
    return () => clearTimeout(timer)
  }, [finish])

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          key="splash"
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.9, ease: smoothEase }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[oklch(0.14_0.02_45)]"
        >
          {/* Subtle noise overlay */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay">
            <div className="h-full w-full bg-[url(&quot;data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E&quot;)] bg-repeat [background-size:256px_256px]" />
          </div>

          <div className="relative flex flex-col items-center">
            {/* ── Greetings cycle ── */}
            {phase === 'greetings' && (
              <div className="flex h-20 items-center justify-center md:h-28">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={currentGreeting}
                    initial={{
                      opacity: 0,
                      y: 24,
                      scale: 0.92,
                      filter: 'blur(8px)',
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      filter: 'blur(0px)',
                    }}
                    exit={{
                      opacity: 0,
                      y: -18,
                      scale: 1.04,
                      filter: 'blur(6px)',
                    }}
                    transition={{
                      duration: 0.5,
                      ease,
                    }}
                    className="block font-display text-3xl font-light tracking-[0.12em] text-white/80 md:text-5xl"
                  >
                    {greetings[currentGreeting]}
                  </motion.span>
                </AnimatePresence>
              </div>
            )}

            {/* ── Brand reveal ── */}
            {phase === 'brand' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, ease }}
                className="flex flex-col items-center"
              >
                {/* EST. — small elegant detail */}
                <motion.p
                  initial={{ opacity: 0, letterSpacing: '0.6em' }}
                  animate={{ opacity: 1, letterSpacing: '0.4em' }}
                  transition={{ duration: 1.2, ease: smoothEase, delay: 0.1 }}
                  className="text-[9px] font-medium uppercase text-white/20 md:text-[10px]"
                >
                  Est. 2024
                </motion.p>

                {/* Brand name — refined stagger with scale */}
                <div className="mt-4 flex items-center justify-center">
                  {'ORO DE TAMAR'.split('').map((letter, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{
                        duration: 0.7,
                        ease,
                        delay: 0.3 + i * 0.045,
                      }}
                      className="inline-block font-display text-4xl font-light tracking-[0.25em] text-white md:text-6xl lg:text-7xl"
                    >
                      {letter === ' ' ? '\u00A0' : letter}
                    </motion.span>
                  ))}
                </div>

                {/* Tagline — soft italic serif */}
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 0.4, y: 0 }}
                  transition={{ duration: 0.8, ease: smoothEase, delay: 1.1 }}
                  className="mt-5 font-display text-sm font-light italic tracking-[0.15em] text-white md:text-base"
                >
                  Dátiles Premium de Baja California
                </motion.p>
              </motion.div>
            )}
          </div>

          {/* Skip on tap/click */}
          <button
            onClick={finish}
            className="absolute inset-0 z-10 cursor-default"
            aria-label="Skip"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
