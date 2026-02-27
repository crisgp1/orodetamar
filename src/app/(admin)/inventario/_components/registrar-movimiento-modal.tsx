'use client'

import { useState, useTransition } from 'react'
import {
  Plus,
  Minus,
  ArrowUUpLeft,
  ArrowsClockwise,
  ArrowRight,
  Warning,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  registrarProduccion,
  registrarMerma,
  registrarReingreso,
  registrarReprocesamiento,
} from '../actions'
import type { VStockActual } from '@/lib/types/database'

type ProductoOption = {
  id: number
  nombre: string
  presentacion: string
}

type TabType = 'produccion' | 'merma' | 'reingreso' | 'reprocesamiento'

export function RegistrarMovimientoModal({
  productos,
  stock,
}: {
  productos: ProductoOption[]
  stock: VStockActual[]
}) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<TabType>('produccion')

  function handleClose() {
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus size={16} weight="bold" />
          Registrar movimiento
        </Button>
      </DialogTrigger>

      <DialogContent
        fullScreenMobile
        className="flex flex-col overflow-hidden sm:max-h-[85dvh]"
      >
        <DialogHeader>
          <DialogTitle>Registrar movimiento</DialogTitle>
          <DialogDescription>
            Registra entradas y salidas de inventario.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as TabType)}
          className="min-h-0 flex-1"
        >
          <TabsList className="w-full">
            <TabsTrigger value="produccion" className="gap-1.5 text-xs">
              <Plus size={14} weight="bold" />
              Producción
            </TabsTrigger>
            <TabsTrigger value="merma" className="gap-1.5 text-xs">
              <Minus size={14} weight="bold" />
              Merma
            </TabsTrigger>
            <TabsTrigger value="reingreso" className="gap-1.5 text-xs">
              <ArrowUUpLeft size={14} weight="bold" />
              Reingreso
            </TabsTrigger>
            <TabsTrigger value="reprocesamiento" className="gap-1.5 text-xs">
              <ArrowsClockwise size={14} weight="bold" />
              Reproc.
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto pt-4">
            <TabsContent value="produccion">
              <FormSimple
                tipo="produccion"
                descripcion="Agrega unidades producidas al inventario."
                placeholder="Ej: Lote del 25 de febrero, 5 cajas limpiadas"
                notasObligatorias={false}
                productos={productos}
                onClose={handleClose}
              />
            </TabsContent>

            <TabsContent value="merma">
              <FormSimple
                tipo="merma"
                descripcion="Registra pérdida o descarte de producto."
                placeholder="Ej: 5 bolsas de pulpa se echaron a perder por calor"
                notasObligatorias
                productos={productos}
                stock={stock}
                onClose={handleClose}
              />
            </TabsContent>

            <TabsContent value="reingreso">
              <FormSimple
                tipo="reingreso"
                descripcion="Producto que vuelve al inventario fuera del ciclo de consignación."
                placeholder="Ej: Pulpa retornada de Ortega House, la venderé en stand"
                notasObligatorias
                productos={productos}
                onClose={handleClose}
              />
            </TabsContent>

            <TabsContent value="reprocesamiento">
              <FormReprocesamiento
                productos={productos}
                stock={stock}
                onClose={handleClose}
              />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

// ── Formulario simple (produccion, merma, reingreso) ────────────────

