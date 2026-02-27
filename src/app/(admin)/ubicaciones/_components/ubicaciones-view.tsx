'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, PencilSimple } from '@phosphor-icons/react'
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
import { Badge } from '@/components/ui/badge'
import { crearUbicacion, actualizarUbicacion, toggleUbicacion } from '../actions'
import type { ZonaUbicacion } from '@/lib/types/database'

type UbicacionRow = {
  id: number
  nombre: string
  direccion: string | null
  ciudad: string | null
  zona: ZonaUbicacion | null
  activo: boolean
  notas: string | null
}

const zonaConfig: Record<string, { label: string; color: string }> = {
  TURISTICA: { label: 'Turística', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' },
  POPULAR: { label: 'Popular', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' },
  COMERCIAL: { label: 'Comercial', color: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400' },
}

// ────────────────────────────────────────────────────────────────

export function UbicacionesView({ ubicaciones }: { ubicaciones: UbicacionRow[] }) {
  const activas = ubicaciones.filter((u) => u.activo)
  const inactivas = ubicaciones.filter((u) => !u.activo)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {activas.length} activa{activas.length !== 1 ? 's' : ''}
          {inactivas.length > 0 && `, ${inactivas.length} inactiva${inactivas.length !== 1 ? 's' : ''}`}
        </p>
        <UbicacionDialog />
      </div>

      {ubicaciones.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Sin ubicaciones registradas.
        </p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Nombre</th>
                  <th className="pb-2 pr-3 font-medium">Dirección</th>
                  <th className="pb-2 pr-3 font-medium">Ciudad</th>
                  <th className="pb-2 pr-3 font-medium">Zona</th>
                  <th className="pb-2 pr-3 font-medium">Estado</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {ubicaciones.map((u) => (
                  <UbicacionTableRow key={u.id} ubicacion={u} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-2 sm:hidden">
            {ubicaciones.map((u) => (
              <UbicacionCard key={u.id} ubicacion={u} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────

function UbicacionTableRow({ ubicacion }: { ubicacion: UbicacionRow }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const zona = ubicacion.zona ? zonaConfig[ubicacion.zona] : null

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleUbicacion({ id: ubicacion.id, activo: !ubicacion.activo })
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(ubicacion.activo ? 'Ubicación desactivada' : 'Ubicación activada')
      router.refresh()
    })
  }

  return (
    <tr className="border-b border-border/50 hover:bg-muted/30">
      <td className="py-2.5 pr-3 font-medium">{ubicacion.nombre}</td>
      <td className="max-w-[200px] truncate py-2.5 pr-3 text-muted-foreground">
        {ubicacion.direccion ?? '—'}
      </td>
      <td className="py-2.5 pr-3 text-muted-foreground">
        {ubicacion.ciudad ?? '—'}
      </td>
      <td className="py-2.5 pr-3">
        {zona ? (
          <Badge className={`text-[11px] ${zona.color}`}>{zona.label}</Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
      <td className="py-2.5 pr-3">
        <button
          onClick={handleToggle}
          disabled={isPending}
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
            ubicacion.activo
              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-400'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-400'
          }`}
        >
          {ubicacion.activo ? 'Activa' : 'Inactiva'}
        </button>
      </td>
      <td className="py-2.5">
        <UbicacionDialog ubicacion={ubicacion} />
      </td>
    </tr>
  )
}

// ────────────────────────────────────────────────────────────────

function UbicacionCard({ ubicacion }: { ubicacion: UbicacionRow }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const zona = ubicacion.zona ? zonaConfig[ubicacion.zona] : null

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleUbicacion({ id: ubicacion.id, activo: !ubicacion.activo })
      if (result.error) {
        toast.error(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{ubicacion.nombre}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleToggle}
            disabled={isPending}
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
              ubicacion.activo
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-900 dark:text-gray-400'
            }`}
          >
            {ubicacion.activo ? 'Activa' : 'Inactiva'}
          </button>
          <UbicacionDialog ubicacion={ubicacion} />
        </div>
      </div>
      {(ubicacion.direccion || ubicacion.ciudad) && (
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {[ubicacion.direccion, ubicacion.ciudad].filter(Boolean).join(', ')}
        </p>
      )}
      <div className="mt-1 flex flex-wrap gap-1">
        {zona && <Badge className={`text-[10px] ${zona.color}`}>{zona.label}</Badge>}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// Dialog crear/editar
// ────────────────────────────────────────────────────────────────

function UbicacionDialog({ ubicacion }: { ubicacion?: UbicacionRow } = {}) {
  const router = useRouter()
  const isEditing = !!ubicacion
  const [open, setOpen] = useState(false)
  const [nombre, setNombre] = useState(ubicacion?.nombre ?? '')
  const [direccion, setDireccion] = useState(ubicacion?.direccion ?? '')
  const [ciudad, setCiudad] = useState(ubicacion?.ciudad ?? 'Tijuana')
  const [zona, setZona] = useState<string>(ubicacion?.zona ?? '')
  const [notas, setNotas] = useState(ubicacion?.notas ?? '')
  const [isPending, startTransition] = useTransition()

  function resetForm() {
    setNombre(ubicacion?.nombre ?? '')
    setDireccion(ubicacion?.direccion ?? '')
    setCiudad(ubicacion?.ciudad ?? 'Tijuana')
    setZona(ubicacion?.zona ?? '')
    setNotas(ubicacion?.notas ?? '')
  }

  function handleOpenChange(v: boolean) {
    setOpen(v)
    if (v) resetForm()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    startTransition(async () => {
      const payload = {
        nombre: nombre.trim(),
        direccion: direccion.trim() || null,
        ciudad: ciudad.trim() || null,
        zona: (zona || null) as 'TURISTICA' | 'POPULAR' | 'COMERCIAL' | null,
        notas: notas.trim() || null,
      }

      const result = isEditing
        ? await actualizarUbicacion({ id: ubicacion!.id, ...payload })
        : await crearUbicacion(payload)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success(isEditing ? 'Ubicación actualizada' : 'Ubicación creada')
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {isEditing ? (
          <Button variant="ghost" size="sm">
            <PencilSimple size={16} />
          </Button>
        ) : (
          <Button size="sm">
            <Plus size={16} weight="bold" />
            Nueva ubicación
          </Button>
        )}
      </DialogTrigger>
      <DialogContent fullScreenMobile className="flex flex-col overflow-hidden sm:max-h-[85dvh]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar ubicación' : 'Nueva ubicación'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modifica los datos del punto de venta.' : 'Registra un nuevo punto de venta.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto">
          <fieldset className="space-y-2">
            <Label>Nombre *</Label>
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Plaza Río"
            />
          </fieldset>

          <fieldset className="space-y-2">
            <Label>Dirección</Label>
            <Textarea
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              rows={2}
              placeholder="Dirección del punto..."
            />
          </fieldset>

          <div className="grid grid-cols-2 gap-3">
            <fieldset className="space-y-2">
              <Label>Ciudad</Label>
              <Input
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                placeholder="Tijuana"
              />
            </fieldset>
            <fieldset className="space-y-2">
              <Label>Zona</Label>
              <Select value={zona} onValueChange={setZona}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TURISTICA">Turística</SelectItem>
                  <SelectItem value="POPULAR">Popular</SelectItem>
                  <SelectItem value="COMERCIAL">Comercial</SelectItem>
                </SelectContent>
              </Select>
            </fieldset>
          </div>

          <fieldset className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              placeholder="Notas adicionales..."
            />
          </fieldset>

          <Button type="submit" className="h-10 w-full" disabled={isPending || !nombre.trim()}>
            {isPending ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear ubicación'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
