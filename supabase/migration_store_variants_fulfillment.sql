-- =======================================================
-- SCRIPT SQL: EXPANSIÓN DE TIENDA E-COMMERCE (VARIANTES Y ENTREGAS)
-- COPIAR Y PEGAR EN EL SQL EDITOR DE SUPABASE
-- =======================================================

-- 0. Dropear temporalmente cualquier política que dependa del tipo o existencia de orders.status, si las tablas existen
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'product_digital_assets'
    ) THEN
        DROP POLICY IF EXISTS "Líderes y dueños de órdenes pagadas pueden ver recursos" ON public.product_digital_assets;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'orders'
    ) THEN
        DROP POLICY IF EXISTS "Usuarios pueden leer sus propios pedidos" ON public.orders;
    END IF;
END $$;

-- 1. Crear enums si no existen
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_type') THEN
        CREATE TYPE product_type AS ENUM ('physical', 'digital');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM ('pending_payment', 'paid', 'ready_for_pickup', 'completed', 'cancelled');
    END IF;
END$$;

-- 2. Modificar tabla products
-- Eliminar check constraint antiguo si existe
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_type_check;

-- Cambiar/agregar la columna type para usar el nuevo enum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'type'
    ) THEN
        ALTER TABLE public.products ADD COLUMN type product_type DEFAULT 'physical';
    ELSE
        -- Si la columna ya existe, convertimos su tipo de datos de forma segura
        ALTER TABLE public.products ALTER COLUMN type DROP DEFAULT;
        ALTER TABLE public.products ALTER COLUMN type TYPE product_type USING (
            CASE 
                WHEN type = 'Físico' THEN 'physical'::product_type
                WHEN type = 'Digital' THEN 'digital'::product_type
                WHEN type = 'physical' THEN 'physical'::product_type
                WHEN type = 'digital' THEN 'digital'::product_type
                ELSE 'physical'::product_type
            END
        );
        ALTER TABLE public.products ALTER COLUMN type SET DEFAULT 'physical'::product_type;
    END IF;
END$$;

-- Añadir columnas features y cover_image_url si no existen
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS features jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cover_image_url text;

-- 3. Tabla para Variantes (Tallas, Colores y sus imágenes de Cloudinary)
CREATE TABLE IF NOT EXISTS public.product_variants (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    color_name text,
    color_hex text,
    size text,
    cloudinary_image_url text,
    stock integer DEFAULT 0 CHECK (stock >= 0),
    price_adjustment numeric(10,2) DEFAULT 0.00,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabla para Recursos Digitales (Seguridad RLS activada)
CREATE TABLE IF NOT EXISTS public.product_digital_assets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL UNIQUE,
    drive_link text NOT NULL,
    instructions text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Modificar tabla de pedidos (orders) y items (order_items)
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Cambiar/agregar la columna status para usar el nuevo enum
ALTER TABLE public.orders ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.orders ALTER COLUMN status TYPE order_status USING (
    CASE 
        WHEN status = 'pending' THEN 'pending_payment'::order_status
        WHEN status = 'processing' THEN 'paid'::order_status
        WHEN status = 'completed' THEN 'completed'::order_status
        WHEN status = 'cancelled' THEN 'cancelled'::order_status
        ELSE 'pending_payment'::order_status
    END
);
ALTER TABLE public.orders ALTER COLUMN status SET DEFAULT 'pending_payment'::order_status;

-- Agregar columnas de método de pago y comprobante de transferencia
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'card';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_voucher_url text;

-- Modificar tabla order_items para asociar variantes
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL;

-- 6. RLS para product_variants
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura pública de variantes" ON public.product_variants;
CREATE POLICY "Permitir lectura pública de variantes"
    ON public.product_variants FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Permitir gestión de variantes a administradores" ON public.product_variants;
CREATE POLICY "Permitir gestión de variantes a administradores"
    ON public.product_variants FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'pastor')
        )
    );

-- 7. RLS para product_digital_assets
ALTER TABLE public.product_digital_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Líderes y dueños de órdenes pagadas pueden ver recursos" ON public.product_digital_assets;
CREATE POLICY "Líderes y dueños de órdenes pagadas pueden ver recursos"
    ON public.product_digital_assets FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'pastor')
        ) OR EXISTS (
            SELECT 1 FROM public.orders o
            JOIN public.order_items oi ON oi.order_id = o.id
            WHERE o.user_id = auth.uid() 
              AND oi.product_id = product_digital_assets.product_id
              AND o.status IN ('paid', 'ready_for_pickup', 'completed')
        )
    );

DROP POLICY IF EXISTS "Permitir gestión de recursos a administradores" ON public.product_digital_assets;
CREATE POLICY "Permitir gestión de recursos a administradores"
    ON public.product_digital_assets FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'pastor')
        )
    );

-- 8. Asegurar políticas de lectura del usuario de sus propios pedidos
DROP POLICY IF EXISTS "Usuarios pueden leer sus propios pedidos" ON public.orders;
CREATE POLICY "Usuarios pueden leer sus propios pedidos"
    ON public.orders FOR SELECT
    USING (
        auth.uid() = user_id OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'pastor')
        )
    );

-- 9. Crear bucket de receipts (comprobantes bancarios)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Permitir lectura pública de comprobantes" ON storage.objects;
CREATE POLICY "Permitir lectura pública de comprobantes"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'receipts');

DROP POLICY IF EXISTS "Permitir subir comprobantes públicamente" ON storage.objects;
CREATE POLICY "Permitir subir comprobantes públicamente"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'receipts');

DROP POLICY IF EXISTS "Permitir gestión de comprobantes a administradores" ON storage.objects;
CREATE POLICY "Permitir gestión de comprobantes a administradores"
    ON storage.objects FOR ALL
    USING (
        bucket_id = 'receipts' AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'pastor')
        )
    );
