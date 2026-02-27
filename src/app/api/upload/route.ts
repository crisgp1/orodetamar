import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { uploadProductoImagen, uploadComprobante } from '@/lib/blob'

/**
 * POST /api/upload?folder=productos&sku=DN-B-200
 * POST /api/upload?folder=comprobantes&pedidoId=42
 *
 * Body: raw file (binary) — NOT FormData.
 * Headers: Content-Type must match the file MIME type.
 *
 * Returns: { url: string }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'NO_AUTH' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const folder = searchParams.get('folder')
  const filename = searchParams.get('filename') ?? 'file.jpg'

  if (!req.body) {
    return NextResponse.json({ error: 'NO_BODY' }, { status: 400 })
  }

  // Convert ReadableStream to File
  const contentType = req.headers.get('content-type') ?? 'application/octet-stream'
  const bytes = await req.arrayBuffer()
  const file = new File([bytes], filename, { type: contentType })

  if (folder === 'productos') {
    const sku = searchParams.get('sku') ?? 'sin-sku'
    const result = await uploadProductoImagen(sku, file)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json({ url: result.url })
  }

  if (folder === 'comprobantes') {
    const pedidoId = Number(searchParams.get('pedidoId'))
    if (!pedidoId) {
      return NextResponse.json({ error: 'MISSING_PEDIDO_ID' }, { status: 400 })
    }
    const result = await uploadComprobante(pedidoId, file)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json({ url: result.url })
  }

  return NextResponse.json({ error: 'INVALID_FOLDER' }, { status: 400 })
}
