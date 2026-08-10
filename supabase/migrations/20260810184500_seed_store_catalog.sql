-- Catálogo inicial de la Tienda Jerusalén.
-- Idempotente: identifica los productos por SKU y reemplaza únicamente sus variantes seed.
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  -- 1. Camiseta oficial
  INSERT INTO public.products (
    name, description, price, discount_price, promo_tag, image_url, cover_image_url,
    thumbnail_url, stock, category, type, features, sku, tax_rate, is_active, metadata
  )
  SELECT
    'Camiseta Jerusalén · Fe que permanece',
    'Camiseta de algodón peinado con el sello de Jerusalén. Una prenda cómoda para llevar la identidad de la iglesia todos los días.',
    22.00, 19.90, 'Novedad',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=640&q=80',
    42, 'Ropa', 'physical'::product_type,
    '["Algodón peinado 100%", "Corte unisex contemporáneo", "Estampado serigráfico de alta duración", "Lavable a máquina"]'::jsonb,
    'JER-TEE-001', 15, true,
    '{"tags":["camiseta","ropa","jerusalen","regalo"],"attributes":{"Material":["Algodón peinado 100%"],"Corte":["Unisex"]},"specifications":{"Cuidados":"Lavar al revés con agua fría","Origen":"Ecuador"},"media":[{"id":"tee-front","url":"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1400&q=85","alt":"Camiseta oficial Jerusalén","sort_order":0},{"id":"tee-detail","url":"https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=1400&q=85","alt":"Detalle de camiseta de algodón","sort_order":1}],"price_tiers":[{"min_quantity":3,"unit_price":18.50,"label":"Precio equipo (3+)"}]}'::jsonb
  WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'JER-TEE-001');

  SELECT id INTO v_product_id FROM public.products WHERE sku = 'JER-TEE-001';

  DELETE FROM public.product_variants pv WHERE pv.product_id = v_product_id AND pv.sku LIKE 'JER-TEE-001-%';

  INSERT INTO public.product_variants (product_id, color_name, color_hex, size, cloudinary_image_url, stock, price_adjustment, sku, metadata) VALUES
    (v_product_id, 'Negro', '#111827', 'S', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=85', 6, 0, 'JER-TEE-001-BLK-S', '{"fit":"Regular"}'),
    (v_product_id, 'Negro', '#111827', 'M', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=85', 8, 0, 'JER-TEE-001-BLK-M', '{"fit":"Regular"}'),
    (v_product_id, 'Negro', '#111827', 'L', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=85', 7, 1.00, 'JER-TEE-001-BLK-L', '{"fit":"Regular"}'),
    (v_product_id, 'Negro', '#111827', 'XL', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=85', 4, 1.50, 'JER-TEE-001-BLK-XL', '{"fit":"Regular"}'),
    (v_product_id, 'Blanco', '#F8FAFC', 'S', 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=1000&q=85', 4, 0, 'JER-TEE-001-WHT-S', '{"fit":"Regular"}'),
    (v_product_id, 'Blanco', '#F8FAFC', 'M', 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=1000&q=85', 6, 0, 'JER-TEE-001-WHT-M', '{"fit":"Regular"}'),
    (v_product_id, 'Blanco', '#F8FAFC', 'L', 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=1000&q=85', 3, 1.00, 'JER-TEE-001-WHT-L', '{"fit":"Regular"}'),
    (v_product_id, 'Azul Jerusalén', '#1D4ED8', 'M', 'https://images.unsplash.com/photo-1627225924765-552d49cf47ad?auto=format&fit=crop&w=1000&q=85', 4, 1.00, 'JER-TEE-001-BLU-M', '{"fit":"Regular"}'),
    (v_product_id, 'Azul Jerusalén', '#1D4ED8', 'L', 'https://images.unsplash.com/photo-1627225924765-552d49cf47ad?auto=format&fit=crop&w=1000&q=85', 4, 1.00, 'JER-TEE-001-BLU-L', '{"fit":"Regular"}');

  -- 2. Biblia de estudio
  INSERT INTO public.products (
    name, description, price, discount_price, promo_tag, image_url, cover_image_url,
    thumbnail_url, stock, category, type, features, sku, tax_rate, is_active, metadata
  )
  SELECT
    'Biblia de estudio Jerusalén',
    'Edición de estudio para acompañar la lectura diaria, el discipulado y la preparación de mensajes con espacio para notas.',
    38.00, 34.90, 'Más elegido',
    'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=640&q=80',
    18, 'Libros', 'physical'::product_type,
    '["Concordancia temática", "Mapas y cronologías bíblicas", "Introducciones por libro", "Cinta marcadora y papel biblia"]'::jsonb,
    'JER-BIB-001', 0, true,
    '{"tags":["biblia","estudio","discipulado","regalo"],"attributes":{"Traducción":["Español"],"Encuadernación":["Tapa dura"],"Tamaño":["Mediana"]},"specifications":{"Páginas":"1.728","Formato":"15 × 22 cm"},"media":[{"id":"bible-cover","url":"https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=1400&q=85","alt":"Biblia abierta","sort_order":0},{"id":"bible-pages","url":"https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1400&q=85","alt":"Lectura y estudio","sort_order":1}],"price_tiers":[{"min_quantity":5,"unit_price":31.50,"label":"Precio para grupos (5+)"}]}'::jsonb
  WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'JER-BIB-001');

  SELECT id INTO v_product_id FROM public.products WHERE sku = 'JER-BIB-001';

  DELETE FROM public.product_variants pv WHERE pv.product_id = v_product_id AND pv.sku LIKE 'JER-BIB-001-%';

  INSERT INTO public.product_variants (product_id, color_name, color_hex, size, cloudinary_image_url, stock, price_adjustment, sku, metadata) VALUES
    (v_product_id, 'Negro', '#111827', 'Mediana', 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=1000&q=85', 8, 0, 'JER-BIB-001-BLK-M', '{"cover":"Tapa dura"}'),
    (v_product_id, 'Azul', '#1D4ED8', 'Mediana', 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=1000&q=85', 6, 0, 'JER-BIB-001-BLU-M', '{"cover":"Tapa dura"}'),
    (v_product_id, 'Borgoña', '#881337', 'Grande', 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=1000&q=85', 4, 3.00, 'JER-BIB-001-BRG-L', '{"cover":"Tapa dura"}');

  -- 3. Taza de comunidad
  INSERT INTO public.products (
    name, description, price, discount_price, promo_tag, image_url, cover_image_url,
    thumbnail_url, stock, category, type, features, sku, tax_rate, is_active, metadata
  )
  SELECT
    'Taza “Jesucristo es el mismo”',
    'Taza cerámica para empezar cada mañana con una palabra de esperanza. Diseño minimalista inspirado en la identidad Jerusalén.',
    14.00, NULL, 'Regalo con propósito',
    'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=640&q=80',
    30, 'Recursos', 'physical'::product_type,
    '["Cerámica esmaltada", "Apta para microondas", "Apta para lavavajillas", "Empaque individual protegido"]'::jsonb,
    'JER-MUG-001', 15, true,
    '{"tags":["taza","regalo","hogar","café"],"attributes":{"Capacidad":["11 oz","15 oz"],"Acabado":["Brillante"]},"specifications":{"Material":"Cerámica","Frase":"Jesucristo es el mismo ayer, hoy y por los siglos"},"media":[{"id":"mug-main","url":"https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=1400&q=85","alt":"Taza cerámica","sort_order":0},{"id":"mug-coffee","url":"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1400&q=85","alt":"Taza con café","sort_order":1}]}'::jsonb
  WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'JER-MUG-001');

  SELECT id INTO v_product_id FROM public.products WHERE sku = 'JER-MUG-001';

  DELETE FROM public.product_variants pv WHERE pv.product_id = v_product_id AND pv.sku LIKE 'JER-MUG-001-%';

  INSERT INTO public.product_variants (product_id, color_name, color_hex, size, cloudinary_image_url, stock, price_adjustment, sku, metadata) VALUES
    (v_product_id, 'Blanco', '#F8FAFC', '11 oz', 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=1000&q=85', 10, 0, 'JER-MUG-001-WHT-11', '{"finish":"Brillante"}'),
    (v_product_id, 'Blanco', '#F8FAFC', '15 oz', 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=1000&q=85', 8, 2.00, 'JER-MUG-001-WHT-15', '{"finish":"Brillante"}'),
    (v_product_id, 'Negro', '#111827', '11 oz', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1000&q=85', 7, 1.00, 'JER-MUG-001-BLK-11', '{"finish":"Mate"}'),
    (v_product_id, 'Negro', '#111827', '15 oz', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1000&q=85', 5, 3.00, 'JER-MUG-001-BLK-15', '{"finish":"Mate"}');
END $$;
