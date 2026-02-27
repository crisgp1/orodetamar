import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Fecha de hoy en timezone Tijuana (YYYY-MM-DD). */
export function fechaHoyTijuana(): string {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Tijuana',
  })
}

/** Formato moneda compacto: $1,234 (sin centavos). */
export function formatMoney(n: number): string {
  return `$${Math.round(n).toLocaleString('es-MX')}`
}

/** Formato moneda exacto: $1,234.56 (con centavos). */
export function formatMoneyExact(n: number): string {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
