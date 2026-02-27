'use client'

import { useState, useTransition, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, PencilSimple, FilePdf, Trash, Warning, UploadSimple, ImageSquare, X, DotsSixVertical, Star, Images, Flask } from '@phosphor-icons/react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  crearProducto,
  actualizarProducto,
  agregarIngredienteReceta,
  eliminarIngredienteReceta,
  agregarImagenProducto,
  eliminarImagenProducto,
  reordenarImagenesProducto,
  obtenerImagenesProducto,
} from '../actions'
import type { Producto, ProductoImagen, RecetaIngrediente, UnidadMedida } from '@/lib/types/database'

type ProductoConCategoria = Producto & {
  categorias_producto: { nombre: string } | null
}
type CategoriaOption = { id: number; nombre: string }
type CostoRow = { producto_id: number; costo_materia_prima: number; margen_porcentaje: number }
type MPOption = { id: number; nombre: string; unidad_medida: string; costo_unitario_actual: number | null }
type RecetaConMP = RecetaIngrediente & {
  materias_primas: { nombre: string; costo_unitario_actual: number | null } | null
}

// Local ingredient for wizard step 2 (before page refresh)
type IngredienteLocal = {
  id: number
  materia_prima_id: number
  mp_nombre: string
  cantidad_necesaria: number
  unidad_medida: UnidadMedida
  costo_unitario: number
}

const unidadLabels: Record<UnidadMedida, string> = {
  KG: 'kg', G: 'g', UNIDAD: 'uds', LITRO: 'L', ML: 'ml',
}

function formatMoney(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
}

function margenBadge(pct: number) {
  if (pct >= 50) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
  if (pct >= 30) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400'
  return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
}

// ────────────────────────────────────────────────────────────────
// Main view
// ────────────────────────────────────────────────────────────────

