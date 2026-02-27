import { NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getBrowser } from '@/lib/puppeteer'
import { generateBomHtml, type BomProducto, type BomData } from '@/lib/pdf/bom-template'

export const maxDuration = 30

const unidadLabels: Record<string, string> = {
  KG: 'kg',
  G: 'g',
  UNIDAD: 'uds',
  LITRO: 'L',
  ML: 'ml',
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const productoId = searchParams.get('producto_id')

  const supabase = createServerSupabase()

  // 1. Fetch product(s) with category
  let productosQuery = supabase
    .from('productos')
    .select('*, categorias_producto(nombre)')
    .eq('activo', true)
    .order('nombre')

  if (productoId) {
    productosQuery = productosQuery.eq('id', Number(productoId))
  }

  const { data: productosRaw, error: prodError } = await productosQuery

  if (prodError || !productosRaw?.length) {
    return Response.json(
      { error: prodError?.message || 'No se encontraron productos' },
      { status: 404 }
    )
  }

  // 2. Fetch recipe ingredients joined with materias_primas
  const productoIds = productosRaw.map((p) => p.id)
  const { data: ingredientes, error: ingError } = await supabase
    .from('receta_ingredientes')
    .select('*, materias_primas(nombre, costo_unitario_actual, proveedor, unidad_medida)')
    .in('producto_id', productoIds)
    .order('id')

  if (ingError) {
    return Response.json({ error: ingError.message }, { status: 500 })
  }

  // 3. Build BomData
  const productos: BomProducto[] = productosRaw.map((p) => {
    const cat = p.categorias_producto as { nombre: string } | null
    const receta = (ingredientes ?? []).filter((i) => i.producto_id === p.id)

    let numero = 0
    const bomIngredientes = receta.map((ing) => {
      numero++
      const mp = ing.materias_primas as {
        nombre: string
        costo_unitario_actual: number | null
        proveedor: string | null
        unidad_medida: string
      } | null

      const costoUnitario = mp?.costo_unitario_actual ?? 0
      const costoTotal = costoUnitario * ing.cantidad_necesaria

      return {
        numero,
        material: mp?.nombre ?? `MP #${ing.materia_prima_id}`,
        cantidad: ing.cantidad_necesaria,
        unidad: unidadLabels[ing.unidad_medida] ?? ing.unidad_medida,
        costo_unitario: costoUnitario,
        costo_total: costoTotal,
        proveedor: mp?.proveedor ?? null,
      }
    })

    const costoTotal = bomIngredientes.reduce((sum, i) => sum + i.costo_total, 0)
    const margen = p.precio_venta - costoTotal
    const margenPct = p.precio_venta > 0 ? (margen / p.precio_venta) * 100 : 0

    return {
      nombre: p.nombre,
      sku: p.sku,
      presentacion: p.presentacion,
      peso_gramos: p.peso_gramos,
      precio_venta: p.precio_venta,
      categoria: cat?.nombre ?? 'Sin categoría',
      ingredientes: bomIngredientes,
      costo_total_materiales: costoTotal,
      margen_bruto: margen,
      margen_porcentaje: margenPct,
    }
  })

  const now = new Date()
  const fechaStr = now.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const docNumber = `BOM-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`

  const bomData: BomData = {
    productos,
    fecha_generacion: fechaStr,
    numero_documento: docNumber,
  }

  // 4. Generate PDF via Puppeteer
  const html = generateBomHtml(bomData)
  let browser
  try {
    browser = await getBrowser()
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdfBuffer = await page.pdf({
      format: 'letter',
      printBackground: true,
      margin: { top: '10mm', bottom: '15mm', left: '10mm', right: '10mm' },
    })
    await page.close()

    const filename = productoId
      ? `BOM-${productos[0]?.sku || productos[0]?.nombre || productoId}.pdf`
      : `BOM-Todos-${docNumber}.pdf`

    return new Response(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('PDF generation error:', err)
    return Response.json({ error: 'Error generando PDF' }, { status: 500 })
  } finally {
    if (browser) await browser.close()
  }
}
