import { es } from './es'
import { en } from './en'
import { fr } from './fr'

export type { Dictionary } from './es'

const dictionaries = { es, en, fr } as const

export type Locale = keyof typeof dictionaries
export const locales: Locale[] = ['es', 'en', 'fr']
export const defaultLocale: Locale = 'es'

export function getDictionary(locale: string) {
  if (locale in dictionaries) return dictionaries[locale as Locale]
  return dictionaries.es
}
