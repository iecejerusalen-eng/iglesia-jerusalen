-- Panel colaborativo de ideas.
-- La autorización se basa en public.profiles, no en raw_user_meta_data editable por el usuario.

CREATE OR REPLACE FUNCTION public.can_access_ideas()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles profile
    WHERE profile.id = (SELECT auth.uid())
      AND profile.banned IS NOT TRUE
      AND (
        profile.role::text IN ('admin', 'pastor', 'leader')
        OR 'admin' = ANY(COALESCE(profile.roles::text[], ARRAY[]::text[]))
        OR 'pastor' = ANY(COALESCE(profile.roles::text[], ARRAY[]::text[]))
        OR 'leader' = ANY(COALESCE(profile.roles::text[], ARRAY[]::text[]))
        OR COALESCE((profile.permissions_override->'ideas'->>'view')::boolean, false)
        OR EXISTS (
          SELECT 1
          FROM public.role_permissions permission
          WHERE permission.role::text = ANY(array_prepend(profile.role::text, COALESCE(profile.roles::text[], ARRAY[]::text[])))
            AND COALESCE((permission.permissions->'ideas'->>'view')::boolean, false)
        )
        OR EXISTS (
          SELECT 1
          FROM public.access_roles access_role
          WHERE access_role.id = ANY(COALESCE(profile.custom_role_ids, '{}'::uuid[]))
            AND access_role.is_active
            AND COALESCE((access_role.permissions->'ideas'->>'view')::boolean, false)
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_ideas()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles profile
    WHERE profile.id = (SELECT auth.uid())
      AND profile.banned IS NOT TRUE
      AND (
        profile.role::text IN ('admin', 'pastor')
        OR 'admin' = ANY(COALESCE(profile.roles::text[], ARRAY[]::text[]))
        OR 'pastor' = ANY(COALESCE(profile.roles::text[], ARRAY[]::text[]))
        OR COALESCE((profile.permissions_override->'ideas'->>'edit')::boolean, false)
        OR EXISTS (
          SELECT 1
          FROM public.role_permissions permission
          WHERE permission.role::text = ANY(array_prepend(profile.role::text, COALESCE(profile.roles::text[], ARRAY[]::text[])))
            AND COALESCE((permission.permissions->'ideas'->>'edit')::boolean, false)
        )
      )
  );
$$;

-- El módulo aparece en el RBAC existente para pastores y líderes. Los admins
-- siguen teniendo acceso global desde usePermissions().
UPDATE public.role_permissions
SET permissions = jsonb_set(
  jsonb_set(COALESCE(permissions, '{}'::jsonb), '{ideas,view}', 'true'::jsonb, true),
  '{ideas,edit}', 'true'::jsonb, true
)
WHERE role::text IN ('pastor', 'leader');

CREATE TABLE IF NOT EXISTS public.ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL CHECK (char_length(titulo) BETWEEN 1 AND 120),
  descripcion text,
  contenido_rico jsonb,
  autor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  autor_nombre text NOT NULL,
  autor_avatar text,
  departamento text NOT NULL,
  categoria text NOT NULL DEFAULT 'otro' CHECK (categoria IN ('recurso', 'propuesta', 'necesidad', 'evento', 'mejora', 'otro')),
  prioridad text NOT NULL DEFAULT 'normal' CHECK (prioridad IN ('baja', 'normal', 'alta', 'urgente')),
  estado text NOT NULL DEFAULT 'nueva' CHECK (estado IN ('nueva', 'en_revision', 'aprobada', 'rechazada', 'implementada')),
  es_anonima boolean NOT NULL DEFAULT false,
  votos_count integer NOT NULL DEFAULT 0 CHECK (votos_count >= 0),
  comentarios_count integer NOT NULL DEFAULT 0 CHECK (comentarios_count >= 0),
  vistas_count integer NOT NULL DEFAULT 0 CHECK (vistas_count >= 0),
  monto_estimado numeric(10, 2) CHECK (monto_estimado IS NULL OR monto_estimado >= 0),
  moneda text NOT NULL DEFAULT 'USD' CHECK (char_length(moneda) = 3),
  fecha_limite date,
  color_card text NOT NULL DEFAULT '#ffffff',
  es_fijada boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.idea_adjuntos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('imagen', 'video_url', 'archivo', 'link')),
  url text NOT NULL,
  nombre_archivo text,
  tamano_bytes integer,
  mime_type text,
  link_titulo text,
  link_descripcion text,
  link_imagen_preview text,
  link_dominio text,
  video_embed_id text,
  video_plataforma text CHECK (video_plataforma IS NULL OR video_plataforma IN ('youtube', 'vimeo')),
  video_thumbnail text,
  orden integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.idea_votos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'up' CHECK (tipo IN ('up', 'down')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (idea_id, usuario_id)
);

