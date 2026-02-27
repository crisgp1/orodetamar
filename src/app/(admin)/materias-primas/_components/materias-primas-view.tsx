'use client'

import { useState, useTransition } from 'react'
import {
  ShoppingCart,
  ArrowDown,
  Minus,
  ArrowUUpLeft,
  Plus,
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
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { registrarCompra, registrarMovimientoMP, crearMateriaPrima } from '../actions'
import type { VStockMateriaPrima, MovimientoMateriaPrima, TipoMovimientoMP, UnidadMedida } from '@/lib/types/database'

type MPOption = { id: number; nombre: string; unidad_medida: string }
type MovConMP = MovimientoMateriaPrima & { materias_primas: { nombre: string } | null }

const tipoConfig: Record<TipoMovimientoMP, { label: string; color: string; icon: React.ReactNode }> = {
  COMPRA: { label: 'Compra', color: 'bg-green-100 text-green-700', icon: <ShoppingCart size={14} weight="bold" /> },
  CONSUMO_PRODUCCION: { label: 'Consumo', color: 'bg-blue-100 text-blue-700', icon: <ArrowDown size={14} weight="bold" /> },
  MERMA: { label: 'Merma', color: 'bg-red-100 text-red-700', icon: <Minus size={14} weight="bold" /> },
  AJUSTE: { label: 'Ajuste', color: 'bg-gray-100 text-gray-700', icon: <ArrowUUpLeft size={14} weight="bold" /> },
}

const alertaConfig = {
  AGOTADO: 'bg-red-100 text-red-700',
  STOCK_BAJO: 'bg-yellow-100 text-yellow-700',
  OK: 'bg-green-100 text-green-700',
}

const unidadLabels: Record<UnidadMedida, string> = {
  KG: 'kg',
  G: 'g',
  UNIDAD: 'uds',
  LITRO: 'L',
  ML: 'ml',
}

export function MateriasPrimasView({
  stock,
  movimientos,
  materiasPrimas,
}: {
  stock: VStockMateriaPrima[]
  movimientos: MovConMP[]
  materiasPrimas: MPOption[]
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <RegistrarMovimientoDialog materiasPrimas={materiasPrimas} stock={stock} />
        <NuevaMateriaPrimaDialog />
      </div>

      {/* Stock table */}
      <section>
        <h2 className="mb-3 text-lg font-medium">Stock</h2>
        {stock.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Sin materias primas registradas.</p>
        ) : (
          <div className="space-y-2">
            {stock.map((s) => (
              <div key={s.materia_prima_id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                <div>
                  <p className="text-sm font-medium">{s.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.proveedor ?? 'Sin proveedor'} · {s.costo_unitario_actual ? `$${s.costo_unitario_actual.toFixed(2)}/${unidadLabels[s.unidad_medida]}` : '—'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold tabular-nums">
                    {s.cantidad_disponible} {unidadLabels[s.unidad_medida]}
                  </span>
                  <Badge className={`text-[11px] ${alertaConfig[s.alerta]}`}>{s.alerta === 'OK' ? 'OK' : s.alerta === 'STOCK_BAJO' ? 'Bajo' : 'Agotado'}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Separator />

      {/* Movement history */}
      <section>
        <h2 className="mb-3 text-lg font-medium">Últimos movimientos</h2>
        {movimientos.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Sin movimientos.</p>
        ) : (
          <div className="space-y-2">
            {movimientos.map((m) => {
              const config = tipoConfig[m.tipo]
              const signo = m.cantidad > 0 ? '+' : ''
              return (
                <div key={m.id} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.color}`}>
                    {config.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">{m.materias_primas?.nombre ?? `MP #${m.materia_prima_id}`}</p>
                      <span className={`shrink-0 text-sm font-semibold tabular-nums ${m.cantidad > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {signo}{m.cantidad}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge className={`text-[11px] ${config.color}`}>{config.label}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(m.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {m.notas && <p className="mt-1 text-xs text-muted-foreground">{m.notas}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

type TabType = 'compra' | 'consumo' | 'merma' | 'ajuste'

function RegistrarMovimientoDialog({ materiasPrimas, stock }: { materiasPrimas: MPOption[]; stock: VStockMateriaPrima[] }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<TabType>('compra')

  function handleClose() { setOpen(false) }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus size={16} weight="bold" />
          Registrar movimiento
        </Button>
      </DialogTrigger>
      <DialogContent fullScreenMobile className="flex flex-col overflow-hidden sm:max-h-[85dvh]">
        <DialogHeader>
          <DialogTitle>Registrar movimiento</DialogTitle>
          <DialogDescription>Entradas y salidas de materia prima.</DialogDescription>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabType)} className="min-h-0 flex-1">
          <TabsList className="w-full">
            <TabsTrigger value="compra" className="gap-1.5 text-xs"><ShoppingCart size={14} weight="bold" />Compra</TabsTrigger>
            <TabsTrigger value="consumo" className="gap-1.5 text-xs"><ArrowDown size={14} weight="bold" />Consumo</TabsTrigger>
            <TabsTrigger value="merma" className="gap-1.5 text-xs"><Minus size={14} weight="bold" />Merma</TabsTrigger>
            <TabsTrigger value="ajuste" className="gap-1.5 text-xs"><ArrowUUpLeft size={14} weight="bold" />Ajuste</TabsTrigger>
          </TabsList>
          <div className="flex-1 overflow-y-auto pt-4">
            <TabsContent value="compra"><CompraForm materiasPrimas={materiasPrimas} onClose={handleClose} /></TabsContent>
            <TabsContent value="consumo"><MovimientoForm tipo="CONSUMO_PRODUCCION" desc="Registra consumo de materia prima para producción." placeholder="Ej: Producción del 25 feb, 5 cajas pulpa" materiasPrimas={materiasPrimas} stock={stock} onClose={handleClose} /></TabsContent>
            <TabsContent value="merma"><MovimientoForm tipo="MERMA" desc="Registra pérdida o descarte de materia prima." placeholder="Ej: Chile en polvo caducado" materiasPrimas={materiasPrimas} stock={stock} onClose={handleClose} /></TabsContent>
            <TabsContent value="ajuste"><MovimientoForm tipo="AJUSTE" desc="Reingreso o ajuste positivo de materia prima." placeholder="Ej: Conteo físico, se encontraron 2kg extras" materiasPrimas={materiasPrimas} stock={stock} onClose={handleClose} /></TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function CompraForm({ materiasPrimas, onClose }: { materiasPrimas: MPOption[]; onClose: () => void }) {
  const [mpId, setMpId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [costoTotal, setCostoTotal] = useState('')
  const [proveedor, setProveedor] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [notas, setNotas] = useState('')
  const [isPending, startTransition] = useTransition()

  const costoUnitario = Number(cantidad) > 0 && Number(costoTotal) > 0
    ? (Number(costoTotal) / Number(cantidad)).toFixed(2)
    : null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await registrarCompra({
        materia_prima_id: Number(mpId),
        cantidad: Number(cantidad),
        costo_total: Number(costoTotal),
        proveedor: proveedor.trim() || null,
        fecha_compra: fecha,
        notas: notas.trim() || null,
      })
      if (result.error) { toast.error(result.error); return }
      toast.success('Compra registrada')
      onClose()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">Registra una compra. El stock y costo unitario se actualizan automáticamente.</p>
      <fieldset className="space-y-2">
        <Label>Materia prima</Label>
        <Select value={mpId} onValueChange={setMpId}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Selecciona" /></SelectTrigger>
          <SelectContent>{materiasPrimas.map((mp) => (<SelectItem key={mp.id} value={String(mp.id)}>{mp.nombre} ({mp.unidad_medida})</SelectItem>))}</SelectContent>
        </Select>
      </fieldset>
      <div className="grid grid-cols-2 gap-3">
        <fieldset className="space-y-2">
          <Label>Cantidad</Label>
          <Input type="number" inputMode="decimal" min={0.01} step="0.01" placeholder="10" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
        </fieldset>
        <fieldset className="space-y-2">
          <Label>Costo total ($)</Label>
          <Input type="number" inputMode="decimal" min={0.01} step="0.01" placeholder="500" value={costoTotal} onChange={(e) => setCostoTotal(e.target.value)} />
        </fieldset>
      </div>
      {costoUnitario && <p className="text-xs text-muted-foreground">Costo unitario: ${costoUnitario}</p>}
      <fieldset className="space-y-2">
        <Label>Proveedor (opcional)</Label>
        <Input value={proveedor} onChange={(e) => setProveedor(e.target.value)} placeholder="Nombre del proveedor" />
      </fieldset>
      <fieldset className="space-y-2">
        <Label>Fecha compra</Label>
        <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      </fieldset>
      <fieldset className="space-y-2">
        <Label>Notas (opcional)</Label>
        <Textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Detalles de la compra" rows={2} />
      </fieldset>
      <Button type="submit" className="w-full" disabled={isPending}>{isPending ? 'Registrando...' : 'Registrar compra'}</Button>
    </form>
  )
}

function MovimientoForm({ tipo, desc, placeholder, materiasPrimas, stock, onClose }: {
  tipo: 'CONSUMO_PRODUCCION' | 'MERMA' | 'AJUSTE'
  desc: string
  placeholder: string
  materiasPrimas: MPOption[]
  stock: VStockMateriaPrima[]
  onClose: () => void
}) {
  const [mpId, setMpId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [notas, setNotas] = useState('')
  const [isPending, startTransition] = useTransition()

  const esSalida = tipo !== 'AJUSTE'
  const mpConStock = esSalida
    ? materiasPrimas.filter((mp) => { const s = stock.find((st) => st.materia_prima_id === mp.id); return s && s.cantidad_disponible > 0 })
    : materiasPrimas

  const stockSelec = stock.find((s) => s.materia_prima_id === Number(mpId))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!notas.trim()) { toast.error('Las notas son obligatorias'); return }
    startTransition(async () => {
      const result = await registrarMovimientoMP({
        materia_prima_id: Number(mpId),
        tipo,
        cantidad: Number(cantidad),
        notas: notas.trim(),
      })
      if (result.error) { toast.error(result.error); return }
      const labels = { CONSUMO_PRODUCCION: 'Consumo registrado', MERMA: 'Merma registrada', AJUSTE: 'Ajuste registrado' }
      toast.success(labels[tipo])
      onClose()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">{desc}</p>
      <fieldset className="space-y-2">
        <Label>Materia prima</Label>
        <Select value={mpId} onValueChange={setMpId}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Selecciona" /></SelectTrigger>
          <SelectContent>{mpConStock.map((mp) => (<SelectItem key={mp.id} value={String(mp.id)}>{mp.nombre}</SelectItem>))}</SelectContent>
        </Select>
        {esSalida && stockSelec && <p className="text-xs text-muted-foreground">Stock: {stockSelec.cantidad_disponible} {unidadLabels[stockSelec.unidad_medida]}</p>}
      </fieldset>
      <fieldset className="space-y-2">
        <Label>Cantidad</Label>
        <Input type="number" inputMode="decimal" min={0.01} step="0.01" max={esSalida && stockSelec ? stockSelec.cantidad_disponible : undefined} placeholder="0" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
      </fieldset>
      <fieldset className="space-y-2">
        <Label>Notas *</Label>
        <Textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder={placeholder} rows={2} />
      </fieldset>
      <Button type="submit" className="w-full" disabled={isPending}>{isPending ? 'Guardando...' : 'Registrar'}</Button>
    </form>
  )
}

function NuevaMateriaPrimaDialog() {
  const [open, setOpen] = useState(false)
  const [nombre, setNombre] = useState('')
  const [unidad, setUnidad] = useState<UnidadMedida>('KG')
  const [proveedor, setProveedor] = useState('')
  const [notas, setNotas] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await crearMateriaPrima({
        nombre: nombre.trim(),
        unidad_medida: unidad,
        proveedor: proveedor.trim() || null,
        notas: notas.trim() || null,
      })
      if (result.error) { toast.error(result.error); return }
      toast.success('Materia prima creada')
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Nueva materia prima</Button>
      </DialogTrigger>
      <DialogContent fullScreenMobile>
        <DialogHeader>
          <DialogTitle>Nueva materia prima</DialogTitle>
          <DialogDescription>Agrega una materia prima al catálogo.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset className="space-y-2">
            <Label>Nombre</Label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Dátil fresco" />
          </fieldset>
          <fieldset className="space-y-2">
            <Label>Unidad de medida</Label>
            <Select value={unidad} onValueChange={(v) => setUnidad(v as UnidadMedida)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="KG">Kilogramos (kg)</SelectItem>
                <SelectItem value="G">Gramos (g)</SelectItem>
                <SelectItem value="UNIDAD">Unidades</SelectItem>
                <SelectItem value="LITRO">Litros (L)</SelectItem>
                <SelectItem value="ML">Mililitros (ml)</SelectItem>
              </SelectContent>
            </Select>
          </fieldset>
          <fieldset className="space-y-2">
            <Label>Proveedor (opcional)</Label>
            <Input value={proveedor} onChange={(e) => setProveedor(e.target.value)} placeholder="Nombre del proveedor" />
          </fieldset>
          <fieldset className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} />
          </fieldset>
          <Button type="submit" className="w-full" disabled={isPending}>{isPending ? 'Creando...' : 'Crear materia prima'}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
