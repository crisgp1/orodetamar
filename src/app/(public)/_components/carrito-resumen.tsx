'use client'

import { WhatsappLogo, Plus, Minus, X, ArrowRight, ShoppingBag } from '@phosphor-icons/react'
import { useRouter } from 'next/navigation'
import { SignedIn, SignedOut } from '@clerk/nextjs'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useDictionary } from '../_dictionaries/context'

type Producto = {
  id: number
  nombre: string
  presentacion: string
  peso_gramos: number
  precio_venta: number
}

type CarritoItem = {
  producto: Producto
  cantidad: number
}

function formatPrecio(n: number) {
  return n % 1 === 0 ? `$${n}` : `$${n.toFixed(2)}`
}

export function CarritoResumen({
  abierto,
  onCerrar,
  items,
  whatsapp,
  onCambiarCantidad,
  onQuitar,
  onLimpiar,
}: {
  abierto: boolean
  onCerrar: () => void
  items: CarritoItem[]
  whatsapp: string
  onCambiarCantidad: (productoId: number, delta: number) => void
  onQuitar: (productoId: number) => void
  onLimpiar: () => void
}) {
  const t = useDictionary()
  const router = useRouter()

  const totalEstimado = items.reduce(
    (s, i) => s + i.producto.precio_venta * i.cantidad,
    0
  )

  function handleEnviar() {
    const lineas = items.map(
      (i) =>
        `- ${i.cantidad}x ${i.producto.nombre} ${i.producto.presentacion} (${formatPrecio(i.producto.precio_venta)} ${t.carrito.waCu})`
    )
    const mensaje = [
      t.carrito.waIntro,
      '',
      ...lineas,
      '',
      `${t.carrito.total}: ${formatPrecio(totalEstimado)}`,
      '',
      t.carrito.waNombre,
    ].join('\n')

    const url = `https://wa.me/52${whatsapp}?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    toast.success(t.carrito.exito)
    onLimpiar()
    onCerrar()
  }

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent
        fullScreenMobile
        className="flex flex-col overflow-hidden sm:max-h-[85dvh] sm:max-w-md sm:rounded-none"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-normal">
            {t.carrito.titulo}
          </DialogTitle>
          <div className="mt-2 h-px w-8 bg-foreground" />
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground italic">
              {t.carrito.vacio}
            </p>
          ) : (
            <div className="space-y-0">
              {items.map((item, i) => (
                <div key={item.producto.id}>
                  {i > 0 && (
                    <div className="my-4 border-t border-dashed border-border" />
                  )}
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
                        {item.producto.nombre} · {item.producto.presentacion}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.cantidad} &times;{' '}
                        {formatPrecio(item.producto.precio_venta)}
                      </p>
                      <div className="mt-2 inline-flex items-center border border-border">
                        <button
                          className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground"
                          onClick={() =>
                            onCambiarCantidad(item.producto.id, -1)
                          }
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-6 text-center font-display text-xs font-semibold">
                          {item.cantidad}
                        </span>
                        <button
                          className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground"
                          onClick={() =>
                            onCambiarCantidad(item.producto.id, 1)
                          }
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <p className="tabular-nums font-display text-sm font-semibold">
                        {formatPrecio(
                          item.producto.precio_venta * item.cantidad
                        )}
                      </p>
                      <button
                        onClick={() => onQuitar(item.producto.id)}
                        className="rounded p-0.5 text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t-2 border-double border-border pt-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium">{t.carrito.total}</span>
              <span className="tabular-nums font-display text-xl font-semibold">
                {formatPrecio(totalEstimado)}
              </span>
            </div>
            <p className="mb-4 text-xs text-muted-foreground italic">
              {t.carrito.nota}
            </p>

            <SignedIn>
              <button
                onClick={() => {
                  onCerrar()
                  router.push('/checkout')
                }}
                className="flex h-12 w-full items-center justify-center gap-2 bg-foreground text-sm font-semibold text-background transition-opacity hover:opacity-90"
              >
                <ShoppingBag size={18} weight="bold" />
                {t.carrito.hacerPedido}
                <ArrowRight size={16} weight="bold" />
              </button>
              <button
                onClick={handleEnviar}
                className="flex h-10 w-full items-center justify-center gap-2 border border-border text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <WhatsappLogo size={16} weight="bold" className="text-[#25D366]" />
                {t.carrito.oWhatsapp}
              </button>
            </SignedIn>
            <SignedOut>
              <button
                onClick={handleEnviar}
                className="flex h-12 w-full items-center justify-center gap-2 bg-[#25D366] text-sm font-semibold text-white shadow-lg shadow-green-500/20 transition-colors hover:bg-[#1DA851]"
              >
                <WhatsappLogo size={20} weight="bold" />
                {t.carrito.pedir}
                <ArrowRight size={16} weight="bold" />
              </button>
            </SignedOut>

            <button
              onClick={() => {
                onLimpiar()
                onCerrar()
              }}
              className="mt-3 w-full text-center text-xs text-muted-foreground transition-colors hover:text-destructive"
            >
              {t.carrito.vaciar}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