function FormSimple({
  tipo,
  descripcion,
  placeholder,
  notasObligatorias,
  productos,
  stock,
  onClose,
}: {
  tipo: 'produccion' | 'merma' | 'reingreso'
  descripcion: string
  placeholder: string
  notasObligatorias: boolean
  productos: ProductoOption[]
  stock?: VStockActual[]
  onClose: () => void
}) {
  const [productoId, setProductoId] = useState<string>('')
  const [cantidad, setCantidad] = useState('')
  const [notas, setNotas] = useState('')
  const [isPending, startTransition] = useTransition()

  const stockProducto = stock?.find(
    (s) => s.producto_id === Number(productoId)
  )

  // For merma, only show products with stock > 0
  const productosVisibles =
    tipo === 'merma' && stock
      ? productos.filter((p) => {
          const s = stock.find((item) => item.producto_id === p.id)
          return s && s.cantidad_disponible > 0
        })
      : productos

  function resetForm() {
    setProductoId('')
    setCantidad('')
    setNotas('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const pid = Number(productoId)
    const cant = Number(cantidad)

    if (!pid) return toast.error('Selecciona un producto')
    if (!cant || cant < 1) return toast.error('La cantidad debe ser mayor a 0')
    if (notasObligatorias && !notas.trim())
      return toast.error('Las notas son obligatorias')

    startTransition(async () => {
      const action = {
        produccion: () =>
          registrarProduccion({
            producto_id: pid,
            cantidad: cant,
            notas: notas.trim() || undefined,
          }),
        merma: () =>
          registrarMerma({
            producto_id: pid,
            cantidad: cant,
            notas: notas.trim(),
          }),
        reingreso: () =>
          registrarReingreso({
            producto_id: pid,
            cantidad: cant,
            notas: notas.trim(),
          }),
      }

      const result = await action[tipo]()

      if (result.error) {
        toast.error(result.error)
        return
      }

      const msg = {
        produccion: `Producción registrada: +${cant} uds`,
        merma: `Merma registrada: -${cant} uds`,
        reingreso: `Reingreso registrado: +${cant} uds`,
      }
      toast.success(msg[tipo])
      resetForm()
      onClose()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">{descripcion}</p>

      <fieldset className="space-y-2">
        <Label>Producto</Label>
        <Select value={productoId} onValueChange={setProductoId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona un producto" />
          </SelectTrigger>
          <SelectContent>
            {productosVisibles.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.nombre} — {p.presentacion}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {tipo === 'merma' && stockProducto && (
          <p className="text-xs text-muted-foreground">
            Stock actual: {stockProducto.cantidad_disponible} uds
          </p>
        )}
      </fieldset>

      <fieldset className="space-y-2">
        <Label>Cantidad</Label>
        <Input
          type="number"
          min={1}
          step={1}
          placeholder="Ej: 50"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
        />
      </fieldset>

      <fieldset className="space-y-2">
        <Label>Notas{notasObligatorias ? '' : ' (opcional)'}</Label>
        <Textarea
          placeholder={placeholder}
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={2}
        />
      </fieldset>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Guardando...' : `Registrar ${tipo}`}
      </Button>
    </form>
  )
}

// ── Formulario reprocesamiento ──────────────────────────────────────

function FormReprocesamiento({
  productos,
  stock,
  onClose,
}: {
  productos: ProductoOption[]
  stock: VStockActual[]
  onClose: () => void
}) {
  const [origenId, setOrigenId] = useState<string>('')
  const [cantidadOrigen, setCantidadOrigen] = useState('')
  const [destinoId, setDestinoId] = useState<string>('')
  const [cantidadDestino, setCantidadDestino] = useState('')
  const [notas, setNotas] = useState('')
  const [isPending, startTransition] = useTransition()

  const stockOrigen = stock.find((s) => s.producto_id === Number(origenId))
  const cantOrigen = Number(cantidadOrigen) || 0
  const cantDestino = Number(cantidadDestino) || 0
  const excedido = stockOrigen
    ? cantOrigen > stockOrigen.cantidad_disponible
    : false
  const destinoExcedido = cantDestino > cantOrigen && cantOrigen > 0

  const productosOrigen = productos.filter((p) => {
    const s = stock.find((item) => item.producto_id === p.id)
    return s && s.cantidad_disponible > 0
  })

  const productosDestino = productos.filter((p) => String(p.id) !== origenId)

  const origenProducto = productos.find((p) => String(p.id) === origenId)
  const destinoProducto = productos.find((p) => String(p.id) === destinoId)

  function resetForm() {
    setOrigenId('')
    setCantidadOrigen('')
    setDestinoId('')
    setCantidadDestino('')
    setNotas('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const oid = Number(origenId)
    const did = Number(destinoId)

    if (!oid) return toast.error('Selecciona producto origen')
    if (!cantOrigen || cantOrigen < 1)
      return toast.error('Cantidad debe ser mayor a 0')
    if (excedido) return toast.error('Stock insuficiente del producto origen')
    if (!did) return toast.error('Selecciona producto destino')
    if (oid === did)
      return toast.error('Origen y destino deben ser productos diferentes')
    if (!cantDestino || cantDestino < 1)
      return toast.error('Cantidad producida debe ser mayor a 0')
    if (destinoExcedido)
      return toast.error('Cantidad producida no puede exceder la cantidad origen')

    startTransition(async () => {
      const result = await registrarReprocesamiento({
        producto_origen_id: oid,
        cantidad_origen: cantOrigen,
        producto_destino_id: did,
        cantidad_destino: cantDestino,
        notas: notas.trim() || undefined,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success(
        `Reprocesamiento: -${cantOrigen} ${origenProducto?.nombre ?? ''} → +${cantDestino} ${destinoProducto?.nombre ?? ''}`
      )
      resetForm()
      onClose()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Convierte un producto en otro. Ej: Dátil Natural → Pulpa Enchilosa.
      </p>

      {/* Indicador visual origen → destino */}
      {origenProducto && destinoProducto && (
        <div className="flex items-center gap-2 rounded-md border border-purple-200 bg-purple-50 px-3 py-2 text-sm">
          <span className="truncate font-medium text-purple-700">
            {origenProducto.nombre}
          </span>
          <ArrowRight
            size={16}
            weight="bold"
            className="shrink-0 text-purple-500"
          />
          <span className="truncate font-medium text-purple-700">
            {destinoProducto.nombre}
          </span>
        </div>
      )}

      {/* Origen */}
      <fieldset className="space-y-2">
        <Label>Producto origen</Label>
        <Select
          value={origenId}
          onValueChange={(v) => {
            setOrigenId(v)
            if (v === destinoId) setDestinoId('')
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona producto origen" />
          </SelectTrigger>
          <SelectContent>
            {productosOrigen.map((p) => {
              const s = stock.find((item) => item.producto_id === p.id)
              return (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.nombre} — {p.presentacion} ({s?.cantidad_disponible ?? 0}{' '}
                  uds)
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
        {stockOrigen && (
          <p className="text-xs text-muted-foreground">
            Stock disponible: {stockOrigen.cantidad_disponible} uds
          </p>
        )}
      </fieldset>

      <fieldset className="space-y-2">
        <Label>Cantidad a reprocesar</Label>
        <Input
          type="number"
          min={1}
          step={1}
          max={stockOrigen?.cantidad_disponible}
          placeholder="Ej: 10"
          value={cantidadOrigen}
          onChange={(e) => setCantidadOrigen(e.target.value)}
        />
        {excedido && (
          <p className="flex items-center gap-1 text-xs text-destructive">
            <Warning size={14} weight="fill" />
            Excede el stock disponible ({stockOrigen?.cantidad_disponible})
          </p>
        )}
      </fieldset>

      {/* Destino */}
      <fieldset className="space-y-2">
        <Label>Producto destino</Label>
        <Select value={destinoId} onValueChange={setDestinoId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona producto destino" />
          </SelectTrigger>
          <SelectContent>
            {productosDestino.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.nombre} — {p.presentacion}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </fieldset>

      <fieldset className="space-y-2">
        <Label>Cantidad producida</Label>
        <Input
          type="number"
          min={1}
          step={1}
          placeholder="Ej: 8"
          value={cantidadDestino}
          onChange={(e) => setCantidadDestino(e.target.value)}
        />
        {destinoExcedido && (
          <p className="flex items-center gap-1 text-xs text-destructive">
            <Warning size={14} weight="fill" />
            No puede ser mayor que la cantidad origen
          </p>
        )}
        {cantOrigen > 0 &&
          cantDestino > 0 &&
          !destinoExcedido &&
          cantDestino < cantOrigen && (
            <p className="text-xs text-muted-foreground">
              Merma de proceso: {cantOrigen - cantDestino} uds
            </p>
          )}
      </fieldset>

      <fieldset className="space-y-2">
        <Label>Notas (opcional)</Label>
        <Textarea
          placeholder="Ej: Dátil retornado de Ortega House, limpiado y procesado en pulpa"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={2}
        />
      </fieldset>

      <Button
        type="submit"
        className="w-full"
        disabled={isPending || excedido || destinoExcedido}
      >
        {isPending ? 'Procesando...' : 'Registrar reprocesamiento'}
      </Button>
    </form>
  )
}
