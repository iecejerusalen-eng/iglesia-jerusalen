-- Migration: Clean up duplicate rows from public_menu_items table

DELETE FROM public.public_menu_items a
WHERE a.ctid NOT IN (
    SELECT MIN(ctid)
    FROM public.public_menu_items
    GROUP BY lower(trim(label)), lower(trim(url)), COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid)
);
