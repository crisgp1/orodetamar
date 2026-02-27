-- ============================================================
-- ORO DE TAMAR — Referencia Completa de Base de Datos
-- Estado actual de la BD en Supabase PostgreSQL 16+
-- Incluye: DDL + DML + DCL (post-migración Clerk)
-- Para uso como contexto en Claude Code
-- ============================================================


-- ████████████████████████████████████████████████████████████
-- DDL — DATA DEFINITION LANGUAGE
-- Estructura: extensiones, enums, tablas, constraints,
--             índices, funciones, triggers, vistas
-- ████████████████████████████████████████████████████████████


-- ============================================================
-- EXTENSIONES
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- ENUMS (11)
-- ============================================================

CREATE TYPE tipo_cliente AS ENUM (
  'CONSUMIDOR_FINAL',   -- Cliente que compra para consumo propio
  'RESTAURANTE',        -- Restaurante o cafetería
  'ABARROTES',          -- Tienda de abarrotes
  'MERCADO',            -- Puesto en mercado
  'MAYORISTA',          -- Compra en volumen (5kg+)
  'CONSIGNACION'        -- Negocio que recibe producto en consignación
);

CREATE TYPE modalidad_pago AS ENUM (
  'CONTADO',            -- Paga al recibir
  'CONSIGNACION'        -- Paga lo vendido después
);

CREATE TYPE canal_origen AS ENUM (
  'RECOMENDACION',      -- Referido por otro cliente (cadena de referidos)
  'PUNTO_DE_VENTA',     -- Lo conoció en el stand
  'FACEBOOK',           -- Redes sociales
  'WHATSAPP',           -- Contacto directo por WhatsApp
  'VISITA_DIRECTA',     -- El dueño visitó el negocio
  'OTRO'
);

CREATE TYPE estado_pedido AS ENUM (
  'RECIBIDO',           -- Pedido recién registrado
  'EN_PREPARACION',     -- Se está armando el pedido
  'LISTO',              -- Empacado, esperando entrega
  'EN_RUTA',            -- En camino al cliente
  'ENTREGADO',          -- Entregado y cobrado
  'CANCELADO'           -- Cancelado por cliente o por falta de stock
);

CREATE TYPE estado_consignacion AS ENUM (
  'ACTIVA',             -- Producto dejado, esperando revisión
  'EN_REVISION',        -- Se está contando vendido vs retornado
  'SALDO_PENDIENTE',    -- Ya se revisó pero falta cobrar
  'LIQUIDADA',          -- Todo cobrado, consignación cerrada
  'CANCELADA'           -- Cancelada (todo retornado sin venta)
);

CREATE TYPE tipo_movimiento AS ENUM (
  'PRODUCCION',            -- +stock: se produjo/empacó producto
  'VENTA',                 -- -stock: venta directa en stand o pedido
  'CONSIGNACION_SALIDA',   -- -stock: producto sale a consignación
  'CONSIGNACION_RETORNO',  -- +stock: producto regresa de consignación a inventario
  'REPROCESAMIENTO',       -- -stock origen / +stock destino: dátil retornado → pulpa enchilosa
  'MERMA',                 -- -stock: producto dañado, caducado, perdido
  'AJUSTE'                 -- ±stock: corrección manual de inventario
);

CREATE TYPE destino_retorno AS ENUM (
  'INVENTARIO',            -- Producto retornado regresa al stock disponible
  'REPROCESAMIENTO_PULPA'  -- Dátil retornado se convierte en pulpa enchilosa
);

CREATE TYPE metodo_pago AS ENUM (
  'EFECTIVO',
  'TRANSFERENCIA'
);

CREATE TYPE zona_ubicacion AS ENUM (
  'TURISTICA',    -- Zona con turismo (Pabellón Zona Dorada)
  'POPULAR',      -- Zona residencial/popular (sobre ruedas)
  'COMERCIAL'     -- Zona comercial (SmartFit, plazas)
);

CREATE TYPE prioridad_ubicacion AS ENUM (
  'ALTA',         -- Ubicación prioritaria (más venta)
  'NORMAL'
);

CREATE TYPE rol_usuario AS ENUM (
  'ADMIN',        -- Acceso total (dueño)
  'APOYO',        -- Acceso limitado (familiar que ayuda)
  'CLIENTE'       -- Mínimo privilegio (usuario que se registra)
);


-- ============================================================
-- TABLAS (17) — Estado actual post-migración Clerk
-- ============================================================

-- ─── PERFILES (sincronizada vía webhook de Clerk) ───────────
-- NO referencia auth.users. El clerk_id viene del webhook.
-- El rol también se guarda en Clerk publicMetadata para auth rápido.

