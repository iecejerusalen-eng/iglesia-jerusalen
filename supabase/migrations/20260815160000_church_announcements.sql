-- Anuncios generales de la Iglesia Jerusalén.
-- Se mantienen separados de los documentos editoriales porque pueden enlazar
-- un evento operativo y generar un aviso de bandeja al publicarse.

CREATE TABLE IF NOT EXISTS public.church_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 2 AND 160),
  summary text NOT NULL DEFAULT '' CHECK (char_length(summary) <= 500),
  body text NOT NULL DEFAULT '' CHECK (char_length(body) <= 6000),
  image_url text,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_featured boolean NOT NULL DEFAULT false,
  publish_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT church_announcements_expiry_ck CHECK (expires_at IS NULL OR expires_at > publish_at)
);

CREATE INDEX IF NOT EXISTS church_announcements_public_idx
  ON public.church_announcements (status, publish_at DESC, expires_at)
  WHERE status = 'published';
CREATE INDEX IF NOT EXISTS church_announcements_event_idx
  ON public.church_announcements (event_id)
  WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS church_announcements_featured_idx
  ON public.church_announcements (is_featured, publish_at DESC)
  WHERE status = 'published' AND is_featured;

ALTER TABLE public.notification_logs
  ADD COLUMN IF NOT EXISTS announcement_id uuid REFERENCES public.church_announcements(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS announcement_expires_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS notification_logs_announcement_uidx
  ON public.notification_logs (announcement_id)
  WHERE announcement_id IS NOT NULL;

CREATE OR REPLACE FUNCTION private.set_church_announcement_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS church_announcements_set_updated_at ON public.church_announcements;
CREATE TRIGGER church_announcements_set_updated_at
  BEFORE UPDATE ON public.church_announcements
  FOR EACH ROW EXECUTE FUNCTION private.set_church_announcement_updated_at();

CREATE OR REPLACE FUNCTION private.sync_church_announcement_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'published'
     AND NEW.publish_at <= now()
     AND (NEW.expires_at IS NULL OR NEW.expires_at > now()) THEN
    INSERT INTO public.notification_logs (
      type,
      title,
      message,
      recipient_group,
      status,
      category,
      sender_id,
      announcement_id,
      announcement_expires_at,
      scheduled_at
    )
    VALUES (
      'push',
      'Anuncio de la Iglesia: ' || NEW.title,
      COALESCE(NULLIF(trim(NEW.summary), ''), NULLIF(trim(NEW.body), ''), 'La Iglesia Jerusalén tiene un nuevo anuncio.'),
      'Todos los Miembros',
      'enviado',
      'evento',
      NEW.created_by,
      NEW.id,
      NEW.expires_at,
      NEW.publish_at
    )
    ON CONFLICT (announcement_id) WHERE announcement_id IS NOT NULL DO UPDATE SET
      title = EXCLUDED.title,
      message = EXCLUDED.message,
      status = EXCLUDED.status,
      category = EXCLUDED.category,
      announcement_expires_at = EXCLUDED.announcement_expires_at,
      scheduled_at = EXCLUDED.scheduled_at;
  ELSE
    DELETE FROM public.notification_logs WHERE announcement_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS church_announcements_sync_notification ON public.church_announcements;
CREATE TRIGGER church_announcements_sync_notification
  AFTER INSERT OR UPDATE OF title, summary, body, status, publish_at, expires_at
  ON public.church_announcements
  FOR EACH ROW EXECUTE FUNCTION private.sync_church_announcement_notification();

ALTER TABLE public.church_announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active church announcements" ON public.church_announcements;
CREATE POLICY "Public read active church announcements"
  ON public.church_announcements FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    AND publish_at <= now()
    AND (expires_at IS NULL OR expires_at > now())
  );

DROP POLICY IF EXISTS "Editorial managers read church announcements" ON public.church_announcements;
CREATE POLICY "Editorial managers read church announcements"
  ON public.church_announcements FOR SELECT TO authenticated
  USING ((SELECT private.can_manage_editorial()));

DROP POLICY IF EXISTS "Editorial managers create church announcements" ON public.church_announcements;
CREATE POLICY "Editorial managers create church announcements"
  ON public.church_announcements FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.can_manage_editorial()));

DROP POLICY IF EXISTS "Editorial managers update church announcements" ON public.church_announcements;
CREATE POLICY "Editorial managers update church announcements"
  ON public.church_announcements FOR UPDATE TO authenticated
  USING ((SELECT private.can_manage_editorial()))
  WITH CHECK ((SELECT private.can_manage_editorial()));

DROP POLICY IF EXISTS "Editorial managers delete church announcements" ON public.church_announcements;
CREATE POLICY "Editorial managers delete church announcements"
  ON public.church_announcements FOR DELETE TO authenticated
  USING ((SELECT private.can_manage_editorial()));

GRANT SELECT ON public.church_announcements TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.church_announcements TO authenticated;

-- Mantiene la nueva subpágina visible dentro de Comunidad incluso cuando el
-- menú dinámico ya fue creado antes de esta funcionalidad.
DO $$
DECLARE
  comunidad_id uuid;
BEGIN
  SELECT parent_id INTO comunidad_id
  FROM public.public_menu_items
  WHERE url = '/eventos' AND parent_id IS NOT NULL
  ORDER BY order_index
  LIMIT 1;

  IF comunidad_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.public_menu_items WHERE url = '/anuncios') THEN
    INSERT INTO public.public_menu_items (label, url, icon, order_index, parent_id, is_visible)
    VALUES ('Anuncios importantes', '/anuncios', 'Megaphone', 25, comunidad_id, true);
  END IF;
END $$;

COMMENT ON TABLE public.church_announcements IS
  'Anuncios generales de la iglesia con imagen, evento vinculado y notificación automática.';
