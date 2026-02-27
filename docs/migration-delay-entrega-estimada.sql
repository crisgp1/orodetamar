-- ============================================================
-- MIGRACIÓN: Delay de preparación + Entrega estimada
-- Fecha: 2026-02-27
-- ============================================================

-- Nuevas columnas en pedidos
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS tiene_delay BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS delay_motivo TEXT,
  ADD COLUMN IF NOT EXISTS fecha_entrega_estimada DATE;

-- Comentarios
COMMENT ON COLUMN public.pedidos.tiene_delay IS 'Indica si el pedido tiene un retraso en preparación';
COMMENT ON COLUMN public.pedidos.delay_motivo IS 'Motivo del retraso (visible para admin y cliente)';
COMMENT ON COLUMN public.pedidos.fecha_entrega_estimada IS 'Fecha estimada de entrega puesta por el admin';
