-- ============================================================================
-- MIGRACIÓN DEL ECOSISTEMA DE TIENDA, POS PRESENCIAL Y CRM
-- Creado: 2026-08-23
-- Descripción: Tablas para Punto de Venta (POS) presencial en librería/templo,
-- sesiones de caja, numeración de comprobantes y vinculación con CRM.
-- ============================================================================

-- 1. TABLA DE SESIONES DE CAJA POS
CREATE TABLE IF NOT EXISTS public.pos_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cashier_id UUID REFERENCES auth.users(id),
  cashier_name TEXT NOT NULL,
  opening_balance NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  closing_balance NUMERIC(10,2),
  total_cash_sales NUMERIC(10,2) DEFAULT 0.00,
  total_card_sales NUMERIC(10,2) DEFAULT 0.00,
  total_transfer_sales NUMERIC(10,2) DEFAULT 0.00,
  orders_count INT DEFAULT 0,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  opened_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ,
  notes TEXT
);

-- 2. ENRIQUECIMIENTO DE LA TABLA ORDERS PARA SOPORTE OMNICANAL
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'online' CHECK (channel IN ('online', 'pos'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS receipt_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cashier_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pos_session_id UUID REFERENCES public.pos_sessions(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS member_id UUID;

-- VIEW DE COMPATIBILIDAD
CREATE OR REPLACE VIEW public.store_orders AS SELECT * FROM public.orders;

-- 3. MOVIMIENTOS DE INVENTARIO PARA VENTAS POS
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'pos_sale', 'online_sale')),
  quantity INT NOT NULL,
  previous_stock INT NOT NULL,
  new_stock INT NOT NULL,
  reference_order_id UUID,
  created_by_name TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- SEGURIDAD RLS (ROW LEVEL SECURITY)
-- ============================================================================

ALTER TABLE public.pos_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Administración total de sesiones POS" ON public.pos_sessions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Administración total de movimientos inventario" ON public.inventory_movements FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- ÍNDICES DE ALTO RENDIMIENTO
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_pos_sessions_status ON public.pos_sessions(status);
CREATE INDEX IF NOT EXISTS idx_orders_channel ON public.orders(channel);
CREATE INDEX IF NOT EXISTS idx_orders_receipt ON public.orders(receipt_number);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON public.inventory_movements(product_id);
