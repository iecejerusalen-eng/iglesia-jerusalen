-- Migration: Enable Realtime Replication for Members and Cells
-- 1. Set REPLICA IDENTITY to FULL for full row payloads on UPDATE and DELETE
ALTER TABLE public.members REPLICA IDENTITY FULL;
ALTER TABLE public.cells REPLICA IDENTITY FULL;

-- 2. Safely add tables to supabase_realtime publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.members;
    EXCEPTION WHEN duplicate_object OR others THEN
      -- Table might already be in publication, ignore
    END;
    
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.cells;
    EXCEPTION WHEN duplicate_object OR others THEN
      -- Table might already be in publication, ignore
    END;
  END IF;
END
$$;
