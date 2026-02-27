'use client'

import { useState, useTransition } from 'react'
import { Plus, PencilSimple, WhatsappLogo, Percent, Warning } from '@phosphor-icons/react'
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
import { Separator } from '@/components/ui/separator'
import { crearCliente, actualizarCliente, desactivarCliente } from '../actions'
import type { Cliente, TipoCliente, ModalidadPago, CanalOrigen } from '@/lib/types/database'

const tipoLabels: Record<TipoCliente, string> = {
  CONSUMIDOR_FINAL: 'Consumidor',
  RESTAURANTE: 'Restaurante',
  ABARROTES: 'Abarrotes',
  MERCADO: 'Mercado',
  MAYORISTA: 'Mayorista',
  CONSIGNACION: 'Consignación',
}

const tipoStyles: Record<TipoCliente, string> = {
  CONSUMIDOR_FINAL: 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400',
  RESTAURANTE: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  ABARROTES: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  MERCADO: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
  MAYORISTA: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
  CONSIGNACION: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400',
}

const modalidadLabels: Record<ModalidadPago, string> = {
  CONTADO: 'Contado',
  CONSIGNACION: 'Consignación',
}

const modalidadStyles: Record<ModalidadPago, string> = {
  CONTADO: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  CONSIGNACION: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
}

const canalLabels: Record<CanalOrigen, string> = {
  RECOMENDACION: 'Recomendación',
  PUNTO_DE_VENTA: 'Punto de venta',
  FACEBOOK: 'Facebook',
  WHATSAPP: 'WhatsApp',
  VISITA_DIRECTA: 'Visita directa',
  OTRO: 'Otro',
}

