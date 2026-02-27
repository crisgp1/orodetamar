'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { WhatsappLogo, ShoppingBag, UserCircle, SignIn } from '@phosphor-icons/react'
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { useDictionary } from '../_dictionaries/context'

const langs = [
  { code: 'es', label: 'ES', href: '/' },
  { code: 'en', label: 'EN', href: '/en' },
  { code: 'fr', label: 'FR', href: '/fr' },
] as const

export function Navbar({
  whatsapp,
  totalItems,
  onAbrirCarrito,
}: {
  whatsapp: string
  totalItems: number
  onAbrirCarrito: () => void
}) {
  const t = useDictionary()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80)
    handler()
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-700 ${
        scrolled
          ? 'bg-background/95 shadow-sm backdrop-blur-xl'
          : 'bg-background/50 backdrop-blur-md'
      }`}
    >
      <div className="relative mx-auto flex h-14 max-w-7xl items-center px-5 md:px-8">
        {/* Left: language switcher + WhatsApp */}
        <div className="flex flex-1 items-center gap-4">
          <div className="flex items-center gap-1.5 text-[10px] tracking-[0.15em]">
            {langs.map((lang, i) => (
              <span key={lang.code} className="flex items-center gap-1.5">
                {i > 0 && (
                  <span className="text-foreground/20">·</span>
                )}
                <Link
                  href={lang.href}
                  className={`transition-colors duration-300 ${
                    t.locale === lang.code
                      ? 'font-semibold text-foreground'
                      : 'text-foreground/40 hover:text-foreground/70'
                  }`}
                >
                  {lang.label}
                </Link>
              </span>
            ))}
          </div>

          <a
            href={`https://wa.me/52${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 text-[11px] tracking-[0.05em] text-foreground/50 transition-colors duration-300 hover:text-foreground sm:flex"
          >
            <WhatsappLogo size={14} weight="bold" />
            {t.nav.escribenos}
          </a>
        </div>

        {/* Center: brand logo */}
        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2 font-display text-base font-semibold tracking-[0.25em] uppercase md:text-lg"
        >
          Oro de Tamar
        </Link>

        {/* Right: auth + cart */}
        <div className="flex flex-1 items-center justify-end gap-3">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="flex items-center gap-1.5 text-[11px] tracking-[0.05em] text-foreground/60 transition-colors duration-300 hover:text-foreground">
                <UserCircle size={18} weight="regular" />
                <span className="hidden sm:inline">{t.nav.iniciarSesion}</span>
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link
              href="/seleccionar-rol"
              className="flex items-center gap-1.5 rounded-full bg-foreground/10 px-3 py-1 text-[11px] tracking-[0.05em] text-foreground/80 transition-colors duration-300 hover:bg-foreground/20 hover:text-foreground"
            >
              <SignIn size={14} weight="bold" />
              <span className="hidden sm:inline">{t.nav.irAlPortal}</span>
            </Link>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: { userButtonAvatarBox: 'w-7 h-7' },
              }}
            />
          </SignedIn>
          <button
            onClick={onAbrirCarrito}
            className="relative flex items-center gap-1.5 text-foreground/70 transition-colors duration-300 hover:text-foreground"
          >
            <ShoppingBag size={20} weight="regular" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center bg-foreground text-[9px] font-bold text-background">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  )
}
