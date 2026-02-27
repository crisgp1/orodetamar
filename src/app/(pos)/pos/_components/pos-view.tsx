'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Warning, X } from '@phosphor-icons/react'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import type { VCierresStand, MetodoPago } from '@/lib/types/database'
import type { VentaResumenProducto } from '../page'
import { BannerConfig } from './banner-config'
import { ProductoCard } from './producto-card'
import { ResumenDia } from './resumen-dia'
import { FeedVentas } from './feed-ventas'
import { CierreDialog } from './cierre-dialog'

type UbicacionOption = { id: number; nombre: string }
type ProductoOption = {
  id: number
  nombre: string
  presentacion: string
  precio_venta: number
}
type VentaHoy = {
  id: number
  producto_id: number
  cantidad_vendida: number
  total: number
  metodo_pago: MetodoPago | null
  created_at: string
}

const STORAGE_KEY = 'oro-pos-config'

type PosConfig = {
  ubicacion_id: number | null
  metodo_pago: 'EFECTIVO' | 'TRANSFERENCIA'
}

function loadConfig(): PosConfig {
  if (typeof window === 'undefined') {
    return { ubicacion_id: null, metodo_pago: 'EFECTIVO' }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PosConfig>
      return {
        ubicacion_id: parsed.ubicacion_id ?? null,
        metodo_pago:
          parsed.metodo_pago === 'TRANSFERENCIA' ? 'TRANSFERENCIA' : 'EFECTIVO',
      }
    }
  } catch {
    // ignore
  }
  return { ubicacion_id: null, metodo_pago: 'EFECTIVO' }
}

function saveConfig(config: PosConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch {
    // ignore
  }
}

export function PosView({
  productos,
  ubicaciones,
  stockMap,
  ventasHoy,
  cierres,
  ventasPorProducto,
}: {
  productos: ProductoOption[]
  ubicaciones: UbicacionOption[]
  stockMap: Record<number, number>
  ventasHoy: VentaHoy[]
  cierres: VCierresStand[]
  ventasPorProducto: Record<number, VentaResumenProducto>
}) {
  const initialConfig = loadConfig()
  const initialUbicacionId =
    initialConfig.ubicacion_id &&
    ubicaciones.some((u) => u.id === initialConfig.ubicacion_id)
      ? initialConfig.ubicacion_id
      : ubicaciones.length === 1
        ? ubicaciones[0].id
        : null
  const [ubicacionId, setUbicacionId] = useState<number | null>(initialUbicacionId)
  const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'TRANSFERENCIA'>(
    initialConfig.metodo_pago
  )
  const [stockBannerDismissed, setStockBannerDismissed] = useState(() => {
    if (typeof window === 'undefined') return true
    const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Tijuana' })
    const dismissKey = `oro-pos-stock-banner-${hoy}`
    return Boolean(localStorage.getItem(dismissKey))
  })

  useEffect(() => {
    saveConfig({ ubicacion_id: ubicacionId, metodo_pago: metodoPago })
  }, [ubicacionId, metodoPago])

  const noUbicacion = ubicacionId === null
  const ubicacionNombre =
    ubicaciones.find((u) => u.id === ubicacionId)?.nombre ?? ''

  // Count products with stock ≤ 0
  const sinStock = productos.filter((p) => (stockMap[p.id] ?? 0) <= 0).length

  function dismissStockBanner() {
    const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Tijuana' })
    localStorage.setItem(`oro-pos-stock-banner-${hoy}`, 'true')
    setStockBannerDismissed(true)
  }

  return (
    <div className="pb-6">
      <BannerConfig
        ubicaciones={ubicaciones}
        ubicacionId={ubicacionId}
        metodoPago={metodoPago}
        onUbicacionChange={setUbicacionId}
        onMetodoPagoChange={setMetodoPago}
      />

      <div className="space-y-4 pt-4">
        {noUbicacion && (
          <div className="mx-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
            Selecciona una ubicación para empezar a vender
          </div>
        )}

        {/* Banner stock: 1x por día, dismissable */}
        {sinStock > 0 && !stockBannerDismissed && (
          <div className="mx-4 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-900 dark:bg-amber-950/30">
            <div className="flex items-center gap-2">
              <Warning
                size={16}
                weight="bold"
                className="shrink-0 text-amber-600"
              />
              <span className="text-amber-700 dark:text-amber-300">
                {sinStock} producto{sinStock > 1 ? 's' : ''} sin stock
                registrado.
                <Link
                  href="/inventario"
                  className="ml-1 font-medium underline"
                >
                  Registrar producción
                </Link>
              </span>
            </div>
            <button
              onClick={dismissStockBanner}
              className="shrink-0 text-amber-600 hover:text-amber-800"
            >
              <X size={16} weight="bold" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 px-4 sm:grid-cols-3 lg:grid-cols-4">
          {productos.map((p) => (
            <ProductoCard
              key={p.id}
              producto={p}
              ubicacionId={ubicacionId}
              metodoPago={metodoPago}
              stock={stockMap[p.id] ?? 0}
              disabled={noUbicacion}
            />
          ))}
        </div>

        <ResumenDia ventasHoy={ventasHoy} />
        <FeedVentas ventasHoy={ventasHoy} />

        <div className="px-4">
          <Separator />
        </div>

        <div className="flex items-center justify-between px-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={16} weight="bold" />
              Admin
            </Button>
          </Link>
          <CierreDialog
            ubicacionId={ubicacionId}
            ubicacionNombre={ubicacionNombre}
            productos={productos}
            ventasPorProducto={ventasPorProducto}
            disabled={noUbicacion}
          />
        </div>
      </div>
    </div>
  )
}
