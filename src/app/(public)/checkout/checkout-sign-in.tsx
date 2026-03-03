'use client'

import { SignInButton } from '@clerk/nextjs'
import { ShoppingBag, ArrowRight } from '@phosphor-icons/react'
import type { Dictionary } from '../_dictionaries'

export function CheckoutSignIn({ dictionary: t }: { dictionary: Dictionary }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5">
      <div className="mx-auto w-full max-w-sm text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-foreground/5">
          <ShoppingBag size={28} weight="regular" className="text-foreground/60" />
        </div>

        <h1 className="mt-6 font-display text-2xl font-light tracking-[0.08em] uppercase md:text-3xl">
          {t.checkout.titulo}
        </h1>

        <div className="mx-auto mt-4 h-px w-10 bg-foreground/20" />

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          {t.checkout.loginMsg}
        </p>

        <div className="mt-8">
          <SignInButton mode="modal" forceRedirectUrl="/checkout" signUpForceRedirectUrl="/checkout">
            <button className="flex h-12 w-full items-center justify-center gap-2 bg-foreground text-sm font-semibold tracking-[0.05em] text-background transition-opacity hover:opacity-90">
              {t.checkout.loginBtn}
              <ArrowRight size={16} weight="bold" />
            </button>
          </SignInButton>
        </div>

        <p className="mt-4 text-[11px] text-muted-foreground">
          {t.checkout.loginNota}
        </p>

        <p className="mt-3 text-[10px] tracking-[0.05em] text-muted-foreground/70">
          🇲🇽 {t.checkout.soloMexico}
        </p>
      </div>
    </div>
  )
}