export function ProductosView({
  productos,
  categorias,
  costos,
  materiasPrimas,
  recetas,
  productosConRecetaIds,
  imageCountMap = {},
}: {
  productos: ProductoConCategoria[]
  categorias: CategoriaOption[]
  costos: CostoRow[]
  materiasPrimas: MPOption[]
  recetas: RecetaConMP[]
  productosConRecetaIds: number[]
  imageCountMap?: Record<number, number>
}) {
  const costosMap = new Map(costos.map((c) => [c.producto_id, c]))
  const recetaIds = new Set(productosConRecetaIds)

  // Group by category
  const groups = new Map<string, ProductoConCategoria[]>()
  for (const p of productos) {
    const cat = p.categorias_producto?.nombre ?? 'Sin categoría'
    if (!groups.has(cat)) groups.set(cat, [])
    groups.get(cat)!.push(p)
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <DescargarBomButton />
        <CrearProductoWizard categorias={categorias} materiasPrimas={materiasPrimas} />
      </div>

      {productos.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No hay productos registrados.
        </p>
      ) : (
        <div className="space-y-6">
          {Array.from(groups.entries()).map(([cat, prods]) => (
            <div key={cat}>
              <h2 className="mb-2 text-sm font-medium text-muted-foreground">{cat}</h2>
              <div className="space-y-2">
                {prods.map((p) => {
                  const costo = costosMap.get(p.id)
                  const tieneReceta = recetaIds.has(p.id)
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-medium">{p.nombre}</p>
                          {p.es_snack && (
                            <Badge className="bg-orange-100 text-orange-700 text-[11px] dark:bg-orange-950 dark:text-orange-400">Snack</Badge>
                          )}
                          {!p.activo && (
                            <Badge className="bg-gray-100 text-gray-500 text-[11px]">Inactivo</Badge>
                          )}
                          {costo ? (
                            <Badge className={`text-[11px] ${margenBadge(costo.margen_porcentaje)}`}>
                              {Math.round(costo.margen_porcentaje)}%
                            </Badge>
                          ) : !tieneReceta ? (
                            <Badge className="bg-amber-100 text-amber-700 text-[11px] dark:bg-amber-950 dark:text-amber-400">
                              Sin receta
                            </Badge>
                          ) : null}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                          <span>{p.presentacion} · {p.peso_gramos}g</span>
                          {p.sku && <span>SKU: {p.sku}</span>}
                          {costo && <span>Costo: {formatMoney(costo.costo_materia_prima)}</span>}
                          {/* Image indicator */}
                          {(imageCountMap[p.id] ?? 0) > 0 ? (
                            <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400" title={`${imageCountMap[p.id]} imagen(es)`}>
                              <Images size={13} weight="duotone" />
                              <span className="tabular-nums">{imageCountMap[p.id]}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-amber-500 dark:text-amber-400" title="Sin imágenes">
                              <ImageSquare size={13} />
                              <span>0</span>
                            </span>
                          )}
                          {/* Recipe indicator */}
                          {tieneReceta ? (
                            <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400" title="Receta configurada">
                              <Flask size={13} weight="duotone" />
                              <span>Receta</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-amber-500 dark:text-amber-400" title="Sin receta / materias primas">
                              <Flask size={13} />
                              <span>Sin MP</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <div className="text-right mr-1">
                          <p className="text-sm font-semibold">{formatMoney(p.precio_venta)}</p>
                          {p.precio_mayoreo && (
                            <p className="text-xs text-muted-foreground">
                              May. {formatMoney(p.precio_mayoreo)}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/api/bom-pdf?producto_id=${p.id}`, '_blank')}
                          title="Descargar BoM"
                        >
                          <FilePdf size={16} />
                        </Button>
                        <EditarProductoDialog
                          producto={p}
                          materiasPrimas={materiasPrimas}
                          receta={recetas.filter((r) => r.producto_id === p.id)}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// Wizard: 2-step create product
// ────────────────────────────────────────────────────────────────

function CrearProductoWizard({
  categorias,
  materiasPrimas,
}: {
  categorias: CategoriaOption[]
  materiasPrimas: MPOption[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'datos' | 'receta'>('datos')
  const [productoId, setProductoId] = useState<number | null>(null)
  const [productoNombre, setProductoNombre] = useState('')
  const [productoPrecio, setProductoPrecio] = useState(0)
  const [ingredientes, setIngredientes] = useState<IngredienteLocal[]>([])

  // Step 1 fields
  const [categoriaId, setCategoriaId] = useState('')
  const [nombre, setNombre] = useState('')
  const [presentacion, setPresentacion] = useState('')
  const [pesoGramos, setPesoGramos] = useState('')
  const [precioVenta, setPrecioVenta] = useState('')
  const [precioMayoreo, setPrecioMayoreo] = useState('')
  const [sku, setSku] = useState('')
  const [esSnack, setEsSnack] = useState(false)
  const [imagenFile, setImagenFile] = useState<File | null>(null)
  const [imagenPreview, setImagenPreview] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function resetAll() {
    setStep('datos')
    setProductoId(null)
    setProductoNombre('')
    setProductoPrecio(0)
    setIngredientes([])
    setCategoriaId('')
    setNombre('')
    setPresentacion('')
    setPesoGramos('')
    setPrecioVenta('')
    setPrecioMayoreo('')
    setSku('')
    setEsSnack(false)
    setImagenFile(null)
    setImagenPreview(null)
  }

  function handleOpenChange(v: boolean) {
    setOpen(v)
    if (!v) {
      // Closing: refresh if we created something
      if (productoId) router.refresh()
      resetAll()
    }
  }

  // Step 1: create product
  function handleCrear(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      // Upload image if selected
      let imagenUrl: string | null = null
      if (imagenFile) {
        try {
          const res = await fetch(
            `/api/upload?folder=productos&sku=${encodeURIComponent(sku.trim() || nombre.trim())}&filename=${encodeURIComponent(imagenFile.name)}`,
            { method: 'POST', body: imagenFile, headers: { 'Content-Type': imagenFile.type } }
          )
          if (res.ok) {
            const data = await res.json()
            imagenUrl = data.url
          }
        } catch { /* continue without image */ }
      }

      const result = await crearProducto({
        categoria_id: Number(categoriaId),
        nombre: nombre.trim(),
        presentacion: presentacion as 'bolsa' | 'charolita' | 'caja',
        peso_gramos: Number(pesoGramos),
        precio_venta: Number(precioVenta),
        precio_mayoreo: precioMayoreo ? Number(precioMayoreo) : null,
        sku: sku.trim() || null,
        es_snack: esSnack,
        imagen_url: imagenUrl,
      })
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('Producto creado')
      setProductoId(result.id!)
      setProductoNombre(nombre.trim())
      setProductoPrecio(Number(precioVenta))
      setStep('receta')
    })
  }

  // Step 2: add ingredient
  function handleIngredienteAdded(ing: IngredienteLocal) {
    setIngredientes((prev) => [...prev, ing])
  }

  function handleIngredienteRemoved(id: number) {
    setIngredientes((prev) => prev.filter((i) => i.id !== id))
  }

  function handleFinalizar() {
    toast.success('Producto listo con receta')
    handleOpenChange(false)
  }

  function handleAgregarDespues() {
    toast('Producto creado sin receta', {
      description: 'La producción no descontará materia prima.',
    })
    handleOpenChange(false)
  }

  // Cost calculation
  const costoTotal = ingredientes.reduce(
    (sum, i) => sum + i.cantidad_necesaria * i.costo_unitario, 0
  )
  const margen = productoPrecio - costoTotal
  const margenPct = productoPrecio > 0 ? (margen / productoPrecio) * 100 : 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus size={16} weight="bold" />
          Agregar producto
        </Button>
      </DialogTrigger>
      <DialogContent fullScreenMobile className="flex flex-col overflow-hidden sm:max-h-[85dvh]">
        <DialogHeader>
          <DialogTitle>
            {step === 'datos' ? 'Nuevo producto' : 'Receta'}
          </DialogTitle>
          <DialogDescription>
            {step === 'datos'
              ? 'Paso 1 de 2 — Datos del producto'
              : `Paso 2 de 2 — Ingredientes de "${productoNombre}"`}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex gap-1.5">
          <div className={`h-1 flex-1 rounded-full ${step === 'datos' ? 'bg-primary' : 'bg-primary'}`} />
          <div className={`h-1 flex-1 rounded-full ${step === 'receta' ? 'bg-primary' : 'bg-muted'}`} />
        </div>

        <div className="flex-1 overflow-y-auto">
          {step === 'datos' ? (
            <form onSubmit={handleCrear} className="space-y-4">
              <fieldset className="space-y-2">
                <Label>Categoría *</Label>
                <Select value={categoriaId} onValueChange={setCategoriaId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </fieldset>

              <fieldset className="space-y-2">
                <Label>Nombre *</Label>
                <Input placeholder="Ej: Dátil Natural Bolsa 1kg" value={nombre} onChange={(e) => setNombre(e.target.value)} />
              </fieldset>

              <div className="grid grid-cols-2 gap-3">
                <fieldset className="space-y-2">
                  <Label>Presentación *</Label>
                  <Select value={presentacion} onValueChange={setPresentacion}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bolsa">Bolsa</SelectItem>
                      <SelectItem value="charolita">Charolita</SelectItem>
                      <SelectItem value="caja">Caja</SelectItem>
                    </SelectContent>
                  </Select>
                </fieldset>
                <fieldset className="space-y-2">
                  <Label>Peso (gramos) *</Label>
                  <Input type="number" inputMode="numeric" min={1} placeholder="200" value={pesoGramos} onChange={(e) => setPesoGramos(e.target.value)} />
                </fieldset>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <fieldset className="space-y-2">
                  <Label>Precio venta *</Label>
                  <Input type="number" inputMode="decimal" min={0} step="0.01" placeholder="60.00" value={precioVenta} onChange={(e) => setPrecioVenta(e.target.value)} />
                </fieldset>
                <fieldset className="space-y-2">
                  <Label>Precio mayoreo</Label>
                  <Input type="number" inputMode="decimal" min={0} step="0.01" placeholder="Opcional" value={precioMayoreo} onChange={(e) => setPrecioMayoreo(e.target.value)} />
                </fieldset>
              </div>

              <fieldset className="space-y-2">
                <Label>SKU (opcional)</Label>
                <Input placeholder="DN-B-200" value={sku} onChange={(e) => setSku(e.target.value)} />
              </fieldset>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={esSnack} onChange={(e) => setEsSnack(e.target.checked)} className="h-4 w-4 rounded border-input" />
                Es snack (display pequeño)
              </label>

              <ImageUploadField
                preview={imagenPreview}
                onSelect={(file, preview) => { setImagenFile(file); setImagenPreview(preview) }}
                onClear={() => { setImagenFile(null); setImagenPreview(null) }}
              />

              <Button type="submit" className="h-10 w-full" disabled={isPending}>
                {isPending ? 'Creando...' : 'Siguiente'}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Ingredient list */}
              {ingredientes.length === 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
                  <Warning size={16} weight="bold" className="mt-0.5 shrink-0 text-amber-600" />
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    Sin receta, la producción no descontará materia prima automáticamente.
                  </p>
                </div>
              )}

              {ingredientes.length > 0 && (
                <div className="space-y-1">
                  {ingredientes.map((ing) => {
                    const costo = ing.cantidad_necesaria * ing.costo_unitario
                    return (
                      <div key={ing.id} className="flex items-center justify-between rounded border border-border bg-card px-2.5 py-1.5">
                        <div className="min-w-0 flex-1">
                          <span className="text-sm">{ing.mp_nombre}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {ing.cantidad_necesaria} {unidadLabels[ing.unidad_medida]} = {formatMoney(costo)}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
                          onClick={() => {
                            startTransition(async () => {
                              const result = await eliminarIngredienteReceta(ing.id)
                              if (result.error) { toast.error(result.error); return }
                              handleIngredienteRemoved(ing.id)
                            })
                          }}
                          disabled={isPending}
                        >
                          <Trash size={14} />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Cost summary */}
              {ingredientes.length > 0 && (
                <div className="rounded-lg border border-border bg-muted/50 p-3">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <span>Costo MP: <strong>{formatMoney(costoTotal)}</strong></span>
                    <span>Margen: <strong>{formatMoney(margen)}</strong></span>
                    <Badge className={`text-[11px] ${margenBadge(margenPct)}`}>
                      {Math.round(margenPct)}%
                    </Badge>
                  </div>
                </div>
              )}

              {/* Add ingredient form */}
              <AgregarIngredienteInline
                productoId={productoId!}
                materiasPrimas={materiasPrimas}
                usedMPIds={new Set(ingredientes.map((i) => i.materia_prima_id))}
                onAdded={handleIngredienteAdded}
              />

              <Separator />

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button className="h-10 flex-1" onClick={handleFinalizar} disabled={ingredientes.length === 0}>
                  Finalizar
                </Button>
                <Button variant="outline" className="h-10" onClick={handleAgregarDespues}>
                  Agregar después
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ────────────────────────────────────────────────────────────────
// Inline ingredient add form (used in wizard step 2)
// ────────────────────────────────────────────────────────────────

function AgregarIngredienteInline({
  productoId,
  materiasPrimas,
  usedMPIds,
  onAdded,
}: {
  productoId: number
  materiasPrimas: MPOption[]
  usedMPIds: Set<number>
  onAdded: (ing: IngredienteLocal) => void
}) {
  const [mpId, setMpId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [unidad, setUnidad] = useState<UnidadMedida>('KG')
  const [isPending, startTransition] = useTransition()

  const availableMPs = materiasPrimas.filter((mp) => !usedMPIds.has(mp.id))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!mpId || !cantidad) return

    const mp = materiasPrimas.find((m) => m.id === Number(mpId))
    if (!mp) return

    startTransition(async () => {
      const result = await agregarIngredienteReceta({
        producto_id: productoId,
        materia_prima_id: Number(mpId),
        cantidad_necesaria: Number(cantidad),
        unidad_medida: unidad,
        notas: null,
      })
      if (result.error) { toast.error(result.error); return }

      // Add to local state (use a temp ID — will be real after refresh)
      onAdded({
        id: Date.now(),
        materia_prima_id: mp.id,
        mp_nombre: mp.nombre,
        cantidad_necesaria: Number(cantidad),
        unidad_medida: unidad,
        costo_unitario: mp.costo_unitario_actual ?? 0,
      })
      setMpId('')
      setCantidad('')
      toast.success('Ingrediente agregado')
    })
  }

  if (availableMPs.length === 0) return null

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-[1fr_80px_90px_auto] items-end gap-2">
      <fieldset className="space-y-1">
        <Label className="text-xs">Materia prima</Label>
        <Select value={mpId} onValueChange={setMpId}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Selecciona" /></SelectTrigger>
          <SelectContent>
            {availableMPs.map((mp) => (
              <SelectItem key={mp.id} value={String(mp.id)}>
                {mp.nombre} ({mp.unidad_medida})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </fieldset>
      <fieldset className="space-y-1">
        <Label className="text-xs">Cantidad</Label>
        <Input type="number" inputMode="decimal" min={0.001} step="0.001" placeholder="0.500" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
      </fieldset>
      <fieldset className="space-y-1">
        <Label className="text-xs">Unidad</Label>
        <Select value={unidad} onValueChange={(v) => setUnidad(v as UnidadMedida)}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="KG">kg</SelectItem>
            <SelectItem value="G">g</SelectItem>
            <SelectItem value="LITRO">L</SelectItem>
            <SelectItem value="ML">ml</SelectItem>
            <SelectItem value="UNIDAD">uds</SelectItem>
          </SelectContent>
        </Select>
      </fieldset>
      <Button type="submit" size="sm" className="h-9" disabled={isPending || !mpId || !cantidad}>
        <Plus size={14} weight="bold" />
      </Button>
    </form>
  )
}

// ────────────────────────────────────────────────────────────────
// Edit product dialog (with recipe section)
// ────────────────────────────────────────────────────────────────

function EditarProductoDialog({
  producto,
  materiasPrimas,
  receta,
}: {
  producto: ProductoConCategoria
  materiasPrimas: MPOption[]
  receta: RecetaConMP[]
}) {
  const [open, setOpen] = useState(false)
  const [precioVenta, setPrecioVenta] = useState(String(producto.precio_venta))
  const [precioMayoreo, setPrecioMayoreo] = useState(producto.precio_mayoreo ? String(producto.precio_mayoreo) : '')
  const [activo, setActivo] = useState(producto.activo)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await actualizarProducto({
        id: producto.id,
        precio_venta: Number(precioVenta),
        precio_mayoreo: precioMayoreo ? Number(precioMayoreo) : null,
        activo,
        imagen_url: producto.imagen_url, // preserved — gallery manages this via syncPortada
      })
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('Producto actualizado')
      setOpen(false)
    })
  }

  // Calculate recipe cost
  const costoReceta = receta.reduce((sum, r) => {
    const costoUnit = r.materias_primas?.costo_unitario_actual ?? 0
    return sum + r.cantidad_necesaria * costoUnit
  }, 0)
  const margen = Number(precioVenta) - costoReceta
  const margenPct = Number(precioVenta) > 0 ? (margen / Number(precioVenta)) * 100 : 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <PencilSimple size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent fullScreenMobile className="flex flex-col overflow-hidden sm:max-h-[85dvh]">
        <DialogHeader>
          <DialogTitle>Editar producto</DialogTitle>
          <DialogDescription>{producto.nombre} — {producto.presentacion}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <fieldset className="space-y-2">
                <Label>Precio venta</Label>
                <Input type="number" inputMode="decimal" min={0} step="0.01" value={precioVenta} onChange={(e) => setPrecioVenta(e.target.value)} />
              </fieldset>
              <fieldset className="space-y-2">
                <Label>Precio mayoreo</Label>
                <Input type="number" inputMode="decimal" min={0} step="0.01" placeholder="Opcional" value={precioMayoreo} onChange={(e) => setPrecioMayoreo(e.target.value)} />
              </fieldset>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} className="h-4 w-4 rounded border-input" />
              Producto activo
            </label>

            <Button type="submit" className="h-10 w-full" disabled={isPending}>
              {isPending ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </form>

          <Separator className="my-4" />

          {/* Image gallery manager */}
          <GaleriaImagenes
            productoId={producto.id}
            productoSku={producto.sku || producto.nombre}
            dialogOpen={open}
          />

          <Separator className="my-4" />

          {/* Recipe section */}
          <RecetaSection
            productoId={producto.id}
            receta={receta}
            materiasPrimas={materiasPrimas}
          />

          {/* Cost summary */}
          {receta.length > 0 && (
            <div className="mt-3 rounded-lg border border-border bg-muted/50 p-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span>Costo MP: <strong>{formatMoney(costoReceta)}</strong></span>
                <span>Margen: <strong>{formatMoney(margen)}</strong></span>
                <Badge className={`text-[11px] ${margenBadge(margenPct)}`}>
                  {Math.round(margenPct)}%
                </Badge>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ────────────────────────────────────────────────────────────────
// Image gallery manager (used in edit dialog) — @dnd-kit sortable
// ────────────────────────────────────────────────────────────────

import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  type DragMoveEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type GaleriaImg = { id: number; imagen_url: string; posicion: number }

// Sigmoid: maps any value to (-1, 1) — used for natural drag rotation
const sigmoid = (x: number) => x / (1 + Math.abs(x))

function GaleriaImagenes({
  productoId,
  productoSku,
  dialogOpen,
}: {
  productoId: number
  productoSku: string
  dialogOpen: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [imagenes, setImagenes] = useState<GaleriaImg[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [activeId, setActiveId] = useState<number | null>(null)

  // ── Delete confirmation state ──
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  const [skipConfirm, setSkipConfirm] = useState(false)

  // ── Sigmoid rotation state ──
  const overlayRef = useRef<HTMLDivElement>(null)
  const rotationRef = useRef(0)
  const xVelocityRef = useRef(0)
  const rafRef = useRef<number>(0)
  const isDraggingRef = useRef(false)

  // rAF loop: accumulate rotation with damping, apply to overlay
  const animateRotation = useCallback(() => {
    if (!isDraggingRef.current && Math.abs(rotationRef.current) < 0.01) {
      rotationRef.current = 0
      if (overlayRef.current) overlayRef.current.style.transform = 'scale(1.05) rotate(0deg)'
      return // stop loop
    }
    // rotation = rotation * damping + sigmoid(velocity) * sensitivity
    rotationRef.current =
      rotationRef.current * 0.85 + sigmoid(xVelocityRef.current) * 3
    // clamp to ±25 degrees
    rotationRef.current = Math.max(-25, Math.min(25, rotationRef.current))
    if (overlayRef.current) {
      overlayRef.current.style.transform = `scale(1.05) rotate(${rotationRef.current.toFixed(2)}deg)`
    }
    // decay velocity when not moving
    xVelocityRef.current *= 0.9
    rafRef.current = requestAnimationFrame(animateRotation)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  )

  // Load images when dialog opens
  const loadImagenes = useCallback(async () => {
    setLoading(true)
    const result = await obtenerImagenesProducto(productoId)
    setImagenes(result.imagenes as GaleriaImg[])
    setLoading(false)
  }, [productoId])

  useEffect(() => {
    if (dialogOpen) loadImagenes()
  }, [dialogOpen, loadImagenes])

  // Upload new image
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) { toast.error('Solo JPG, PNG o WebP'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Máximo 5 MB'); return }

    setUploading(true)
    try {
      const res = await fetch(
        `/api/upload?folder=productos&sku=${encodeURIComponent(productoSku)}&filename=${encodeURIComponent(file.name)}`,
        { method: 'POST', body: file, headers: { 'Content-Type': file.type } }
      )
      if (!res.ok) { toast.error('Error subiendo imagen'); return }
      const data = await res.json()

      const result = await agregarImagenProducto({
        producto_id: productoId,
        imagen_url: data.url,
      })
      if (result.error) { toast.error(result.error); return }

      toast.success('Imagen agregada')
      await loadImagenes()
    } catch {
      toast.error('Error de conexión')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  // Delete image
  function handleDelete(imgId: number) {
    startTransition(async () => {
      const result = await eliminarImagenProducto({ id: imgId })
      if (result.error) { toast.error(result.error); return }
      toast.success('Imagen eliminada')
      setImagenes((prev) => prev.filter((i) => i.id !== imgId))
    })
  }

  // Request delete (with or without confirmation)
  function requestDelete(imgId: number) {
    if (skipConfirm) {
      handleDelete(imgId)
    } else {
      setDeleteTarget(imgId)
    }
  }

  function confirmDelete() {
    if (deleteTarget !== null) {
      handleDelete(deleteTarget)
      setDeleteTarget(null)
    }
  }

  // DnD handlers
  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as number)
    isDraggingRef.current = true
    rotationRef.current = 0
    xVelocityRef.current = 0
    rafRef.current = requestAnimationFrame(animateRotation)
  }

  function handleDragMove(event: DragMoveEvent) {
    // delta.x is the change since last move event — perfect for velocity
    xVelocityRef.current = event.delta.x
  }

  function handleDragEnd(event: DragEndEvent) {
    isDraggingRef.current = false
    xVelocityRef.current = 0
    // let the rAF loop dampen rotation to 0 naturally
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIdx = imagenes.findIndex((i) => i.id === active.id)
    const newIdx = imagenes.findIndex((i) => i.id === over.id)
    if (oldIdx === -1 || newIdx === -1) return

    const newOrder = arrayMove(imagenes, oldIdx, newIdx)
    setImagenes(newOrder)

    startTransition(async () => {
      const result = await reordenarImagenesProducto({
        producto_id: productoId,
        imagen_ids: newOrder.map((i) => i.id),
      })
      if (result.error) toast.error(result.error)
      else toast.success('Orden actualizado')
    })
  }

  // Move to front (make cover)
  function handleMakePortada(imgId: number) {
    const idx = imagenes.findIndex((i) => i.id === imgId)
    if (idx <= 0) return
    const newOrder = [...imagenes]
    const [moved] = newOrder.splice(idx, 1)
    newOrder.unshift(moved)
    setImagenes(newOrder)

    startTransition(async () => {
      const result = await reordenarImagenesProducto({
        producto_id: productoId,
        imagen_ids: newOrder.map((i) => i.id),
      })
      if (result.error) toast.error(result.error)
      else toast.success('Portada actualizada')
    })
  }

  const activeImg = activeId ? imagenes.find((i) => i.id === activeId) : null

  return (
    <div>
      <h3 className="mb-2 text-sm font-medium">Galería de imágenes</h3>

      {loading ? (
        <p className="py-4 text-center text-xs text-muted-foreground">Cargando imágenes…</p>
      ) : imagenes.length === 0 ? (
        <p className="mb-2 text-xs text-muted-foreground">Sin imágenes. Agrega fotos del producto.</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={imagenes.map((i) => i.id)} strategy={rectSortingStrategy}>
            <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {imagenes.map((img, idx) => (
                <SortableImageTile
                  key={img.id}
                  img={img}
                  idx={idx}
                  isActive={activeId === img.id}
                  isPending={isPending}
                  onDelete={requestDelete}
                  onMakePortada={handleMakePortada}
                />
              ))}
            </div>
          </SortableContext>

          {/* Drag overlay — portal to body to escape Dialog's transform containing block */}
          {typeof document !== 'undefined' && createPortal(
            <DragOverlay dropAnimation={{
              duration: 300,
              easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
            }}>
              {activeImg && (
                <div
                  ref={overlayRef}
                  className="rounded-lg border-2 border-primary shadow-2xl"
                  style={{ transform: 'scale(1.05) rotate(0deg)', transformOrigin: 'center center' }}
                >
                  <img
                    src={activeImg.imagen_url}
                    alt="Arrastrando"
                    className="aspect-square w-24 rounded-lg object-cover"
                  />
                </div>
              )}
            </DragOverlay>,
            document.body
          )}
        </DndContext>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar imagen?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La imagen será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={skipConfirm}
              onChange={(e) => setSkipConfirm(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            No volver a preguntar
          </label>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upload button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? (
          'Subiendo…'
        ) : (
          <>
            <UploadSimple size={14} weight="bold" />
            Agregar imagen
          </>
        )}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  )
}

/* ── Sortable tile for each image ── */
function SortableImageTile({
  img,
  idx,
  isActive,
  isPending,
  onDelete,
  onMakePortada,
}: {
  img: GaleriaImg
  idx: number
  isActive: boolean
  isPending: boolean
  onDelete: (id: number) => void
  onMakePortada: (id: number) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: img.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? 'transform 250ms cubic-bezier(0.25, 1, 0.5, 1)',
    willChange: isDragging ? 'transform' : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative rounded-lg border-2 transition-colors ${
        isDragging
          ? 'z-10 border-dashed border-primary/40 bg-muted'
          : idx === 0
            ? 'border-primary/50'
            : 'border-border hover:border-primary/30'
      }`}
    >
      {/* When dragging, show empty placeholder slot */}
      {isDragging ? (
        <div className="aspect-square w-full" />
      ) : (
        <>
          {/* Drag handle: the image itself */}
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none overflow-hidden rounded-md">
            <img
              src={img.imagen_url}
              alt={`Imagen ${idx + 1}`}
              className="aspect-square w-full object-cover select-none"
              draggable={false}
            />
          </div>

          {/* Cover badge */}
          {idx === 0 && (
            <div className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[9px] font-medium text-primary-foreground shadow">
              Portada
            </div>
          )}

          {/* Drag hint at bottom */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center py-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <DotsSixVertical size={16} weight="bold" color="#ffffff" />
          </div>

          {/* Delete X button — top right corner */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(img.id) }}
            className="absolute -right-2 -top-2 z-20 flex h-5 w-5 items-center justify-center rounded-full border border-white shadow"
            style={{ backgroundColor: '#000' }}
            title="Eliminar"
            disabled={isPending}
          >
            <X size={10} weight="bold" color="#ffffff" />
          </button>
        </>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// Recipe section (used in edit dialog)
// ────────────────────────────────────────────────────────────────

function RecetaSection({
  productoId,
  receta,
  materiasPrimas,
}: {
  productoId: number
  receta: RecetaConMP[]
  materiasPrimas: MPOption[]
}) {
  const [adding, setAdding] = useState(false)
  const [mpId, setMpId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [unidad, setUnidad] = useState<UnidadMedida>('KG')
  const [isPending, startTransition] = useTransition()

  const usedMPIds = new Set(receta.map((r) => r.materia_prima_id))
  const availableMPs = materiasPrimas.filter((mp) => !usedMPIds.has(mp.id))

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await agregarIngredienteReceta({
        producto_id: productoId,
        materia_prima_id: Number(mpId),
        cantidad_necesaria: Number(cantidad),
        unidad_medida: unidad,
        notas: null,
      })
      if (result.error) { toast.error(result.error); return }
      toast.success('Ingrediente agregado')
      setAdding(false)
      setMpId('')
      setCantidad('')
    })
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      const result = await eliminarIngredienteReceta(id)
      if (result.error) { toast.error(result.error); return }
      toast.success('Ingrediente eliminado')
    })
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-medium">Receta / Ingredientes</h3>

      {receta.length === 0 && !adding && (
        <p className="mb-2 text-xs text-muted-foreground">Sin ingredientes. Agrega materias primas para calcular costo.</p>
      )}

      {receta.length > 0 && (
        <div className="mb-2 space-y-1">
          {receta.map((r) => {
            const costo = r.cantidad_necesaria * (r.materias_primas?.costo_unitario_actual ?? 0)
            return (
              <div key={r.id} className="flex items-center justify-between rounded border border-border bg-card px-2.5 py-1.5">
                <div className="min-w-0 flex-1">
                  <span className="text-sm">{r.materias_primas?.nombre ?? `MP #${r.materia_prima_id}`}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {r.cantidad_necesaria} {unidadLabels[r.unidad_medida]} = {formatMoney(costo)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
                  onClick={() => handleDelete(r.id)}
                  disabled={isPending}
                >
                  <Trash size={14} />
                </Button>
              </div>
            )
          })}
        </div>
      )}

      {adding ? (
        <form onSubmit={handleAdd} className="space-y-3 rounded-lg border border-dashed border-border p-3">
          <fieldset className="space-y-1">
            <Label className="text-xs">Materia prima</Label>
            <Select value={mpId} onValueChange={setMpId}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Selecciona" /></SelectTrigger>
              <SelectContent>
                {availableMPs.map((mp) => (
                  <SelectItem key={mp.id} value={String(mp.id)}>
                    {mp.nombre} ({mp.unidad_medida})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </fieldset>
          <div className="grid grid-cols-2 gap-2">
            <fieldset className="space-y-1">
              <Label className="text-xs">Cantidad</Label>
              <Input type="number" inputMode="decimal" min={0.001} step="0.001" placeholder="0.500" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
            </fieldset>
            <fieldset className="space-y-1">
              <Label className="text-xs">Unidad</Label>
              <Select value={unidad} onValueChange={(v) => setUnidad(v as UnidadMedida)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="KG">Kilogramos</SelectItem>
                  <SelectItem value="G">Gramos</SelectItem>
                  <SelectItem value="LITRO">Litros</SelectItem>
                  <SelectItem value="ML">Mililitros</SelectItem>
                  <SelectItem value="UNIDAD">Unidades</SelectItem>
                </SelectContent>
              </Select>
            </fieldset>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" className="h-8" disabled={isPending}>
              {isPending ? 'Guardando...' : 'Agregar'}
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => setAdding(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <>
          {materiasPrimas.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No hay materias primas registradas.{' '}
              <Link href="/materias-primas" className="underline text-primary hover:text-primary/80">
                Crea una primero
              </Link>.
            </p>
          ) : availableMPs.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Todas las materias primas ya están en la receta.
            </p>
          ) : (
            <Button variant="outline" size="sm" className="h-8" onClick={() => setAdding(true)}>
              <Plus size={14} weight="bold" />
              Agregar ingrediente
            </Button>
          )}
        </>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// Reusable image upload field
// ────────────────────────────────────────────────────────────────

function ImageUploadField({
  preview,
  onSelect,
  onClear,
}: {
  preview: string | null
  onSelect: (file: File, previewUrl: string) => void
  onClear: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      toast.error('Solo JPG, PNG o WebP')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Máximo 5 MB')
      return
    }
    const url = URL.createObjectURL(file)
    onSelect(file, url)
  }

  return (
    <fieldset className="space-y-2">
      <Label className="text-xs font-medium">Imagen del producto</Label>
      {preview ? (
        <div className="relative inline-block">
          <Image
            src={preview}
            alt="Preview"
            width={120}
            height={120}
            className="rounded-lg border border-border object-cover"
            style={{ width: 120, height: 120 }}
            unoptimized={preview.startsWith('blob:')}
          />
          <button
            type="button"
            onClick={() => {
              onClear()
              if (inputRef.current) inputRef.current.value = ''
            }}
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white shadow"
          >
            <X size={10} weight="bold" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border px-4 py-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/50"
        >
          <ImageSquare size={24} className="mb-1 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Click para subir imagen</p>
          <p className="text-[10px] text-muted-foreground/60">JPG, PNG, WebP · Máx. 5 MB</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
      />
    </fieldset>
  )
}

// ────────────────────────────────────────────────────────────────
// BOM PDF download button
// ────────────────────────────────────────────────────────────────

function DescargarBomButton() {
  const [isPending, startTransition] = useTransition()

  function handleDownload() {
    startTransition(async () => {
      try {
        const res = await fetch('/api/bom-pdf')
        if (!res.ok) {
          const err = await res.json()
          toast.error(err.error || 'Error descargando PDF')
          return
        }
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download =
          res.headers
            .get('Content-Disposition')
            ?.split('filename="')[1]
            ?.replace('"', '') || 'BOM.pdf'
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
        toast.success('PDF descargado')
      } catch {
        toast.error('Error de conexión')
      }
    })
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDownload} disabled={isPending}>
      <FilePdf size={16} weight="bold" />
      {isPending ? 'Generando...' : 'Descargar BoM'}
    </Button>
  )
}
