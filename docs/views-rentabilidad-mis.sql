-- ============================================================
-- Vistas para módulo Rentabilidad MIS
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Vista consolidada de ingresos por canal
-- Combina ventas stand, cobros consignación y pedidos entregados
CREATE OR REPLACE VIEW v_ingresos_consolidados AS

-- Canal: STAND
SELECT
  'STAND' AS canal,
  vs.producto_id,
  p.nombre AS producto_nombre,
  p.presentacion,
  vs.cantidad_vendida,
  vs.total AS monto,
  vs.metodo_pago,
  (vs.created_at AT TIME ZONE 'America/Tijuana')::date AS fecha,
  vs.created_at
FROM ventas_stand vs
JOIN productos p ON p.id = vs.producto_id
WHERE vs.anulada = FALSE

UNION ALL

-- Canal: CONSIGNACION (cobros)
SELECT
  'CONSIGNACION' AS canal,
  cd.producto_id,
  p.nombre AS producto_nombre,
  p.presentacion,
  cd.cantidad_vendida,
  cd.cantidad_vendida * cd.precio_unitario AS monto,
  NULL::text AS metodo_pago,
  c.fecha_entrega::date AS fecha,
  c.created_at
FROM consignacion_detalle cd
JOIN consignaciones c ON c.id = cd.consignacion_id
JOIN productos p ON p.id = cd.producto_id
WHERE c.estado NOT IN ('CANCELADA')
  AND cd.cantidad_vendida > 0

UNION ALL

-- Canal: PEDIDOS (entregados)
SELECT
  'PEDIDO' AS canal,
  pd.producto_id,
  p.nombre AS producto_nombre,
  p.presentacion,
  pd.cantidad AS cantidad_vendida,
  pd.subtotal AS monto,
  NULL::text AS metodo_pago,
  pe.fecha_entrega_real::date AS fecha,
  pe.created_at
FROM pedido_detalle pd
JOIN pedidos pe ON pe.id = pd.pedido_id
JOIN productos p ON p.id = pd.producto_id
WHERE pe.estado = 'ENTREGADO';

-- 2. Vista de costos de producción por periodo
-- Costo de materias primas consumidas basado en recetas
CREATE OR REPLACE VIEW v_costos_produccion_periodo AS
SELECT
  p.id AS producto_id,
  p.nombre AS producto_nombre,
  p.presentacion,
  p.precio_venta,
  COALESCE(SUM(
    ri.cantidad_necesaria * COALESCE(mp.costo_unitario_actual, 0)
  ), 0) AS costo_unitario,
  CASE
    WHEN p.precio_venta > 0
    THEN ROUND(
      ((p.precio_venta - COALESCE(SUM(ri.cantidad_necesaria * COALESCE(mp.costo_unitario_actual, 0)), 0))
       / p.precio_venta * 100)::numeric, 1
    )
    ELSE 0
  END AS margen_porcentaje
FROM productos p
LEFT JOIN receta_ingredientes ri ON ri.producto_id = p.id
LEFT JOIN materias_primas mp ON mp.id = ri.materia_prima_id
WHERE p.activo = TRUE
GROUP BY p.id, p.nombre, p.presentacion, p.precio_venta;
  