CREATE TABLE public.perfiles (
  id SERIAL PRIMARY KEY,
  clerk_id TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  rol rol_usuario NOT NULL DEFAULT 'CLIENTE',
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── CATEGORÍAS DE PRODUCTO ─────────────────────────────────

CREATE TABLE public.categorias_producto (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  vida_util_dias_ambiente INT,
  vida_util_dias_refrigerado INT,
  vida_util_dias_congelado INT,
  beneficios_salud TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── PRODUCTOS ──────────────────────────────────────────────

CREATE TABLE public.productos (
  id SERIAL PRIMARY KEY,
  categoria_id INT NOT NULL REFERENCES public.categorias_producto(id),
  nombre VARCHAR(150) NOT NULL,
  presentacion VARCHAR(50) NOT NULL,        -- 'bolsa', 'charolita', 'caja'
  peso_gramos INT NOT NULL,
  precio_venta DECIMAL(10,2) NOT NULL,
  precio_mayoreo DECIMAL(10,2),             -- NULL si no aplica
  sku VARCHAR(50) UNIQUE,                   -- Formato: DN-B-200, PE-CH-300, BC-B-200
  es_snack BOOLEAN NOT NULL DEFAULT FALSE,  -- TRUE = presentación chica para stand
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  imagen_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── CLIENTES ───────────────────────────────────────────────

CREATE TABLE public.clientes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  telefono VARCHAR(20),
  whatsapp VARCHAR(20),                     -- Formato: 5216611234567
  email VARCHAR(150),
  tipo tipo_cliente NOT NULL DEFAULT 'CONSUMIDOR_FINAL',
  modalidad_pago modalidad_pago NOT NULL DEFAULT 'CONTADO',
  canal_origen canal_origen,
  referido_por_id INT REFERENCES public.clientes(id),  -- Self-reference para cadena de referidos
  direccion TEXT,
  ciudad VARCHAR(100),
  notas TEXT,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── PEDIDOS ────────────────────────────────────────────────

CREATE TABLE public.pedidos (
  id SERIAL PRIMARY KEY,
  cliente_id INT NOT NULL REFERENCES public.clientes(id),
  fecha_pedido TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_entrega_min DATE,                   -- Rango entrega: día mínimo
  fecha_entrega_max DATE,                   -- Rango entrega: día máximo (típico 2-3 días)
  fecha_entrega_real TIMESTAMPTZ,
  estado estado_pedido NOT NULL DEFAULT 'RECIBIDO',
  canal_venta VARCHAR(50),                  -- 'whatsapp', 'telefono', 'presencial'
  subtotal DECIMAL(10,2),
  total DECIMAL(10,2),
  tiene_delay BOOLEAN NOT NULL DEFAULT FALSE,  -- Indica retraso en preparación
  delay_motivo TEXT,                           -- Motivo del retraso
  fecha_entrega_estimada DATE,                 -- Fecha estimada de entrega (admin)
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.pedido_detalle (
  id SERIAL PRIMARY KEY,
  pedido_id INT NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  producto_id INT NOT NULL REFERENCES public.productos(id),
  cantidad INT NOT NULL CHECK (cantidad > 0),
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL
);

CREATE TABLE public.pedido_pagos (
  id SERIAL PRIMARY KEY,
  pedido_id INT NOT NULL REFERENCES public.pedidos(id),
  monto DECIMAL(10,2) NOT NULL CHECK (monto > 0),
  metodo_pago metodo_pago NOT NULL,
  fecha_pago TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notas TEXT
);

-- ─── CONSIGNACIONES ─────────────────────────────────────────
-- Ciclo: ACTIVA → EN_REVISION → SALDO_PENDIENTE → LIQUIDADA

CREATE TABLE public.consignaciones (
  id SERIAL PRIMARY KEY,
  cliente_id INT NOT NULL REFERENCES public.clientes(id),
  fecha_entrega DATE NOT NULL,              -- Día que se dejó el producto
  fecha_revision DATE,                      -- Día que se contó vendido/retornado
  fecha_liquidacion DATE,                   -- Día que se cobró todo
  estado estado_consignacion NOT NULL DEFAULT 'ACTIVA',
  total_vendido DECIMAL(10,2) NOT NULL DEFAULT 0,   -- Σ(cantidad_vendida × precio_unitario)
  total_cobrado DECIMAL(10,2) NOT NULL DEFAULT 0,   -- Σ pagos recibidos
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.consignacion_detalle (
  id SERIAL PRIMARY KEY,
  consignacion_id INT NOT NULL REFERENCES public.consignaciones(id) ON DELETE CASCADE,
  producto_id INT NOT NULL REFERENCES public.productos(id),
  cantidad_dejada INT NOT NULL CHECK (cantidad_dejada > 0),
  cantidad_vendida INT NOT NULL DEFAULT 0 CHECK (cantidad_vendida >= 0),
  cantidad_retornada INT NOT NULL DEFAULT 0 CHECK (cantidad_retornada >= 0),
  precio_unitario DECIMAL(10,2) NOT NULL,
  destino_retorno destino_retorno,          -- NULL hasta liquidación; INVENTARIO o REPROCESAMIENTO_PULPA
  -- CONSTRAINT CRÍTICO: lo vendido + retornado no puede exceder lo dejado
  CONSTRAINT chk_cantidades CHECK (cantidad_vendida + cantidad_retornada <= cantidad_dejada)
);

CREATE TABLE public.consignacion_pagos (
  id SERIAL PRIMARY KEY,
  consignacion_id INT NOT NULL REFERENCES public.consignaciones(id),
  monto DECIMAL(10,2) NOT NULL CHECK (monto > 0),
  metodo_pago metodo_pago NOT NULL,
  fecha_pago TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notas TEXT
);

-- ─── INVENTARIO ─────────────────────────────────────────────
-- cantidad_disponible se actualiza automáticamente vía trigger trg_actualizar_inventario

CREATE TABLE public.inventario (
  id SERIAL PRIMARY KEY,
  producto_id INT NOT NULL UNIQUE REFERENCES public.productos(id),
  cantidad_disponible INT NOT NULL DEFAULT 0,
  ultima_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cada movimiento = un registro auditable. El trigger suma/resta automáticamente.
-- cantidad positiva = entrada, negativa = salida.

CREATE TABLE public.movimientos_inventario (
  id SERIAL PRIMARY KEY,
  producto_id INT NOT NULL REFERENCES public.productos(id),
  tipo tipo_movimiento NOT NULL,
  cantidad INT NOT NULL,                    -- +entrada / -salida
  producto_origen_id INT REFERENCES public.productos(id),  -- Solo para REPROCESAMIENTO (traza origen→destino)
  pedido_id INT REFERENCES public.pedidos(id),             -- Si el movimiento viene de un pedido
  consignacion_id INT REFERENCES public.consignaciones(id),-- Si el movimiento viene de una consignación
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── UBICACIONES Y STAND MÓVIL ──────────────────────────────

CREATE TABLE public.ubicaciones (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  direccion TEXT,
  ciudad VARCHAR(100),
  latitud DECIMAL(10,7),
  longitud DECIMAL(10,7),
  zona zona_ubicacion,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.ruta_semanal (
  id SERIAL PRIMARY KEY,
  ubicacion_id INT NOT NULL REFERENCES public.ubicaciones(id) ON DELETE CASCADE,
  dia_semana SMALLINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),  -- 0=lunes, 6=domingo
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  prioridad prioridad_ubicacion NOT NULL DEFAULT 'NORMAL',
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(dia_semana, ubicacion_id),
  CONSTRAINT chk_horario CHECK (hora_fin > hora_inicio)
);

CREATE TABLE public.ventas_stand (
  id SERIAL PRIMARY KEY,
  ubicacion_id INT NOT NULL REFERENCES public.ubicaciones(id),
  fecha DATE NOT NULL,
  producto_id INT NOT NULL REFERENCES public.productos(id),
  cantidad_vendida INT NOT NULL CHECK (cantidad_vendida > 0),
  total DECIMAL(10,2) NOT NULL CHECK (total > 0),
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── CONTENIDO PÚBLICO ──────────────────────────────────────

CREATE TABLE public.empresa_info (
  id SERIAL PRIMARY KEY,
  clave VARCHAR(50) NOT NULL UNIQUE,        -- 'historia', 'mision', 'vision', 'valores', 'origen_datil', 'beneficios'
  titulo VARCHAR(200),
  contenido TEXT NOT NULL,
  orden INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.premios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  otorgado_por VARCHAR(200),
  fecha DATE,
  descripcion TEXT,
  imagen_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- ÍNDICES (20+)
-- ============================================================

-- Perfiles
CREATE INDEX idx_perfiles_clerk_id ON public.perfiles(clerk_id);
CREATE INDEX idx_perfiles_email ON public.perfiles(email);

-- Productos
CREATE INDEX idx_productos_categoria ON public.productos(categoria_id);
CREATE INDEX idx_productos_activo ON public.productos(activo);
CREATE INDEX idx_productos_sku ON public.productos(sku);

-- Clientes
CREATE INDEX idx_clientes_tipo ON public.clientes(tipo);
CREATE INDEX idx_clientes_modalidad ON public.clientes(modalidad_pago);
CREATE INDEX idx_clientes_referido ON public.clientes(referido_por_id);
CREATE INDEX idx_clientes_ciudad ON public.clientes(ciudad);
CREATE INDEX idx_clientes_activo ON public.clientes(activo);

-- Pedidos
CREATE INDEX idx_pedidos_cliente ON public.pedidos(cliente_id);
CREATE INDEX idx_pedidos_estado ON public.pedidos(estado);
CREATE INDEX idx_pedidos_fecha ON public.pedidos(fecha_pedido);

-- Consignaciones
CREATE INDEX idx_consignaciones_cliente ON public.consignaciones(cliente_id);
CREATE INDEX idx_consignaciones_estado ON public.consignaciones(estado);
CREATE INDEX idx_consignaciones_fecha ON public.consignaciones(fecha_entrega);

-- Inventario / Movimientos
CREATE INDEX idx_movimientos_producto ON public.movimientos_inventario(producto_id);
CREATE INDEX idx_movimientos_tipo ON public.movimientos_inventario(tipo);
CREATE INDEX idx_movimientos_fecha ON public.movimientos_inventario(created_at);
CREATE INDEX idx_movimientos_consignacion ON public.movimientos_inventario(consignacion_id);
CREATE INDEX idx_movimientos_pedido ON public.movimientos_inventario(pedido_id);

-- Stand / Ventas / Ruta
CREATE INDEX idx_ventas_stand_fecha ON public.ventas_stand(fecha);
CREATE INDEX idx_ventas_stand_ubicacion ON public.ventas_stand(ubicacion_id);
CREATE INDEX idx_ventas_stand_producto ON public.ventas_stand(producto_id);
CREATE INDEX idx_ruta_dia ON public.ruta_semanal(dia_semana);


-- ============================================================
-- FUNCIONES (5)
-- ============================================================

-- Saldo pendiente de una consignación (computed column)
CREATE OR REPLACE FUNCTION public.saldo_pendiente(consig public.consignaciones)
RETURNS DECIMAL(10,2) AS $
  SELECT consig.total_vendido - consig.total_cobrado;
$ LANGUAGE SQL IMMUTABLE;

-- Días transcurridos desde entrega de consignación
CREATE OR REPLACE FUNCTION public.dias_transcurridos(consig public.consignaciones)
RETURNS INT AS $
  SELECT (CURRENT_DATE - consig.fecha_entrega)::INT;
$ LANGUAGE SQL STABLE;

-- Total dejado (valorizado) de una consignación
CREATE OR REPLACE FUNCTION public.total_dejado(consig_id INT)
RETURNS DECIMAL(10,2) AS $
  SELECT COALESCE(SUM(cantidad_dejada * precio_unitario), 0)
  FROM public.consignacion_detalle
  WHERE consignacion_id = consig_id;
$ LANGUAGE SQL STABLE;

-- Auto-actualizar inventario al insertar movimiento
CREATE OR REPLACE FUNCTION public.fn_actualizar_inventario()
RETURNS TRIGGER AS $
BEGIN
  INSERT INTO public.inventario (producto_id, cantidad_disponible, ultima_actualizacion)
  VALUES (NEW.producto_id, NEW.cantidad, NOW())
  ON CONFLICT (producto_id)
  DO UPDATE SET
    cantidad_disponible = public.inventario.cantidad_disponible + NEW.cantidad,
    ultima_actualizacion = NOW();
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Auto-actualizar updated_at
CREATE OR REPLACE FUNCTION public.fn_updated_at()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$ LANGUAGE plpgsql;


-- ============================================================
-- TRIGGERS (7)
-- ============================================================

-- Inventario: auto-actualiza stock al insertar movimiento
CREATE TRIGGER trg_actualizar_inventario
  AFTER INSERT ON public.movimientos_inventario
  FOR EACH ROW EXECUTE FUNCTION public.fn_actualizar_inventario();

-- Updated_at en tablas principales
CREATE TRIGGER trg_perfiles_updated BEFORE UPDATE ON public.perfiles FOR EACH ROW EXECUTE FUNCTION public.fn_updated_at();
CREATE TRIGGER trg_productos_updated BEFORE UPDATE ON public.productos FOR EACH ROW EXECUTE FUNCTION public.fn_updated_at();
CREATE TRIGGER trg_clientes_updated BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.fn_updated_at();
CREATE TRIGGER trg_pedidos_updated BEFORE UPDATE ON public.pedidos FOR EACH ROW EXECUTE FUNCTION public.fn_updated_at();
CREATE TRIGGER trg_consignaciones_updated BEFORE UPDATE ON public.consignaciones FOR EACH ROW EXECUTE FUNCTION public.fn_updated_at();
CREATE TRIGGER trg_empresa_info_updated BEFORE UPDATE ON public.empresa_info FOR EACH ROW EXECUTE FUNCTION public.fn_updated_at();

-- NOTA: NO existe trigger fn_crear_perfil (eliminado en migración Clerk).
-- Los perfiles se crean vía webhook de Clerk, no vía auth.users.


-- ============================================================
-- VISTAS (5)
-- ============================================================

-- Stock actual con info de producto y alertas
CREATE OR REPLACE VIEW public.v_stock_actual AS
SELECT
  i.producto_id,
  p.nombre AS producto_nombre,
  p.sku,
  cp.nombre AS categoria,
  p.presentacion,
  p.peso_gramos,
  p.precio_venta,
  i.cantidad_disponible,
  i.ultima_actualizacion,
  CASE
    WHEN i.cantidad_disponible = 0 THEN 'AGOTADO'
    WHEN i.cantidad_disponible < 10 THEN 'STOCK_BAJO'
    ELSE 'OK'
  END AS alerta
FROM public.inventario i
JOIN public.productos p ON p.id = i.producto_id
JOIN public.categorias_producto cp ON cp.id = p.categoria_id
WHERE p.activo = TRUE
ORDER BY i.cantidad_disponible ASC;

-- Consignaciones activas con saldos calculados
CREATE OR REPLACE VIEW public.v_consignaciones_activas AS
SELECT
  c.id,
  c.cliente_id,
  cl.nombre AS cliente_nombre,
  c.estado,
  c.fecha_entrega,
  (CURRENT_DATE - c.fecha_entrega)::INT AS dias_transcurridos,
  public.total_dejado(c.id) AS total_dejado,
  c.total_vendido,
  c.total_cobrado,
  (c.total_vendido - c.total_cobrado) AS saldo_pendiente,
  c.created_at
FROM public.consignaciones c
JOIN public.clientes cl ON cl.id = c.cliente_id
WHERE c.estado IN ('ACTIVA', 'EN_REVISION', 'SALDO_PENDIENTE')
ORDER BY c.fecha_entrega ASC;

-- Ruta del día actual (filtra por día de la semana)
CREATE OR REPLACE VIEW public.v_ruta_hoy AS
SELECT
  r.dia_semana,
  CASE r.dia_semana
    WHEN 0 THEN 'Lunes'    WHEN 1 THEN 'Martes'
    WHEN 2 THEN 'Miércoles' WHEN 3 THEN 'Jueves'
    WHEN 4 THEN 'Viernes'  WHEN 5 THEN 'Sábado'
    WHEN 6 THEN 'Domingo'
  END AS dia_nombre,
  u.nombre AS ubicacion,
  u.ciudad,
  u.zona,
  u.latitud,
  u.longitud,
  r.hora_inicio,
  r.hora_fin,
  r.prioridad,
  CASE
    WHEN CURRENT_TIME BETWEEN r.hora_inicio AND r.hora_fin THEN TRUE
    ELSE FALSE
  END AS en_horario
FROM public.ruta_semanal r
JOIN public.ubicaciones u ON u.id = r.ubicacion_id
WHERE r.activo = TRUE
  AND r.dia_semana = (EXTRACT(ISODOW FROM CURRENT_DATE)::INT - 1);

-- Rentabilidad por ubicación (últimos 30 días)
CREATE OR REPLACE VIEW public.v_rentabilidad_ubicaciones AS
SELECT
  u.id AS ubicacion_id,
  u.nombre AS ubicacion,
  u.zona,
  COUNT(DISTINCT vs.fecha) AS dias_venta,
  COALESCE(SUM(vs.cantidad_vendida), 0) AS total_unidades,
  COALESCE(SUM(vs.total), 0) AS total_ventas,
  CASE
    WHEN COUNT(DISTINCT vs.fecha) > 0
    THEN ROUND(SUM(vs.total) / COUNT(DISTINCT vs.fecha), 2)
    ELSE 0
  END AS promedio_por_dia
FROM public.ubicaciones u
LEFT JOIN public.ventas_stand vs ON vs.ubicacion_id = u.id
  AND vs.fecha >= CURRENT_DATE - INTERVAL '30 days'
WHERE u.activo = TRUE
GROUP BY u.id, u.nombre, u.zona
ORDER BY total_ventas DESC;

-- Dashboard resumen (una sola fila con métricas clave)
CREATE OR REPLACE VIEW public.v_dashboard AS
SELECT
  (SELECT COUNT(*) FROM public.consignaciones WHERE estado = 'ACTIVA') AS consignaciones_activas,
  (SELECT COUNT(*) FROM public.consignaciones WHERE estado = 'SALDO_PENDIENTE') AS consignaciones_con_saldo,
  (SELECT COALESCE(SUM(total_vendido - total_cobrado), 0) FROM public.consignaciones WHERE estado IN ('SALDO_PENDIENTE', 'EN_REVISION')) AS saldo_pendiente_total,
  (SELECT COUNT(*) FROM public.pedidos WHERE estado NOT IN ('ENTREGADO', 'CANCELADO')) AS pedidos_pendientes,
  (SELECT COUNT(*) FROM public.inventario WHERE cantidad_disponible < 10) AS productos_stock_bajo,
  (SELECT COALESCE(SUM(total), 0) FROM public.ventas_stand WHERE fecha >= CURRENT_DATE - INTERVAL '7 days') AS ventas_semana;


-- ████████████████████████████████████████████████████████████
-- DML — DATA MANIPULATION LANGUAGE
-- Datos iniciales (seeds) que ya existen en la BD
-- ████████████████████████████████████████████████████████████


-- ─── CATEGORÍAS DE PRODUCTO (3 registros) ───────────────────

INSERT INTO public.categorias_producto (nombre, descripcion, vida_util_dias_ambiente, vida_util_dias_refrigerado, vida_util_dias_congelado, beneficios_salud) VALUES
('Dátil Natural',   'Dátil medjool limpio y empacado sin procesamiento adicional. Producto base de Oro de Tamar. Cultivado en el Valle de Mexicali. El dátil retornado de consignación se limpia y reprocesa para pulpa enchilosa.', 540, 1095, 1460, 'Beneficioso para el estómago y el área digestiva. Regenera las células del cuerpo. Rico en vitaminas (A, B, K) y minerales (potasio, magnesio, hierro). Fuente natural de energía. Alto contenido de fibra. Origen: Valle de Mexicali / Valle de Coachella.'),
('Pulpa Enchilosa', 'Derivado del dátil: dátil sin semilla mezclado con chile y chamoy. Se elabora con dátil fresco o retornado de consignación (reprocesado). Producto estrella junto al dátil natural.', 180, 365, NULL, 'Mismos beneficios del dátil natural con el plus de capsaicina del chile, que activa el metabolismo. Sabor único mexicano. El chile aporta vitamina C adicional.'),
('Bolita de Dátil', 'Bolita de dátil cubierta de chocolate. Snack saludable y energético. Producto innovador que diferencia a Oro de Tamar de otros productores de dátil.', 180, 270, NULL, 'Snack saludable con antioxidantes del chocolate y nutrientes del dátil. Ideal para energía rápida. Combinación de fibra natural del dátil con los flavonoides del cacao.');

-- ─── PRODUCTOS (13 registros) ───────────────────────────────
-- SKU: DN = Dátil Natural, PE = Pulpa Enchilosa, BC = Bolita Chocolate
--      B = bolsa, CH = charolita, C = caja

INSERT INTO public.productos (categoria_id, nombre, presentacion, peso_gramos, precio_venta, precio_mayoreo, sku, es_snack) VALUES
-- Dátil Natural (6)
(1, 'Dátil Natural',                   'bolsa',      200,   60.00,  NULL,    'DN-B-200',   TRUE),
(1, 'Dátil Natural',                   'bolsa',      300,   85.00,  NULL,    'DN-B-300',   TRUE),
(1, 'Dátil Natural',                   'bolsa',      500,  150.00,  NULL,    'DN-B-500',   FALSE),
(1, 'Dátil Natural',                   'bolsa',     1000,  280.00,  NULL,    'DN-B-1000',  FALSE),
(1, 'Dátil Natural',                   'caja',      5000, 1200.00, 1050.00, 'DN-C-5000',  FALSE),
(1, 'Dátil Natural',                   'caja',     10000, 2200.00, 1900.00, 'DN-C-10000', FALSE),
-- Pulpa Enchilosa (4)
(2, 'Pulpa Enchilosa',                 'charolita',  200,   75.00,  NULL,    'PE-CH-200',  TRUE),
(2, 'Pulpa Enchilosa',                 'charolita',  300,  110.00,  NULL,    'PE-CH-300',  FALSE),
(2, 'Pulpa Enchilosa',                 'bolsa',      500,  180.00,  NULL,    'PE-B-500',   FALSE),
(2, 'Pulpa Enchilosa',                 'bolsa',     1000,  340.00,  NULL,    'PE-B-1000',  FALSE),
-- Bolitas de Dátil con Chocolate (3)
(3, 'Bolitas de Dátil con Chocolate',  'bolsa',      200,   80.00,  NULL,    'BC-B-200',   TRUE),
(3, 'Bolitas de Dátil con Chocolate',  'bolsa',      300,  115.00,  NULL,    'BC-B-300',   TRUE),
(3, 'Bolitas de Dátil con Chocolate',  'bolsa',      500,  180.00,  NULL,    'BC-B-500',   FALSE);

-- ─── INVENTARIO INICIAL (9 registros, todos en 0) ───────────

INSERT INTO public.inventario (producto_id, cantidad_disponible)
SELECT id, 0 FROM public.productos;

-- ─── UBICACIONES (5 registros) ──────────────────────────────

INSERT INTO public.ubicaciones (nombre, direccion, ciudad, latitud, longitud, zona, notas) VALUES
('Pabellón Zona Dorada', 'Zona Dorada, Área recreativa',        'Rosarito', 32.3594, -117.0584, 'TURISTICA', 'Punto más fuerte de venta. Viernes a domingo.'),
('Waldos',               'Alrededores de Waldos, Col. Mazatlán', 'Rosarito', 32.3451, -117.0521, 'POPULAR',   'Sobre ruedas los lunes.'),
('Av. Constitución',     'Av. Constitución, Centro',             'Rosarito', 32.3528, -117.0545, 'POPULAR',   'Sobre ruedas los martes.'),
('Col. Mazatlán',        'Colonia Mazatlán',                     'Rosarito', 32.3412, -117.0498, 'POPULAR',   'Sobre ruedas los miércoles.'),
('SmartFit Exterior',    'Exterior del gimnasio SmartFit',       'Rosarito', 32.3489, -117.0532, 'COMERCIAL', 'Permiso para vender en exterior.');

-- ─── RUTA SEMANAL (6 registros — jueves libre) ─────────────
-- dia_semana: 0=lunes, 1=martes, ..., 6=domingo

INSERT INTO public.ruta_semanal (ubicacion_id, dia_semana, hora_inicio, hora_fin, prioridad) VALUES
(2, 0, '08:00', '15:00', 'NORMAL'),   -- Lunes:   Waldos
(3, 1, '07:00', '14:00', 'NORMAL'),   -- Martes:  Constitución
(4, 2, '09:00', '14:00', 'NORMAL'),   -- Miércoles: Mazatlán
                                        -- Jueves:  libre / entregas
(1, 4, '09:00', '15:00', 'ALTA'),     -- Viernes: Pabellón
(1, 5, '09:00', '15:00', 'ALTA'),     -- Sábado:  Pabellón
(1, 6, '09:00', '15:00', 'ALTA');     -- Domingo: Pabellón

-- ─── CLIENTES DE EJEMPLO (2 registros) ─────────────────────

INSERT INTO public.clientes (nombre, telefono, whatsapp, tipo, modalidad_pago, canal_origen, ciudad, notas) VALUES
('Ortega House',   '661-123-4567', '5216611234567', 'CONSIGNACION', 'CONSIGNACION', 'VISITA_DIRECTA', 'Rosarito', 'Primer negocio que aceptó consignación.'),
('Rosarito Beach', '661-234-5678', '5216612345678', 'CONSIGNACION', 'CONSIGNACION', 'RECOMENDACION',  'Rosarito', 'Referido por Ortega House.');

-- Cadena de referidos: Rosarito Beach fue referido por Ortega House
UPDATE public.clientes SET referido_por_id = 1 WHERE nombre = 'Rosarito Beach';

-- ─── CONTENIDO DE LA EMPRESA (6 registros) ─────────────────

INSERT INTO public.empresa_info (clave, titulo, contenido, orden) VALUES
('historia',     'Nuestra Historia',            '[PENDIENTE — el dueño lo escribirá]', 1),
('mision',       'Misión',                      '[PENDIENTE]', 2),
('vision',       'Visión',                      '[PENDIENTE]', 3),
('valores',      'Valores',                     '[PENDIENTE]', 4),
('origen_datil', 'El Dátil: Origen e Historia', 'El dátil medjool tiene su origen en Medio Oriente. Llegó al Valle de Mexicali y al Valle de Coachella donde encontró condiciones ideales para su cultivo. Oro de Tamar trabaja directamente con productores de la región, garantizando la frescura y calidad del producto.', 5),
('beneficios',   'Beneficios para la Salud',    'El dátil es beneficioso para el estómago y el área digestiva. Regenera las células del cuerpo. Es rico en vitaminas (A, B, K) y minerales (potasio, magnesio, hierro). Fuente natural de energía. Alto contenido de fibra.', 6);

-- ─── PREMIOS (2 registros) ──────────────────────────────────

INSERT INTO public.premios (nombre, otorgado_por, descripcion) VALUES
('Segundo Lugar Internacional', 'Festival Califa', 'Reconocimiento por innovación en derivados del dátil a nivel internacional.'),
('Segundo Lugar Internacional', 'Emiratos Árabes Unidos / Universidad de San Luis Río Colorado', 'Reconocimiento por innovación en productos de dátil.');

-- ─── PERFILES ───────────────────────────────────────────────
-- Vacía. Se llena automáticamente vía webhook de Clerk cuando un usuario se registra.
-- No insertar datos manualmente aquí.


-- ████████████████████████████████████████████████████████████
-- DCL — DATA CONTROL LANGUAGE
-- Row Level Security (RLS) — Políticas de acceso
-- ████████████████████████████████████████████████████████████


-- ============================================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- ============================================================

ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_producto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consignaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consignacion_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consignacion_pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ubicaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ruta_semanal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas_stand ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresa_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premios ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- POLÍTICAS: TABLAS PÚBLICAS (lectura sin auth)
-- Estas tablas son leídas desde la landing/catálogo público
-- usando el anon key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
-- ============================================================

-- Productos
CREATE POLICY "Productos: lectura pública" ON public.productos FOR SELECT USING (TRUE);
CREATE POLICY "Productos: escritura auth" ON public.productos FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Categorías
CREATE POLICY "Categorias: lectura pública" ON public.categorias_producto FOR SELECT USING (TRUE);
CREATE POLICY "Categorias: escritura auth" ON public.categorias_producto FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Ubicaciones (para mapa público)
CREATE POLICY "Ubicaciones: lectura pública" ON public.ubicaciones FOR SELECT USING (TRUE);
CREATE POLICY "Ubicaciones: escritura auth" ON public.ubicaciones FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Ruta semanal (horarios del stand)
CREATE POLICY "Ruta: lectura pública" ON public.ruta_semanal FOR SELECT USING (TRUE);
CREATE POLICY "Ruta: escritura auth" ON public.ruta_semanal FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Empresa info (historia, misión, visión)
CREATE POLICY "Empresa: lectura pública" ON public.empresa_info FOR SELECT USING (TRUE);
CREATE POLICY "Empresa: escritura auth" ON public.empresa_info FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Premios
CREATE POLICY "Premios: lectura pública" ON public.premios FOR SELECT USING (TRUE);
CREATE POLICY "Premios: escritura auth" ON public.premios FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');


-- ============================================================
-- POLÍTICAS: PERFILES (adaptada para Clerk)
-- Lectura: cualquier usuario autenticado de Supabase
-- Escritura: solo service_role (webhook y server actions)
-- ============================================================

CREATE POLICY "Perfiles: lectura auth" ON public.perfiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Perfiles: escritura service_role" ON public.perfiles FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');


-- ============================================================
-- POLÍTICAS: TABLAS PRIVADAS (solo usuarios autenticados)
-- Desde el admin panel, todas las queries usan service_role_key
-- que bypasea RLS. Estas políticas son defensa en profundidad.
-- ============================================================

CREATE POLICY "Clientes: solo auth" ON public.clientes FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Pedidos: solo auth" ON public.pedidos FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Pedido detalle: solo auth" ON public.pedido_detalle FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Pedido pagos: solo auth" ON public.pedido_pagos FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Consignaciones: solo auth" ON public.consignaciones FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Consignacion detalle: solo auth" ON public.consignacion_detalle FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Consignacion pagos: solo auth" ON public.consignacion_pagos FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Inventario: solo auth" ON public.inventario FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Movimientos: solo auth" ON public.movimientos_inventario FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Ventas stand: solo auth" ON public.ventas_stand FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');


-- ████████████████████████████████████████████████████████████
-- NOTAS PARA CLAUDE CODE
-- ████████████████████████████████████████████████████████████

-- 1. AUTH: La app usa Clerk (NO Supabase Auth). La tabla perfiles
--    se sincroniza vía webhook de Clerk. El rol vive en Clerk
--    publicMetadata Y en la tabla perfiles (dual para auditoría).

-- 2. QUERIES ADMIN: Siempre usar SUPABASE_SERVICE_ROLE_KEY desde
--    server components/actions. Esto bypasea RLS.

-- 3. QUERIES PÚBLICAS: Usar NEXT_PUBLIC_SUPABASE_ANON_KEY. Las
--    políticas USING(TRUE) permiten lectura de: productos,
--    categorias_producto, ubicaciones, ruta_semanal, empresa_info, premios.

-- 4. INVENTARIO: NO hacer UPDATE directo a inventario.cantidad_disponible.
--    Siempre INSERT en movimientos_inventario y el trigger
--    trg_actualizar_inventario lo calcula automáticamente.

-- 5. CONSIGNACIONES: El constraint chk_cantidades en consignacion_detalle
--    impide que cantidad_vendida + cantidad_retornada > cantidad_dejada.
--    Esto protege a nivel de BD contra errores de conteo.

-- 6. REPROCESAMIENTO: Cuando dátil retornado se convierte en pulpa,
--    registrar movimiento con tipo=REPROCESAMIENTO y producto_origen_id
--    apuntando al dátil original. Esto da trazabilidad completa.

-- 7. VISTAS: Consultar con supabase.from('v_nombre').select('*').
--    v_dashboard retorna una sola fila con todas las métricas del negocio.
