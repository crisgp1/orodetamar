'use client'

import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'

type Categoria = {
  id: number
  nombre: string
}

export function CategoryTabs({
  categorias,
  activeId,
  onChange,
}: {
  categorias: Categoria[]
  activeId: number
  onChange: (id: number) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Map<number, HTMLButtonElement>>(new Map())
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })

  // Update underline indicator position
  useEffect(() => {
    const el = tabRefs.current.get(activeId)
    const container = containerRef.current
    if (el && container) {
      const containerRect = container.getBoundingClientRect()
      const elRect = el.getBoundingClientRect()
      setIndicator({
        left: elRect.left - containerRect.left,
        width: elRect.width,
      })
    }
  }, [activeId])

  return (
    <div className="relative mx-auto max-w-7xl px-5 md:px-8">
      <div
        ref={containerRef}
        className="relative flex items-center gap-6 overflow-x-auto pb-px md:gap-10"
        style={{ scrollbarWidth: 'none' }}
      >
        {categorias.map((cat) => {
          const isActive = cat.id === activeId
          return (
            <button
              key={cat.id}
              ref={(el) => {
                if (el) tabRefs.current.set(cat.id, el)
              }}
              onClick={() => onChange(cat.id)}
              className={`relative shrink-0 py-4 text-sm font-medium tracking-[0.25em] uppercase transition-colors duration-300 md:text-base ${
                isActive
                  ? 'text-foreground'
                  : 'text-foreground/30 hover:text-foreground/60'
              }`}
            >
              {/* Active indicator: small filled square before text — Taylors style */}
              <span className="flex items-center gap-2.5">
                {isActive && (
                  <motion.span
                    layoutId="tab-bullet"
                    className="inline-block h-2 w-2 bg-foreground"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                {cat.nombre}
              </span>
            </button>
          )
        })}

        {/* Animated underline */}
        <motion.div
          className="absolute bottom-0 h-[2px] bg-foreground"
          animate={{ left: indicator.left, width: indicator.width }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        />
      </div>

      {/* Bottom border */}
      <div className="h-px bg-border/50" />
    </div>
  )
}
