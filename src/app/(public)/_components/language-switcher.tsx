'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { setLocaleCookie } from '../_dictionaries/actions'
import { useDictionary } from '../_dictionaries/context'

const langs = [
  { code: 'es', label: 'ES', labelFull: 'Español' },
  { code: 'en', label: 'EN', labelFull: 'English' },
  { code: 'fr', label: 'FR', labelFull: 'Français' },
] as const

/**
 * Desktop language switcher (compact: ES · EN · FR).
 * Sets a cookie and refreshes — no navigation.
 */
export function LanguageSwitcher() {
  const t = useDictionary()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleSwitch(code: string) {
    startTransition(async () => {
      await setLocaleCookie(code)
      router.refresh()
    })
  }

  return (
    <div className="hidden items-center gap-1.5 text-[10px] tracking-[0.15em] md:flex">
      {langs.map((lang, i) => (
        <span key={lang.code} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-foreground/20">·</span>}
          <button
            onClick={() => handleSwitch(lang.code)}
            disabled={isPending}
            className={`transition-colors duration-300 ${
              t.locale === lang.code
                ? 'font-semibold text-foreground'
                : 'text-foreground/40 hover:text-foreground/70'
            }`}
          >
            {lang.label}
          </button>
        </span>
      ))}
    </div>
  )
}

/**
 * Mobile language switcher (full names: Español, English, Français).
 * Sets a cookie and refreshes — no navigation.
 */
export function LanguageSwitcherMobile({
  onSelect,
}: {
  onSelect?: () => void
}) {
  const t = useDictionary()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleSwitch(code: string) {
    startTransition(async () => {
      await setLocaleCookie(code)
      onSelect?.()
      router.refresh()
    })
  }

  return (
    <div className="mt-1 flex flex-col gap-0.5">
      {langs.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleSwitch(lang.code)}
          disabled={isPending}
          className={`rounded-md px-3 py-2 text-left text-sm tracking-[0.05em] transition-colors duration-200 ${
            t.locale === lang.code
              ? 'bg-foreground/5 font-semibold text-foreground'
              : 'text-foreground/50 hover:bg-foreground/5 hover:text-foreground/80'
          }`}
        >
          {lang.labelFull}
        </button>
      ))}
    </div>
  )
}
