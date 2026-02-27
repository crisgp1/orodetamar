import Link from 'next/link'
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr'
import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { ConsignacionDetalleView } from '../_components/consignacion-detalle'
import type {
  Consignacion,
  ConsignacionDetalle,
  ConsignacionPago,
} from '@/lib/types/database'

export default async function ConsignacionDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: rawId } = await params
  const id = Number(rawId)
  if (!id) notFound()

  const supabase = createServerSupabase()

  const [consigRes, detalleRes, pagosRes] = await Promise.all([
    supabase
      .from('consignaciones')
      .select('*, clientes(nombre, whatsapp, ciudad)')
      .eq('id', id)
      .single(),
    supabase
      .from('consignacion_detalle')
      .select('*, productos(nombre, sku, presentacion)')
      .eq('consignacion_id', id)
      .order('id'),
    supabase
      .from('consignacion_pagos')
      .select('*')
      .eq('consignacion_id', id)
      .order('fecha_pago', { ascending: false }),
  ])

  if (!consigRes.data) notFound()

  const consignacion = consigRes.data as Consignacion & {
    clientes: {
      nombre: string
      whatsapp: string | null
      ciudad: string | null
    } | null
  }

  const detalle = (detalleRes.data ?? []) as Array<
    ConsignacionDetalle & {
      productos: {
        nombre: string
        sku: string | null
        presentacion: string
      } | null
    }
  >

  const pagos = (pagosRes.data ?? []) as ConsignacionPago[]

  return (
    <div>
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/consignaciones">
            <ArrowLeft size={16} />
            Consignaciones
          </Link>
        </Button>
      </div>

      <ConsignacionDetalleView
        consignacion={consignacion}
        detalle={detalle}
        pagos={pagos}
      />
    </div>
  )
}
