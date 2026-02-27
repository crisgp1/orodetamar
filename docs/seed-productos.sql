-- ============================================================
-- ORO DE TAMAR — Insert completo de categorías y productos
-- Ejecutar en Supabase SQL Editor
-- Basado en entrevista con dueños (Feb 2026)
-- ============================================================
-- NOTA: Usa ON CONFLICT para ser idempotente (se puede correr
-- varias veces sin duplicar datos).
-- ============================================================


-- ─── 1. CATEGORÍAS (3) ─────────────────────────────────────
-- Vida útil en días. Datos del dueño:
--   Dátil natural:   ~18 meses ambiente, 2-3 años refri, 3-4 años congelado
--   Pulpa enchilosa: ~6 meses ambiente, ~1 año refri
--   Bolita de dátil: ~6 meses ambiente, ~9 meses refri

INSERT INTO public.categorias_producto
  (nombre, descripcion, vida_util_dias_ambiente, vida_util_dias_refrigerado, vida_util_dias_congelado, beneficios_salud)
VALUES
  (
    'Dátil Natural',
    'Dátil medjool limpio y empacado sin procesamiento adicional. Producto base de Oro de Tamar. Cultivado en el Valle de Mexicali. El dátil retornado de consignación se limpia y reprocesa para pulpa enchilosa.',
    540,   -- ~18 meses
    1095,  -- ~3 años
    1460,  -- ~4 años
    'Beneficioso para el estómago y el área digestiva. Regenera las células del cuerpo. Rico en vitaminas (A, B, K) y minerales (potasio, magnesio, hierro). Fuente natural de energía. Alto contenido de fibra. Origen: Valle de Mexicali / Valle de Coachella.'
  ),
  (
    'Pulpa Enchilosa',
    'Derivado del dátil: dátil sin semilla mezclado con chile y chamoy. Se elabora con dátil fresco o retornado de consignación (reprocesado). Producto estrella junto al dátil natural.',
    180,   -- ~6 meses
    365,   -- ~1 año
    NULL,
    'Mismos beneficios del dátil natural con el plus de capsaicina del chile, que activa el metabolismo. Sabor único mexicano. El chile aporta vitamina C adicional.'
  ),
  (
    'Bolita de Dátil',
    'Bolita de dátil cubierta de chocolate. Snack saludable y energético. Producto innovador que diferencia a Oro de Tamar de otros productores de dátil.',
    180,   -- ~6 meses
    270,   -- ~9 meses
    NULL,
    'Snack saludable con antioxidantes del chocolate y nutrientes del dátil. Ideal para energía rápida. Combinación de fibra natural del dátil con los flavonoides del cacao.'
  )
ON CONFLICT DO NOTHING;


-- ─── 2. PRODUCTOS (13) ─────────────────────────────────────
-- SKU format: DN = Dátil Natural, PE = Pulpa Enchilosa, BC = Bolita Chocolate
--             B = bolsa, CH = charolita, C = caja
--
-- Precios en MXN. precio_mayoreo = precio para 5+ unidades (NULL si no aplica).
-- es_snack = TRUE para presentaciones ≤300g orientadas a stand/impulso.
--
-- IMPORTANTE: Ajustar categoria_id si los IDs en tu BD son distintos.
-- Para saberlos: SELECT id, nombre FROM categorias_producto;

DO $$
DECLARE
  cat_datil   INT;
  cat_pulpa   INT;
  cat_bolita  INT;
