'use server'

import { cookies } from 'next/headers'
import { locales, type Locale } from '.'

const COOKIE_NAME = 'locale'
const ONE_YEAR = 60 * 60 * 24 * 365

export async function setLocaleCookie(locale: string) {
  if (!locales.includes(locale as Locale)) return
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, locale, {
    path: '/',
    maxAge: ONE_YEAR,
    sameSite: 'lax',
  })
}