CREATE TABLE IF NOT EXISTS public.idea_comentarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  padre_id uuid REFERENCES public.idea_comentarios(id) ON DELETE CASCADE,
  autor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  autor_nombre text NOT NULL,
  autor_avatar text,
  contenido text NOT NULL CHECK (char_length(contenido) BETWEEN 1 AND 3000),
  es_resolucion boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.idea_historial (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  usuario_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  usuario_nombre text NOT NULL,
  estado_anterior text,
  estado_nuevo text,
  nota text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.idea_etiquetas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  etiqueta text NOT NULL CHECK (char_length(etiqueta) BETWEEN 1 AND 40)
);

CREATE TABLE IF NOT EXISTS public.idea_notificaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idea_id uuid REFERENCES public.ideas(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('aprobada', 'rechazada', 'implementada', 'comentario', 'respuesta', 'voto', 'mencion', 'nueva_idea')),
  mensaje text NOT NULL,
  leida boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ideas_departamento_idx ON public.ideas(departamento);
CREATE INDEX IF NOT EXISTS ideas_estado_idx ON public.ideas(estado);
CREATE INDEX IF NOT EXISTS ideas_prioridad_idx ON public.ideas(prioridad);
CREATE INDEX IF NOT EXISTS ideas_created_at_idx ON public.ideas(created_at DESC);
CREATE INDEX IF NOT EXISTS ideas_votos_count_idx ON public.ideas(votos_count DESC);
CREATE INDEX IF NOT EXISTS idea_adjuntos_idea_id_idx ON public.idea_adjuntos(idea_id);
CREATE INDEX IF NOT EXISTS idea_comentarios_idea_id_idx ON public.idea_comentarios(idea_id);
CREATE INDEX IF NOT EXISTS idea_notificaciones_usuario_idx ON public.idea_notificaciones(usuario_id, leida, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_ideas_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_idea_vote_count()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE target_idea uuid := COALESCE(NEW.idea_id, OLD.idea_id);
BEGIN
  UPDATE public.ideas
  SET votos_count = (SELECT count(*) FROM public.idea_votos WHERE idea_id = target_idea AND tipo = 'up')
  WHERE id = target_idea;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_idea_comment_count()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE target_idea uuid := COALESCE(NEW.idea_id, OLD.idea_id);
BEGIN
  UPDATE public.ideas
  SET comentarios_count = (SELECT count(*) FROM public.idea_comentarios WHERE idea_id = target_idea)
  WHERE id = target_idea;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.record_idea_status_change()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE actor_name text;
BEGIN
  IF OLD.estado IS DISTINCT FROM NEW.estado THEN
    SELECT trim(concat_ws(' ', profile.first_name, profile.last_name))
      INTO actor_name
      FROM public.profiles profile
      WHERE profile.id = (SELECT auth.uid());
    INSERT INTO public.idea_historial (idea_id, usuario_id, usuario_nombre, estado_anterior, estado_nuevo)
    VALUES (NEW.id, (SELECT auth.uid()), COALESCE(NULLIF(actor_name, ''), 'Usuario'), OLD.estado, NEW.estado);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ideas_updated_at_trigger ON public.ideas;
CREATE TRIGGER ideas_updated_at_trigger BEFORE UPDATE ON public.ideas FOR EACH ROW EXECUTE FUNCTION public.set_ideas_updated_at();
DROP TRIGGER IF EXISTS idea_vote_count_trigger ON public.idea_votos;
CREATE TRIGGER idea_vote_count_trigger AFTER INSERT OR UPDATE OR DELETE ON public.idea_votos FOR EACH ROW EXECUTE FUNCTION public.refresh_idea_vote_count();
DROP TRIGGER IF EXISTS idea_comment_count_trigger ON public.idea_comentarios;
CREATE TRIGGER idea_comment_count_trigger AFTER INSERT OR UPDATE OR DELETE ON public.idea_comentarios FOR EACH ROW EXECUTE FUNCTION public.refresh_idea_comment_count();
DROP TRIGGER IF EXISTS idea_status_history_trigger ON public.ideas;
CREATE TRIGGER idea_status_history_trigger AFTER UPDATE ON public.ideas FOR EACH ROW EXECUTE FUNCTION public.record_idea_status_change();

ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_adjuntos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_votos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_historial ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_etiquetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_notificaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ideas_read ON public.ideas;
CREATE POLICY ideas_read ON public.ideas FOR SELECT TO authenticated USING ((SELECT public.can_access_ideas()));
DROP POLICY IF EXISTS ideas_insert ON public.ideas;
CREATE POLICY ideas_insert ON public.ideas FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.can_access_ideas()) AND autor_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS ideas_update ON public.ideas;
CREATE POLICY ideas_update ON public.ideas FOR UPDATE TO authenticated
  USING (autor_id = (SELECT auth.uid()) OR (SELECT public.can_manage_ideas()))
  WITH CHECK (autor_id = (SELECT auth.uid()) OR (SELECT public.can_manage_ideas()));
DROP POLICY IF EXISTS ideas_delete ON public.ideas;
CREATE POLICY ideas_delete ON public.ideas FOR DELETE TO authenticated
  USING (autor_id = (SELECT auth.uid()) OR (SELECT public.can_manage_ideas()));

