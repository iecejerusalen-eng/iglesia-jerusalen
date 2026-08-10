-- Actualización de imágenes oficiales para los productos de la Tienda Jerusalén

-- 1. Camiseta Jerusalén
UPDATE public.products
SET 
  image_url = '/products/camiseta-jerusalen.jpg',
  cover_image_url = '/products/camiseta-jerusalen.jpg',
  thumbnail_url = '/products/camiseta-jerusalen.jpg',
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{media}',
    '[{"id":"tee-main","url":"/products/camiseta-jerusalen.jpg","alt":"Camiseta oficial Jerusalén Fe que permanece","sort_order":0}]'::jsonb
  )
WHERE sku = 'JER-TEE-001' OR name ILIKE '%Camiseta%';

UPDATE public.product_variants
SET cloudinary_image_url = '/products/camiseta-jerusalen.jpg'
WHERE product_id IN (SELECT id FROM public.products WHERE sku = 'JER-TEE-001' OR name ILIKE '%Camiseta%');

-- 2. Biblia de estudio Jerusalén
UPDATE public.products
SET 
  image_url = '/products/biblia-estudio.jpg',
  cover_image_url = '/products/biblia-estudio.jpg',
  thumbnail_url = '/products/biblia-estudio.jpg',
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{media}',
    '[{"id":"bible-main","url":"/products/biblia-estudio.jpg","alt":"Biblia de estudio Jerusalén tapa de cuero y pan de oro","sort_order":0}]'::jsonb
  )
WHERE sku = 'JER-BIB-001' OR name ILIKE '%Biblia%';

UPDATE public.product_variants
SET cloudinary_image_url = '/products/biblia-estudio.jpg'
WHERE product_id IN (SELECT id FROM public.products WHERE sku = 'JER-BIB-001' OR name ILIKE '%Biblia%');

-- 3. Taza Jesucristo es el mismo
UPDATE public.products
SET 
  image_url = '/products/taza-jerusalen.jpg',
  cover_image_url = '/products/taza-jerusalen.jpg',
  thumbnail_url = '/products/taza-jerusalen.jpg',
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{media}',
    '[{"id":"mug-main","url":"/products/taza-jerusalen.jpg","alt":"Taza cerámica Jesucristo es el mismo ayer hoy y por los siglos","sort_order":0}]'::jsonb
  )
WHERE sku = 'JER-MUG-001' OR name ILIKE '%Taza%';

UPDATE public.product_variants
SET cloudinary_image_url = '/products/taza-jerusalen.jpg'
WHERE product_id IN (SELECT id FROM public.products WHERE sku = 'JER-MUG-001' OR name ILIKE '%Taza%');
