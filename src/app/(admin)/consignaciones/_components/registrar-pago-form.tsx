'use client'

import { useState, useTransition } from 'react'
import { CurrencyDollar } from '@phosphor-icons/react'
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
import { registrarPagoConsignacion } from '../actions'

function formatPeso(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
}

export function RegistrarPagoForm({
  consignacionId,
  saldoPendiente,
}: {
  consignacionId: number
  saldoPendiente: number
}) {
  const [open, setOpen] = useState(false)
  const [monto, setMonto] = useState(String(saldoPendiente))
  const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'TRANSFERENCIA'>(
    'EFECTIVO'
  )
  const [notas, setNotas] = useState('')
  const [isPending, startTransition] = useTransition()

  const montoNum = Number(monto) || 0
  const cierraConsignacion = montoNum >= saldoPendiente && saldoPendiente > 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (montoNum <= 0) {
      toast.error('Monto debe ser mayor a 0')
      return
    }

    startTransition(async () => {
      const result = await registrarPagoConsignacion({
        consignacion_id: consignacionId,
        monto: montoNum,
        metodo_pago: metodoPago,
        notas: notas.trim() || undefined,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success(
        result.liquidada
          ? 'Pago registrado — consignación liquidada'
          : 'Pago registrado'
      )
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <CurrencyDollar size={16} weight="bold" />
          Registrar pago
        </Button>
      </DialogTrigger>
      <DialogContent fullScreenMobile>
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
          <DialogDescription>
            Saldo pendiente: {formatPeso(saldoPendiente)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset className="space-y-2">
            <Label>Monto</Label>
            <Input
              type="number"
              inputMode="decimal"
              min={0.01}
              step="0.01"
              placeholder="0.00"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
            />
            {cierraConsignacion && (
              <p className="text-xs text-green-600">
                Este pago cierra la consignación
              </p>
            )}
          </fieldset>

          <fieldset className="space-y-2">
            <Label>Método de pago</Label>
            <Select
              value={metodoPago}
              onValueChange={(v) =>
                setMetodoPago(v as 'EFECTIVO' | 'TRANSFERENCIA')
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
              </SelectContent>
            </Select>
          </fieldset>

          <fieldset className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea
              placeholder="Ej: Pago parcial, regreso la próxima semana"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
            />
          </fieldset>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Registrando...' : 'Registrar pago'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
