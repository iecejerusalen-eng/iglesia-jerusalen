-- =======================================================
-- SCRIPT SQL: COMISIONES DE PASARELAS DE PAGO Y ÓRDENES
-- COPIAR Y PEGAR EN EL SQL EDITOR DE SUPABASE
-- =======================================================

-- 1. Añadir campos a church_settings
ALTER TABLE public.church_settings ADD COLUMN IF NOT EXISTS payphone_fee_percent numeric(5,2) DEFAULT 6.00;
ALTER TABLE public.church_settings ADD COLUMN IF NOT EXISTS de_una_fee_percent numeric(5,2) DEFAULT 2.00;

-- 2. Añadir campos a orders para desglose de facturación
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal numeric(10,2) DEFAULT 0.00;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_fee numeric(10,2) DEFAULT 0.00;

-- 3. (Opcional) Inicializar las columnas nuevas si ya existían órdenes, usando el total
UPDATE public.orders 
SET subtotal = total 
WHERE subtotal = 0.00 OR subtotal IS NULL;
