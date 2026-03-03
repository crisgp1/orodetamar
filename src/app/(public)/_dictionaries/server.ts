import { cookies } from 'next/headers'
import { defaultLocale, locales, getDictionary, type Locale } from '.'

const COOKIE_NAME = 'locale'

/**
 * Read the preferred locale from cookies (server-side).
 * Falls back to defaultLocale if not set or invalid.
 */
export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const val = cookieStore.get(COOKIE_NAME)?.value
  if (val && locales.includes(val as Locale)) return val as Locale
  return defaultLocale
}

/**
 * Get the dictionary for the current server locale.
 */
export async function getServerDictionary() {
  const locale = await getServerLocale()
  return getDictionary(locale)
}
