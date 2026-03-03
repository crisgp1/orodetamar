'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  List,
  X,
  MagnifyingGlass,
  Package,
  SignIn,
  WhatsappLogo,
  Globe,
} from '@phosphor-icons/react'
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { useDictionary } from '../_dictionaries/context'
import { LanguageSwitcherMobile } from './language-switcher'

export function MobileMenu({ whatsapp }: { whatsapp: string }) {
  const t = useDictionary()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Hamburger trigger — visible only on mobile */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center text-foreground/70 transition-colors duration-300 hover:text-foreground md:hidden"
        aria-label={t.nav.menu}
      >
        <List size={22} weight="regular" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="noise-overlay flex w-[300px] flex-col bg-background p-0 sm:max-w-[300px]"
        >
          {/* Header */}
          <SheetHeader className="px-6 pt-6 pb-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="font-display text-base font-semibold tracking-[0.25em] uppercase">
                Oro de Tamar
              </SheetTitle>
              <button
                onClick={() => setOpen(false)}
                className="text-foreground/50 transition-colors hover:text-foreground"
                aria-label={t.nav.cerrar}
              >
                <X size={18} weight="regular" />
              </button>
            </div>
          </SheetHeader>

          {/* Nav links */}
          <nav className="flex flex-1 flex-col gap-1 px-4 pt-6">
            {/* Catálogo */}
            <Link
              href="/catalogo"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm tracking-[0.05em] text-foreground/70 transition-colors duration-200 hover:bg-foreground/5 hover:text-foreground"
            >
              <MagnifyingGlass size={18} weight="regular" />
              {t.nav.catalogo}
            </Link>

            <SignedIn>
              {/* Mis pedidos */}
              <Link
                href="/mis-pedidos"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm tracking-[0.05em] text-foreground/70 transition-colors duration-200 hover:bg-foreground/5 hover:text-foreground"
              >
                <Package size={18} weight="regular" />
                {t.misPedidos.titulo}
              </Link>

              {/* Portal admin */}
              <Link
                href="/seleccionar-rol"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm tracking-[0.05em] text-foreground/70 transition-colors duration-200 hover:bg-foreground/5 hover:text-foreground"
              >
                <SignIn size={18} weight="regular" />
                {t.nav.irAlPortal}
              </Link>
            </SignedIn>

            {/* WhatsApp */}
            <a
              href={`https://wa.me/52${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm tracking-[0.05em] text-foreground/70 transition-colors duration-200 hover:bg-foreground/5 hover:text-foreground"
            >
              <WhatsappLogo size={18} weight="regular" />
              {t.nav.escribenos}
            </a>

            <Separator className="my-3 bg-foreground/10" />

            {/* Language switcher */}
            <p className="flex items-center gap-2 px-3 text-[10px] font-medium tracking-[0.2em] uppercase text-foreground/40">
              <Globe size={14} weight="regular" />
              {t.nav.idioma}
            </p>
              <LanguageSwitcherMobile onSelect={() => setOpen(false)} />
          </nav>

          {/* Bottom: auth */}
          <div className="mt-auto border-t border-foreground/10 px-6 py-4">
            <SignedOut>
              <SignInButton mode="modal" forceRedirectUrl="/seleccionar-rol" signUpForceRedirectUrl="/seleccionar-rol">
                <button className="flex w-full items-center justify-center gap-2 rounded-md bg-foreground/5 py-2.5 text-sm tracking-[0.05em] text-foreground/70 transition-colors duration-200 hover:bg-foreground/10 hover:text-foreground">
                  {t.nav.iniciarSesion}
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <div className="flex items-center gap-3">
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: { userButtonAvatarBox: 'w-8 h-8' },
                  }}
                />
                <span className="text-sm text-foreground/50">
                  {t.nav.iniciarSesion === 'Sign in'
                    ? 'My account'
                    : t.nav.iniciarSesion === 'Se connecter'
                      ? 'Mon compte'
                      : 'Mi cuenta'}
                </span>
              </div>
            </SignedIn>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
