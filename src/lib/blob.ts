import { put, del } from '@vercel/blob'

/* ──────────────────────────────────────────────────────────────
   Vercel Blob — helpers centralizados de upload
   Carpetas:
     comprobantes/  → recibos de pago de pedidos web
     productos/     → imágenes de producto (catálogo + admin)
   ────────────────────────────────────────────────────────────── */

const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_COMPROBANTE = [...ALLOWED_IMAGE, 'application/pdf']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

export type UploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string }

/** Validate file type + size */
function validate(
  file: File,
  allowedTypes: string[],
  maxSize = MAX_SIZE
): string | null {
  if (!allowedTypes.includes(file.type)) return 'INVALID_FILE_TYPE'
  if (file.size > maxSize) return 'FILE_TOO_LARGE'
  return null
}

/* ── Comprobantes de pago ── */

export async function uploadComprobante(
  pedidoId: number,
  file: File
): Promise<UploadResult> {
  const err = validate(file, ALLOWED_COMPROBANTE)
  if (err) return { ok: false, error: err }

  const ext = file.name.split('.').pop() || 'jpg'
  const pathname = `comprobantes/pedido-${pedidoId}/${Date.now()}.${ext}`

  try {
    const blob = await put(pathname, file, {
      access: 'public',
      contentType: file.type,
    })
    return { ok: true, url: blob.url }
  } catch (e) {
    console.error('[blob] comprobante upload error:', e)
    return { ok: false, error: 'UPLOAD_ERROR' }
  }
}

/* ── Imágenes de producto ── */

export async function uploadProductoImagen(
  sku: string,
  file: File
): Promise<UploadResult> {
  const err = validate(file, ALLOWED_IMAGE)
  if (err) return { ok: false, error: err }

  const ext = file.name.split('.').pop() || 'jpg'
  const safeSku = sku.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase()
  const pathname = `productos/${safeSku}-${Date.now()}.${ext}`

  try {
    const blob = await put(pathname, file, {
      access: 'public',
      contentType: file.type,
    })
    return { ok: true, url: blob.url }
  } catch (e) {
    console.error('[blob] producto upload error:', e)
    return { ok: false, error: 'UPLOAD_ERROR' }
  }
}

/* ── Eliminar blob por URL ── */

export async function deleteBlob(url: string): Promise<void> {
  try {
    await del(url)
  } catch (e) {
    console.error('[blob] delete error:', e)
  }
}
