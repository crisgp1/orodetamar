export type BomIngrediente = {
  numero: number
  material: string
  cantidad: number
  unidad: string
  costo_unitario: number
  costo_total: number
  proveedor: string | null
}

export type BomProducto = {
  nombre: string
  sku: string | null
  presentacion: string
  peso_gramos: number
  precio_venta: number
  categoria: string
  ingredientes: BomIngrediente[]
  costo_total_materiales: number
  margen_bruto: number
  margen_porcentaje: number
}

export type BomData = {
  productos: BomProducto[]
  fecha_generacion: string
  numero_documento: string
}

function formatMXN(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function productSection(prod: BomProducto, idx: number): string {
  const ingredientRows = prod.ingredientes
    .map(
      (ing, i) => `
        <tr class="${i % 2 === 1 ? 'alt-row' : ''}">
          <td style="text-align:center">${ing.numero}</td>
          <td>${ing.material}</td>
          <td style="text-align:right">${ing.cantidad}</td>
          <td style="text-align:center">${ing.unidad}</td>
          <td style="text-align:right">${formatMXN(ing.costo_unitario)}</td>
          <td style="text-align:right">${formatMXN(ing.costo_total)}</td>
          <td>${ing.proveedor ?? '—'}</td>
        </tr>`
    )
    .join('')

  const noReceta =
    prod.ingredientes.length === 0
      ? '<tr><td colspan="7" style="text-align:center;color:#999;padding:16px">Sin receta registrada</td></tr>'
      : ''

  return `
    ${idx > 0 ? '<div class="page-break"></div>' : ''}

    <div class="section-header">Informaci&oacute;n del Producto</div>
    <table class="info-table">
      <tr>
        <td class="info-label">Producto:</td>
        <td class="info-value">${prod.nombre}</td>
        <td class="info-label">SKU:</td>
        <td class="info-value">${prod.sku || 'N/A'}</td>
      </tr>
      <tr>
        <td class="info-label">Presentaci&oacute;n:</td>
        <td class="info-value">${prod.presentacion}</td>
        <td class="info-label">Peso:</td>
        <td class="info-value">${prod.peso_gramos}g</td>
      </tr>
      <tr>
        <td class="info-label">Categor&iacute;a:</td>
        <td class="info-value">${prod.categoria}</td>
        <td class="info-label">Precio de Venta:</td>
        <td class="info-value" style="font-weight:600">${formatMXN(prod.precio_venta)}</td>
      </tr>
    </table>

    <div class="section-header">Lista de Materiales / Bill of Materials</div>
    <table class="materials-table">
      <thead>
        <tr>
          <th style="width:36px">#</th>
          <th>Material</th>
          <th style="width:72px;text-align:right">Cantidad</th>
          <th style="width:56px;text-align:center">Unidad</th>
          <th style="width:90px;text-align:right">Costo Unit.</th>
          <th style="width:90px;text-align:right">Costo Total</th>
          <th style="width:110px">Proveedor</th>
        </tr>
      </thead>
      <tbody>
        ${ingredientRows}
        ${noReceta}
      </tbody>
    </table>

    <div class="summary-box">
      <table class="summary-table">
        <tr>
          <td class="summary-label">Costo Total de Materiales:</td>
          <td class="summary-value">${formatMXN(prod.costo_total_materiales)}</td>
        </tr>
        <tr>
          <td class="summary-label">Precio de Venta:</td>
          <td class="summary-value">${formatMXN(prod.precio_venta)}</td>
        </tr>
        <tr class="summary-highlight">
          <td class="summary-label">Margen Bruto:</td>
          <td class="summary-value">${formatMXN(prod.margen_bruto)} (${prod.margen_porcentaje.toFixed(1)}%)</td>
        </tr>
      </table>
    </div>
  `
}

export function generateBomHtml(data: BomData): string {
  const sections = data.productos.map((p, i) => productSection(p, i)).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Arial', 'Helvetica Neue', sans-serif;
      font-size: 10pt;
      color: #333;
      padding: 20mm 15mm 25mm;
    }

    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #1a1a2e;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .company-name {
      font-size: 18pt;
      font-weight: 700;
      color: #1a1a2e;
      letter-spacing: 0.5px;
    }
    .company-subtitle {
      font-size: 8pt;
      color: #666;
      margin-top: 2px;
    }
    .doc-info {
      text-align: right;
      font-size: 8pt;
      color: #555;
    }
    .doc-title {
      font-size: 12pt;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 2px;
    }
    .doc-info-row { margin-top: 2px; }
    .doc-info-label { color: #888; }

    .section-header {
      background-color: #e8e8e8;
      border-left: 4px solid #1a1a2e;
      padding: 6px 10px;
      font-size: 9pt;
      font-weight: 700;
      color: #1a1a2e;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin: 16px 0 8px 0;
    }

    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    .info-table td {
      padding: 4px 8px;
      font-size: 9pt;
      border-bottom: 1px solid #eee;
    }
    .info-label { color: #888; width: 120px; font-weight: 500; }
    .info-value { color: #333; }

    .materials-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    .materials-table th {
      background-color: #1a1a2e;
      color: white;
      padding: 7px 8px;
      font-size: 8pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      text-align: left;
    }
    .materials-table td {
      padding: 6px 8px;
      font-size: 9pt;
      border-bottom: 1px solid #e0e0e0;
    }
    .alt-row { background-color: #f7f7f7; }

    .summary-box {
      margin-top: 12px;
      margin-left: auto;
      width: 340px;
      border: 1px solid #ddd;
      border-radius: 2px;
    }
    .summary-table { width: 100%; border-collapse: collapse; }
    .summary-table td { padding: 6px 10px; font-size: 9pt; }
    .summary-label { color: #555; text-align: left; }
    .summary-value { text-align: right; font-weight: 600; }
    .summary-highlight {
      background-color: #e8f5e9;
      border-top: 2px solid #1a1a2e;
    }
    .summary-highlight .summary-value { color: #2e7d32; font-size: 10pt; }

    .doc-footer {
      position: fixed;
      bottom: 10mm;
      left: 15mm;
      right: 15mm;
      display: flex;
      justify-content: space-between;
      font-size: 7pt;
      color: #999;
      border-top: 1px solid #ddd;
      padding-top: 6px;
    }

    .page-break { page-break-before: always; }
  </style>
</head>
<body>
  <div class="doc-header">
    <div>
      <div class="company-name">Oro de Tamar</div>
      <div class="company-subtitle">Productos de D&aacute;til Premium</div>
    </div>
    <div class="doc-info">
      <div class="doc-title">Bill of Materials</div>
      <div style="font-size:10pt;font-weight:600;color:#555;margin-bottom:4px">Lista de Materiales</div>
      <div class="doc-info-row"><span class="doc-info-label">Documento:</span> ${data.numero_documento}</div>
      <div class="doc-info-row"><span class="doc-info-label">Fecha:</span> ${data.fecha_generacion}</div>
    </div>
  </div>

  ${sections}

  <div class="doc-footer">
    <span>Generado: ${data.fecha_generacion} | Oro de Tamar &mdash; Sistema de Gesti&oacute;n</span>
    <span>Documento: ${data.numero_documento}</span>
  </div>
</body>
</html>`
}
