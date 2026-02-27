'use client'

import { useState, useRef, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Bank,
  CopySimple,
  UploadSimple,
  CheckCircle,
  WarningCircle,
  Spinner,
  Package,
  ShoppingBag,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { DictionaryProvider, useDictionary } from '../_dictionaries/context'
import type { Dictionary } from '../_dictionaries'
import { loadCart, STORAGE_KEY } from '../_hooks/use-carrito'
import { crearPedidoWeb, subirComprobante } from './actions'

/* ── Types ── */
type Producto = {
  id: number
  nombre: string
  presentacion: string
  peso_gramos: number
  precio_venta: number
  imagen_url: string | null
}

type DatosBancarios = {
  banco: string
  clabe: string
  beneficiario: string
}

type CarritoItem = {
  producto: Producto
  cantidad: number
}

/* ── Constants ── */
const ANTICIPO_THRESHOLD = 2000
const ANTICIPO_PERCENT = 0.5

function formatPrecio(n: number) {
  return n % 1 === 0 ? `$${n}` : `$${n.toFixed(2)}`
}

/* ── Main export (wraps in DictionaryProvider) ── */
export function CheckoutContent({
  dictionary,
  datosBancarios,
  productos,
  whatsapp,
}: {
  dictionary: Dictionary
  datosBancarios: DatosBancarios
  productos: Producto[]
  whatsapp: string
}) {
  return (
    <DictionaryProvider dictionary={dictionary}>
      <CheckoutInner
        datosBancarios={datosBancarios}
        productos={productos}
        whatsapp={whatsapp}
      />
    </DictionaryProvider>
  )
}

/* ── Inner component (has dictionary context) ── */
function CheckoutInner({
  datosBancarios,
  productos,
  whatsapp,
}: {
  datosBancarios: DatosBancarios
  productos: Producto[]
  whatsapp: string
}) {
  const t = useDictionary()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()

  /* ── Cart from localStorage ── */
  const items: CarritoItem[] = (() => {
    const cart = loadCart()
    const resolved: CarritoItem[] = []
    cart.forEach((qty, pid) => {
      const p = productos.find((pr) => pr.id === pid)
      if (p) resolved.push({ producto: p, cantidad: qty })
    })
    return resolved
  })()

  /* ── Form state ── */
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [direccion, setDireccion] = useState('')
  const [notas, setNotas] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [montoDeclarado, setMontoDeclarado] = useState('')

  /* ── Success state ── */
  const [success, setSuccess] = useState<number | null>(null) // pedidoId

  /* ── Derived ── */
  const subtotal = items.reduce(
    (s, i) => s + i.producto.precio_venta * i.cantidad,
    0
  )
  const requiereAnticipo = subtotal > ANTICIPO_THRESHOLD
  const montoAnticipo = requiereAnticipo
    ? Math.ceil(subtotal * ANTICIPO_PERCENT)
    : null
  const montoAPagar = montoAnticipo ?? subtotal

  /* ── Copy CLABE ── */
  function copiarClabe() {
    navigator.clipboard.writeText(datosBancarios.clabe)
    toast.success('CLABE copiada')
  }

  /* ── Submit ── */
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!items.length) return toast.error(t.checkout.errorVacio)
    if (!file) return toast.error(t.checkout.errorComprobante)

    startTransition(async () => {
      try {
        // 1. Create the order
        const result = await crearPedidoWeb({
          items: items.map((i) => ({
            productoId: i.producto.id,
            cantidad: i.cantidad,
          })),
          nombre: nombre.trim(),
          telefono: telefono.trim(),
          direccion: direccion.trim(),
          notas: notas.trim(),
          montoDeclarado: montoDeclarado ? Number(montoDeclarado) : null,
        })

        if (!result.ok) {
          console.error('[checkout] fail:', result.error)
          toast.error(t.checkout.errorGeneral)
          return
        }

        // 2. Upload comprobante
        const fd = new FormData()
        fd.set('pedidoId', String(result.pedidoId))
        fd.set('file', file)
        if (montoDeclarado) fd.set('montoDeclarado', montoDeclarado)

        const upload = await subirComprobante(fd)
        if (!upload.ok) {
          console.error('[checkout] upload fail:', upload.error)
          // The order was created — warn but don't block
          toast.warning('Pedido creado, pero hubo un error al subir el comprobante. Puedes subirlo después desde "Mis pedidos".')
        }

        // 3. Clear cart
        try {
          localStorage.removeItem(STORAGE_KEY)
        } catch { /* ok */ }

        setSuccess(result.pedidoId)
      } catch (err) {
        console.error('[checkout] unexpected:', err)
        toast.error(t.checkout.errorGeneral)
      }
    })
  }

  /* ── SUCCESS VIEW ── */
  if (success) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-5">
        <div className="mx-auto w-full max-w-md text-center">
          <CheckCircle size={64} weight="thin" className="mx-auto mb-6 text-[#25D366]" />
          <h1 className="font-display text-3xl font-light">
            {t.checkout.exitoTitulo}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {t.checkout.exitoDesc}
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/mis-pedidos"
              className="flex h-12 items-center justify-center gap-2 border border-foreground bg-foreground text-sm font-medium text-background transition-colors hover:bg-foreground/90"
            >
              <Package size={18} />
              {t.checkout.exitoVerPedidos}
            </Link>
            <Link
              href="/"
              className="flex h-12 items-center justify-center gap-2 border border-border text-sm font-medium transition-colors hover:bg-muted"
            >
              <ShoppingBag size={18} />
              {t.checkout.exitoSeguirComprando}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  /* ── EMPTY CART ── */
  if (items.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-5">
        <div className="mx-auto w-full max-w-md text-center">
          <ShoppingBag size={48} weight="thin" className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t.checkout.errorVacio}</p>
          <Link
            href="/"
            className="mt-6 inline-flex h-10 items-center gap-2 border border-border px-6 text-sm transition-colors hover:bg-muted"
          >
            <ArrowLeft size={14} />
            {t.checkout.exitoSeguirComprando}
          </Link>
        </div>
      </div>
    )
  }

  /* ── Shared submit button ── */
  const submitBtn = (
    <button
      type="submit"
      disabled={isPending}
      className="flex h-12 w-full items-center justify-center gap-2 bg-foreground text-sm font-semibold tracking-wide text-background transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {isPending ? (
        <>
          <Spinner size={18} className="animate-spin" />
          {t.checkout.procesando}
        </>
      ) : (
        <>
          <CheckCircle size={18} />
          {t.checkout.confirmar}
        </>
      )}
    </button>
  )

  /* ── CHECKOUT FORM ── */
  return (
    <div className="min-h-dvh bg-background pb-24 lg:pb-12">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-5 lg:px-8">
          <Link href="/" className="text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="font-display text-xl font-normal">{t.checkout.titulo}</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="mx-auto max-w-6xl px-5 pt-8 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">

          {/* ════════════════════════════════════════════
              LEFT COLUMN — Form fields (8 cols on lg)
              ════════════════════════════════════════════ */}
          <div className="space-y-6 lg:col-span-7 xl:col-span-7">

            {/* ── Mobile-only: mini order summary ── */}
            <section className="lg:hidden">
              <div className="border border-border bg-card p-4">
                {items.map((item, i) => (
                  <div
                    key={item.producto.id}
                    className={`flex items-center justify-between py-2 ${
                      i > 0 ? 'border-t border-dashed border-border' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm">{item.producto.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.cantidad} &times; {formatPrecio(item.producto.precio_venta)} {t.checkout.cu}
                      </p>
                    </div>
                    <p className="tabular-nums font-display text-sm font-semibold whitespace-nowrap pl-4">
                      {formatPrecio(item.producto.precio_venta * item.cantidad)}
                    </p>
                  </div>
                ))}
                <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total</span>
                  <span className="tabular-nums font-display text-lg font-semibold">
                    {formatPrecio(subtotal)}
                  </span>
                </div>
              </div>
            </section>

            {/* ── 1. Delivery Details ── */}
            <section className="border border-border bg-card">
              <div className="border-b border-border px-5 py-3">
                <h2 className="text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground">
                  {t.checkout.datosEntrega}
                </h2>
              </div>
              <div className="space-y-4 p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium">{t.checkout.nombre}</span>
                    <input
                      type="text"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="h-10 w-full border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-foreground"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium">{t.checkout.telefono}</span>
                    <input
                      type="tel"
                      required
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="h-10 w-full border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-foreground"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium">{t.checkout.direccion}</span>
                  <input
                    type="text"
                    required
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    placeholder={t.checkout.direccionPlaceholder}
                    className="h-10 w-full border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-foreground"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium">{t.checkout.notas}</span>
                  <textarea
                    rows={2}
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder={t.checkout.notasPlaceholder}
                    className="w-full resize-none border border-border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-foreground"
                  />
                </label>
              </div>
            </section>

            {/* ── 2. Payment — Bank Details ── */}
            <section className="border border-border bg-card">
              <div className="border-b border-border px-5 py-3">
                <h2 className="text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground">
                  {t.checkout.metodoPago}
                </h2>
              </div>
              <div className="p-5">
                <div className="mb-5 flex items-center gap-2">
                  <Bank size={18} className="text-muted-foreground" />
                  <span className="text-sm font-medium">{t.checkout.transferencia}</span>
                </div>

                {/* Bank details card */}
                <div className="border border-dashed border-border bg-muted/40 p-4">
                  <p className="mb-3 text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground">
                    {t.checkout.datosBancarios}
                  </p>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">{t.checkout.banco}</span>
                      <span className="font-medium">{datosBancarios.banco || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">{t.checkout.clabe}</span>
                      <span className="flex items-center gap-1.5 font-mono text-xs font-semibold tracking-wider">
                        {datosBancarios.clabe || '—'}
                        {datosBancarios.clabe && (
                          <button
                            type="button"
                            onClick={copiarClabe}
                            className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                          >
                            <CopySimple size={14} />
                          </button>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">{t.checkout.beneficiario}</span>
                      <span className="font-medium">{datosBancarios.beneficiario || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Anticipo notice */}
                {requiereAnticipo && (
                  <div className="mt-5 flex items-start gap-2.5 border border-amber-200 bg-amber-50 p-4">
                    <WarningCircle size={18} weight="fill" className="mt-0.5 shrink-0 text-amber-500" />
                    <div>
                      <p className="text-xs font-semibold text-amber-800">{t.checkout.anticipo}</p>
                      <p className="mt-1 font-display text-base font-semibold text-amber-900">
                        {t.checkout.montoAnticipo}: {formatPrecio(montoAnticipo!)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Transfer amount */}
                <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                  <span className="text-sm font-medium">{t.checkout.montoTotal}</span>
                  <span className="tabular-nums font-display text-2xl font-semibold">
                    {formatPrecio(montoAPagar)}
                  </span>
                </div>
              </div>
            </section>

            {/* ── 3. Upload Comprobante ── */}
            <section className="border border-border bg-card">
              <div className="border-b border-border px-5 py-3">
                <h2 className="text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground">
                  {t.checkout.subirComprobante}
                </h2>
              </div>
              <div className="space-y-4 p-5">
                <div
                  onClick={() => fileRef.current?.click()}
                  className={`flex cursor-pointer flex-col items-center justify-center border-2 border-dashed px-4 py-8 text-center transition-colors ${
                    file
                      ? 'border-[#25D366]/50 bg-[#25D366]/5'
                      : 'border-border hover:border-foreground/30'
                  }`}
                >
                  {file ? (
                    <>
                      <CheckCircle size={28} weight="fill" className="mb-2 text-[#25D366]" />
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(0)} KB · Click para cambiar
                      </p>
                    </>
                  ) : (
                    <>
                      <UploadSimple size={28} className="mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {t.checkout.comprobantePlaceholder}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground/60">
                        JPG, PNG, WebP o PDF · Máx. 5 MB
                      </p>
                    </>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </div>

                <label className="block sm:max-w-xs">
                  <span className="mb-1.5 block text-xs font-medium">{t.checkout.montoTransferido}</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={montoDeclarado}
                    onChange={(e) => setMontoDeclarado(e.target.value)}
                    placeholder={formatPrecio(montoAPagar)}
                    className="h-10 w-full border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-foreground"
                  />
                </label>
              </div>
            </section>

            {/* ── Mobile-only submit ── */}
            <div className="lg:hidden">{submitBtn}</div>
          </div>

          {/* ════════════════════════════════════════════
              RIGHT COLUMN — Sticky sidebar (desktop only)
              ════════════════════════════════════════════ */}
          <aside className="hidden lg:col-span-5 xl:col-span-5 lg:block">
            <div className="sticky top-20 border border-border bg-card">
              {/* Items */}
              <div className="border-b border-border px-5 py-3">
                <h3 className="text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground">
                  {t.checkout.resumen}
                </h3>
              </div>

              <div className="p-5">
                <div className="space-y-0">
                  {items.map((item, i) => (
                    <div
                      key={item.producto.id}
                      className={`flex items-center justify-between py-2.5 ${
                        i > 0 ? 'border-t border-dashed border-border' : ''
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm">{item.producto.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.cantidad} &times; {formatPrecio(item.producto.precio_venta)} {t.checkout.cu}
                        </p>
                      </div>
                      <p className="tabular-nums font-display text-sm font-semibold whitespace-nowrap pl-4">
                        {formatPrecio(item.producto.precio_venta * item.cantidad)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="mt-4 border-t border-border pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Subtotal</span>
                    <span className="tabular-nums text-sm font-medium">
                      {formatPrecio(subtotal)}
                    </span>
                  </div>
                  {requiereAnticipo && (
                    <div className="flex items-center justify-between text-amber-700">
                      <span className="flex items-center gap-1 text-xs">
                        <WarningCircle size={12} />
                        {t.checkout.montoAnticipo}
                      </span>
                      <span className="tabular-nums font-display text-sm font-semibold">
                        {formatPrecio(montoAnticipo!)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <span className="text-sm font-semibold">Total</span>
                    <span className="tabular-nums font-display text-xl font-semibold">
                      {formatPrecio(subtotal)}
                    </span>
                  </div>
                </div>

                {/* Submit */}
                <div className="mt-5">{submitBtn}</div>

                <p className="mt-3 text-center text-[10px] text-muted-foreground/60">
                  {t.carrito.nota}
                </p>
              </div>
            </div>
          </aside>

        </div>
      </form>
    </div>
  )
}