BEGIN
  SELECT id INTO cat_datil  FROM public.categorias_producto WHERE nombre = 'Dátil Natural'   LIMIT 1;
  SELECT id INTO cat_pulpa  FROM public.categorias_producto WHERE nombre = 'Pulpa Enchilosa' LIMIT 1;
  SELECT id INTO cat_bolita FROM public.categorias_producto WHERE nombre = 'Bolita de Dátil' LIMIT 1;

  -- ── Dátil Natural (6 presentaciones) ──
  INSERT INTO public.productos (categoria_id, nombre, presentacion, peso_gramos, precio_venta, precio_mayoreo, sku, es_snack, activo) VALUES
    (cat_datil, 'Dátil Natural',         'bolsa',  200,    60.00,  NULL,    'DN-B-200',   TRUE,  TRUE),
    (cat_datil, 'Dátil Natural',         'bolsa',  300,    85.00,  NULL,    'DN-B-300',   TRUE,  TRUE),
    (cat_datil, 'Dátil Natural',         'bolsa',  500,   150.00,  NULL,    'DN-B-500',   FALSE, TRUE),
    (cat_datil, 'Dátil Natural',         'bolsa', 1000,   280.00,  NULL,    'DN-B-1000',  FALSE, TRUE),
    (cat_datil, 'Dátil Natural',         'caja',  5000,  1200.00, 1050.00, 'DN-C-5000',  FALSE, TRUE),
    (cat_datil, 'Dátil Natural',         'caja', 10000,  2200.00, 1900.00, 'DN-C-10000', FALSE, TRUE)
  ON CONFLICT (sku) DO NOTHING;

  -- ── Pulpa Enchilosa (4 presentaciones) ──
  INSERT INTO public.productos (categoria_id, nombre, presentacion, peso_gramos, precio_venta, precio_mayoreo, sku, es_snack, activo) VALUES
    (cat_pulpa, 'Pulpa Enchilosa',       'charolita', 200,   75.00,  NULL,   'PE-CH-200',  TRUE,  TRUE),
    (cat_pulpa, 'Pulpa Enchilosa',       'charolita', 300,  110.00,  NULL,   'PE-CH-300',  FALSE, TRUE),
    (cat_pulpa, 'Pulpa Enchilosa',       'bolsa',     500,  180.00,  NULL,   'PE-B-500',   FALSE, TRUE),
    (cat_pulpa, 'Pulpa Enchilosa',       'bolsa',    1000,  340.00,  NULL,   'PE-B-1000',  FALSE, TRUE)
  ON CONFLICT (sku) DO NOTHING;

  -- ── Bolitas de Dátil con Chocolate (3 presentaciones) ──
  INSERT INTO public.productos (categoria_id, nombre, presentacion, peso_gramos, precio_venta, precio_mayoreo, sku, es_snack, activo) VALUES
    (cat_bolita, 'Bolitas de Dátil con Chocolate', 'bolsa', 200,   80.00,  NULL,   'BC-B-200',  TRUE,  TRUE),
    (cat_bolita, 'Bolitas de Dátil con Chocolate', 'bolsa', 300,  115.00,  NULL,   'BC-B-300',  TRUE,  TRUE),
    (cat_bolita, 'Bolitas de Dátil con Chocolate', 'bolsa', 500,  180.00,  NULL,   'BC-B-500',  FALSE, TRUE)
  ON CONFLICT (sku) DO NOTHING;

  -- ── Crear inventario inicial (cantidad 0) para productos nuevos ──
  INSERT INTO public.inventario (producto_id, cantidad_disponible)
  SELECT p.id, 0
  FROM public.productos p
  LEFT JOIN public.inventario i ON i.producto_id = p.id
  WHERE i.id IS NULL;

END $$;


-- ─── 3. VERIFICACIÓN ───────────────────────────────────────
-- Ejecuta esto después para verificar que todo se insertó bien:

SELECT
  p.id,
  cp.nombre AS categoria,
  p.nombre,
  p.presentacion,
  p.peso_gramos || 'g' AS peso,
  '$' || p.precio_venta AS precio,
  COALESCE('$' || p.precio_mayoreo, '—') AS mayoreo,
  p.sku,
  CASE WHEN p.es_snack THEN '✓' ELSE '' END AS snack,
  COALESCE(i.cantidad_disponible, 0) AS stock
FROM public.productos p
JOIN public.categorias_producto cp ON cp.id = p.categoria_id
LEFT JOIN public.inventario i ON i.producto_id = p.id
WHERE p.activo = TRUE
ORDER BY p.categoria_id, p.peso_gramos;
