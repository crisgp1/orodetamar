-- ============================================================
-- MIGRACIÓN: columna anulada + vista v_ventas_stand
-- ============================================================
-- Ejecutar en Supabase SQL Editor.
-- Seguro de re-ejecutar (IF NOT EXISTS / CREATE OR REPLACE).
-- ============================================================

-- 1. Columna anulada en ventas_stand
ALTER TABLE ventas_stand ADD COLUMN IF NOT EXISTS anulada BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Vista v_ventas_stand (timezone Tijuana)
CREATE OR REPLACE VIEW v_ventas_stand AS
SELECT
  vs.id,
  vs.ubicacion_id,
  vs.fecha,
  vs.producto_id,
  vs.cantidad_vendida,
  vs.total,
  vs.metodo_pago,
  vs.notas,
  vs.anulada,
  vs.created_at,
  (vs.created_at AT TIME ZONE 'America/Tijuana')::date AS fecha_local,
  p.nombre AS producto_nombre,
  p.presentacion AS producto_presentacion,
  p.precio_venta AS producto_precio,
  u.nombre AS ubicacion_nombre
FROM ventas_stand vs
LEFT JOIN productos p ON p.id = vs.producto_id
LEFT JOIN ubicaciones u ON u.id = vs.ubicacion_id
WHERE vs.anulada = FALSE;
