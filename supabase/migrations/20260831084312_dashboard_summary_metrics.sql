-- Dashboard summary metrics
--
-- This migration is intentionally SECURITY INVOKER: the caller's grants and
-- RLS policies remain in force while the database performs the aggregations.

CREATE INDEX IF NOT EXISTS idx_donations_created_at_amount
  ON public.donations (created_at DESC) INCLUDE (amount)
  ;

CREATE INDEX IF NOT EXISTS idx_inventory_items_category_id
  ON public.inventory_items (category_id);

CREATE INDEX IF NOT EXISTS idx_inventory_items_status
  ON public.inventory_items (status);

CREATE INDEX IF NOT EXISTS idx_petitions_user_id
  ON public.petitions (user_id);

CREATE INDEX IF NOT EXISTS idx_petitions_public_created_at
  ON public.petitions (created_at DESC)
  WHERE is_public IS TRUE;

CREATE INDEX IF NOT EXISTS idx_petitions_status_created_at
  ON public.petitions (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_members_leaders
  ON public.members (id)
  WHERE is_leader IS TRUE;

CREATE OR REPLACE FUNCTION public.get_dashboard_summary_metrics()
RETURNS TABLE (
  total_donations_amount numeric,
  members_count bigint,
  leaders_count bigint,
  inventory_count bigint,
  inventory_value numeric,
  petitions_count bigint,
  pending_petitions bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    COALESCE((
      SELECT SUM(d.amount)
      FROM public.donations AS d
    ), 0)::numeric,
    (SELECT COUNT(*) FROM public.members),
    (SELECT COUNT(*) FROM public.members AS m WHERE m.is_leader IS TRUE),
    COALESCE((
      SELECT SUM(i.quantity)
      FROM public.inventory_items AS i
    ), 0)::bigint,
    COALESCE((
      SELECT SUM(i.price * i.quantity)
      FROM public.inventory_items AS i
    ), 0)::numeric,
    (SELECT COUNT(*) FROM public.petitions),
    (SELECT COUNT(*) FROM public.petitions AS p WHERE p.status = 'pendiente');
$$;

REVOKE ALL ON FUNCTION public.get_dashboard_summary_metrics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_dashboard_summary_metrics() TO authenticated;