export function ClientesView({ clientes }: { clientes: Cliente[] }) {
  const referentesMap = new Map(clientes.map((c) => [c.id, c.nombre]))

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <ClienteFormDialog mode="crear" clientes={clientes} />
      </div>

      {clientes.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No hay clientes registrados.
        </p>
      ) : (
        <div className="space-y-2">
          {clientes.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium">{c.nombre}</p>
                  <Badge className={`text-[11px] ${tipoStyles[c.tipo]}`}>
                    {tipoLabels[c.tipo]}
                  </Badge>
                  <Badge className={`text-[11px] ${modalidadStyles[c.modalidad_pago]}`}>
                    {modalidadLabels[c.modalidad_pago]}
                  </Badge>
                  {c.descuento_porcentaje != null && c.descuento_porcentaje > 0 && (
                    <Badge className="bg-green-100 text-green-700 text-[11px] gap-0.5 dark:bg-green-950 dark:text-green-400">
                      <Percent size={10} />
                      {c.descuento_porcentaje}% dto
                    </Badge>
                  )}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  {c.ciudad && <span>{c.ciudad}</span>}
                  {c.canal_origen && <span>{canalLabels[c.canal_origen]}</span>}
                  {c.referido_por_id && referentesMap.has(c.referido_por_id) && (
                    <span>Ref: {referentesMap.get(c.referido_por_id)}</span>
                  )}
                  {c.whatsapp && (
                    <a
                      href={`https://wa.me/52${c.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-0.5 text-green-600 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <WhatsappLogo size={14} />
                      {c.whatsapp}
                    </a>
                  )}
                </div>
              </div>
              <ClienteFormDialog mode="editar" cliente={c} clientes={clientes} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ClienteFormDialog({
  mode,
  cliente,
  clientes,
}: {
  mode: 'crear' | 'editar'
  cliente?: Cliente
  clientes: Cliente[]
}) {
  const [open, setOpen] = useState(false)
  const [nombre, setNombre] = useState(cliente?.nombre ?? '')
  const [telefono, setTelefono] = useState(cliente?.telefono ?? '')
  const [whatsapp, setWhatsapp] = useState(cliente?.whatsapp ?? '')
  const [email, setEmail] = useState(cliente?.email ?? '')
  const [tipo, setTipo] = useState<TipoCliente>(cliente?.tipo ?? 'CONSUMIDOR_FINAL')
  const [modalidad, setModalidad] = useState<ModalidadPago>(cliente?.modalidad_pago ?? 'CONTADO')
  const [canal, setCanal] = useState(cliente?.canal_origen ?? '')
  const [referidoPorId, setReferidoPorId] = useState(cliente?.referido_por_id ? String(cliente.referido_por_id) : '')
  const [direccion, setDireccion] = useState(cliente?.direccion ?? '')
  const [ciudad, setCiudad] = useState(cliente?.ciudad ?? '')
  const [descuento, setDescuento] = useState(cliente?.descuento_porcentaje ? String(cliente.descuento_porcentaje) : '')
  const [notas, setNotas] = useState(cliente?.notas ?? '')
  const [isPending, startTransition] = useTransition()

  const otrosClientes = clientes.filter((c) => c.id !== cliente?.id)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      nombre: nombre.trim(),
      telefono: telefono.trim() || null,
      whatsapp: whatsapp.trim() || null,
      email: email.trim() || null,
      tipo,
      modalidad_pago: modalidad,
      canal_origen: (canal || null) as CanalOrigen | null,
      referido_por_id: referidoPorId ? Number(referidoPorId) : null,
      direccion: direccion.trim() || null,
      ciudad: ciudad.trim() || null,
      descuento_porcentaje: descuento ? Number(descuento) : null,
      notas: notas.trim() || null,
    }

    startTransition(async () => {
      const result = mode === 'crear'
        ? await crearCliente(payload)
        : await actualizarCliente({ id: cliente!.id, ...payload })

      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(mode === 'crear' ? 'Cliente creado' : 'Cliente actualizado')
      setOpen(false)
    })
  }

  function handleDesactivar() {
    startTransition(async () => {
      const result = await desactivarCliente(cliente!.id)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('Cliente desactivado')
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === 'crear' ? (
          <Button size="sm">
            <Plus size={16} weight="bold" />
            Nuevo cliente
          </Button>
        ) : (
          <Button variant="ghost" size="sm">
            <PencilSimple size={16} />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent fullScreenMobile className="flex flex-col overflow-hidden sm:max-h-[85dvh]">
        <DialogHeader>
          <DialogTitle>{mode === 'crear' ? 'Nuevo cliente' : 'Editar cliente'}</DialogTitle>
          <DialogDescription>
            {mode === 'crear' ? 'Registra un nuevo cliente.' : cliente?.nombre}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <fieldset className="space-y-2">
              <Label>Nombre *</Label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre completo o negocio" />
            </fieldset>

            <div className="grid grid-cols-2 gap-3">
              <fieldset className="space-y-2">
                <Label>Tipo</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as TipoCliente)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(tipoLabels) as TipoCliente[]).map((k) => (
                      <SelectItem key={k} value={k}>{tipoLabels[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </fieldset>
              <fieldset className="space-y-2">
                <Label>Modalidad pago</Label>
                <Select value={modalidad} onValueChange={(v) => setModalidad(v as ModalidadPago)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(modalidadLabels) as ModalidadPago[]).map((k) => (
                      <SelectItem key={k} value={k}>{modalidadLabels[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </fieldset>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <fieldset className="space-y-2">
                <Label>Teléfono</Label>
                <Input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="6641234567" />
              </fieldset>
              <fieldset className="space-y-2">
                <Label>WhatsApp</Label>
                <Input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="6611234567" />
              </fieldset>
            </div>

            <fieldset className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" />
            </fieldset>

            <div className="grid grid-cols-2 gap-3">
              <fieldset className="space-y-2">
                <Label>Dirección</Label>
                <Input value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Calle y número" />
              </fieldset>
              <fieldset className="space-y-2">
                <Label>Ciudad</Label>
                <Input value={ciudad} onChange={(e) => setCiudad(e.target.value)} placeholder="Tijuana" />
              </fieldset>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <fieldset className="space-y-2">
                <Label>Canal origen</Label>
                <Select value={canal} onValueChange={setCanal}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(canalLabels) as CanalOrigen[]).map((k) => (
                      <SelectItem key={k} value={k}>{canalLabels[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </fieldset>
              <fieldset className="space-y-2">
                <Label>Descuento %</Label>
                <Input type="number" inputMode="numeric" min={0} max={100} step="0.5" placeholder="0" value={descuento} onChange={(e) => setDescuento(e.target.value)} />
              </fieldset>
            </div>

            {otrosClientes.length > 0 && (
              <fieldset className="space-y-2">
                <Label>Referido por</Label>
                <Select value={referidoPorId} onValueChange={setReferidoPorId}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Ninguno" /></SelectTrigger>
                  <SelectContent>
                    {otrosClientes.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </fieldset>
            )}

            <fieldset className="space-y-2">
              <Label>Notas</Label>
              <Textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Notas adicionales" rows={2} />
            </fieldset>

            <Button type="submit" className="h-10 w-full" disabled={isPending}>
              {isPending ? 'Guardando...' : mode === 'crear' ? 'Crear cliente' : 'Guardar cambios'}
            </Button>

            {mode === 'editar' && (
              <>
                <Separator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="h-10 w-full text-red-600 hover:text-red-700" disabled={isPending}>
                      <Warning size={16} weight="bold" />
                      Desactivar cliente
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Desactivar cliente</AlertDialogTitle>
                      <AlertDialogDescription>
                        {cliente?.nombre} dejará de aparecer en selects de consignaciones y pedidos. Esta acción se puede revertir desde la base de datos.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDesactivar}>Desactivar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
