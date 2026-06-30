-- =======================================================
-- SCRIPT SQL: E-COMMERCE CHECKOUT HÍBRIDO Y FULFILLMENT
-- COPIAR Y PEGAR EN EL SQL EDITOR DE SUPABASE
-- =======================================================

-- 1. Actualizar tabla products
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ecommerce_product_type') THEN
        CREATE TYPE ecommerce_product_type AS ENUM ('physical', 'digital');
    END IF;
END$$;

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS ecommerce_product_type ecommerce_product_type DEFAULT 'physical';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS digital_file_url text;

-- 2. Crear Enums para Orders
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ecommerce_payment_method') THEN
        CREATE TYPE ecommerce_payment_method AS ENUM ('payphone', 'de_una', 'transfer');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ecommerce_payment_status') THEN
        CREATE TYPE ecommerce_payment_status AS ENUM ('pending', 'paid', 'verifying', 'failed');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ecommerce_fulfillment_status') THEN
        CREATE TYPE ecommerce_fulfillment_status AS ENUM ('unfulfilled', 'processing', 'shipped', 'delivered');
    END IF;
END$$;

-- 3. Modificar tabla orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS ecommerce_payment_method ecommerce_payment_method DEFAULT 'transfer';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS ecommerce_payment_status ecommerce_payment_status DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS ecommerce_fulfillment_status ecommerce_fulfillment_status DEFAULT 'unfulfilled';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_receipt_url text;

-- 4. Seguridad (RLS) en Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Políticas para Orders
DROP POLICY IF EXISTS "Usuarios pueden leer sus propios pedidos" ON public.orders;
CREATE POLICY "Usuarios pueden leer sus propios pedidos"
    ON public.orders FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden insertar sus propios pedidos" ON public.orders;
CREATE POLICY "Usuarios pueden insertar sus propios pedidos"
    ON public.orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins y Pastores pueden ver todas las ordenes" ON public.orders;
CREATE POLICY "Admins y Pastores pueden ver todas las ordenes"
    ON public.orders FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'pastor')
        )
    );

DROP POLICY IF EXISTS "Admins y Pastores pueden actualizar ordenes" ON public.orders;
CREATE POLICY "Admins y Pastores pueden actualizar ordenes"
    ON public.orders FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'pastor')
        )
    );

-- Políticas para Order_Items
DROP POLICY IF EXISTS "Usuarios pueden leer items de sus pedidos" ON public.order_items;
CREATE POLICY "Usuarios pueden leer items de sus pedidos"
    ON public.order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE id = order_items.order_id AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Usuarios pueden insertar items a sus pedidos" ON public.order_items;
CREATE POLICY "Usuarios pueden insertar items a sus pedidos"
    ON public.order_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE id = order_items.order_id AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins y Pastores pueden ver todos los items" ON public.order_items;
CREATE POLICY "Admins y Pastores pueden ver todos los items"
    ON public.order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'pastor')
        )
    );
