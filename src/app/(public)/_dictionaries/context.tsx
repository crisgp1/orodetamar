'use client'

import { createContext, useContext } from 'react'
import type { Dictionary } from '.'

const Ctx = createContext<Dictionary | null>(null)

export function DictionaryProvider({
  dictionary,
  children,
}: {
  dictionary: Dictionary
  children: React.ReactNode
}) {
  return <Ctx.Provider value={dictionary}>{children}</Ctx.Provider>
}

export function useDictionary() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useDictionary must be within DictionaryProvider')
  return ctx
}
