-- Keep recent public features discoverable when public_menu_items was seeded
-- before those routes were introduced. This is safe to run more than once.
DO $$
DECLARE
  community_id uuid;
  resources_id uuid;
BEGIN
  SELECT id INTO community_id
  FROM public.public_menu_items
  WHERE parent_id IS NULL AND lower(label) = 'comunidad'
  ORDER BY order_index
  LIMIT 1;

  SELECT id INTO resources_id
  FROM public.public_menu_items
  WHERE parent_id IS NULL AND lower(label) = 'recursos'
  ORDER BY order_index
  LIMIT 1;

  IF NOT EXISTS (SELECT 1 FROM public.public_menu_items WHERE url = '/podcast') THEN
    INSERT INTO public.public_menu_items (label, url, icon, order_index, parent_id, is_visible)
    VALUES ('Podcast', '/podcast', 'Radio', 25, resources_id, true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.public_menu_items WHERE url = '/novedades') THEN
    INSERT INTO public.public_menu_items (label, url, icon, order_index, parent_id, is_visible)
    VALUES ('Novedades', '/novedades', 'Sparkles', 35, community_id, true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.public_menu_items WHERE url = '/boletin') THEN
    INSERT INTO public.public_menu_items (label, url, icon, order_index, parent_id, is_visible)
    VALUES ('Boletín dominical', '/boletin', 'Newspaper', 36, community_id, true);
  END IF;
END $$;
