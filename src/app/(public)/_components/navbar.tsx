'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { WhatsappLogo, ShoppingBag, UserCircle, SignIn, Package } from '@phosphor-icons/react'
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { useDictionary } from '../_dictionaries/context'
import { MobileMenu } from './mobile-menu'
import { LanguageSwitcher } from './language-switcher'

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
        {/* Left: mobile menu (small screens) + language switcher + WhatsApp (desktop) */}
        <div className="flex flex-1 items-center gap-4">
          {/* Mobile hamburger menu */}
          <MobileMenu whatsapp={whatsapp} />

          {/* Desktop language switcher */}
          <LanguageSwitcher />

          <a
            href={`https://wa.me/52${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 text-[11px] tracking-[0.05em] text-foreground/50 transition-colors duration-300 hover:text-foreground md:flex"
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
            <SignInButton mode="modal" forceRedirectUrl="/seleccionar-rol" signUpForceRedirectUrl="/seleccionar-rol">
              <button className="hidden items-center gap-1.5 text-[11px] tracking-[0.05em] text-foreground/60 transition-colors duration-300 hover:text-foreground md:flex">
                <UserCircle size={18} weight="regular" />
                <span>{t.nav.iniciarSesion}</span>
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link
              href="/mis-pedidos"
              className="hidden items-center gap-1.5 text-[11px] tracking-[0.05em] text-foreground/50 transition-colors duration-300 hover:text-foreground md:flex"
            >
              <Package size={14} weight="bold" />
              <span>{t.misPedidos.titulo}</span>
            </Link>
            <Link
              href="/seleccionar-rol"
              className="hidden items-center gap-1.5 rounded-full bg-foreground/10 px-3 py-1 text-[11px] tracking-[0.05em] text-foreground/80 transition-colors duration-300 hover:bg-foreground/20 hover:text-foreground md:flex"
            >
              <SignIn size={14} weight="bold" />
              <span>{t.nav.irAlPortal}</span>
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