DROP POLICY IF EXISTS idea_adjuntos_read ON public.idea_adjuntos;
CREATE POLICY idea_adjuntos_read ON public.idea_adjuntos FOR SELECT TO authenticated USING ((SELECT public.can_access_ideas()));
DROP POLICY IF EXISTS idea_adjuntos_manage ON public.idea_adjuntos;
CREATE POLICY idea_adjuntos_manage ON public.idea_adjuntos FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ideas idea WHERE idea.id = idea_id AND (idea.autor_id = (SELECT auth.uid()) OR (SELECT public.can_manage_ideas()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.ideas idea WHERE idea.id = idea_id AND (idea.autor_id = (SELECT auth.uid()) OR (SELECT public.can_manage_ideas()))));

DROP POLICY IF EXISTS idea_votos_read ON public.idea_votos;
CREATE POLICY idea_votos_read ON public.idea_votos FOR SELECT TO authenticated USING ((SELECT public.can_access_ideas()));
DROP POLICY IF EXISTS idea_votos_write ON public.idea_votos;
CREATE POLICY idea_votos_write ON public.idea_votos FOR INSERT TO authenticated WITH CHECK ((SELECT public.can_access_ideas()) AND usuario_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS idea_votos_delete ON public.idea_votos;
CREATE POLICY idea_votos_delete ON public.idea_votos FOR DELETE TO authenticated USING (usuario_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS idea_comentarios_read ON public.idea_comentarios;
CREATE POLICY idea_comentarios_read ON public.idea_comentarios FOR SELECT TO authenticated USING ((SELECT public.can_access_ideas()));
DROP POLICY IF EXISTS idea_comentarios_write ON public.idea_comentarios;
CREATE POLICY idea_comentarios_write ON public.idea_comentarios FOR INSERT TO authenticated WITH CHECK ((SELECT public.can_access_ideas()) AND autor_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS idea_comentarios_update ON public.idea_comentarios;
CREATE POLICY idea_comentarios_update ON public.idea_comentarios FOR UPDATE TO authenticated USING (autor_id = (SELECT auth.uid()) OR (SELECT public.can_manage_ideas())) WITH CHECK (autor_id = (SELECT auth.uid()) OR (SELECT public.can_manage_ideas()));
DROP POLICY IF EXISTS idea_comentarios_delete ON public.idea_comentarios;
CREATE POLICY idea_comentarios_delete ON public.idea_comentarios FOR DELETE TO authenticated USING (autor_id = (SELECT auth.uid()) OR (SELECT public.can_manage_ideas()));

DROP POLICY IF EXISTS idea_historial_read ON public.idea_historial;
CREATE POLICY idea_historial_read ON public.idea_historial FOR SELECT TO authenticated USING ((SELECT public.can_access_ideas()));
DROP POLICY IF EXISTS idea_etiquetas_read ON public.idea_etiquetas;
CREATE POLICY idea_etiquetas_read ON public.idea_etiquetas FOR SELECT TO authenticated USING ((SELECT public.can_access_ideas()));
DROP POLICY IF EXISTS idea_etiquetas_manage ON public.idea_etiquetas;
CREATE POLICY idea_etiquetas_manage ON public.idea_etiquetas FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.ideas idea WHERE idea.id = idea_id AND (idea.autor_id = (SELECT auth.uid()) OR (SELECT public.can_manage_ideas())))) WITH CHECK (EXISTS (SELECT 1 FROM public.ideas idea WHERE idea.id = idea_id AND (idea.autor_id = (SELECT auth.uid()) OR (SELECT public.can_manage_ideas()))));

DROP POLICY IF EXISTS idea_notifications_read ON public.idea_notificaciones;
CREATE POLICY idea_notifications_read ON public.idea_notificaciones FOR SELECT TO authenticated USING (usuario_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS idea_notifications_update ON public.idea_notificaciones;
CREATE POLICY idea_notifications_update ON public.idea_notificaciones FOR UPDATE TO authenticated USING (usuario_id = (SELECT auth.uid())) WITH CHECK (usuario_id = (SELECT auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ideas, public.idea_adjuntos, public.idea_votos, public.idea_comentarios, public.idea_historial, public.idea_etiquetas, public.idea_notificaciones TO authenticated;

INSERT INTO storage.buckets (id, name, public) VALUES ('ideas-adjuntos', 'ideas-adjuntos', false) ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS ideas_storage_read ON storage.objects;
CREATE POLICY ideas_storage_read ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'ideas-adjuntos' AND (SELECT public.can_access_ideas()));
DROP POLICY IF EXISTS ideas_storage_insert ON storage.objects;
CREATE POLICY ideas_storage_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ideas-adjuntos' AND (SELECT public.can_access_ideas()));
DROP POLICY IF EXISTS ideas_storage_delete ON storage.objects;
CREATE POLICY ideas_storage_delete ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'ideas-adjuntos' AND (SELECT public.can_manage_ideas()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.ideas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.idea_votos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.idea_comentarios;
ALTER PUBLICATION supabase_realtime ADD TABLE public.idea_notificaciones;
