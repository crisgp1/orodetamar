-- ============================================================
-- Migración: producto_imagenes — galería multi-imagen
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Tabla de imágenes por producto (galería)
CREATE TABLE IF NOT EXISTS public.producto_imagenes (
  id         SERIAL       PRIMARY KEY,
  producto_id INT         NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
  imagen_url  TEXT        NOT NULL,
  posicion    INT         NOT NULL DEFAULT 0,   -- 0 = portada, 1, 2, …
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para consultas por producto ordenadas por posición
CREATE INDEX idx_producto_imagenes_producto
  ON public.producto_imagenes(producto_id, posicion);

-- 2. Migrar datos existentes: copiar imagen_url → producto_imagenes
INSERT INTO public.producto_imagenes (producto_id, imagen_url, posicion)
SELECT id, imagen_url, 0
FROM public.productos
WHERE imagen_url IS NOT NULL;

-- 3. (Opcional) Verificar migración
-- SELECT p.id, p.nombre, p.imagen_url, pi.imagen_url AS galeria_url
-- FROM productos p
-- LEFT JOIN producto_imagenes pi ON pi.producto_id = p.id
-- WHERE p.imagen_url IS NOT NULL;
