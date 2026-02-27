'use client'

import { WhatsappLogo } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

export function WhatsAppButton({
  telefono,
  mensaje,
  size = 'sm',
}: {
  telefono: string
  mensaje: string
  size?: 'sm' | 'default'
}) {
  const url = `https://wa.me/52${telefono}?text=${encodeURIComponent(mensaje)}`

  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      <Button variant="outline" size={size} className="gap-1.5 text-emerald-600 hover:text-emerald-700">
        <WhatsappLogo size={16} weight="regular" />
        WhatsApp
      </Button>
    </a>
  )
}
