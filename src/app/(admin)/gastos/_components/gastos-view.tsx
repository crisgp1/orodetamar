'use client'

import { useState, useTransition } from 'react'
import { Plus, PencilSimple, Trash } from '@phosphor-icons/react'
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
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
import { registrarGasto, actualizarGasto, eliminarGasto } from '../actions'
import type { Gasto, TipoGasto } from '@/lib/types/database'

const tipoConfig: Record<TipoGasto, { label: string; color: string }> = {
  GASOLINA: { label: 'Gasolina', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' },
  PERMISO: { label: 'Permiso', color: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400' },
  MATERIA_PRIMA: { label: 'Materia prima', color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' },
  EMPAQUE: { label: 'Empaque', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' },
  RENTA: { label: 'Renta', color: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400' },
  HERRAMIENTA: { label: 'Herramienta', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400' },
  MARKETING: { label: 'Marketing', color: 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-400' },
  OTRO: { label: 'Otro', color: 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400' },
}

function formatMoney(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
}

function formatFecha(fecha: string) {
  return new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function GastosView({ gastos }: { gastos: Gasto[] }) {
  const ahora = new Date()
  const gastosMes = gastos.filter((g) => {
    const d = new Date(g.fecha + 'T12:00:00')
    return d.getMonth() === ahora.getMonth() && d.getFullYear() === ahora.getFullYear()
  })
  const mesActual = gastosMes.reduce((sum, g) => sum + g.monto, 0)

  // Per-type summary for current month
  const porTipo = new Map<TipoGasto, number>()
  for (const g of gastosMes) {
    porTipo.set(g.tipo, (porTipo.get(g.tipo) ?? 0) + g.monto)
  }

  return (
    <div className="space-y-6">
      {/* Summary + action */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Total del mes</p>
          <p className="text-2xl font-semibold">{formatMoney(mesActual)}</p>
          {porTipo.size > 0 && (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {Array.from(porTipo.entries())
                .sort(([, a], [, b]) => b - a)
                .map(([tipo, monto]) => (
                  <Badge key={tipo} className={`text-[10px] ${tipoConfig[tipo].color}`}>
                    {tipoConfig[tipo].label} {formatMoney(monto)}
                  </Badge>
                ))}
            </div>
          )}
        </div>
        <GastoFormDialog mode="crear" />
      </div>

      {/* Gastos list */}
      {gastos.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Sin gastos registrados.</p>
      ) : (
        <div className="space-y-2">
          {gastos.map((g) => {
            const config = tipoConfig[g.tipo]
            return (
              <div key={g.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{g.concepto}</p>
                    <Badge className={`text-[11px] ${config.color}`}>{config.label}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatFecha(g.fecha)}
                    {g.notas ? ` — ${g.notas}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <p className="text-sm font-semibold mr-1">{formatMoney(g.monto)}</p>
                  <GastoFormDialog mode="editar" gasto={g} />
                  <EliminarGastoButton gasto={g} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function GastoFormDialog({
  mode,
  gasto,
}: {
  mode: 'crear' | 'editar'
  gasto?: Gasto
}) {
  const [open, setOpen] = useState(false)
  const [tipo, setTipo] = useState<TipoGasto>(gasto?.tipo ?? 'GASOLINA')
  const [concepto, setConcepto] = useState(gasto?.concepto ?? '')
  const [monto, setMonto] = useState(gasto ? String(gasto.monto) : '')
  const [fecha, setFecha] = useState(gasto?.fecha ?? new Date().toISOString().split('T')[0])
  const [notas, setNotas] = useState(gasto?.notas ?? '')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      tipo,
      concepto: concepto.trim(),
      monto: Number(monto),
      fecha,
      notas: notas.trim() || null,
    }

    startTransition(async () => {
      const result = mode === 'crear'
        ? await registrarGasto(payload)
        : await actualizarGasto(gasto!.id, payload)

      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(mode === 'crear' ? 'Gasto registrado' : 'Gasto actualizado')
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === 'crear' ? (
          <Button size="sm">
            <Plus size={16} weight="bold" />
            Registrar gasto
          </Button>
        ) : (
          <Button variant="ghost" size="sm">
            <PencilSimple size={16} />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent fullScreenMobile>
        <DialogHeader>
          <DialogTitle>{mode === 'crear' ? 'Registrar gasto' : 'Editar gasto'}</DialogTitle>
          <DialogDescription>
            {mode === 'crear' ? 'Registra un gasto operativo.' : gasto?.concepto}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset className="space-y-2">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoGasto)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(tipoConfig) as TipoGasto[]).map((k) => (
                  <SelectItem key={k} value={k}>{tipoConfig[k].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </fieldset>

          <fieldset className="space-y-2">
            <Label>Concepto *</Label>
            <Input value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Ej: Gasolina Tijuana-Rosarito ida y vuelta" />
          </fieldset>

          <div className="grid grid-cols-2 gap-3">
            <fieldset className="space-y-2">
              <Label>Monto ($) *</Label>
              <Input type="number" inputMode="decimal" min={0.01} step="0.01" placeholder="0.00" value={monto} onChange={(e) => setMonto(e.target.value)} />
            </fieldset>
            <fieldset className="space-y-2">
              <Label>Fecha *</Label>
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </fieldset>
          </div>

          <fieldset className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} placeholder="Detalles adicionales" />
          </fieldset>

          <Button type="submit" className="h-10 w-full" disabled={isPending}>
            {isPending ? 'Guardando...' : mode === 'crear' ? 'Registrar gasto' : 'Guardar cambios'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EliminarGastoButton({ gasto }: { gasto: Gasto }) {
  const [isPending, startTransition] = useTransition()

  function handleEliminar() {
    startTransition(async () => {
      const result = await eliminarGasto(gasto.id)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('Gasto eliminado')
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-600" disabled={isPending}>
          <Trash size={16} />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar gasto</AlertDialogTitle>
          <AlertDialogDescription>
            Eliminar gasto de {formatMoney(gasto.monto)} del {formatFecha(gasto.fecha)}? Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleEliminar}>Eliminar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
