'use client'

import { TrendUp, TrendDown, Minus } from '@phosphor-icons/react'

export function TendenciaIndicator({
  valor,
  sufijo = '%',
  invertir = false,
}: {
  valor: number
  sufijo?: string
  invertir?: boolean
}) {
  const positivo = invertir ? valor < 0 : valor > 0
  const negativo = invertir ? valor > 0 : valor < 0

  if (valor === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
        <Minus size={12} weight="bold" />
        0{sufijo}
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        positivo
          ? 'text-emerald-600'
          : negativo
            ? 'text-red-600'
            : 'text-muted-foreground'
      }`}
    >
      {valor > 0 ? (
        <TrendUp size={12} weight="bold" />
      ) : (
        <TrendDown size={12} weight="bold" />
      )}
      {valor > 0 ? '+' : ''}
      {valor.toFixed(1)}
      {sufijo}
    </span>
  )
}
