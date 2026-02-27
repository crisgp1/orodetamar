-- ============================================================
-- ORO DE TAMAR — Migración E-commerce: Pedidos desde el sitio
-- Ejecutar en Supabase SQL Editor (en orden)
-- ============================================================


-- ─── 1. NUEVOS VALORES EN ENUMS ────────────────────────────

-- Estados de pedido: agregar flujo de pago
ALTER TYPE estado_pedido ADD VALUE IF NOT EXISTS 'PENDIENTE_PAGO' BEFORE 'RECIBIDO';
ALTER TYPE estado_pedido ADD VALUE IF NOT EXISTS 'PAGO_CONFIRMADO' AFTER 'RECIBIDO';

-- Método de pago: SPEI
ALTER TYPE metodo_pago ADD VALUE IF NOT EXISTS 'TRANSFERENCIA_SPEI';

-- Canal origen: sitio web
ALTER TYPE canal_origen ADD VALUE IF NOT EXISTS 'SITIO_WEB';


-- ─── 2. VINCULAR PERFILES (Clerk) CON CLIENTES ─────────────

ALTER TABLE public.perfiles
  ADD COLUMN IF NOT EXISTS cliente_id INT REFERENCES public.clientes(id);

CREATE INDEX IF NOT EXISTS idx_perfiles_cliente ON public.perfiles(cliente_id);


-- ─── 3. CAMPOS E-COMMERCE EN PEDIDOS ───────────────────────

-- Origen del pedido (WEB, WHATSAPP, PRESENCIAL, TELEFONO)
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS origen VARCHAR(20) DEFAULT 'PRESENCIAL';

-- Dirección de entrega específica de este pedido
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS direccion_entrega TEXT;

-- Teléfono de contacto para este pedido
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS telefono_contacto VARCHAR(20);

-- Quién hizo el pedido (usuario del sitio)
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS perfil_id INT REFERENCES public.perfiles(id);

-- Anticipo: si aplica y cuánto
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS requiere_anticipo BOOLEAN DEFAULT FALSE;

ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS monto_anticipo DECIMAL(10,2);

CREATE INDEX IF NOT EXISTS idx_pedidos_perfil ON public.pedidos(perfil_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_origen ON public.pedidos(origen);


-- ─── 4. TABLA DE COMPROBANTES DE PAGO ──────────────────────

CREATE TABLE IF NOT EXISTS public.pedido_comprobantes (
  id SERIAL PRIMARY KEY,
  pedido_id INT NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  imagen_url TEXT NOT NULL,
  monto_declarado DECIMAL(10,2),
  estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
    CHECK (estado IN ('PENDIENTE', 'APROBADO', 'RECHAZADO')),
  notas_admin TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revisado_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_comprobantes_pedido ON public.pedido_comprobantes(pedido_id);
CREATE INDEX IF NOT EXISTS idx_comprobantes_estado ON public.pedido_comprobantes(estado);

ALTER TABLE public.pedido_comprobantes ENABLE ROW LEVEL SECURITY;

-- Lectura: el dueño del pedido o staff
CREATE POLICY "Comprobantes: lectura auth"
  ON public.pedido_comprobantes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Comprobantes: escritura auth"
  ON public.pedido_comprobantes FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');


-- ─── 5. DATOS BANCARIOS DE LA EMPRESA ──────────────────────

INSERT INTO public.empresa_info (clave, titulo, contenido, orden) VALUES
  ('banco_nombre',       'Banco',        '[NOMBRE DEL BANCO]', 10),
  ('banco_clabe',        'CLABE',        '[18 DÍGITOS]',       11),
  ('banco_beneficiario', 'Beneficiario', '[NOMBRE TITULAR]',   12)
ON CONFLICT (clave) DO NOTHING;


-- ─── 6. STORAGE BUCKET PARA COMPROBANTES ────────────────────
-- Ejecutar en Supabase Dashboard > Storage > New Bucket:
--   Nombre: comprobantes
--   Public: false
--   File size limit: 5MB
--   Allowed MIME types: image/jpeg, image/png, image/webp, application/pdf
--
-- Políticas de storage (ejecutar en SQL Editor):

-- INSERT: cualquier usuario autenticado puede subir
-- SELECT: cualquier usuario autenticado puede leer
-- Estas son políticas de STORAGE, no de tablas.
-- Se configuran desde Dashboard > Storage > comprobantes > Policies


-- ─── 7. VERIFICACIÓN ───────────────────────────────────────

-- Ver nuevos campos en pedidos
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'pedidos'
ORDER BY ordinal_position;

-- Ver tabla comprobantes
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'pedido_comprobantes'
ORDER BY ordinal_position;

-- Ver datos bancarios
SELECT clave, titulo, contenido FROM public.empresa_info WHERE clave LIKE 'banco_%';
