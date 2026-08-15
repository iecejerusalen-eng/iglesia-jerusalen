-- Persistencia de lecturas para que avisos y conversaciones se sincronicen
-- entre dispositivos sin exponer información de otros usuarios.
CREATE TABLE IF NOT EXISTS public.notification_reads (
  notification_id uuid NOT NULL REFERENCES public.notification_logs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  dismissed_at timestamptz,
  PRIMARY KEY (notification_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.chat_read_states (
  chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (chat_id, user_id)
);

CREATE INDEX IF NOT EXISTS notification_reads_user_idx ON public.notification_reads(user_id, read_at DESC);
CREATE INDEX IF NOT EXISTS chat_read_states_user_idx ON public.chat_read_states(user_id, read_at DESC);

ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_read_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own notification reads" ON public.notification_reads;
CREATE POLICY "Users manage own notification reads" ON public.notification_reads
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users manage own chat reads" ON public.chat_read_states;
CREATE POLICY "Users manage own chat reads" ON public.chat_read_states
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.chat_participants participant
      WHERE participant.chat_id = chat_read_states.chat_id
        AND participant.user_id = (SELECT auth.uid())
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_reads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_read_states TO authenticated;

-- El cliente ya filtra la audiencia para mejorar la UX, pero la seguridad debe
-- quedar garantizada también en la base de datos.
DROP POLICY IF EXISTS "Permitir lectura de notificaciones a autenticados" ON public.notification_logs;
CREATE POLICY "Users read notifications for their audience" ON public.notification_logs
  FOR SELECT TO authenticated
  USING (
    status = 'enviado'
    AND (scheduled_at IS NULL OR scheduled_at <= now())
    AND (
      recipient_group IN ('Todos los Miembros', 'todos')
      OR (
        recipient_group IN ('Líderes de Ministerios', 'lideres')
        AND EXISTS (
          SELECT 1 FROM public.profiles profile
          WHERE profile.id = (SELECT auth.uid())
            AND profile.role IN ('admin', 'pastor', 'secretary', 'secretaria', 'editor', 'leader')
        )
      )
      OR (
        target_ministry_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.profiles profile
          WHERE profile.id = (SELECT auth.uid())
            AND profile.ministry_id = notification_logs.target_ministry_id
        )
      )
    )
  );
